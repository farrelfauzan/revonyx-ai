import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PortalController } from "./portal.controller";
import { PortalTierService } from "./portal-tier.service";
import { PortalGuard } from "./portal.guard";
import { BillingModule } from "../billing/billing.module";
import { ProvidersModule } from "../providers/providers.module";
import { UsageModule } from "../usage/usage.module";
import { ChatModule } from "../chat/chat.module";
import { KnowledgeModule } from "../knowledge/knowledge.module";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: { expiresIn: "7d" },
      }),
    }),
    BillingModule,
    ProvidersModule,
    UsageModule,
    ChatModule,
    KnowledgeModule,
  ],
  controllers: [PortalController],
  providers: [PortalTierService, PortalGuard],
})
export class PortalModule {}
