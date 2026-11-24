import { Global, Module } from "@nestjs/common";
import { ProfileSyncInterceptor } from "./profile-sync.interceptor";
import { ProfilesController } from "./profiles.controller";
import { ProfilesService } from "./profiles.service";

@Global()
@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfileSyncInterceptor],
  exports: [ProfilesService, ProfileSyncInterceptor],
})
export class ProfilesModule {}
