import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

function validatePassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("密碼必須是非空字串。");
  }

  if (bcrypt.truncates(password)) {
    throw new Error("密碼不得超過 72 bytes。");
  }
}

export async function hashPassword(password) {
  validatePassword(password);

  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  validatePassword(password);

  return bcrypt.compare(password, passwordHash);
}
