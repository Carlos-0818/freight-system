-- CreateTable
CREATE TABLE "Shipment" (
    "id" SERIAL NOT NULL,
    "paperNumber" TEXT NOT NULL,
    "originStationId" INTEGER NOT NULL,
    "destinationStationId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "shipmentId" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "needsHandover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_paperNumber_key" ON "Shipment"("paperNumber");

-- CreateIndex
CREATE INDEX "Shipment_originStationId_idx" ON "Shipment"("originStationId");

-- CreateIndex
CREATE INDEX "Shipment_destinationStationId_idx" ON "Shipment"("destinationStationId");

-- CreateIndex
CREATE INDEX "Shipment_createdById_idx" ON "Shipment"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Package_code_key" ON "Package"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Package_shipmentId_sequence_key" ON "Package"("shipmentId", "sequence");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_originStationId_fkey" FOREIGN KEY ("originStationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_destinationStationId_fkey" FOREIGN KEY ("destinationStationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
