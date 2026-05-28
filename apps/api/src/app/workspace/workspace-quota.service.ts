import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const TIER_SEAT_LIMITS: Record<string, number> = {
  starter: 3,
  pro: 10,
  enterprise: 100,
};

@Injectable()
export class WorkspaceQuotaService {
  constructor(private readonly prisma: PrismaService) {}

  async requireSubscription(userId: string) {
    const subscription = await this.prisma.agentSubscription.findUnique({
      where: { userId },
    });

    if (!subscription || subscription.status !== "active") {
      throw new ForbiddenException(
        "Active AI Agent subscription required. Please upgrade to access workspaces.",
      );
    }

    return subscription;
  }

  async getMaxUsers(workspaceOwnerId: string): Promise<number> {
    const subscription = await this.prisma.agentSubscription.findUnique({
      where: { userId: workspaceOwnerId },
    });

    if (!subscription || subscription.status !== "active") {
      return 0;
    }

    // Use explicit value if set, otherwise use tier defaults
    if (subscription.maxWorkspaceUsers != null) {
      return subscription.maxWorkspaceUsers;
    }

    return TIER_SEAT_LIMITS[subscription.tier] ?? 3;
  }

  async getActiveCount(workspaceId: string): Promise<number> {
    return this.prisma.workspaceMember.count({
      where: { workspaceId, status: "active" },
    });
  }

  async getQuota(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });

    const maxUsers = await this.getMaxUsers(workspace.ownerId);
    const activeCount = await this.getActiveCount(workspaceId);

    return {
      maxUsers,
      activeCount,
      available: maxUsers - activeCount,
    };
  }

  async enforceCanAddMember(workspaceId: string) {
    const { maxUsers, activeCount } = await this.getQuota(workspaceId);

    if (activeCount >= maxUsers) {
      throw new BadRequestException(
        `Workspace has reached its seat limit (${maxUsers}). Upgrade your subscription to add more members.`,
      );
    }
  }
}
