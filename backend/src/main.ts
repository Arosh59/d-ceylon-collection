import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import type { Server } from "node:http";

import { AppModule } from "./app.module";
import { ProblemDetailsFilter } from "./common/problem-details.filter";
import { JsonLogger } from "./common/json-logger";
import { loadCanonicalOpenApi, verifyImplementedOperations } from "./common/openapi-contract";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new JsonLogger(),
  });

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hidePoweredBy: true,
      hsts: process.env.APP_ENVIRONMENT === "Production",
      referrerPolicy: { policy: "no-referrer" },
    }),
  );
  app.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    );
    response.setHeader("Cache-Control", "no-store");
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
      forbidUnknownValues: false,
      stopAtFirstError: false,
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter());

  const generatedOpenApi = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("D Ceylon Collection API")
      .setVersion("v1")
      .addBearerAuth()
      .build(),
    { operationIdFactory: (_controller, method) => method },
  );
  const openApi = loadCanonicalOpenApi();
  verifyImplementedOperations(openApi, generatedOpenApi);
  SwaggerModule.setup("openapi", app, openApi, {
    jsonDocumentUrl: "/openapi/v1.json",
    swaggerOptions: { persistAuthorization: true },
  });

  app.enableShutdownHooks();
  const port = Number.parseInt(process.env.API_PORT ?? "8080", 10);
  const server = (await app.listen(port, "0.0.0.0")) as Server;
  server.headersTimeout = 15_000;
}

void bootstrap();
