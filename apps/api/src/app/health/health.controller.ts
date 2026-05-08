import { Controller, Get } from "@nestjs/common";
import { Prisma } from "@generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$executeRaw(Prisma.sql`SELECT 1`);
      return { status: "ok", database: "connected" };
    } catch {
      return { status: "degraded", database: "disconnected" };
    }
  }
}
