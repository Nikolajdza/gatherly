import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL ?? "postgresql://gatherly:gatherly@localhost:5432/gatherly";
    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : "Database connection failed");
      if (process.env.NODE_ENV === "production") throw error;
    }
  }
}
