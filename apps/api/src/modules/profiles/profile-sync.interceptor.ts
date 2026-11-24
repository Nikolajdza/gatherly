import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import type { AuthUser } from "../../common/types/auth-user";
import { ProfilesService } from "./profiles.service";

@Injectable()
export class ProfileSyncInterceptor implements NestInterceptor {
  constructor(private readonly profiles: ProfilesService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (request.user) await this.profiles.ensure(request.user);
    return next.handle();
  }
}
