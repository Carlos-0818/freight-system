import { createShipmentSchema } from "./shipment.schema.js";
import { createShipment, ShipmentServiceError } from "./shipment.service.js";

export async function postShipment(req, res) {
  res.set("Cache-Control", "no-store");

  try {
    const result = createShipmentSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "收貨資料格式不正確。",
          details: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    const shipment = await createShipment(result.data, req.user);

    return res.status(201).json({
      shipment,
    });
  } catch (error) {
    if (error instanceof ShipmentServiceError) {
      return res.status(error.status).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    console.error("Create shipment failed:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "系統暫時無法建立託運單，請稍後再試。",
      },
    });
  }
}
