import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";

export class ShipmentServiceError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "ShipmentServiceError";
    this.status = status;
    this.code = code;
  }
}

// input 必須先通過 createShipmentSchema 驗證。
// user 必須來自 requireAuth 所建立的 req.user。
export async function createShipment(input, user) {
  const {
    paperNumber,
    packageCount,
    destinationStationId,
    handoverSequences,
    driverQuotedAmount,
  } = input;

  const handoverSet = new Set(handoverSequences);

  try {
    return await prisma.$transaction(async (tx) => {
      const destinationStation = await tx.station.findUnique({
        where: {
          id: destinationStationId,
        },
        select: {
          id: true,
          isActive: true,
        },
      });

      if (!destinationStation || !destinationStation.isActive) {
        throw new ShipmentServiceError(
          400,
          "INVALID_DESTINATION_STATION",
          "最終配送站所不存在或已停用。",
        );
      }

      return tx.shipment.create({
        data: {
          paperNumber,
          originStationId: user.station.id,
          destinationStationId,
          createdById: user.id,
          driverQuotedAmount,
          packages: {
            create: Array.from({ length: packageCount }, (_, index) => {
              const sequence = index + 1;

              return {
                code: `PKG-${randomUUID()}`,
                sequence,
                needsHandover: handoverSet.has(sequence),
              };
            }),
          },
        },
        select: {
          id: true,
          paperNumber: true,
          driverQuotedAmount: true,
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
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          packages: {
            orderBy: {
              sequence: "asc",
            },
            select: {
              id: true,
              code: true,
              sequence: true,
              needsHandover: true,
            },
          },
        },
      });
    });
  } catch (error) {
    if (error.code === "P2002") {
      const target = error.meta?.target;
      const constraintIndex =
        error.meta?.driverAdapterError?.cause?.constraint?.index;

      const isPaperNumberConflict =
        (Array.isArray(target) && target.includes("paperNumber")) ||
        constraintIndex === "Shipment_paperNumber_key";

      if (isPaperNumberConflict) {
        throw new ShipmentServiceError(
          409,
          "DUPLICATE_PAPER_NUMBER",
          "這個紙本單號已建立，請勿重複建單。",
        );
      }

      throw new ShipmentServiceError(
        409,
        "SHIPMENT_IDENTIFIER_CONFLICT",
        "託運單或貨件編號發生重複，請確認資料後再試。",
      );
    }

    throw error;
  }
}
