import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";

const FREE_REQUEST_LIMIT = 20;
const MAX_SESSIONS_PER_IP = 3;

/** Returns midnight UTC of today */
function startOfDayUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export interface TierUsage {
  tier: "free" | "paid";
  used?: number;
  limit?: number;
  remaining?: number;
  balance?: string;
  unlimited?: boolean;
}

@Injectable()
export class PortalTierService {
  private readonly logger = new Logger(PortalTierService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateSession(sessionToken: string, ipAddress?: string) {
    const existing = await this.prisma.portalSession.findUnique({
      where: { sessionToken },
    });

    if (existing) {
      // Reset request count if last reset was before today
      if (existing.lastResetAt < startOfDayUTC()) {
        return this.prisma.portalSession.update({
          where: { sessionToken },
          data: { requestCount: 0, lastResetAt: new Date() },
        });
      }
      return existing;
    }

    // Check IP-based session limit (only count sessions created in last 24h)
    if (ipAddress) {
      const recentSessions = await this.prisma.portalSession.count({
        where: {
          ipAddress,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (recentSessions >= MAX_SESSIONS_PER_IP) {
        return null; // signal that session creation is blocked
      }
    }

    return this.prisma.portalSession.create({
      data: {
        sessionToken,
        ipAddress: ipAddress ?? null,
        lastResetAt: new Date(),
      },
    });
  }

  async canMakeRequest(
    sessionToken: string,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const session = await this.prisma.portalSession.findUnique({
      where: { sessionToken },
    });

    if (!session) {
      return { allowed: false, remaining: 0 };
    }

    // Auto-reset if a new day has started
    let requestCount = session.requestCount;
    if (session.lastResetAt < startOfDayUTC()) {
      await this.prisma.portalSession.update({
        where: { sessionToken },
        data: { requestCount: 0, lastResetAt: new Date() },
      });
      requestCount = 0;
    }

    const allowed = requestCount < FREE_REQUEST_LIMIT;
    const remaining = Math.max(0, FREE_REQUEST_LIMIT - requestCount);
    return { allowed, remaining };
  }

  async trackFreeRequest(sessionToken: string): Promise<void> {
    await this.prisma.portalSession.update({
      where: { sessionToken },
      data: {
        requestCount: { increment: 1 },
        lastRequestAt: new Date(),
      },
    });
  }

  async getUsage(
    sessionToken: string,
    userBalance?: number,
  ): Promise<TierUsage> {
    if (userBalance !== undefined && userBalance > 0) {
      return {
        tier: "paid",
        balance: userBalance.toFixed(6),
        unlimited: true,
      };
    }

    const session = await this.prisma.portalSession.findUnique({
      where: { sessionToken },
    });

    let used = session?.requestCount ?? 0;

    // Auto-reset if a new day has started
    if (session && session.lastResetAt < startOfDayUTC()) {
      await this.prisma.portalSession.update({
        where: { sessionToken: session.sessionToken },
        data: { requestCount: 0, lastResetAt: new Date() },
      });
      used = 0;
    }

    return {
      tier: "free",
      used,
      limit: FREE_REQUEST_LIMIT,
      remaining: Math.max(0, FREE_REQUEST_LIMIT - used),
    };
  }

  async linkSessionToUser(sessionToken: string, userId: string): Promise<void> {
    await this.prisma.portalSession.upsert({
      where: { sessionToken },
      update: { userId },
      create: {
        sessionToken,
        userId,
        lastResetAt: new Date(),
      },
    });
  }

  /** Daily at midnight UTC: reset all request counts */
  @Cron("0 0 * * *")
  async resetDailyRequestCounts(): Promise<void> {
    const result = await this.prisma.portalSession.updateMany({
      where: {
        lastResetAt: { lt: startOfDayUTC() },
      },
      data: { requestCount: 0, lastResetAt: new Date() },
    });

    if (result.count > 0) {
      this.logger.log(
        `Reset daily request counts for ${result.count} sessions`,
      );
    }
  }

  /** Weekly cleanup: remove sessions inactive for 30+ days */
  @Cron("0 1 * * 0")
  async cleanupStaleSessions(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.portalSession.deleteMany({
      where: {
        lastRequestAt: { lt: thirtyDaysAgo },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} stale portal sessions`);
    }
  }
}
