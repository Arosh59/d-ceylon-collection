import { PrismaClient } from "@prisma/client";

const describeDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describeDatabase("existing PostgreSQL baseline", () => {
  const prisma = new PrismaClient();

  afterAll(async () => prisma.$disconnect());

  it("can read every preserved application schema without applying a migration", async () => {
    await prisma.$connect();
    const rows = await prisma.$queryRaw<Array<{ schemaName: string }>>`
      SELECT schema_name AS "schemaName"
      FROM information_schema.schemata
      WHERE schema_name IN (
        'catalogue', 'identity_access', 'organisations_agents', 'customers_travellers',
        'itineraries_travel_planning', 'quotes', 'bookings', 'payments', 'supplier_operations'
      )
      ORDER BY schema_name`;
    expect(rows.map((row) => row.schemaName)).toEqual([
      "bookings",
      "catalogue",
      "customers_travellers",
      "identity_access",
      "itineraries_travel_planning",
      "organisations_agents",
      "payments",
      "quotes",
      "supplier_operations",
    ]);

    const [tableCount] = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM information_schema.tables
      WHERE table_type = 'BASE TABLE'
        AND table_schema IN (
          'catalogue', 'identity_access', 'organisations_agents', 'customers_travellers',
          'itineraries_travel_planning', 'quotes', 'bookings', 'payments', 'supplier_operations'
        )`;
    expect(Number(tableCount?.count)).toBe(55);

    const [checkCount] = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE c.contype = 'c'
        AND c.conname LIKE 'ck_%'
        AND n.nspname IN (
          'catalogue', 'customers_travellers', 'itineraries_travel_planning',
          'quotes', 'bookings', 'payments'
        )`;
    expect(Number(checkCount?.count)).toBe(40);

    const [searchVector] = await prisma.$queryRaw<Array<{ generated: string }>>`
      SELECT is_generated AS generated
      FROM information_schema.columns
      WHERE table_schema = 'catalogue' AND table_name = 'products'
        AND column_name = 'search_vector'`;
    expect(searchVector?.generated).toBe("ALWAYS");
  });
});
