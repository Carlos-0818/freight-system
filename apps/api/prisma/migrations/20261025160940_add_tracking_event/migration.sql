/*
  Warnings:

  - A unique constraint covering the columns `[latestTrackingEventId]` on the table `Package` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TrackingEventType" AS ENUM ('RECEIVED');

-- CreateEnum
CREATE TYPE "TrackingInputMethod" AS ENUM ('MANUAL', 'CAMERA');

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "latestTrackingEventId" INTEGER;

-- CreateTable
CREATE TABLE "TrackingEvent" (
    "id" SERIAL NOT NULL,
    "requestId" UUID NOT NULL,
    "packageId" INTEGER NOT NULL,
    "type" "TrackingEventType" NOT NULL,
    "stationId" INTEGER NOT NULL,
    "operatorId" INTEGER NOT NULL,
    "recordedById" INTEGER NOT NULL,
    "inputMethod" "TrackingInputMethod" NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackingEvent_requestId_key" ON "TrackingEvent"("requestId");

-- CreateIndex
CREATE INDEX "TrackingEvent_packageId_occurredAt_id_idx" ON "TrackingEvent"("packageId", "occurredAt", "id");

-- CreateIndex
CREATE INDEX "TrackingEvent_stationId_occurredAt_idx" ON "TrackingEvent"("stationId", "occurredAt");

-- CreateIndex
CREATE INDEX "TrackingEvent_operatorId_idx" ON "TrackingEvent"("operatorId");

-- CreateIndex
CREATE INDEX "TrackingEvent_recordedById_idx" ON "TrackingEvent"("recordedById");

-- CreateIndex
CREATE UNIQUE INDEX "Package_latestTrackingEventId_key" ON "Package"("latestTrackingEventId");

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_latestTrackingEventId_fkey" FOREIGN KEY ("latestTrackingEventId") REFERENCES "TrackingEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
