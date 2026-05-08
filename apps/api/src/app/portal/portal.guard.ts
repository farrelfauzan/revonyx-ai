import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";

export interface PortalIdentity {
  sessionId: string;
  tier: "free" | "paid";
  user?: {
    id: string;
    email: string;
    balance: number;
  };
}

@Injectable()
export class PortalGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Session token is always required
    const sessionToken = request.headers["x-portal-session"];
    if (!sessionToken || typeof sessionToken !== "string") {
      throw new BadRequestException("Missing X-Portal-Session header");
    }

    // 2. Try to extract JWT (optional)
    const authHeader = request.headers.authorization;
    let user: PortalIdentity["user"] | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      // Skip if it looks like an API key
      if (!token.startsWith("sk_live_")) {
        try {
          const payload = this.jwtService.verify(token);
          const dbUser = await this.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, balance: true },
          });
          if (dbUser) {
            user = {
              id: dbUser.id,
              email: dbUser.email,
              balance: Number(dbUser.balance),
            };
          }
        } catch {
          // Invalid JWT — treat as anonymous (free tier)
        }
      }
    }

    // 3. Determine tier
    const tier: "free" | "paid" = user && user.balance > 0 ? "paid" : "free";

    // 4. Attach portal identity to request
    const identity: PortalIdentity = {
      sessionId: sessionToken,
      tier,
      user,
    };
    request.portalIdentity = identity;

    return true;
  }
}
