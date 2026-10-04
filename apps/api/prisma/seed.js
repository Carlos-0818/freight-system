import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/password.js";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("此 seed 僅供開發測試使用。");
  }

  const password = process.env.SEED_PASSWORD;

  if (!password) {
    throw new Error("請先設定 SEED_PASSWORD。");
  }

  // 寫入前先確認密碼符合雜湊工具的限制。
  await hashPassword(password);

  const originStation = await prisma.station.upsert({
    where: { code: "001" },
    update: {},
    create: {
      code: "001",
      name: "測試起站",
    },
  });

  const destinationStation = await prisma.station.upsert({
    where: { code: "002" },
    update: {},
    create: {
      code: "002",
      name: "測試目的站",
    },
  });

  const users = [
    {
      username: "driver01",
      name: "測試收配司機",
      role: "DRIVER",
      stationId: originStation.id,
    },
    {
      username: "linehaul01",
      name: "測試幹線司機",
      role: "LINEHAUL_DRIVER",
      stationId: originStation.id,
    },
    {
      username: "clerk01",
      name: "測試內勤",
      role: "CLERK",
      stationId: originStation.id,
    },
    {
      username: "supervisor01",
      name: "測試主管",
      role: "SUPERVISOR",
      stationId: destinationStation.id,
    },
  ];

  const results = [];

  for (const user of users) {
    const passwordHash = await hashPassword(password);

    const savedUser = await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        ...user,
        passwordHash,
      },
      select: {
        username: true,
        name: true,
        role: true,
        isActive: true,
        station: {
          select: {
            code: true,
          },
        },
      },
    });

    results.push({
      username: savedUser.username,
      name: savedUser.name,
      role: savedUser.role,
      stationCode: savedUser.station.code,
      isActive: savedUser.isActive,
    });
  }

  console.table(results);
  console.log("開發用 seed 完成。");
}

try {
  await main();
} catch (error) {
  console.error("Seed 執行失敗：", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
