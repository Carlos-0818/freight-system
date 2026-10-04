import "dotenv/config";
import { Buffer } from "node:buffer";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;
const expiresInText = process.env.JWT_EXPIRES_IN_SECONDS;
const expiresInSeconds = Number(expiresInText);

const ISSUER = "freight-api";
const AUDIENCE = "freight-web";

if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
  throw new Error("JWT_SECRET 必須設定，且至少為 32 bytes。");
}

if (
  !/^[1-9]\d*$/.test(expiresInText ?? "") ||
  !Number.isSafeInteger(expiresInSeconds)
) {
  throw new Error("JWT_EXPIRES_IN_SECONDS 必須是正整數。");
}

export function createAccessToken(userId) {
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error("簽發 Token 時必須提供有效的使用者 ID。");
  }

  return jwt.sign({}, secret, {
    algorithm: "HS256",
    subject: String(userId),
    expiresIn: expiresInSeconds,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  if (
    typeof payload !== "object" ||
    payload === null ||
    !/^[1-9]\d*$/.test(payload.sub ?? "") ||
    !Number.isSafeInteger(Number(payload.sub)) ||
    !Number.isSafeInteger(payload.exp)
  ) {
    throw new Error("Token 內容不符合預期。");
  }

  return payload;
}
