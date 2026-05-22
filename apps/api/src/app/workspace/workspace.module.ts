import { Module } from "@nestjs/common";
import { WorkspaceController } from "./workspace.controller";
import { WorkspaceInviteController } from "./workspace-invite.controller";
import { WorkspaceChannelController } from "./workspace-channel.controller";
import { WorkspaceService } from "./workspace.service";
import { WorkspaceMemberService } from "./workspace-member.service";
import { WorkspaceInviteService } from "./workspace-invite.service";
import { WorkspaceQuotaService } from "./workspace-quota.service";
import { WorkspaceKnowledgeService } from "./workspace-knowledge.service";
import { KnowledgeModule } from "../knowledge/knowledge.module";

@Module({
  imports: [KnowledgeModule],
  controllers: [
    WorkspaceController,
    WorkspaceInviteController,
    WorkspaceChannelController,
  ],
  providers: [
    WorkspaceService,
    WorkspaceMemberService,
    WorkspaceInviteService,
    WorkspaceQuotaService,
    WorkspaceKnowledgeService,
  ],
  exports: [WorkspaceService, WorkspaceQuotaService],
})
export class WorkspaceModule {}
