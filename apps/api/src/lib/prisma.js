import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("缺少 DATABASE_URL，請檢查 apps/api/.env。");
}

const adapter = new PrismaPg({
  connectionString,
  connectionTimeoutMillis: 5000,
});

export const prisma = new PrismaClient({ adapter });
