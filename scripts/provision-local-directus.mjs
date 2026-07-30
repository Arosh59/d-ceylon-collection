#!/usr/bin/env node

const baseUrl = (process.env.DIRECTUS_PUBLIC_URL ?? "http://127.0.0.1:8055").replace(/\/$/, "");
const email = process.env.DIRECTUS_ADMIN_EMAIL;
const password = process.env.DIRECTUS_ADMIN_PASSWORD;
const shouldSeed = process.argv.includes("--seed");

if (!email || !password) {
  throw new Error("DIRECTUS_ADMIN_EMAIL and DIRECTUS_ADMIN_PASSWORD are required.");
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    const code = payload?.errors?.[0]?.extensions?.code ?? response.status;
    throw new Error(`Directus ${options.method ?? "GET"} ${path} failed (${code}).`);
  }

  return payload?.data;
}

const authentication = await request("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password, mode: "json" }),
});

const authorization = { Authorization: `Bearer ${authentication.access_token}` };
const withAuthentication = (options = {}) => ({
  ...options,
  headers: { ...authorization, ...(options.headers ?? {}) },
});

const statusField = {
  field: "status",
  type: "string",
  meta: {
    interface: "select-dropdown",
    options: {
      choices: ["draft", "published", "archived"].map((value) => ({ text: value, value })),
    },
    required: true,
  },
  schema: { default_value: "draft", is_nullable: false, max_length: 16 },
};

const idField = {
  field: "id",
  type: "uuid",
  meta: { hidden: true, interface: "input", readonly: true, special: ["uuid"] },
  schema: { is_nullable: false, is_primary_key: true, has_auto_increment: false },
};

const textField = (field, options = {}) => ({
  field,
  type: options.type ?? "string",
  meta: {
    interface: options.interface ?? (options.type === "text" ? "input-multiline" : "input"),
    required: options.required ?? false,
  },
  schema: {
    is_nullable: !(options.required ?? false),
    ...(options.maxLength ? { max_length: options.maxLength } : {}),
    ...(options.unique ? { is_unique: true } : {}),
  },
});

const integerField = (field) => ({
  field,
  type: "integer",
  meta: { interface: "input", required: true },
  schema: { default_value: 0, is_nullable: false },
});

const timestampField = (field) => ({
  field,
  type: "timestamp",
  meta: { interface: "datetime", required: false },
  schema: { is_nullable: true },
});

const collections = [
  {
    name: "journal_articles",
    note: "Published Journal stories rendered by the public website.",
    displayTemplate: "{{ title }}",
    fields: [
      idField,
      statusField,
      textField("slug", { required: true, unique: true, maxLength: 160 }),
      textField("title", { required: true, maxLength: 240 }),
      textField("summary", { type: "text" }),
      textField("content", { type: "text" }),
      textField("hero_image", { maxLength: 2048 }),
      timestampField("date_published"),
    ],
    readableFields: [
      "id",
      "status",
      "slug",
      "title",
      "summary",
      "content",
      "hero_image",
      "date_published",
    ],
  },
  {
    name: "promotions",
    note: "Published public promotional messages rendered by the public website.",
    displayTemplate: "{{ title }}",
    fields: [
      idField,
      statusField,
      integerField("sort"),
      textField("title", { required: true, maxLength: 240 }),
      textField("summary", { type: "text" }),
      textField("cta_label", { maxLength: 120 }),
      textField("cta_url", { maxLength: 2048 }),
      textField("image", { maxLength: 2048 }),
    ],
    readableFields: ["id", "status", "sort", "title", "summary", "cta_label", "cta_url", "image"],
  },
];

const existingCollections = await request("/collections", withAuthentication());
const existingNames = new Set(existingCollections.map((collection) => collection.collection));

for (const collection of collections) {
  if (existingNames.has(collection.name)) {
    continue;
  }

  await request(
    "/collections",
    withAuthentication({
      method: "POST",
      body: JSON.stringify({
        collection: collection.name,
        meta: {
          icon: collection.name === "journal_articles" ? "article" : "campaign",
          note: collection.note,
          display_template: collection.displayTemplate,
          accountability: "all",
          archive_field: "status",
          archive_value: "archived",
          unarchive_value: "draft",
        },
        schema: { name: collection.name },
        fields: collection.fields,
      }),
    }),
  );
  console.log(`Created ${collection.name}.`);
}

const policies = await request("/policies", withAuthentication());
const publicPolicy = policies.find((policy) => !policy.admin_access && !policy.app_access);
if (!publicPolicy) {
  throw new Error("Directus public policy was not found.");
}

const permissions = await request("/permissions?limit=-1", withAuthentication());
for (const collection of collections) {
  const exists = permissions.some(
    (permission) =>
      permission.policy === publicPolicy.id &&
      permission.collection === collection.name &&
      permission.action === "read",
  );
  if (exists) {
    continue;
  }

  await request(
    "/permissions",
    withAuthentication({
      method: "POST",
      body: JSON.stringify({
        policy: publicPolicy.id,
        collection: collection.name,
        action: "read",
        permissions: { status: { _eq: "published" } },
        validation: null,
        presets: null,
        fields: collection.readableFields,
      }),
    }),
  );
  console.log(`Granted published-only public read access to ${collection.name}.`);
}

if (shouldSeed) {
  const seeds = {
    journal_articles: [
      {
        id: "0cc96350-3e5d-4dc3-9142-f4a9531d26a1",
        status: "published",
        slug: "slow-travel-through-the-hill-country",
        title: "A slower way through the Hill Country",
        summary: "A local-only Journal fixture for the public editorial integration.",
        content:
          "This local sample is editorial placeholder content. It is not a travel quote, booking, or availability claim.",
        hero_image: "placeholder:journal-hill-country",
        date_published: "2026-07-30T00:00:00Z",
      },
      {
        id: "51463aa3-94c3-45ef-af59-832c4a1fba17",
        status: "published",
        slug: "coastal-mornings-in-the-south",
        title: "Coastal mornings in the south",
        summary: "A second local-only Journal fixture for pagination and detail checks.",
        content:
          "This local sample is editorial placeholder content. Replace it with approved, rights-cleared content before release.",
        hero_image: "placeholder:journal-coast",
        date_published: "2026-07-29T00:00:00Z",
      },
    ],
    promotions: [
      {
        id: "1c00ba54-b560-46a3-b41c-4c4760f80ceb",
        status: "published",
        sort: 1,
        title: "Plan at your own pace",
        summary:
          "Explore catalogue ideas and save a draft itinerary without any booking commitment.",
        cta_label: "Explore the catalogue",
        cta_url: "/catalogue",
        image: "placeholder:promotion-catalogue",
      },
    ],
  };

  for (const [collection, records] of Object.entries(seeds)) {
    const current = await request(`/items/${collection}?limit=1`, withAuthentication());
    if (current.length > 0) {
      console.log(`Skipped ${collection} seed data because content already exists.`);
      continue;
    }

    await request(
      `/items/${collection}`,
      withAuthentication({ method: "POST", body: JSON.stringify(records) }),
    );
    console.log(`Seeded ${records.length} local ${collection} record(s).`);
  }
}

console.log("Directus editorial provisioning completed.");
