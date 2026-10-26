import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../../lib/api.js";

function readSavedRequest(storageKey) {
  try {
    const saved = sessionStorage.getItem(storageKey);

    if (!saved) {
      return { request: null, error: "" };
    }

    const request = JSON.parse(saved);

    if (
      typeof request.requestId !== "string" ||
      typeof request.code !== "string" ||
      !request.code.trim()
    ) {
      throw new Error("Invalid saved request");
    }

    return {
      request: {
        requestId: request.requestId,
        code: request.code,
      },
      error: "",
    };
  } catch {
    return {
      request: null,
      error: "無法讀取本次操作的保存資料，請先排除瀏覽器儲存問題。",
    };
  }
}

export default function PackageReceiptForm({ token, userId, onUnauthorized }) {
  const storageKey = `freight:manual-receipt:${userId}`;

  const [initial] = useState(() => readSavedRequest(storageKey));
  const [code, setCode] = useState(initial.request?.code ?? "");
  const [pendingRequest, setPendingRequest] = useState(initial.request);
  const [receipt, setReceipt] = useState(null);
  const [errorMessage, setErrorMessage] = useState(initial.error);
  const [canClear, setCanClear] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitLock = useRef(false);
  const controllerRef = useRef(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitLock.current || receipt || initial.error) {
      return;
    }

    let request = pendingRequest;

    if (!request) {
      const normalizedCode = code.trim();

      if (!normalizedCode) {
        setErrorMessage("請輸入貨件編號。");
        return;
      }

      if (typeof globalThis.crypto?.randomUUID !== "function") {
        setErrorMessage("此環境無法產生請求編號，請使用 localhost 或 HTTPS。");
        return;
      }

      request = {
        requestId: globalThis.crypto.randomUUID(),
        code: normalizedCode,
      };

      try {
        // 必須先保存，再發送；保存失敗時不呼叫 API。
        sessionStorage.setItem(storageKey, JSON.stringify(request));
      } catch {
        setErrorMessage("無法保存本次操作，尚未送出收貨確認。");
        return;
      }

      setPendingRequest(request);
      setCode(request.code);
    }

    submitLock.current = true;
    setLoading(true);
    setErrorMessage("");
    setCanClear(false);

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const result = await apiRequest("/tracking/receipts", {
        method: "POST",
        body: request,
        token,
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      setReceipt(result);
    } catch (error) {
      if (controller.signal.aborted || error.name === "AbortError") {
        return;
      }

      if (error.status === 401) {
        // 保存資料仍保留，原使用者重新登入後可重試。
        onUnauthorized();
        return;
      }

      setErrorMessage(error.message || "確認失敗，請沿用本次操作重試。");

      // 明確拒絕的操作可清除輸入。
      // 網路錯誤、伺服器錯誤及寫入衝突則保留原請求重試。
      const rejected =
        [400, 403, 404].includes(error.status) ||
        (error.status === 409 &&
          ["PACKAGE_ALREADY_TRACKED", "REQUEST_ID_CONFLICT"].includes(
            error.code,
          ));

      setCanClear(rejected);
    } finally {
      submitLock.current = false;

      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }

      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  function clearCurrentRequest() {
    if (submitLock.current) {
      return;
    }

    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      setErrorMessage("無法清除保存資料，請稍後再試。");
      return;
    }

    setPendingRequest(null);
    setReceipt(null);
    setCode("");
    setErrorMessage("");
    setCanClear(false);
  }

  return (
    <section aria-labelledby="package-receipt-heading">
      <h2 id="package-receipt-heading">人工逐件收貨確認</h2>

      <p>
        請在客戶端核對實物與標籤後確認。此操作不代表貨已回站，
        也不代表已完成點交。
      </p>

      <form onSubmit={handleSubmit}>
        <fieldset
          disabled={
            loading ||
            Boolean(pendingRequest) ||
            Boolean(receipt) ||
            Boolean(initial.error)
          }
        >
          <legend>本次確認貨件</legend>

          <label htmlFor="receipt-package-code">貨件編號</label>

          <input
            id="receipt-package-code"
            type="text"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setErrorMessage("");
            }}
            maxLength={100}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </fieldset>

        {!receipt && (
          <button type="submit" disabled={loading || Boolean(initial.error)}>
            {loading
              ? "確認中……"
              : pendingRequest
                ? "重試本次確認"
                : "確認此件已收貨"}
          </button>
        )}
      </form>

      {pendingRequest && !receipt && !loading && (
        <p>
          已保留本次操作的貨件編號。重試會使用相同請求，
          不會自動建立另一筆收貨紀錄。
        </p>
      )}

      {loading && <p role="status">正在確認收貨……</p>}

      {errorMessage && <p role="alert">{errorMessage}</p>}

      {receipt && (
        <div>
          <p role="status">
            {receipt.replayed
              ? "此操作先前已完成，已取得原收貨確認紀錄。"
              : "此件收貨確認成功。"}
          </p>

          <dl>
            <dt>貨件編號</dt>
            <dd style={{ overflowWrap: "anywhere" }}>
              <code>{pendingRequest.code}</code>
            </dd>

            <dt>確認時間（裝置當地時間）</dt>
            <dd>
              <time dateTime={receipt.event.occurredAt}>
                {new Date(receipt.event.occurredAt).toLocaleString("zh-TW", {
                  hour12: false,
                })}
              </time>
            </dd>
          </dl>

          <button type="button" onClick={clearCurrentRequest}>
            確認下一件
          </button>
        </div>
      )}

      {!receipt && canClear && (
        <button type="button" onClick={clearCurrentRequest} disabled={loading}>
          清除本次輸入
        </button>
      )}
    </section>
  );
}
