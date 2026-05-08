import { Global, Module } from "@nestjs/common";
import { ModelRegistryService } from "./model-registry.service";

@Global()
@Module({
  providers: [ModelRegistryService],
  exports: [ModelRegistryService],
})
export class ConfigRegistryModule {}
