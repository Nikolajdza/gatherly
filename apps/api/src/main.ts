import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  app.setGlobalPrefix("api/v1");
  app.enableShutdownHooks();

  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({ origin: origins, credentials: true });

  const swaggerEnabled = process.env.NODE_ENV !== "production" || process.env.SWAGGER_ENABLED === "true";
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle("Gatherly API")
      .setDescription("REST API for Gatherly experiences, registries, Secret Santa and lists.")
      .setVersion("1")
      .addBearerAuth()
      .build();
    SwaggerModule.setup("api/v1/docs", app, SwaggerModule.createDocument(app, config));
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  Logger.log(`Gatherly API listening on 0.0.0.0:${port}`, "Bootstrap");
}

void bootstrap();
