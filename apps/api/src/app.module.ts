import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PrismaModule } from "./database/prisma.module";
import { AiModule } from "./modules/ai/ai.module";
import { ExperiencesModule } from "./modules/experiences/experiences.module";
import { GiftRegistryModule } from "./modules/gift-registry/gift-registry.module";
import { HealthModule } from "./modules/health/health.module";
import { InvitationsModule } from "./modules/invitations/invitations.module";
import { MembershipsModule } from "./modules/memberships/memberships.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PermissionsModule } from "./modules/permissions/permissions.module";
import { ProfileSyncInterceptor } from "./modules/profiles/profile-sync.interceptor";
import { ProfilesModule } from "./modules/profiles/profiles.module";
import { ReservationsModule } from "./modules/reservations/reservations.module";
import { SecretSantaModule } from "./modules/secret-santa/secret-santa.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { UploadsModule } from "./modules/uploads/uploads.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    PermissionsModule,
    ProfilesModule,
    HealthModule,
    ExperiencesModule,
    MembershipsModule,
    InvitationsModule,
    GiftRegistryModule,
    ReservationsModule,
    SecretSantaModule,
    TasksModule,
    AiModule,
    UploadsModule,
    NotificationsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: ProfileSyncInterceptor },
  ],
})
export class AppModule {}
