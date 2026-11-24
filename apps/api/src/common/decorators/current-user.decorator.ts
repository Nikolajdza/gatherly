import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthUser } from "../types/auth-user";

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext): AuthUser | undefined => {
  return context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
});
