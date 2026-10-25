import { findPackageQuerySchema } from "./package.schema.js";

import { findPackageByCode, PackageServiceError } from "./package.service.js";

export async function getPackageByCode(req, res) {
  res.set("Cache-Control", "no-store");

  try {
    const result = findPackageQuerySchema.safeParse(req.query);

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

    const packageData = await findPackageByCode(result.data);

    return res.status(200).json({
      package: packageData,
    });
  } catch (error) {
    if (error instanceof PackageServiceError) {
      return res.status(error.status).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    console.error("Find package failed:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "系統暫時無法查詢貨件，請稍後再試。",
      },
    });
  }
}
