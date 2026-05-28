import { Global, Module } from "@nestjs/common";
import { GuardrailService } from "./guardrail.service";
import { InputGuardrailService } from "./input-guardrail.service";
import { OutputGuardrailService } from "./output-guardrail.service";
import { InjectionDetectorService } from "./injection-detector.service";
import { ContentPolicyService } from "./content-policy.service";
import { PiiDetectorService } from "./pii-detector.service";
import { ViolationTrackerService } from "./violation-tracker.service";

@Global()
@Module({
  providers: [
    GuardrailService,
    InputGuardrailService,
    OutputGuardrailService,
    InjectionDetectorService,
    ContentPolicyService,
    PiiDetectorService,
    ViolationTrackerService,
  ],
  exports: [GuardrailService],
})
export class GuardrailModule {}
