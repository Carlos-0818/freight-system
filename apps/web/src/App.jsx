import { useState } from "react";

export default function App() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("尚未檢查 API 連線。");

  async function checkApiHealth() {
    setStatus("loading");
    setMessage("正在檢查 API 連線……");

    try {
      const response = await fetch("/api/health");

      if (!response.ok) {
        throw new Error(`API 回應失敗，HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== "ok" || data.service !== "freight-api") {
        throw new Error("API 回應內容不符合預期。");
      }

      setStatus("success");
      setMessage(`API 連線成功，服務名稱：${data.service}`);
    } catch (error) {
      setStatus("error");
      setMessage(`API 檢查失敗：${error.message}`);
    }
  }

  return (
    <main>
      <h1>貨運管理系統</h1>
      <p>Phase 1 開發環境</p>

      <button
        type="button"
        onClick={checkApiHealth}
        disabled={status === "loading"}
      >
        {status === "loading" ? "檢查中……" : "檢查 API 連線"}
      </button>

      <p role="status">{message}</p>
    </main>
  );
}
