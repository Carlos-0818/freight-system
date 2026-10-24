import { z } from "zod";

// 試作期間單次建單的保護上限，之後可依現場需求調整。
const MAX_PACKAGE_COUNT = 200;

export const createShipmentSchema = z
  .strictObject({
    paperNumber: z
      .string({ error: "紙本單號必須是字串。" })
      .trim()
      .min(1, { error: "請輸入紙本單號。" })
      .max(100, { error: "紙本單號不得超過 100 個字元。" }),

    packageCount: z
      .number({ error: "件數必須是數字。" })
      .int({ error: "件數必須是整數。" })
      .min(1, { error: "件數至少為 1。" })
      .max(MAX_PACKAGE_COUNT, {
        error: `單張託運單最多 ${MAX_PACKAGE_COUNT} 件。`,
      }),

    destinationStationId: z
      .number({ error: "最終配送站所 ID 必須是數字。" })
      .int({ error: "最終配送站所 ID 必須是整數。" })
      .min(1, { error: "請選擇最終配送站所。" })
      .max(2147483647, { error: "最終配送站所 ID 超出範圍。" }),

    driverQuotedAmount: z
      .string({ error: "司機指定價格必須以字串傳入。" })
      .trim()
      .regex(/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/, {
        error: "司機指定價格必須是非負金額，最多兩位小數。",
      })
      .optional(),

    handoverSequences: z
      .array(
        z
          .number({ error: "點交貨件序號必須是數字。" })
          .int({ error: "點交貨件序號必須是整數。" })
          .min(1, { error: "點交貨件序號至少為 1。" }),
      )
      .max(MAX_PACKAGE_COUNT, {
        error: "點交貨件數量超出上限。",
      })
      .default([]),
  })
  .superRefine((data, ctx) => {
    const seen = new Set();

    data.handoverSequences.forEach((sequence, index) => {
      if (sequence > data.packageCount) {
        ctx.addIssue({
          code: "custom",
          path: ["handoverSequences", index],
          message: "點交貨件序號不得超過總件數。",
        });
      }

      if (seen.has(sequence)) {
        ctx.addIssue({
          code: "custom",
          path: ["handoverSequences", index],
          message: "點交貨件序號不得重複。",
        });
      }

      seen.add(sequence);
    });
  });
