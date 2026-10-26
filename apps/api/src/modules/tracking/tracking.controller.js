import { receivePackageSchema } from "./tracking.schema.js";

import { receivePackage, TrackingServiceError } from "./tracking.service.js";

export async function postPackageReceipt(req, res) {
  res.set("Cache-Control", "no-store");

  try {
    const result = receivePackageSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "收貨確認資料格式不正確。",
          details: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    const receipt = await receivePackage(result.data, req.user);

    return res.status(receipt.replayed ? 200 : 201).json(receipt);
  } catch (error) {
    if (error instanceof TrackingServiceError) {
      return res.status(error.status).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    console.error("Receive package failed:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "系統暫時無法確認收貨，請保留原請求編號後重試。",
      },
    });
  }
}
