import { prisma } from "../../lib/prisma.js";
import { packageTrackingSelect } from "../tracking/tracking.select.js";

export class PackageServiceError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "PackageServiceError";
    this.status = status;
    this.code = code;
  }
}

// input 必須先通過 findPackageQuerySchema 驗證。
// 此查詢須由受 requireAuth 保護的端點呼叫。
export async function findPackageByCode(input) {
  const packageData = await prisma.package.findUnique({
    where: {
      code: input.code,
    },
    select: {
      id: true,
      code: true,
      sequence: true,
      needsHandover: true,
      createdAt: true,
      ...packageTrackingSelect,
      shipment: {
        select: {
          id: true,
          paperNumber: true,
          createdAt: true,
          originStation: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          destinationStation: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              packages: true,
            },
          },
        },
      },
    },
  });

  if (!packageData) {
    throw new PackageServiceError(
      404,
      "PACKAGE_NOT_FOUND",
      "找不到這個編號的貨件。",
    );
  }

  const { _count, ...shipment } = packageData.shipment;

  return {
    ...packageData,
    shipment: {
      ...shipment,
      packageCount: _count.packages,
    },
  };
}
