import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../lib/api.js";

export default function ShipmentLookup({ token, onUnauthorized }) {
  const [paperNumber, setPaperNumber] = useState("");
  const [shipment, setShipment] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submittingRef = useRef(false);
  const controllerRef = useRef(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  function handlePaperNumberChange(event) {
    setPaperNumber(event.target.value);

    // 查詢條件改變後，清除前一次結果，避免誤認為新單號的資料。
    setShipment(null);
    setErrorMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const normalizedNumber = paperNumber.trim();

    setShipment(null);
    setErrorMessage("");

    if (!normalizedNumber) {
      setErrorMessage("請輸入紙本單號。");
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const query = new URLSearchParams({
        paperNumber: normalizedNumber,
      });

      const result = await apiRequest(
        `/shipments/by-paper-number?${query.toString()}`,
        {
          token,
          signal: controller.signal,
        },
      );

      if (controller.signal.aborted) {
        return;
      }

      setPaperNumber(normalizedNumber);
      setShipment(result.shipment);
    } catch (error) {
      if (controller.signal.aborted || error.name === "AbortError") {
        return;
      }

      if (error.status === 401) {
        onUnauthorized();
        return;
      }

      setErrorMessage(error.message || "查詢失敗，請稍後再試。");
    } finally {
      submittingRef.current = false;

      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }

      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  return (
    <section aria-labelledby="shipment-lookup-heading">
      <h2 id="shipment-lookup-heading">託運單查詢</h2>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={loading}>
          <legend>按紙本單號查詢</legend>

          <label htmlFor="lookup-paper-number">紙本單號</label>

          <input
            id="lookup-paper-number"
            type="text"
            value={paperNumber}
            onChange={handlePaperNumberChange}
            maxLength={100}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
          />

          <button type="submit">{loading ? "查詢中……" : "查詢"}</button>
        </fieldset>
      </form>

      {loading && <p role="status">正在查詢託運單……</p>}

      {errorMessage && <p role="alert">{errorMessage}</p>}

      {shipment && (
        <div>
          <p role="status">查詢成功，共 {shipment.packages.length} 件貨。</p>

          <h3>託運資料</h3>

          <dl>
            <dt>紙本單號</dt>
            <dd>{shipment.paperNumber}</dd>

            <dt>起站</dt>
            <dd>
              {shipment.originStation.code}－{shipment.originStation.name}
            </dd>

            <dt>最終配送站所</dt>
            <dd>
              {shipment.destinationStation.code}－
              {shipment.destinationStation.name}
            </dd>

            <dt>建單人員</dt>
            <dd>{shipment.createdBy.name}</dd>

            <dt>建單時間（裝置當地時間）</dt>
            <dd>
              <time dateTime={shipment.createdAt}>
                {new Date(shipment.createdAt).toLocaleString("zh-TW", {
                  hour12: false,
                })}
              </time>
            </dd>

            <dt>總件數</dt>
            <dd>{shipment.packages.length} 件</dd>
          </dl>

          <h3>貨件清單</h3>

          <ul>
            {shipment.packages.map((pkg) => (
              <li key={pkg.id}>
                <p>第 {pkg.sequence} 件</p>

                <p>
                  貨件編號：
                  <code style={{ overflowWrap: "anywhere" }}>{pkg.code}</code>
                </p>

                <p>
                  點交標記：
                  {pkg.needsHandover ? "需要點交" : "一般貨件"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
