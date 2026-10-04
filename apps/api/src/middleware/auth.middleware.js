import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/token.js";

function rejectUnauthorized(res) {
  res.set("WWW-Authenticate", "Bearer");

  return res.status(401).json({
    error: {
      code: "UNAUTHORIZED",
      message: "登入狀態無效，請重新登入。",
    },
  });
}

export async function requireAuth(req, res, next) {
  res.set("Cache-Control", "no-store");

  const authorization = req.get("Authorization") ?? "";
  const match = /^Bearer (\S+)$/i.exec(authorization);

  if (!match) {
    return rejectUnauthorized(res);
  }

  let payload;

  try {
    payload = verifyAccessToken(match[1]);
  } catch {
    return rejectUnauthorized(res);
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(payload.sub),
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        station: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!user || !user.isActive || !user.station.isActive) {
      return rejectUnauthorized(res);
    }

    req.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      station: {
        id: user.station.id,
        code: user.station.code,
        name: user.station.name,
      },
    };
  } catch (error) {
    console.error("Authentication lookup failed:", error.message);

    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "系統暫時無法驗證登入狀態，請稍後再試。",
      },
    });
  }

  return next();
}
