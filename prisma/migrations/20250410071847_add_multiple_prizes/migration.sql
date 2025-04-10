/*
  Warnings:

  - You are about to drop the column `numberOfWinners` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `prizeDescription` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `prizeName` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `winnerId` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "numberOfWinners",
DROP COLUMN "prizeDescription",
DROP COLUMN "prizeName",
DROP COLUMN "winnerId";

-- CreateTable
CREATE TABLE "prizes" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "winningEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prizes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prizes_winningEntryId_key" ON "prizes"("winningEntryId");

-- CreateIndex
CREATE INDEX "prizes_eventId_idx" ON "prizes"("eventId");

-- AddForeignKey
ALTER TABLE "prizes" ADD CONSTRAINT "prizes_winningEntryId_fkey" FOREIGN KEY ("winningEntryId") REFERENCES "entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prizes" ADD CONSTRAINT "prizes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
