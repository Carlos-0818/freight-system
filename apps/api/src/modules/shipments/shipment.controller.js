import {
  createShipmentSchema,
  findShipmentQuerySchema,
} from "./shipment.schema.js";

import {
  createShipment,
  findShipmentByPaperNumber,
  ShipmentServiceError,
} from "./shipment.service.js";

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

export async function getShipmentByPaperNumber(req, res) {
  res.set("Cache-Control", "no-store");

  try {
    const result = findShipmentQuerySchema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "查詢條件格式不正確。",
          details: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    const shipment = await findShipmentByPaperNumber(result.data);

    return res.status(200).json({
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

    console.error("Find shipment failed:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "系統暫時無法查詢託運單，請稍後再試。",
      },
    });
  }
}
