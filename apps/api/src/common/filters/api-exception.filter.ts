import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "object" && body && "code" in body) {
        response.status(status).json({ error: body });
        return;
      }
      const message =
        typeof body === "string"
          ? body
          : (body as { message?: unknown }).message ?? "Request failed";
      response.status(status).json({
        error: {
          code: HttpStatus[status] ?? "ERROR",
          message: Array.isArray(message) ? message.join(", ") : String(message),
        },
      });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.message : "Unhandled error");
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { code: "INTERNAL", message: "Something went wrong." },
    });
  }
}
