-- AlterTable
ALTER TABLE "entries" ADD COLUMN     "packageEntryNum" INTEGER,
ADD COLUMN     "packageId" INTEGER;

-- CreateTable
CREATE TABLE "entry_packages" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entry_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entry_packages_eventId_idx" ON "entry_packages"("eventId");

-- CreateIndex
CREATE INDEX "entries_packageId_idx" ON "entries"("packageId");

-- AddForeignKey
ALTER TABLE "entry_packages" ADD CONSTRAINT "entry_packages_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "entry_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
