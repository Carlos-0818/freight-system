import { useState } from "react";
import { apiRequest, ApiError } from "../../lib/api.js";

export default function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setLoginError(null);
    setIsSubmitting(true);

    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: {
          username,
          password,
        },
      });

      setPassword("");
      onLoginSuccess(result);
    } catch (error) {
      setLoginError({
        message:
          error instanceof ApiError ? error.message : "登入失敗，請稍後再試。",
        details: error instanceof ApiError ? error.details : [],
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <h2>登入貨運系統</h2>

      <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting}>
          <legend>登入資料</legend>

          <p>
            <label htmlFor="login-username">帳號</label>
            <br />
            <input
              id="login-username"
              name="username"
              type="text"
              autoComplete="username"
              maxLength={50}
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </p>

          <p>
            <label htmlFor="login-password">密碼</label>
            <br />
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </p>

          <button type="submit">{isSubmitting ? "登入中……" : "登入"}</button>
        </fieldset>
      </form>

      {loginError && (
        <div role="alert">
          <p>{loginError.message}</p>

          {loginError.details.length > 0 && (
            <ul>
              {loginError.details.map((detail, index) => (
                <li key={`${detail.field}-${index}`}>{detail.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
