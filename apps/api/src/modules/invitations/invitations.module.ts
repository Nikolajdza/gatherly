import { Module } from "@nestjs/common";
import { GuestAccountsService } from "./guest-accounts.service";
import { InvitationsController } from "./invitations.controller";
import { InvitationsService } from "./invitations.service";

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, GuestAccountsService],
})
export class InvitationsModule {}
