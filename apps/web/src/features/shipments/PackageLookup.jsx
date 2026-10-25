import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../lib/api.js";
import PackageBarcode from "./PackageBarcode.jsx";

export default function PackageLookup({ token, onUnauthorized }) {
  const [code, setCode] = useState("");
  const [packageData, setPackageData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submittingRef = useRef(false);
  const controllerRef = useRef(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  function handleCodeChange(event) {
    setCode(event.target.value);
    setPackageData(null);
    setErrorMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const normalizedCode = code.trim();

    setPackageData(null);
    setErrorMessage("");

    if (!normalizedCode) {
      setErrorMessage("請輸入貨件編號。");
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const query = new URLSearchParams({
        code: normalizedCode,
      });

      const result = await apiRequest(`/packages/by-code?${query.toString()}`, {
        token,
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      setCode(normalizedCode);
      setPackageData(result.package);
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
    <section aria-labelledby="package-lookup-heading">
      <h2 id="package-lookup-heading">貨件查詢</h2>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={loading}>
          <legend>按貨件編號查詢</legend>

          <label htmlFor="lookup-package-code">貨件編號</label>

          <input
            id="lookup-package-code"
            type="text"
            value={code}
            onChange={handleCodeChange}
            maxLength={100}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
          />

          <button type="submit">{loading ? "查詢中……" : "查詢"}</button>
        </fieldset>
      </form>

      {loading && <p role="status">正在查詢貨件……</p>}

      {errorMessage && <p role="alert">{errorMessage}</p>}

      {packageData && (
        <div>
          <p role="status">貨件查詢成功。</p>

          <h3>貨件資料</h3>

          <PackageBarcode key={packageData.code} code={packageData.code} />

          <dl>
            <dt>貨件編號</dt>
            <dd style={{ overflowWrap: "anywhere" }}>
              <code>{packageData.code}</code>
            </dd>

            <dt>單內序號</dt>
            <dd>
              第 {packageData.sequence} 件／共{" "}
              {packageData.shipment.packageCount} 件
            </dd>

            <dt>點交標記</dt>
            <dd>{packageData.needsHandover ? "需要點交" : "一般貨件"}</dd>

            <dt>貨件建檔時間（裝置當地時間）</dt>
            <dd>
              <time dateTime={packageData.createdAt}>
                {new Date(packageData.createdAt).toLocaleString("zh-TW", {
                  hour12: false,
                })}
              </time>
            </dd>
          </dl>

          <h3>所屬託運單</h3>

          <dl>
            <dt>紙本單號</dt>
            <dd>{packageData.shipment.paperNumber}</dd>

            <dt>起站</dt>
            <dd>
              {packageData.shipment.originStation.code}－
              {packageData.shipment.originStation.name}
            </dd>

            <dt>最終配送站所</dt>
            <dd>
              {packageData.shipment.destinationStation.code}－
              {packageData.shipment.destinationStation.name}
            </dd>
          </dl>
        </div>
      )}
    </section>
  );
}
