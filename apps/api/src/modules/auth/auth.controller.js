import { loginSchema } from "./auth.schema.js";
import { authenticateUser } from "./auth.service.js";
import { createAccessToken } from "../../lib/token.js";

export async function login(req, res) {
  res.set("Cache-Control", "no-store");

  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "登入資料格式不正確。",
          details: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    const user = await authenticateUser(result.data);

    if (!user) {
      return res.status(401).json({
        error: {
          code: "LOGIN_FAILED",
          message: "帳號、密碼錯誤或帳號目前無法使用。",
        },
      });
    }

    const accessToken = createAccessToken(user.id);

    return res.status(200).json({
      accessToken,
      tokenType: "Bearer",
      expiresIn: Number(process.env.JWT_EXPIRES_IN_SECONDS),
      user,
    });
  } catch (error) {
    console.error("Login failed:", error.message);

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "系統暫時無法處理登入，請稍後再試。",
      },
    });
  }
}

export function getMe(req, res) {
  return res.status(200).json({
    user: req.user,
  });
}
