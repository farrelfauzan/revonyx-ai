import { Controller, Post, HttpCode, UseGuards } from "@nestjs/common";
import { ApiKeyGuard } from "../guards/api-key.guard";
import { SystemKnowledgeService } from "./system-knowledge.service";

@Controller("v1/admin/system-kb")
@UseGuards(ApiKeyGuard)
export class SystemKnowledgeController {
  constructor(private readonly systemKnowledge: SystemKnowledgeService) {}

  @Post("sync")
  @HttpCode(200)
  async triggerSync() {
    const result = await this.systemKnowledge.sync();
    return { message: "System knowledge base synced", ...result };
  }
}
