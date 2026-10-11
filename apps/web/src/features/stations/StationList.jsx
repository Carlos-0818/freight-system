import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "../../lib/api.js";

export default function StationList({ token, onUnauthorized }) {
  const [stations, setStations] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadStations() {
      setStatus("loading");
      setErrorMessage("");
      setStations([]);

      try {
        const result = await apiRequest("/stations", {
          token,
          signal: controller.signal,
        });

        if (cancelled) {
          return;
        }

        if (!Array.isArray(result?.stations)) {
          throw new Error("站所回應格式不正確。");
        }

        setStations(result.stations);
        setStatus("success");
      } catch (error) {
        if (cancelled || error.name === "AbortError") {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          onUnauthorized();
          return;
        }

        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "無法取得站所資料，請稍後再試。",
        );
        setStatus("error");
      }
    }

    loadStations();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token, onUnauthorized, reloadKey]);

  return (
    <section aria-busy={status === "loading"}>
      <h2>可用站所</h2>

      {status === "loading" && <p role="status">正在取得站所資料……</p>}

      {status === "error" && <p role="alert">{errorMessage}</p>}

      {status === "success" &&
        (stations.length === 0 ? (
          <p>目前沒有可用站所。</p>
        ) : (
          <table>
            <caption>啟用中的站所</caption>
            <thead>
              <tr>
                <th scope="col">站所編號</th>
                <th scope="col">站所名稱</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((station) => (
                <tr key={station.id}>
                  <td>{station.code}</td>
                  <td>{station.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}

      <button
        type="button"
        disabled={status === "loading"}
        onClick={() => setReloadKey((value) => value + 1)}
      >
        重新載入站所
      </button>
    </section>
  );
}
