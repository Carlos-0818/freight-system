import { useState } from "react";

import LoginForm from "./features/auth/LoginForm.jsx";

const ROLE_LABELS = {
  DRIVER: "收貨／配送司機",
  LINEHAUL_DRIVER: "幹線司機",
  CLERK: "站所內勤",
  SUPERVISOR: "站所主管",
};

export default function App() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("尚未檢查 API 連線。");
  const [session, setSession] = useState(null);

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

      {session ? (
        <section>
          <h2>目前登入人員</h2>

          <dl>
            <dt>姓名</dt>
            <dd>{session.user.name}</dd>

            <dt>帳號</dt>
            <dd>{session.user.username}</dd>

            <dt>角色</dt>
            <dd>{ROLE_LABELS[session.user.role] ?? session.user.role}</dd>

            <dt>所屬站所</dt>
            <dd>
              {session.user.station.code}－{session.user.station.name}
            </dd>
          </dl>

          <button type="button" onClick={() => setSession(null)}>
            登出
          </button>
        </section>
      ) : (
        <LoginForm onLoginSuccess={setSession} />
      )}

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
