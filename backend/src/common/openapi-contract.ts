import type { OpenAPIObject } from "@nestjs/swagger";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadCanonicalOpenApi(): OpenAPIObject {
  const candidates = [
    resolve(process.cwd(), "packages/sdk/openapi/v1.json"),
    resolve(process.cwd(), "../packages/sdk/openapi/v1.json"),
    resolve(__dirname, "../../packages/sdk/openapi/v1.json"),
  ];
  const path = candidates.find(existsSync);
  if (!path) throw new Error("The canonical packages/sdk/openapi/v1.json contract was not found.");
  return JSON.parse(readFileSync(path, "utf8")) as OpenAPIObject;
}

export function missingCanonicalOperations(
  canonical: OpenAPIObject,
  generated: OpenAPIObject,
): string[] {
  const missing: string[] = [];
  for (const [path, operations] of Object.entries(canonical.paths)) {
    for (const [method, operation] of Object.entries(operations ?? {})) {
      if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
      const implemented = generated.paths[path]?.[method as "get"];
      const expected = operation as {
        operationId?: string;
        responses?: Record<string, unknown>;
      };
      const expectedOperationId = expected.operationId;
      if (!implemented || implemented.operationId !== expectedOperationId) {
        missing.push(`${method.toUpperCase()} ${path} (${expectedOperationId ?? "unnamed"})`);
        continue;
      }
      const expectedSuccess = Object.keys(expected.responses ?? {}).filter((status) =>
        /^2\d\d$/u.test(status),
      );
      const implementedResponses = implemented.responses ?? {};
      for (const status of expectedSuccess) {
        if (!(status in implementedResponses)) {
          missing.push(
            `${method.toUpperCase()} ${path} (${expectedOperationId ?? "unnamed"}) missing HTTP ${status}`,
          );
        }
      }
    }
  }
  return missing;
}

export function verifyImplementedOperations(
  canonical: OpenAPIObject,
  generated: OpenAPIObject,
): void {
  const missing = missingCanonicalOperations(canonical, generated);
  if (missing.length) {
    throw new Error(
      `NestJS does not implement the canonical API operations:\n${missing.join("\n")}`,
    );
  }
}
