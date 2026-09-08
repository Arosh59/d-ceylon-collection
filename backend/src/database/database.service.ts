import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { PrismaClient, type Prisma } from "@prisma/client";

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleDestroy, OnModuleInit {
  public async onModuleInit(): Promise<void> {
    requireDatabaseUrl(process.env);
    await this.$connect();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  public async rows<T>(query: Prisma.Sql): Promise<T[]> {
    return this.$queryRaw<T[]>(query);
  }
}

export function requireDatabaseUrl(environment: NodeJS.ProcessEnv): string {
  const databaseUrl = environment.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Start locally with `npm run dev:backend` or configure backend/.env.",
    );
  }
  return databaseUrl;
}
