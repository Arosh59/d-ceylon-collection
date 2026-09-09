"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { AdminContentOptions, AdminContentRecord } from "@/lib/admin-content";

interface ContentEditorProps {
  moduleSlug: string;
  resource: string;
  record?: AdminContentRecord;
  options: AdminContentOptions;
  productType?: string;
}

export function ContentEditor({
  moduleSlug,
  resource,
  record,
  options,
  productType,
}: ContentEditorProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(record);
  const referenceResource = ["product-types", "categories", "tags", "media"].includes(resource);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const body = formBody(form, resource, record, options, productType);
    try {
      const response = await fetch(
        `/api/administration/content/${resource}${record ? `/${record.id}` : ""}`,
        {
          method: record ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) throw new Error(await responseError(response));
      router.push(`/modules/${moduleSlug}?saved=1`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The record could not be saved.");
      setBusy(false);
    }
  }

  async function archive() {
    const action = referenceResource ? "delete" : "archive";
    if (
      !record ||
      !window.confirm(
        `${action === "delete" ? "Delete" : "Archive"} this record?${action === "archive" ? " It will disappear from the public website." : " This cannot be undone."}`,
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/administration/content/${resource}/${record.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await responseError(response));
      router.push(`/modules/${moduleSlug}?${referenceResource ? "deleted" : "archived"}=1`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `The record could not be ${action}d.`);
      setBusy(false);
    }
  }

  const value = (key: string) => stringValue(record?.[key]);
  const selected = (key: string) => arrayValue(record?.[key]);
  const productTypeId =
    value("productTypeId") ||
    options.productTypes.find((item) => item.slug === productType)?.id ||
    "";

  return (
    <form className="editor-form" onSubmit={submit}>
      {resource === "media" ? (
        <>
          <Field
            label="Asset URL or storage key"
            name="assetKey"
            required
            value={value("assetKey") || value("name")}
          />
          <Field
            label="Alternative text"
            maxLength={300}
            name="altText"
            required
            value={value("altText")}
          />
          <div className="editor-grid">
            <Field
              label="Width (pixels)"
              min="1"
              name="width"
              required
              step="1"
              type="number"
              value={value("width")}
            />
            <Field
              label="Height (pixels)"
              min="1"
              name="height"
              required
              step="1"
              type="number"
              value={value("height")}
            />
          </div>
          <p className="form-help">
            Use an existing CDN URL or storage key. Binary uploads should be completed in the
            configured media storage service.
          </p>
        </>
      ) : (
        <div className="editor-grid">
          <Field
            label={resource === "journal" ? "Article title" : "Name"}
            name="name"
            required
            value={value("name")}
          />
          <Field
            label="URL slug"
            name="slug"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
            value={value("slug")}
          />
        </div>
      )}
      {!referenceResource ? (
        <label className="editor-field">
          <span>Publication state</span>
          <select
            defaultValue={value(resource === "journal" ? "status" : "publicationState") || "Draft"}
            name="publicationState"
          >
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
        </label>
      ) : null}
      {!referenceResource ? (
        <label className="editor-field">
          <span>Summary</span>
          <textarea
            defaultValue={value("summary") || value("shortDescription")}
            maxLength={500}
            name="summary"
            required={resource === "products"}
            rows={3}
          />
        </label>
      ) : null}
      {!referenceResource ? (
        <label className="editor-field">
          <span>{resource === "journal" ? "Article content" : "Description"}</span>
          <textarea
            defaultValue={value(resource === "journal" ? "content" : "description")}
            maxLength={resource === "journal" ? undefined : 4000}
            name={resource === "journal" ? "content" : "description"}
            required={resource === "products"}
            rows={10}
          />
        </label>
      ) : null}

      {resource === "products" ? (
        <>
          <div className="editor-grid editor-grid-three">
            <label className="editor-field">
              <span>Product type</span>
              <select
                defaultValue={productTypeId}
                disabled={Boolean(productType)}
                name="productTypeId"
                required
              >
                <option value="">Select a type</option>
                {options.productTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {productType ? (
                <input name="lockedProductTypeId" type="hidden" value={productTypeId} />
              ) : null}
            </label>
            <Field
              label="Starting price"
              min="0"
              name="startingPrice"
              step="0.01"
              type="number"
              value={value("startingPrice")}
            />
            <Field
              label="Currency"
              maxLength={3}
              name="currency"
              value={value("currency") || "USD"}
            />
            <Field
              label="Duration (minutes)"
              min="1"
              name="durationMinutes"
              step="1"
              type="number"
              value={value("durationMinutes")}
            />
          </div>
          <OptionSelect
            label="Categories"
            name="categoryIds"
            options={options.categories}
            selected={selected("categoryIds")}
          />
          <OptionSelect
            label="Collections"
            name="collectionIds"
            options={options.collections}
            selected={selected("collectionIds")}
          />
          <OptionSelect
            label="Destinations"
            name="destinationIds"
            options={options.destinations}
            selected={selected("destinationIds")}
          />
          <OptionSelect
            label="Tags"
            name="tagIds"
            options={options.tags}
            selected={selected("tagIds")}
          />
          <OptionSelect
            label="Media"
            name="mediaAssetIds"
            options={options.media}
            selected={selected("mediaAssetIds")}
          />
        </>
      ) : null}

      {resource === "destinations" ? (
        <div className="editor-grid editor-grid-three">
          <Field
            label="Latitude"
            max="90"
            min="-90"
            name="latitude"
            step="any"
            type="number"
            value={value("latitude")}
          />
          <Field
            label="Longitude"
            max="180"
            min="-180"
            name="longitude"
            step="any"
            type="number"
            value={value("longitude")}
          />
          <Field label="District" name="district" value={value("district")} />
          <Field label="Province" name="province" value={value("province")} />
        </div>
      ) : null}

      {resource === "journal" ? (
        <Field label="Hero image URL" name="heroImage" type="url" value={value("heroImage")} />
      ) : null}
      {resource === "collections" || resource === "destinations" ? (
        <label className="editor-field">
          <span>Hero media</span>
          <select defaultValue={value("heroMediaId")} name="heroMediaId">
            <option value="">No hero media</option>
            {options.media.map((item) => (
              <option key={item.id} value={item.id}>
                {item.assetKey}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="editor-actions">
        <button className="primary-button" disabled={busy} type="submit">
          {busy ? "Saving…" : editing ? "Save changes" : "Create record"}
        </button>
        <button
          className="secondary-button"
          disabled={busy}
          onClick={() => router.push(`/modules/${moduleSlug}`)}
          type="button"
        >
          Cancel
        </button>
        {editing ? (
          <button className="danger-button" disabled={busy} onClick={archive} type="button">
            {referenceResource ? "Delete" : "Archive"}
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  ...props
}: { label: string; name: string; value: string } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "defaultValue"
>) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      <input defaultValue={value} name={name} {...props} />
    </label>
  );
}

function OptionSelect({
  label,
  name,
  options,
  selected,
}: {
  label: string;
  name: string;
  options: AdminContentOptions["categories"];
  selected: string[];
}) {
  return (
    <label className="editor-field">
      <span>
        {label} <small>Select multiple with Command/Ctrl</small>
      </span>
      <select
        defaultValue={selected}
        multiple
        name={name}
        size={Math.min(6, Math.max(3, options.length))}
      >
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name ?? item.assetKey}
          </option>
        ))}
      </select>
    </label>
  );
}

function formBody(
  form: FormData,
  resource: string,
  record: AdminContentRecord | undefined,
  options: AdminContentOptions,
  productType?: string,
) {
  const optionalNumber = (name: string) => (form.get(name) ? Number(form.get(name)) : undefined);
  const typeId = String(
    form.get("productTypeId") ||
      form.get("lockedProductTypeId") ||
      options.productTypes.find((item) => item.slug === productType)?.id ||
      "",
  );
  return {
    name: String(form.get("name") ?? form.get("assetKey") ?? ""),
    slug: String(form.get("slug") ?? ""),
    assetKey: String(form.get("assetKey") ?? ""),
    altText: String(form.get("altText") ?? ""),
    width: optionalNumber("width"),
    height: optionalNumber("height"),
    summary: String(form.get("summary") ?? ""),
    description: String(form.get("description") ?? ""),
    content: String(form.get("content") ?? ""),
    heroImage: String(form.get("heroImage") ?? ""),
    heroMediaId: String(form.get("heroMediaId") ?? "") || undefined,
    publicationState: String(form.get("publicationState") ?? "Draft"),
    status: resource === "journal" ? String(form.get("publicationState") ?? "Draft") : undefined,
    productTypeId: typeId || undefined,
    startingPrice: optionalNumber("startingPrice"),
    currency: String(form.get("currency") ?? "USD"),
    durationMinutes: optionalNumber("durationMinutes"),
    latitude: optionalNumber("latitude"),
    longitude: optionalNumber("longitude"),
    district: String(form.get("district") ?? ""),
    province: String(form.get("province") ?? ""),
    categoryIds: form.getAll("categoryIds").map(String),
    collectionIds: form.getAll("collectionIds").map(String),
    destinationIds: form.getAll("destinationIds").map(String),
    tagIds: form.getAll("tagIds").map(String),
    mediaAssetIds: form.getAll("mediaAssetIds").map(String),
    concurrencyToken: record?.concurrencyToken,
  };
}

function stringValue(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}
function arrayValue(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
async function responseError(response: Response): Promise<string> {
  const value = (await response.json().catch(() => null)) as {
    error?: string;
    detail?: string;
    message?: string;
  } | null;
  return (
    value?.detail ??
    value?.error ??
    value?.message ??
    `The request failed with HTTP ${response.status}.`
  );
}
