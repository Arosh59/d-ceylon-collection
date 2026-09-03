import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { PrismaClient, type Prisma } from "@prisma/client";

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleDestroy {
  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  public async rows<T>(query: Prisma.Sql): Promise<T[]> {
    return this.$queryRaw<T[]>(query);
  }
}
