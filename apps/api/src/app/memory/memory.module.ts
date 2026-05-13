import { Module } from "@nestjs/common";
import { UserMemoryService } from "./user-memory.service";
import { MemoryExtractionService } from "./memory-extraction.service";
import { MemoryPolicyService } from "./memory-policy.service";

@Module({
  providers: [UserMemoryService, MemoryExtractionService, MemoryPolicyService],
  exports: [UserMemoryService, MemoryExtractionService, MemoryPolicyService],
})
export class MemoryModule {}
