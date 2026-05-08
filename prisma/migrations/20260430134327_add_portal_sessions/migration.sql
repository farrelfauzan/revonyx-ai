-- CreateTable
CREATE TABLE "portal_sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userId" TEXT,
    "lastRequestAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "portal_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portal_sessions_sessionToken_key" ON "portal_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "portal_sessions_userId_idx" ON "portal_sessions"("userId");

-- CreateIndex
CREATE INDEX "portal_sessions_expiresAt_idx" ON "portal_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "portal_sessions_ipAddress_idx" ON "portal_sessions"("ipAddress");

-- AddForeignKey
ALTER TABLE "portal_sessions" ADD CONSTRAINT "portal_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
