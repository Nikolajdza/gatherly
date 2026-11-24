import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTPayload } from "jose";
import { IS_PUBLIC } from "../decorators/public.decorator";
import type { AuthUser } from "../types/auth-user";

type RequestWithUser = {
  headers: { authorization?: string };
  user?: AuthUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = bearerToken(request.headers.authorization);
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "Missing bearer token." });
    }

    if (!supabaseUrl) {
      if (isPublic) return true;
      throw new ServiceUnavailableException({
        code: "AUTH_NOT_CONFIGURED",
        message: "Authentication is not configured.",
      });
    }

    try {
      request.user = await this.verify(token, supabaseUrl);
      return true;
    } catch {
      if (isPublic) return true;
      throw new UnauthorizedException({ code: "UNAUTHORIZED", message: "Invalid or expired token." });
    }
  }

  private async verify(token: string, supabaseUrl: string): Promise<AuthUser> {
    const header = decodeProtectedHeader(token);
    if (header.alg === "ES256" || header.alg === "RS256") {
      this.jwks ??= createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: `${supabaseUrl}/auth/v1`,
        audience: "authenticated",
      });
      return userFromPayload(payload);
    }

    if (header.alg === "HS256") {
      return this.verifyWithAuthServer(token, supabaseUrl);
    }

    throw new Error("Unsupported token algorithm");
  }

  private async verifyWithAuthServer(token: string, supabaseUrl: string): Promise<AuthUser> {
    const apiKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!apiKey) throw new Error("Missing publishable key");
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: apiKey },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error("Auth server rejected token");
    const body = (await response.json()) as { id?: string; email?: string; user_metadata?: { full_name?: string } };
    if (!body.id) throw new Error("Auth server returned no user");
    return {
      id: body.id,
      email: body.email ?? "",
      displayName: body.user_metadata?.full_name || body.email?.split("@")[0] || "Gatherly",
    };
  }
}

function bearerToken(header?: string): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

function userFromPayload(payload: JWTPayload): AuthUser {
  if (!payload.sub) throw new Error("Missing subject");
  const email = typeof payload.email === "string" ? payload.email : "";
  const metadata = payload.user_metadata;
  const fullName =
    metadata && typeof metadata === "object" && "full_name" in metadata && typeof metadata.full_name === "string"
      ? metadata.full_name
      : "";
  return {
    id: payload.sub,
    email,
    displayName: fullName || email.split("@")[0] || "Gatherly",
  };
}
