import { Buffer } from "node:buffer";
import { z } from "zod";

export const loginSchema = z.strictObject({
  username: z
    .string({ error: "帳號必須是字串。" })
    .trim()
    .min(1, { error: "請輸入帳號。" })
    .max(50, { error: "帳號不得超過 50 個字元。" }),

  password: z
    .string({ error: "密碼必須是字串。" })
    .min(1, { error: "請輸入密碼。" })
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
      error: "密碼不得超過 72 bytes。",
    }),
});
