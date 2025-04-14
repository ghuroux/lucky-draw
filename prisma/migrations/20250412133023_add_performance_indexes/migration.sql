-- CreateIndex
CREATE INDEX "entrants_firstName_lastName_idx" ON "entrants"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "entrants_createdAt_idx" ON "entrants"("createdAt");

-- CreateIndex
CREATE INDEX "entries_createdAt_idx" ON "entries"("createdAt");

-- CreateIndex
CREATE INDEX "entries_eventId_createdAt_idx" ON "entries"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_createdAt_idx" ON "events"("createdAt");

-- CreateIndex
CREATE INDEX "events_drawnAt_idx" ON "events"("drawnAt");

-- CreateIndex
CREATE INDEX "events_date_idx" ON "events"("date");
