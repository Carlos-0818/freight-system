import { prisma } from "../../lib/prisma.js";

export async function listActiveStations() {
  return prisma.station.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      code: true,
      name: true,
    },
    orderBy: {
      code: "asc",
    },
  });
}
