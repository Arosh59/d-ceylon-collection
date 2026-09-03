import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../apps/api/src/Modules/", import.meta.url));

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? files(path)
      : entry.name.endsWith("ModelSnapshot.cs")
        ? [path]
        : [];
  });
}

function blockAt(source, openingBrace) {
  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}" && --depth === 0) return source.slice(openingBrace + 1, index);
  }
  throw new Error("Unbalanced C# snapshot block.");
}

function camel(value) {
  return value[0].toLowerCase() + value.slice(1);
}

function prismaType(csharp, columnType) {
  const nullable = csharp.endsWith("?");
  const type = csharp.replace(/\?$/u, "");
  let prisma;
  let native = "";
  if (type === "Guid") [prisma, native] = ["String", "@db.Uuid"];
  else if (type === "string") {
    prisma = "String";
    const length = /character varying\((\d+)\)/u.exec(columnType)?.[1];
    const fixedLength = /character\((\d+)\)/u.exec(columnType)?.[1];
    native = length
      ? `@db.VarChar(${length})`
      : fixedLength
        ? `@db.Char(${fixedLength})`
        : columnType === "text"
          ? "@db.Text"
          : "";
  } else if (type === "DateTimeOffset") [prisma, native] = ["DateTime", "@db.Timestamptz(6)"];
  else if (type === "DateOnly") [prisma, native] = ["DateTime", "@db.Date"];
  else if (type === "decimal") {
    prisma = "Decimal";
    const precision = /numeric\((\d+),(\d+)\)/u.exec(columnType);
    native = precision ? `@db.Decimal(${precision[1]}, ${precision[2]})` : "@db.Decimal";
  } else if (type === "int") [prisma, native] = ["Int", "@db.Integer"];
  else if (type === "long") [prisma, native] = ["BigInt", "@db.BigInt"];
  else if (type === "bool") [prisma, native] = ["Boolean", "@db.Boolean"];
  else if (type === "string[]") [prisma, native] = ["String[]", ""];
  else if (type === "NpgsqlTsVector") [prisma, native] = ['Unsupported("tsvector")', ""];
  else if (type === "byte[]") [prisma, native] = ["Bytes", "@db.ByteA"];
  else throw new Error(`Unsupported C# type ${csharp} (${columnType}).`);
  return { prisma: prisma + (nullable && !prisma.endsWith("[]") ? "?" : ""), native };
}

const models = new Map();
for (const path of files(root)) {
  const source = readFileSync(path, "utf8");
  const defaultSchema = /\.HasDefaultSchema\("([^"]+)"\)/u.exec(source)?.[1];
  const expression = /modelBuilder\.Entity\("([^"]+)", b =>/gu;
  for (const match of source.matchAll(expression)) {
    const openingBrace = source.indexOf("{", match.index + match[0].length);
    const block = blockAt(source, openingBrace);
    const fullName = match[1];
    const name = fullName.split(".").at(-1);
    const model = models.get(fullName) ?? {
      fullName,
      name,
      fields: [],
      indexes: [],
      relations: [],
      checks: [],
    };
    if (block.includes("b.Property<")) {
      const table = /b\.ToTable\("([^"]+)"(?:, "([^"]+)")?/u.exec(block);
      model.table = table?.[1];
      model.schema = table?.[2] ?? defaultSchema;
      const keyStatement = /b\.HasKey\(([^;]+)\);/u.exec(block)?.[1] ?? "";
      model.keys = [...keyStatement.matchAll(/"([^"]+)"/gu)].map((item) => camel(item[1]));
      const propertyExpression = /b\.Property<([^>]+)>\("([^"]+)"\)([\s\S]*?);/gu;
      for (const property of block.matchAll(propertyExpression)) {
        const chain = property[3];
        const column = /\.HasColumnName\("([^"]+)"\)/u.exec(chain)?.[1] ?? property[2];
        const columnType = /\.HasColumnType\("([^"]+)"\)/u.exec(chain)?.[1] ?? "";
        const fieldName = camel(property[2]);
        const nullable =
          property[1].endsWith("?") ||
          (property[1] === "string" &&
            !chain.includes(".IsRequired()") &&
            !model.keys.includes(fieldName));
        const mapped = prismaType(
          property[1] + (nullable && !property[1].endsWith("?") ? "?" : ""),
          columnType,
        );
        model.fields.push({ name: fieldName, column, ...mapped });
      }
      const indexExpression = /b\.HasIndex\(([^;]+?)\)([\s\S]*?);/gu;
      for (const index of block.matchAll(indexExpression)) {
        const indexProperties = [...index[1].matchAll(/"([^"]+)"/gu)].map((item) => item[1]);
        const indexFields = indexProperties.map(camel);
        model.indexes.push({
          fields: indexFields,
          unique: index[2].includes(".IsUnique()"),
          name:
            /\.HasDatabaseName\("([^"]+)"\)/u.exec(index[2])?.[1] ??
            `IX_${model.table}_${indexProperties.join("_")}`,
        });
      }
      for (const check of block.matchAll(/t\.HasCheckConstraint\("([^"]+)", "([^"]+)"\)/gu)) {
        model.checks.push({ name: check[1], expression: check[2] });
      }
    } else if (block.includes("b.HasOne(")) {
      const relationExpression =
        /b\.HasOne\("([^"]+)", (?:"([^"]+)"|null)\)([\s\S]*?)\.HasForeignKey\(([^)]*)\)([\s\S]*?)\.IsRequired\(\);/gu;
      for (const relation of block.matchAll(relationExpression)) {
        const target = relation[1];
        const middle = relation[3];
        const foreignKeys = [...relation[4].matchAll(/"([^"]+)"/gu)]
          .map((item) => item[1])
          .filter((item) => !item.includes("."))
          .map(camel);
        const childName = relation[2] ? camel(relation[2]) : camel(target.split(".").at(-1));
        const many = /\.WithMany\("([^"]+)"\)/u.exec(middle)?.[1];
        const one = /\.WithOne\("([^"]+)"\)/u.exec(middle)?.[1];
        const onDelete = /\.OnDelete\(DeleteBehavior\.([A-Za-z]+)\)/u.exec(relation[5])?.[1];
        model.relations.push({
          target,
          foreignKeys,
          childName,
          parentName: camel(many ?? one ?? `${model.name}Records`),
          oneToOne: middle.includes(".WithOne"),
          onDelete,
        });
      }
    }
    models.set(fullName, model);
  }
}

for (const model of models.values()) {
  for (const relation of model.relations) {
    const parent = models.get(relation.target);
    if (parent && relation.parentName) {
      parent.backRelations ??= [];
      parent.backRelations.push({
        name: relation.parentName,
        type: model.name,
        oneToOne: relation.oneToOne,
      });
    }
  }
}

const lines = [
  "generator client {",
  '  provider = "prisma-client-js"',
  "}",
  "",
  "datasource db {",
  '  provider = "postgresql"',
  '  url      = env("DATABASE_URL")',
  '  schemas  = ["bookings", "catalogue", "customers_travellers", "identity_access", "itineraries_travel_planning", "organisations_agents", "payments", "quotes", "supplier_operations"]',
  "}",
  "",
  "// Generated from the final EF Core model snapshots at the NestJS cutover baseline.",
  "// Refresh with `node scripts/generate-prisma-baseline.mjs --write` only while the legacy",
  "// snapshots remain authoritative; review every migration diff before applying it.",
  "",
];

for (const model of [...models.values()].sort((a, b) => a.name.localeCompare(b.name))) {
  if (!model.table || !model.schema) continue;
  lines.push(`model ${model.name} {`);
  for (const field of model.fields) {
    const id =
      model.keys.length === 1 && model.keys[0] === field.name
        ? ` @id(map: "PK_${model.table}")`
        : "";
    const map = field.column !== field.name ? ` @map(\"${field.column}\")` : "";
    lines.push(
      `  ${field.name.padEnd(29)} ${field.prisma}${id}${map}${field.native ? ` ${field.native}` : ""}`,
    );
  }
  for (const relation of model.relations) {
    const target = models.get(relation.target);
    const optional = relation.foreignKeys.some((key) =>
      model.fields.find((field) => field.name === key)?.prisma.endsWith("?"),
    );
    const deleteAction = relation.onDelete ? `, onDelete: ${relation.onDelete}` : "";
    const foreignColumns = relation.foreignKeys.map(
      (key) => model.fields.find((field) => field.name === key)?.column ?? key,
    );
    // PostgreSQL truncates EF Core's conventional identifiers to 63 bytes.
    const constraint = `FK_${model.table}_${target.table}_${foreignColumns.join("_")}`.slice(0, 63);
    lines.push(
      `  ${relation.childName.padEnd(29)} ${target.name}${optional ? "?" : ""} @relation(fields: [${relation.foreignKeys.join(", ")}], references: [${target.keys.join(", ")}]${deleteAction}, map: "${constraint}")`,
    );
  }
  for (const relation of model.backRelations ?? []) {
    lines.push(`  ${relation.name.padEnd(29)} ${relation.type}${relation.oneToOne ? "?" : "[]"}`);
  }
  if (model.keys.length > 1)
    lines.push(`  @@id([${model.keys.join(", ")}], map: "PK_${model.table}")`);
  const emittedIndexes = new Set();
  for (const index of model.indexes) {
    if (
      index.unique &&
      index.fields.length === 1 &&
      model.keys.length === 1 &&
      index.fields[0] === model.keys[0]
    )
      continue;
    // EF's provider metadata can repeat b.HasIndex(...) inside an extension call (for example GIN).
    // Prisma expresses the access method on the original index, so emit one index per field set.
    const signature = `${index.unique}:${index.fields.join(",")}`;
    if (emittedIndexes.has(signature)) continue;
    emittedIndexes.add(signature);
    const indexType = index.name === "ix_products_search_vector" ? ", type: Gin" : "";
    lines.push(
      `  @@${index.unique ? "unique" : "index"}([${index.fields.join(", ")}], map: \"${index.name}\"${indexType})`,
    );
  }
  lines.push(`  @@map(\"${model.table}\")`, `  @@schema(\"${model.schema}\")`, "}", "");
}

const generated = `${lines.join("\n")}\n`;
const schemaPath = fileURLToPath(new URL("../backend/prisma/schema.prisma", import.meta.url));
if (process.argv.includes("--verify-migration")) {
  const migrationPath = fileURLToPath(
    new URL(
      "../backend/prisma/migrations/20260903000000_existing_database_baseline/migration.sql",
      import.meta.url,
    ),
  );
  const migration = readFileSync(migrationPath, "utf8");
  const missingChecks = [...models.values()]
    .flatMap((model) => model.checks)
    .map((check) => check.name)
    .filter((name) => !migration.includes(`ADD CONSTRAINT "${name}" CHECK`));
  const missingTables = [...models.values()]
    .filter((model) => model.table && model.schema)
    .filter((model) => !migration.includes(`CREATE TABLE "${model.schema}"."${model.table}"`))
    .map((model) => `${model.schema}.${model.table}`);
  if (missingChecks.length || missingTables.length || !migration.includes("GENERATED ALWAYS AS")) {
    throw new Error(
      `The Prisma migration baseline is incomplete. Missing tables: ${missingTables.join(", ") || "none"}; missing checks: ${missingChecks.join(", ") || "none"}.`,
    );
  }
  process.stdout.write(
    `Migration baseline contains ${models.size} tables, all preserved check constraints, and the generated search vector.\n`,
  );
} else if (process.argv.includes("--check-constraints")) {
  for (const model of [...models.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    for (const check of model.checks) {
      process.stdout.write(
        `ALTER TABLE "${model.schema}"."${model.table}" ADD CONSTRAINT "${check.name}" CHECK (${check.expression});\n`,
      );
    }
  }
} else if (process.argv.includes("--write")) {
  writeFileSync(schemaPath, generated, "utf8");
  process.stdout.write("Wrote the Prisma baseline from all final EF Core snapshots.\n");
} else if (process.argv.includes("--check")) {
  const normalize = (value) =>
    `${value
      .replace(/^\uFEFF/u, "")
      .replace(/\r\n/gu, "\n")
      .trimEnd()}\n`;
  const current = normalize(readFileSync(schemaPath, "utf8"));
  if (current !== normalize(generated)) {
    const currentLines = current.split("\n");
    const generatedLines = normalize(generated).split("\n");
    const mismatch = generatedLines.findIndex((line, index) => line !== currentLines[index]);
    throw new Error(
      "backend/prisma/schema.prisma is not synchronized with the final EF Core snapshots. " +
        `First mismatch is line ${mismatch < 0 ? "after EOF" : mismatch + 1}. ` +
        "Regenerate it with: node scripts/generate-prisma-baseline.mjs > backend/prisma/schema.prisma",
    );
  }
  process.stdout.write("Prisma baseline matches all final EF Core snapshots.\n");
} else {
  process.stdout.write(generated);
}
