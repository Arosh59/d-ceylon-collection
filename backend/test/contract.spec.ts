import { Test } from "@nestjs/testing";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

jest.mock("jose", () => ({ createRemoteJWKSet: jest.fn(), jwtVerify: jest.fn() }));

import { AppModule } from "../src/app.module";
import { loadCanonicalOpenApi, missingCanonicalOperations } from "../src/common/openapi-contract";
import { DatabaseService } from "../src/database/database.service";

describe("canonical API contract", () => {
  it("implements every preserved path, method, operation ID, and success status", async () => {
    const testingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService)
      .useValue({ rows: jest.fn(), $executeRaw: jest.fn(), $transaction: jest.fn() })
      .compile();
    const app = testingModule.createNestApplication();
    const generated = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle("test").setVersion("v1").build(),
      { operationIdFactory: (_controller, method) => method },
    );
    const canonical = loadCanonicalOpenApi();
    const operations = Object.values(canonical.paths).flatMap((path) =>
      Object.keys(path ?? {}).filter((method) =>
        ["get", "post", "put", "patch", "delete"].includes(method),
      ),
    );
    expect(Object.keys(canonical.paths)).toHaveLength(60);
    expect(operations).toHaveLength(82);
    expect(Object.keys(generated.paths)).toHaveLength(60);
    expect(
      Object.values(generated.paths).flatMap((path) =>
        Object.keys(path ?? {}).filter((method) =>
          ["get", "post", "put", "patch", "delete"].includes(method),
        ),
      ),
    ).toHaveLength(82);
    expect(missingCanonicalOperations(canonical, generated)).toEqual([]);
    await app.close();
  });
});
