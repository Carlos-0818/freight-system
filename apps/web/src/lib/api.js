export class ApiError extends Error {
  constructor(message, { status = 0, code, details = [] } = {}) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(
  path,
  { method = "GET", body, token, signal } = {},
) {
  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new ApiError("無法連線至伺服器，請確認網路後再試。", {
      code: "NETWORK_ERROR",
    });
  }

  if (response.status === 204) {
    return null;
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new ApiError("伺服器回應格式不正確。", {
      status: response.status,
      code: "INVALID_RESPONSE",
    });
  }

  if (!response.ok) {
    throw new ApiError(data?.error?.message ?? "API 請求失敗。", {
      status: response.status,
      code: data?.error?.code ?? "REQUEST_FAILED",
      details: data?.error?.details ?? [],
    });
  }

  return data;
}
