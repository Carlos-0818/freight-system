import { prisma } from "../../lib/prisma.js";

export class TrackingServiceError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "TrackingServiceError";
    this.status = status;
    this.code = code;
  }
}

function replayReceipt(event, packageData, user) {
  const matches =
    event.packageId === packageData.id &&
    event.type === "RECEIVED" &&
    event.inputMethod === "MANUAL" &&
    event.stationId === user.station.id &&
    event.operatorId === user.id &&
    event.recordedById === user.id;

  if (!matches) {
    throw new TrackingServiceError(
      409,
      "REQUEST_ID_CONFLICT",
      "這個請求編號已用於其他操作，請確認操作內容。",
    );
  }

  return {
    event,
    replayed: true,
  };
}

// input 必須先通過 receivePackageSchema 驗證。
// user 必須來自 requireAuth，角色由路由授權。
export async function receivePackage(input, user) {
  const packageData = await prisma.package.findUnique({
    where: {
      code: input.code,
    },
    select: {
      id: true,
      latestTrackingEventId: true,
      shipment: {
        select: {
          originStationId: true,
        },
      },
    },
  });

  if (!packageData) {
    throw new TrackingServiceError(
      404,
      "PACKAGE_NOT_FOUND",
      "找不到這個編號的貨件。",
    );
  }

  if (packageData.shipment.originStationId !== user.station.id) {
    throw new TrackingServiceError(
      403,
      "ORIGIN_STATION_REQUIRED",
      "僅限起站人員執行本次收貨確認。",
    );
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existingEvent = await tx.trackingEvent.findUnique({
        where: {
          requestId: input.requestId,
        },
      });

      if (existingEvent) {
        return replayReceipt(existingEvent, packageData, user);
      }

      if (packageData.latestTrackingEventId !== null) {
        throw new TrackingServiceError(
          409,
          "PACKAGE_ALREADY_TRACKED",
          "這件貨已有追蹤紀錄，不能再次執行初次收貨確認。",
        );
      }

      const event = await tx.trackingEvent.create({
        data: {
          requestId: input.requestId,
          packageId: packageData.id,
          type: "RECEIVED",
          stationId: user.station.id,
          operatorId: user.id,
          recordedById: user.id,
          inputMethod: "MANUAL",
          occurredAt: new Date(),
        },
      });

      // 只有仍無追蹤紀錄的貨件可以完成初次確認。
      // 若另一個請求已先完成，這次交易必須整筆回滾。
      const updated = await tx.package.updateMany({
        where: {
          id: packageData.id,
          latestTrackingEventId: null,
        },
        data: {
          latestTrackingEventId: event.id,
        },
      });

      if (updated.count !== 1) {
        throw new TrackingServiceError(
          409,
          "PACKAGE_ALREADY_TRACKED",
          "這件貨已由其他操作完成確認，請重新查詢。",
        );
      }

      return {
        event,
        replayed: false,
      };
    });
  } catch (error) {
    // 相同 requestId 同時送達時，唯一約束可能先阻擋第二筆。
    // 在失敗交易結束後，重新讀取已完成的事件。
    if (error.code === "P2002") {
      const existingEvent = await prisma.trackingEvent.findUnique({
        where: {
          requestId: input.requestId,
        },
      });

      if (existingEvent) {
        return replayReceipt(existingEvent, packageData, user);
      }
    }

    if (error.code === "P2034") {
      throw new TrackingServiceError(
        409,
        "TRACKING_WRITE_CONFLICT",
        "作業發生衝突，請沿用原請求編號重試。",
      );
    }

    throw error;
  }
}
