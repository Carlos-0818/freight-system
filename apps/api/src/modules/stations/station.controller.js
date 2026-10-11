import { listActiveStations } from "./station.service.js";

export async function getStations(req, res) {
  try {
    const stations = await listActiveStations();

    return res.status(200).json({
      stations,
    });
  } catch (error) {
    console.error("Station lookup failed:", error.message);

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "系統暫時無法取得站所資料，請稍後再試。",
      },
    });
  }
}
