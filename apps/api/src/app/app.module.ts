import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { ChatModule } from "./chat/chat.module";
import { BillingModule } from "./billing/billing.module";
import { UsageModule } from "./usage/usage.module";
import { ProvidersModule } from "./providers/providers.module";
import { WebhookModule } from "./webhooks/webhook.module";
import { HealthModule } from "./health/health.module";
import { ConfigRegistryModule } from "./config/config-registry.module";
import { KnowledgeModule } from "./knowledge/knowledge.module";
import { PortalModule } from "./portal/portal.module";
import { DocumentModule } from "./document/document.module";
import { AgentModule } from "./agent/agent.module";
import { ChannelModule } from "./channel/channel.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    PrismaModule,
    ConfigRegistryModule,
    AuthModule,
    ChatModule,
    BillingModule,
    UsageModule,
    ProvidersModule,
    WebhookModule,
    HealthModule,
    KnowledgeModule,
    PortalModule,
    DocumentModule,
    AgentModule,
    ChannelModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
