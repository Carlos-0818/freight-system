import { z } from "zod";

export const findPackageQuerySchema = z.strictObject({
  code: z
    .string({ error: "貨件編號必須是字串。" })
    .trim()
    .min(1, { error: "請輸入貨件編號。" })
    .max(100, { error: "貨件編號不得超過 100 個字元。" }),
});
