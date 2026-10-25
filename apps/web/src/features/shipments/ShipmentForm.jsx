import { useEffect, useRef, useState } from "react";
import { apiRequest, ApiError } from "../../lib/api.js";

export default function ShipmentForm({ token, onUnauthorized }) {
  const [paperNumber, setPaperNumber] = useState("");
  const [packageCount, setPackageCount] = useState("1");
  const [handoverSequences, setHandoverSequences] = useState([]);
  const [destinationStationId, setDestinationStationId] = useState("");
  const [driverQuotedAmount, setDriverQuotedAmount] = useState("");
  const [collectedAmount, setCollectedAmount] = useState("");
  const [collectedAt, setCollectedAt] = useState("");

  const [stations, setStations] = useState([]);
  const [stationStatus, setStationStatus] = useState("loading");
  const [stationError, setStationError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [createdShipment, setCreatedShipment] = useState(null);

  const submitLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadStations() {
      setStationStatus("loading");
      setStationError("");
      setStations([]);
      setDestinationStationId("");

      try {
        const result = await apiRequest("/stations", {
          token,
          signal: controller.signal,
        });

        if (cancelled) return;

        if (!Array.isArray(result?.stations)) {
          throw new Error("站所回應格式不正確。");
        }

        setStations(result.stations);
        setStationStatus("success");
      } catch (error) {
        if (cancelled || error.name === "AbortError") return;

        if (error instanceof ApiError && error.status === 401) {
          onUnauthorized();
          return;
        }

        setStationError(
          error instanceof ApiError
            ? error.message
            : "無法取得配送站所，請稍後再試。",
        );
        setStationStatus("error");
      }
    }

    loadStations();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token, onUnauthorized, reloadKey]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      submitLock.current ||
      createdShipment ||
      stationStatus !== "success" ||
      stations.length === 0
    ) {
      return;
    }

    const quotedAmount = driverQuotedAmount.trim();
    const receivedAmount = collectedAmount.trim();
    const receiptDate = collectedAt ? new Date(collectedAt) : null;

    if (
      receivedAmount !== "" &&
      (!receiptDate || Number.isNaN(receiptDate.getTime()))
    ) {
      setSubmitError({
        message: "請填寫有效的實際收款時間。",
        details: [],
      });
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await apiRequest("/shipments", {
        method: "POST",
        token,
        body: {
          paperNumber: paperNumber.trim(),
          packageCount: Number(packageCount),
          destinationStationId: Number(destinationStationId),
          handoverSequences,

          ...(quotedAmount !== "" ? { driverQuotedAmount: quotedAmount } : {}),

          ...(receivedAmount !== ""
            ? {
                collectedAmount: receivedAmount,
                collectedAt: receiptDate.toISOString(),
              }
            : {}),
        },
      });

      setCreatedShipment(result.shipment);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized();
        return;
      }

      setSubmitError({
        message:
          error instanceof ApiError
            ? error.message
            : "建立託運單失敗，請稍後再試。",
        details: error instanceof ApiError ? error.details : [],
      });
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  }

  function handleNewShipment() {
    setPaperNumber("");
    setPackageCount("1");
    setDestinationStationId("");
    setSubmitError(null);
    setCreatedShipment(null);
    setHandoverSequences([]);
    setDriverQuotedAmount("");
    setCollectedAmount("");
    setCollectedAt("");
  }

  function handlePackageCountChange(event) {
    const value = event.target.value;
    setPackageCount(value);

    const count = Number(value);

    if (Number.isInteger(count) && count >= 1 && count <= 200) {
      setHandoverSequences((current) =>
        current.filter((sequence) => sequence <= count),
      );
    }
  }

  function handleHandoverChange(sequence, checked) {
    setHandoverSequences((current) =>
      checked
        ? [...new Set([...current, sequence])].sort((a, b) => a - b)
        : current.filter((value) => value !== sequence),
    );
  }

  const count = Number(packageCount);

  const packageSequences =
    Number.isInteger(count) && count >= 1 && count <= 200
      ? Array.from({ length: count }, (_, index) => index + 1)
      : [];

  return (
    <section>
      <h2>收貨建單</h2>

      <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <fieldset
          disabled={
            stationStatus !== "success" ||
            stations.length === 0 ||
            isSubmitting ||
            createdShipment !== null
          }
        >
          <legend>基本收貨資料</legend>

          <p>
            <label htmlFor="shipment-paper-number">紙本託運單號</label>
            <br />
            <input
              id="shipment-paper-number"
              name="paperNumber"
              type="text"
              maxLength={100}
              autoComplete="off"
              required
              value={paperNumber}
              onChange={(event) => setPaperNumber(event.target.value)}
            />
          </p>

          <p>
            <label htmlFor="shipment-package-count">實際件數</label>
            <br />
            <input
              id="shipment-package-count"
              name="packageCount"
              type="number"
              min={1}
              max={200}
              step={1}
              required
              value={packageCount}
              onChange={handlePackageCountChange}
            />
          </p>

          <p>
            <label htmlFor="shipment-destination">最終配送站所</label>
            <br />
            <select
              id="shipment-destination"
              name="destinationStationId"
              required
              value={destinationStationId}
              onChange={(event) => setDestinationStationId(event.target.value)}
            >
              <option value="">請選擇最終配送站所</option>

              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.code}－{station.name}
                </option>
              ))}
            </select>
          </p>

          <fieldset>
            <legend>需要點交的貨件</legend>

            <p>
              請依實際貨物勾選。未勾選的貨件不標記為需點交。
              減少件數會移除超出範圍的勾選。
            </p>

            {packageSequences.length === 0 ? (
              <p>請先輸入 1 至 200 的整數件數。</p>
            ) : (
              packageSequences.map((sequence) => (
                <p key={sequence}>
                  <label>
                    <input
                      type="checkbox"
                      name="handoverSequences"
                      value={sequence}
                      checked={handoverSequences.includes(sequence)}
                      onChange={(event) =>
                        handleHandoverChange(sequence, event.target.checked)
                      }
                    />
                    第 {sequence} 件需要點交
                  </label>
                </p>
              ))
            )}
          </fieldset>

          <fieldset>
            <legend>指定價格與現場實收</legend>

            <p>
              <label htmlFor="shipment-quoted-amount">
                司機指定價格（元，選填）
              </label>
              <br />
              <input
                id="shipment-quoted-amount"
                name="driverQuotedAmount"
                type="text"
                inputMode="decimal"
                pattern="(0|[1-9][0-9]{0,9})([.][0-9]{1,2})?"
                maxLength={13}
                value={driverQuotedAmount}
                onChange={(event) => setDriverQuotedAmount(event.target.value)}
              />
              <br />
              <small>未定價請留白；填入 0 代表明確指定零元。</small>
            </p>

            <p>
              <label htmlFor="shipment-collected-amount">
                現場實收金額（元，選填）
              </label>
              <br />
              <input
                id="shipment-collected-amount"
                name="collectedAmount"
                type="text"
                inputMode="decimal"
                pattern="(0|[1-9][0-9]{0,9})([.][0-9]{1,2})?"
                maxLength={13}
                value={collectedAmount}
                onChange={(event) => {
                  const value = event.target.value;
                  setCollectedAmount(value);

                  if (value.trim() === "") {
                    setCollectedAt("");
                  }
                }}
              />
              <br />
              <small>
                本欄記錄你本人實際收到的款項，必須大於零；未收款請留白。
              </small>
            </p>

            <p>
              <label htmlFor="shipment-collected-at">實際收款時間</label>
              <br />
              <input
                id="shipment-collected-at"
                name="collectedAt"
                type="datetime-local"
                step={1}
                disabled={collectedAmount.trim() === ""}
                required={collectedAmount.trim() !== ""}
                value={collectedAt}
                onChange={(event) => setCollectedAt(event.target.value)}
              />
              <br />
              <small>請依裝置目前的當地時區填寫實際收款時間。</small>
            </p>
          </fieldset>

          <button type="submit">
            {isSubmitting ? "建立中……" : "建立託運單"}
          </button>
        </fieldset>
      </form>

      {submitError && (
        <div role="alert">
          <p>{submitError.message}</p>

          {submitError.details.length > 0 && (
            <ul>
              {submitError.details.map((detail, index) => (
                <li key={`${detail.field}-${index}`}>{detail.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {createdShipment && (
        <section>
          <h3 role="status">託運單建立成功</h3>

          <dl>
            <dt>紙本單號</dt>
            <dd>{createdShipment.paperNumber}</dd>

            <dt>起站</dt>
            <dd>
              {createdShipment.originStation.code}－
              {createdShipment.originStation.name}
            </dd>

            <dt>最終配送站所</dt>
            <dd>
              {createdShipment.destinationStation.code}－
              {createdShipment.destinationStation.name}
            </dd>

            <dt>件數</dt>
            <dd>{createdShipment.packages.length}</dd>

            <dt>司機指定價格</dt>
            <dd>
              {createdShipment.driverQuotedAmount == null
                ? "未指定"
                : `${createdShipment.driverQuotedAmount} 元`}
            </dd>
          </dl>

          <h4>現場實收紀錄</h4>

          {createdShipment.paymentRecords.length === 0 ? (
            <p>本次建單未登錄收款。</p>
          ) : (
            <ul>
              {createdShipment.paymentRecords.map((payment) => (
                <li key={payment.id}>
                  實收 {payment.amount} 元； 收款時間：
                  {new Date(payment.collectedAt).toLocaleString()}
                </li>
              ))}
            </ul>
          )}

          <ol>
            {createdShipment.packages.map((item) => (
              <li key={item.id}>
                第 {item.sequence} 件：{item.code}
                {item.needsHandover && <strong>（需點交）</strong>}
              </li>
            ))}
          </ol>

          <button type="button" onClick={handleNewShipment}>
            建立下一張
          </button>
        </section>
      )}

      {stationStatus === "loading" && <p role="status">正在取得配送站所……</p>}

      {stationStatus === "error" && (
        <div>
          <p role="alert">{stationError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            重新載入配送站所
          </button>
        </div>
      )}

      {stationStatus === "success" && stations.length === 0 && (
        <p role="status">目前沒有可用的配送站所，請聯繫站所人員。</p>
      )}
    </section>
  );
}
