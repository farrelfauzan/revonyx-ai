import { Module } from "@nestjs/common";
import { TogetherAdapter } from "./together.adapter";
import { ProviderRouter } from "./provider-router";

@Module({
  providers: [TogetherAdapter, ProviderRouter],
  exports: [ProviderRouter],
})
export class ProvidersModule {}
