import { Global, Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { EmailJobService } from "./email-job.service";
import { EmailTemplateService } from "./email-template.service";
import { EmailScheduler } from "./email.scheduler";

@Global()
@Module({
  providers: [
    EmailService,
    EmailJobService,
    EmailTemplateService,
    EmailScheduler,
  ],
  exports: [EmailService, EmailJobService, EmailTemplateService],
})
export class EmailModule {}
