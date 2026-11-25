import { Module } from "@nestjs/common";
import { ProfilesModule } from "../profiles/profiles.module";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";

@Module({
  imports: [ProfilesModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
