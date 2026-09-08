import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = path.join(repositoryRoot, "packages/sdk/openapi/v1.json");
const outputDirectory = path.join(repositoryRoot, "docs/api/postman");
const collectionPath = path.join(outputDirectory, "D-Ceylon-Backend.postman_collection.json");
const environmentPath = path.join(outputDirectory, "D-Ceylon-Local.postman_environment.json");
const contract = JSON.parse(await readFile(contractPath, "utf8"));

const requestExamples = {
  CreateCustomerProfileRequest: {
    givenName: "Nadeesha",
    familyName: "Perera",
    contactEmail: "nadeesha.perera@example.com",
    contactPhone: "+94771234567",
    countryCode: "LK",
    preferredLocale: "en-LK",
    preferredContactMethod: "email",
    marketingConsent: true,
  },
  UpdateCustomerProfileRequest: {
    concurrencyToken: "{{profileConcurrencyToken}}",
    givenName: "Nadeesha",
    familyName: "Perera",
    contactEmail: "nadeesha.perera@example.com",
    contactPhone: "+94771234567",
    countryCode: "LK",
    preferredLocale: "en-LK",
    preferredContactMethod: "email",
    marketingConsent: false,
  },
  CreateTravellerRequest: {
    givenName: "Maya",
    familyName: "Perera",
    dateOfBirth: "1992-08-14",
    accessibilityNeeds: "Step-free access where available.",
    dietaryNeeds: "Vegetarian; no peanuts.",
    emergencyContactName: "Kamal Perera",
    emergencyContactPhone: "+94772345678",
  },
  UpdateTravellerRequest: {
    concurrencyToken: "{{travellerConcurrencyToken}}",
    givenName: "Maya",
    familyName: "Perera",
    dateOfBirth: "1992-08-14",
    accessibilityNeeds: "Step-free access and an aisle seat where available.",
    dietaryNeeds: "Vegetarian; no peanuts.",
    emergencyContactName: "Kamal Perera",
    emergencyContactPhone: "+94772345678",
  },
  CreateWishlistEntryRequest: {
    productSlug: "{{productSlug}}",
    note: "Interested in a private tea-country railway experience.",
  },
  UpdateWishlistEntryRequest: {
    note: "Prefer the morning train and a window seat, subject to availability.",
    concurrencyToken: "{{wishlistConcurrencyToken}}",
  },
  CreateSavedItineraryRequest: {
    title: "Tea Country and Southern Coast",
    summary: "A relaxed journey from Ella to Galle with rail, tea, heritage, and coastal time.",
    travelStartDate: "2027-02-10",
    travelEndDate: "2027-02-17",
    primaryDestinationSlug: "ella",
  },
  UpdateSavedItineraryRequest: {
    concurrencyToken: "{{savedItineraryConcurrencyToken}}",
    title: "Tea Country, Galle and the Southern Coast",
    summary: "An eight-day slow journey through Ella and Galle with local food and heritage.",
    travelStartDate: "2027-02-10",
    travelEndDate: "2027-02-17",
    primaryDestinationSlug: "ella",
  },
  CreateTravelPlanRequest: {
    title: "Ella and Galle Discovery",
    savedItineraryId: "{{savedItineraryId}}",
    travelStartDate: "2027-02-10",
    travelEndDate: "2027-02-17",
    pace: "relaxed",
    destinationSlugs: ["ella", "galle"],
    travellerIds: ["{{travellerId}}"],
    interests: ["tea culture", "scenic railways", "local food", "heritage"],
    productTypeSlugs: [],
    categorySlugs: [],
    tagSlugs: ["tea", "heritage"],
    accessibilityConsiderations: "Avoid long stair climbs and include regular rest stops.",
    dietaryConsiderations: "Vegetarian meals with no peanuts.",
  },
  UpdateTravelPlanInputRequest: {
    concurrencyToken: "{{travelPlanConcurrencyToken}}",
    title: "Ella and Galle Discovery",
    savedItineraryId: "{{savedItineraryId}}",
    travelStartDate: "2027-02-10",
    travelEndDate: "2027-02-17",
    pace: "relaxed",
    destinationSlugs: ["ella", "galle"],
    travellerIds: ["{{travellerId}}"],
    interests: ["tea culture", "scenic railways", "local food", "heritage"],
    productTypeSlugs: [],
    categorySlugs: [],
    tagSlugs: ["tea", "heritage"],
    accessibilityConsiderations: "Avoid long stair climbs and include regular rest stops.",
    dietaryConsiderations: "Vegetarian meals with no peanuts.",
  },
  GenerateTravelPlanRequest: { concurrencyToken: "{{travelPlanConcurrencyToken}}" },
  UpdateItineraryDayRequest: {
    title: "Ella tea country and viewpoints",
    concurrencyToken: "{{dayConcurrencyToken}}",
  },
  CreateItineraryItemRequest: {
    title: "Guided visit to a working tea estate",
    notes: "Include a factory tour and a vegetarian estate lunch.",
    durationMinutes: 240,
    destinationSlug: "ella",
    position: 1,
  },
  UpdateItineraryItemRequest: {
    concurrencyToken: "{{itemConcurrencyToken}}",
    title: "Private guided visit to a working tea estate",
    notes: "Include factory tour, tasting, and vegetarian estate lunch.",
    durationMinutes: 270,
    destinationSlug: "ella",
    position: 1,
  },
  ReorderItineraryItemRequest: {
    targetDayId: "{{targetDayId}}",
    position: 1,
    concurrencyToken: "{{itemConcurrencyToken}}",
  },
  CreateQuoteRequest: {
    travelPlanId: "{{planId}}",
    itineraryRevisionId: "{{itineraryRevisionId}}",
    customerNotes: "Please quote private transfers and boutique accommodation with breakfast.",
  },
  QuoteTransitionRequest: {
    versionId: "{{quoteVersionId}}",
    concurrencyToken: "{{quoteConcurrencyToken}}",
  },
  QuoteConcurrencyRequest: { concurrencyToken: "{{quoteConcurrencyToken}}" },
  PrepareAgentQuoteRequest: {
    currency: "USD",
    concurrencyToken: "{{quoteConcurrencyToken}}",
  },
  UpdateAgentQuoteDraftRequest: {
    currency: "USD",
    assumptions: [
      "Rates are based on two adults sharing one room.",
      "Rail seats and named hotels remain subject to confirmation.",
    ],
    inclusions: [
      "Seven nights' boutique accommodation with breakfast",
      "Private air-conditioned vehicle with English-speaking chauffeur",
      "Tea estate visit and Galle Fort walking tour",
    ],
    exclusions: ["International flights", "Travel insurance", "Personal expenses"],
    terms:
      "A 30% deposit is required after acceptance. Final availability is confirmed separately.",
    internalNotes: "Confirm Ella rail seats before supplier release deadline.",
    lines: [
      {
        title: "Boutique accommodation",
        description: "Seven nights for two adults, including breakfast.",
        quantity: 7,
        unitAmount: 185,
      },
      {
        title: "Private chauffeur and vehicle",
        description: "Airport arrival, intercity transfers, and local touring.",
        quantity: 8,
        unitAmount: 95,
      },
      {
        title: "Curated experiences",
        description: "Tea estate visit, scenic railway assistance, and Galle heritage walk.",
        quantity: 1,
        unitAmount: 420,
      },
    ],
    components: [
      { kind: "tax", label: "Local taxes and service charges", amount: 247.5 },
      { kind: "adjustment", label: "Early planning adjustment", amount: -100 },
    ],
    concurrencyToken: "{{quoteConcurrencyToken}}",
  },
  SendQuoteRequest: {
    expiresAtUtc: "2027-01-15T12:00:00.000Z",
    concurrencyToken: "{{quoteConcurrencyToken}}",
  },
  CreateBookingRequest: {
    quoteId: "{{quoteId}}",
    quoteVersionId: "{{quoteVersionId}}",
    customerNotes: "Please arrange an airport meet-and-greet with a name board.",
  },
  CancelBookingRequest: {
    reason: "Travel dates changed unexpectedly; please review cancellation options.",
    concurrencyToken: "{{bookingConcurrencyToken}}",
  },
  CreatePaymentRequest: {
    kind: "deposit",
    gateway: "manual",
    idempotencyKey: "postman-ella-galle-deposit-001",
  },
  CreateSupplierRequest: {
    name: "Ceylon Highlands Transport",
    category: "transport",
    contactName: "Dinuka Fernando",
    contactEmail: "operations@ceylon-highlands.example",
  },
  CreateOperationTaskRequest: {
    bookingId: "{{bookingId}}",
    supplierId: "{{supplierId}}",
    title: "Confirm Ella railway tickets",
    dueDate: "2027-01-20",
    notes: "Request first-class observation seats where available.",
  },
  CreateVehicleRequest: {
    supplierId: "{{supplierId}}",
    name: "Toyota KDH High Roof",
    registrationNumber: "WP-CAB-4821",
    capacity: 8,
    notes: "Air-conditioned vehicle with space for four large suitcases.",
  },
  CreateDriverRequest: {
    name: "Kasun Jayawardena",
    phone: "+94774567890",
    licenceNumber: "B1234567",
  },
  CreateGuideRequest: {
    name: "Tharushi Wijesinghe",
    phone: "+94775678901",
    languages: "English, Sinhala, German",
  },
  CreateArrivalRequest: {
    bookingId: "{{bookingId}}",
    arrivalAtUtc: "2027-02-10T03:30:00.000Z",
    airport: "Bandaranaike International Airport (CMB)",
    flightNumber: "UL 504",
    notes: "Meet at arrivals with a D Ceylon Collection name board.",
  },
  CreateBookingResourceAssignmentRequest: {
    bookingId: "{{bookingId}}",
    serviceDate: "2027-02-10",
    vehicleId: "{{vehicleId}}",
    driverId: "{{driverId}}",
    guideId: "{{guideId}}",
    notes: "Airport pickup followed by transfer to the first Colombo hotel.",
  },
};

const identifierVariables = {
  customerId: "customerId",
  organisationId: "organisationId",
  travellerId: "travellerId",
  entryId: "wishlistEntryId",
  itineraryId: "savedItineraryId",
  planId: "planId",
  dayId: "dayId",
  itemId: "itemId",
  quoteId: "quoteId",
  bookingId: "bookingId",
  voucherId: "voucherId",
  paymentId: "paymentId",
};

const resourceCaptures = {
  CreateCustomerProfileV1: ["profileConcurrencyToken", "data.concurrencyToken"],
  GetCustomerProfileV1: ["profileConcurrencyToken", "data.concurrencyToken"],
  UpdateCustomerProfileV1: ["profileConcurrencyToken", "data.concurrencyToken"],
  CreateCustomerTravellerV1: [
    "travellerId",
    "data.id",
    "travellerConcurrencyToken",
    "data.concurrencyToken",
  ],
  GetCustomerTravellerV1: ["travellerConcurrencyToken", "data.concurrencyToken"],
  UpdateCustomerTravellerV1: ["travellerConcurrencyToken", "data.concurrencyToken"],
  CreateCustomerWishlistEntryV1: [
    "wishlistEntryId",
    "data.id",
    "wishlistConcurrencyToken",
    "data.concurrencyToken",
  ],
  UpdateCustomerWishlistEntryV1: ["wishlistConcurrencyToken", "data.concurrencyToken"],
  CreateCustomerSavedItineraryV1: [
    "savedItineraryId",
    "data.id",
    "savedItineraryConcurrencyToken",
    "data.concurrencyToken",
  ],
  GetCustomerSavedItineraryV1: ["savedItineraryConcurrencyToken", "data.concurrencyToken"],
  UpdateCustomerSavedItineraryV1: ["savedItineraryConcurrencyToken", "data.concurrencyToken"],
  CreateCustomerTravelPlanV1: [
    "planId",
    "data.id",
    "travelPlanConcurrencyToken",
    "data.concurrencyToken",
  ],
  GetCustomerTravelPlanV1: ["travelPlanConcurrencyToken", "data.concurrencyToken"],
  UpdateCustomerTravelPlanInputV1: ["travelPlanConcurrencyToken", "data.concurrencyToken"],
  GenerateCustomerTravelPlanV1: [
    "travelPlanConcurrencyToken",
    "data.concurrencyToken",
    "itineraryRevisionId",
    "data.currentRevision?.id",
    "dayId",
    "data.currentRevision?.days?.[0]?.id",
    "dayConcurrencyToken",
    "data.currentRevision?.days?.[0]?.concurrencyToken",
    "itemId",
    "data.currentRevision?.days?.[0]?.items?.[0]?.id",
    "itemConcurrencyToken",
    "data.currentRevision?.days?.[0]?.items?.[0]?.concurrencyToken",
  ],
  UpdateCustomerItineraryDayV1: [
    "travelPlanConcurrencyToken",
    "data.concurrencyToken",
    "dayConcurrencyToken",
    "data.currentRevision?.days?.[0]?.concurrencyToken",
  ],
  CreateCustomerItineraryItemV1: [
    "travelPlanConcurrencyToken",
    "data.concurrencyToken",
    "itemId",
    "data.currentRevision?.days?.[0]?.items?.[0]?.id",
    "itemConcurrencyToken",
    "data.currentRevision?.days?.[0]?.items?.[0]?.concurrencyToken",
  ],
  UpdateCustomerItineraryItemV1: [
    "travelPlanConcurrencyToken",
    "data.concurrencyToken",
    "itemConcurrencyToken",
    "data.currentRevision?.days?.[0]?.items?.[0]?.concurrencyToken",
  ],
  ReorderCustomerItineraryItemV1: [
    "travelPlanConcurrencyToken",
    "data.concurrencyToken",
    "itemConcurrencyToken",
    "data.currentRevision?.days?.[0]?.items?.[0]?.concurrencyToken",
  ],
  RequestCustomerQuoteV1: ["quoteId", "data.id", "quoteConcurrencyToken", "data.concurrencyToken"],
  GetCustomerQuoteV1: [
    "quoteConcurrencyToken",
    "data.concurrencyToken",
    "quoteVersionId",
    "data.currentVersionId",
  ],
  GetAgentQuoteV1: [
    "quoteConcurrencyToken",
    "data.concurrencyToken",
    "quoteVersionId",
    "data.currentVersionId",
  ],
  PrepareAgentQuoteV1: ["quoteConcurrencyToken", "data.concurrencyToken"],
  UpdateAgentQuoteDraftV1: ["quoteConcurrencyToken", "data.concurrencyToken"],
  SendAgentQuoteV1: [
    "quoteConcurrencyToken",
    "data.concurrencyToken",
    "quoteVersionId",
    "data.currentVersionId",
  ],
  AcceptCustomerQuoteV1: ["quoteConcurrencyToken", "data.concurrencyToken"],
  DeclineCustomerQuoteV1: ["quoteConcurrencyToken", "data.concurrencyToken"],
  WithdrawCustomerQuoteV1: ["quoteConcurrencyToken", "data.concurrencyToken"],
  ReviseAgentQuoteV1: ["quoteConcurrencyToken", "data.concurrencyToken"],
  WithdrawAgentQuoteV1: ["quoteConcurrencyToken", "data.concurrencyToken"],
  CreateCustomerBookingV1: [
    "bookingId",
    "data.id",
    "bookingConcurrencyToken",
    "data.concurrencyToken",
  ],
  GetCustomerBookingV1: [
    "bookingConcurrencyToken",
    "data.concurrencyToken",
    "voucherId",
    "data.vouchers?.[0]?.id",
  ],
  RequestBookingCancellationV1: ["bookingConcurrencyToken", "data.concurrencyToken"],
  CreateCustomerPaymentV1: [
    "paymentId",
    "data.id",
    "paymentConcurrencyToken",
    "data.concurrencyToken",
  ],
  CreateOperationSupplierV1: [
    "supplierId",
    "data.id",
    "supplierConcurrencyToken",
    "data.concurrencyToken",
  ],
  CreateBookingOperationTaskV1: ["operationTaskId", "data.id"],
  CreateOperationVehicleV1: ["vehicleId", "data.id"],
  CreateOperationDriverV1: ["driverId", "data.id"],
  CreateOperationGuideV1: ["guideId", "data.id"],
  CreateOperationArrivalV1: ["arrivalId", "data.id"],
  CreateOperationBookingResourceAssignmentV1: ["assignmentId", "data.id"],
};

const folderOrder = [
  "Catalogue",
  "Editorial",
  "Identity and Access",
  "Customer records",
  "Travel planning",
  "Customer quotes",
  "Agent quotes",
  "Customer bookings",
  "Agent bookings",
  "Customer payments",
  "Supplier operations",
  "Administration",
];

const tokenByTag = {
  "Identity and Access": "customerToken",
  "Customer records": "customerToken",
  "Travel planning": "customerToken",
  "Customer quotes": "customerToken",
  "Agent quotes": "agentToken",
  "Customer bookings": "customerToken",
  "Agent bookings": "agentToken",
  "Customer payments": "customerToken",
  "Supplier operations": "staffToken",
  Administration: "adminToken",
};

const publicTags = new Set(["Catalogue", "Editorial"]);
const folders = new Map(folderOrder.map((name) => [name, { name, item: [] }]));

for (const [apiPath, pathItem] of Object.entries(contract.paths)) {
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    const operation = pathItem[method];
    if (!operation) continue;
    const tag = operation.tags?.[0] ?? "Other";
    if (!folders.has(tag)) folders.set(tag, { name: tag, item: [] });
    folders.get(tag).item.push(createOperationRequest(apiPath, method, operation, tag));
  }
}

const collection = {
  info: {
    _postman_id: "ca0ab651-c832-4b96-a35d-0e01a84b533f",
    name: "D Ceylon Backend API",
    description:
      "Complete D Ceylon v1 API collection generated from packages/sdk/openapi/v1.json. Request bodies contain realistic Sri Lankan travel examples. Run the testing-token requests only against APP_ENVIRONMENT=Testing; otherwise, paste NestJS-issued bearer tokens into the matching environment variables. Requests capture created IDs and concurrency tokens. Accept, decline, revise, withdraw, cancellation, and delete requests are alternative/destructive transitions and should be run deliberately rather than by running the entire collection in one pass.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  item: [
    createHealthFolder(),
    createAuthenticationFolder(),
    ...folderOrder.map((name) => folders.get(name)).filter(Boolean),
    ...[...folders.entries()]
      .filter(([name]) => !folderOrder.includes(name))
      .map(([, folder]) => folder),
  ],
  event: [
    {
      listen: "prerequest",
      script: {
        type: "text/javascript",
        exec: [
          "if (!pm.environment.get('baseUrl')) {",
          "  throw new Error('Select the D Ceylon Local environment or define baseUrl.');",
          "}",
        ],
      },
    },
  ],
  variable: [
    { key: "pageNumber", value: "1" },
    { key: "pageSize", value: "20" },
  ],
};

const environment = {
  id: "72624583-34a1-4adc-880d-2e802e3e9967",
  name: "D Ceylon Local",
  values: environmentValues(),
  _postman_variable_scope: "environment",
  _postman_exported_using: "D Ceylon repository generator",
};

await mkdir(outputDirectory, { recursive: true });
const prettierConfig = (await resolveConfig(collectionPath)) ?? {};
await writeFile(
  collectionPath,
  await format(JSON.stringify(collection), { ...prettierConfig, parser: "json" }),
);
await writeFile(
  environmentPath,
  await format(JSON.stringify(environment), { ...prettierConfig, parser: "json" }),
);

console.log(`Generated ${collectionPath}`);
console.log(`Generated ${environmentPath}`);

function createOperationRequest(apiPath, method, operation, tag) {
  const schemaName = operation.requestBody?.content?.["application/json"]?.schema?.$ref
    ?.split("/")
    .at(-1);
  const example = schemaName ? requestExamples[schemaName] : undefined;
  const parameters = [...(operation.parameters ?? [])];
  const query = parameters
    .filter((parameter) => parameter.in === "query")
    .map((parameter) => queryParameter(parameter, operation.operationId));
  const renderedPath = parameters
    .filter((parameter) => parameter.in === "path")
    .reduce(
      (value, parameter) =>
        value.replace(`{${parameter.name}}`, `{{${pathVariable(parameter.name, apiPath)}}}`),
      apiPath,
    );
  const enabledQuery = query.filter((parameter) => !parameter.disabled);
  const rawQuery = enabledQuery.length
    ? `?${enabledQuery.map(({ key, value }) => `${key}=${value}`).join("&")}`
    : "";
  const expectedStatus = Number(
    Object.keys(operation.responses ?? {}).find((status) => status.startsWith("2")) ?? 200,
  );
  const token = accessToken(operation.operationId, tag);
  const request = {
    method: method.toUpperCase(),
    header: [
      { key: "Accept", value: "application/json", type: "text" },
      { key: "X-Correlation-ID", value: "{{$guid}}", type: "text" },
      ...(example ? [{ key: "Content-Type", value: "application/json", type: "text" }] : []),
    ],
    ...(publicTags.has(tag)
      ? { auth: { type: "noauth" } }
      : {
          auth: {
            type: "bearer",
            bearer: [{ key: "token", value: `{{${token}}}`, type: "string" }],
          },
        }),
    url: {
      raw: `{{baseUrl}}${renderedPath}${rawQuery}`,
      host: ["{{baseUrl}}"],
      path: renderedPath.split("/").filter(Boolean),
      ...(query.length ? { query } : {}),
    },
    ...(example
      ? {
          body: {
            mode: "raw",
            raw: JSON.stringify(example, null, 2),
            options: { raw: { language: "json" } },
          },
        }
      : {}),
    description: [
      operation.summary || operation.operationId,
      `Authentication: ${publicTags.has(tag) ? "public" : `Bearer {{${token}}}`}.`,
      ...(schemaName ? [`Example body follows ${schemaName}.`] : []),
    ].join("\n\n"),
  };

  return {
    name: readableName(operation.operationId),
    request,
    response: [],
    event: [
      {
        listen: "test",
        script: {
          type: "text/javascript",
          exec: testScript(operation.operationId, expectedStatus),
        },
      },
    ],
  };
}

function queryParameter(parameter, operationId) {
  const key = lowerFirst(parameter.name);
  let value = `{{${key}}}`;
  let disabled = !parameter.required;

  if (key === "pageNumber" || key === "pageSize") disabled = false;
  if (key === "query") {
    value = "tea";
    disabled = false;
  }
  if (key === "destination") {
    value = "ella";
    disabled = false;
  }
  if (key === "sort") {
    value = "price-asc";
    disabled = false;
  }
  if (key === "concurrencyToken") {
    value = `{{${concurrencyVariableForOperation(operationId)}}}`;
    disabled = false;
  }

  return { key, value, disabled, description: parameter.description ?? "" };
}

function concurrencyVariableForOperation(operationId) {
  if (operationId === "DeleteCustomerProfileV1") return "profileConcurrencyToken";
  if (operationId === "DeleteCustomerTravellerV1") return "travellerConcurrencyToken";
  if (operationId === "DeleteCustomerWishlistEntryV1") return "wishlistConcurrencyToken";
  if (operationId === "DeleteCustomerSavedItineraryV1") return "savedItineraryConcurrencyToken";
  return "resourceConcurrencyToken";
}

function pathVariable(name, apiPath) {
  if (name !== "slug") return identifierVariables[name] ?? name;
  if (apiPath.includes("/products/")) return "productSlug";
  if (apiPath.includes("/collections/")) return "collectionSlug";
  if (apiPath.includes("/destinations/")) return "destinationSlug";
  if (apiPath.includes("/journal/")) return "journalSlug";
  return "slug";
}

function accessToken(operationId, tag) {
  if (operationId === "GetAgentPortalV1") return "agentToken";
  if (operationId === "GetStaffPortalV1") return "staffToken";
  if (operationId === "GetAdministratorPortalV1") return "adminToken";
  return tokenByTag[tag] ?? "customerToken";
}

function testScript(operationId, expectedStatus) {
  const captures = resourceCaptures[operationId] ?? [];
  const lines = [
    `pm.test("HTTP ${expectedStatus}", () => pm.response.to.have.status(${expectedStatus}));`,
    "const correlationId = pm.response.headers.get('X-Correlation-ID');",
    "if (correlationId) pm.environment.set('lastCorrelationId', correlationId);",
  ];
  if (expectedStatus !== 204 && captures.length) {
    lines.push(
      "if (pm.response.code >= 200 && pm.response.code < 300 && pm.response.text()) {",
      "  const data = pm.response.json();",
    );
    for (let index = 0; index < captures.length; index += 2) {
      const variable = captures[index];
      const expression = captures[index + 1];
      lines.push(`  if (${expression}) pm.environment.set('${variable}', ${expression});`);
    }
    if (operationId === "GenerateCustomerTravelPlanV1") {
      lines.push(
        "  if (data.currentRevision?.days?.length > 1) pm.environment.set('targetDayId', data.currentRevision.days[1].id);",
      );
    }
    lines.push("}");
  }
  return lines;
}

function createHealthFolder() {
  return {
    name: "00 - Health",
    item: ["live", "ready"].map((kind) => ({
      name: kind === "live" ? "Liveness" : "Readiness (database)",
      request: {
        method: "GET",
        auth: { type: "noauth" },
        header: [{ key: "Accept", value: "application/json" }],
        url: {
          raw: `{{baseUrl}}/health/${kind}`,
          host: ["{{baseUrl}}"],
          path: ["health", kind],
        },
      },
      event: [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: ["pm.test('HTTP 200', () => pm.response.to.have.status(200));"],
          },
        },
      ],
      response: [],
    })),
  };
}

function createAuthenticationFolder() {
  const personas = [
    ["customer", "customerToken", "customerId", "identity.customerId"],
    ["agent", "agentToken", "organisationId", "identity.organisationId"],
    ["staff", "staffToken", null, null],
    ["administrator", "adminToken", null, null],
  ];
  return {
    name: "00 - Testing authentication",
    description:
      "Available only when the backend runs with APP_ENVIRONMENT=Testing. Otherwise, obtain application tokens from the NestJS authentication endpoints and paste them into the environment.",
    item: personas.map(([persona, tokenVariable, identityVariable, identityProperty]) => ({
      name: `Get ${persona} testing token`,
      request: {
        method: "POST",
        auth: { type: "noauth" },
        header: [
          { key: "Accept", value: "application/json" },
          { key: "Content-Type", value: "application/json" },
          { key: "X-Test-Authentication-Key", value: "{{testAuthKey}}", type: "text" },
        ],
        body: {
          mode: "raw",
          raw: JSON.stringify({ persona }, null, 2),
          options: { raw: { language: "json" } },
        },
        url: {
          raw: "{{baseUrl}}/api/v1/access/testing/token",
          host: ["{{baseUrl}}"],
          path: ["api", "v1", "access", "testing", "token"],
        },
      },
      event: [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: [
              "pm.test('HTTP 200', () => pm.response.to.have.status(200));",
              "if (pm.response.code === 200) {",
              "  const data = pm.response.json();",
              `  pm.environment.set('${tokenVariable}', data.accessToken);`,
              ...(identityVariable
                ? [
                    `  if (data.${identityProperty}) pm.environment.set('${identityVariable}', data.${identityProperty});`,
                  ]
                : []),
              "}",
            ],
          },
        },
      ],
      response: [],
    })),
  };
}

function environmentValues() {
  const values = {
    baseUrl: "http://127.0.0.1:8080",
    testAuthKey: "",
    customerToken: "",
    agentToken: "",
    staffToken: "",
    adminToken: "",
    customerId: "10000000-0000-0000-0000-000000000001",
    organisationId: "20000000-0000-0000-0000-000000000001",
    productSlug: "tea-country-rail",
    collectionSlug: "flow",
    destinationSlug: "ella",
    journalSlug: "slow-rail-journeys-through-tea-country",
    productType: "experience",
    category: "culture",
    collection: "flow",
    tag: "tea",
    minimumPrice: "100",
    maximumPrice: "5000",
    minimumDurationMinutes: "60",
    maximumDurationMinutes: "1440",
    pageNumber: "1",
    pageSize: "20",
    profileConcurrencyToken: "00000000-0000-0000-0000-000000000001",
    travellerId: "30000000-0000-0000-0000-000000000001",
    travellerConcurrencyToken: "00000000-0000-0000-0000-000000000002",
    wishlistEntryId: "40000000-0000-0000-0000-000000000001",
    wishlistConcurrencyToken: "00000000-0000-0000-0000-000000000003",
    savedItineraryId: "50000000-0000-0000-0000-000000000001",
    savedItineraryConcurrencyToken: "00000000-0000-0000-0000-000000000004",
    planId: "60000000-0000-0000-0000-000000000001",
    travelPlanConcurrencyToken: "00000000-0000-0000-0000-000000000005",
    itineraryRevisionId: "61000000-0000-0000-0000-000000000001",
    dayId: "62000000-0000-0000-0000-000000000001",
    targetDayId: "62000000-0000-0000-0000-000000000002",
    dayConcurrencyToken: "00000000-0000-0000-0000-000000000006",
    itemId: "63000000-0000-0000-0000-000000000001",
    itemConcurrencyToken: "00000000-0000-0000-0000-000000000007",
    quoteId: "70000000-0000-0000-0000-000000000001",
    quoteVersionId: "71000000-0000-0000-0000-000000000001",
    quoteConcurrencyToken: "00000000-0000-0000-0000-000000000008",
    bookingId: "80000000-0000-0000-0000-000000000001",
    bookingConcurrencyToken: "00000000-0000-0000-0000-000000000009",
    voucherId: "81000000-0000-0000-0000-000000000001",
    paymentId: "82000000-0000-0000-0000-000000000001",
    supplierId: "90000000-0000-0000-0000-000000000001",
    vehicleId: "91000000-0000-0000-0000-000000000001",
    driverId: "92000000-0000-0000-0000-000000000001",
    guideId: "93000000-0000-0000-0000-000000000001",
    resourceConcurrencyToken: "00000000-0000-0000-0000-000000000010",
    lastCorrelationId: "",
  };
  const secrets = new Set([
    "testAuthKey",
    "customerToken",
    "agentToken",
    "staffToken",
    "adminToken",
  ]);
  return Object.entries(values).map(([key, value]) => ({
    key,
    value,
    type: secrets.has(key) ? "secret" : "default",
    enabled: true,
  }));
}

function readableName(operationId) {
  return operationId
    .replace(/V1$/u, "")
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .replace(/^Get /u, "Get ")
    .trim();
}

function lowerFirst(value) {
  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}
