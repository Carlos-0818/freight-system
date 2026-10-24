-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" SERIAL NOT NULL,
    "shipmentId" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "collectedById" INTEGER NOT NULL,
    "recordedById" INTEGER NOT NULL,
    "collectedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentRecord_shipmentId_collectedAt_idx" ON "PaymentRecord"("shipmentId", "collectedAt");

-- CreateIndex
CREATE INDEX "PaymentRecord_collectedById_idx" ON "PaymentRecord"("collectedById");

-- CreateIndex
CREATE INDEX "PaymentRecord_recordedById_idx" ON "PaymentRecord"("recordedById");

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
