"use client";

import { useState, type FormEvent } from "react";
import type { AdminContactContent } from "@/lib/admin-content";

export function ContactEditor({ contact }: { contact: AdminContactContent }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [concurrencyToken, setConcurrencyToken] = useState(contact.concurrencyToken);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(
      ["email", "phone", "eyebrow", "heading", "description", "promise"].map((key) => [
        key,
        String(form.get(key) ?? ""),
      ]),
    );
    try {
      const response = await fetch("/api/administration/content/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, concurrencyToken }),
      });
      if (!response.ok) {
        const value = (await response.json().catch(() => null)) as {
          detail?: string;
          error?: string;
        } | null;
        throw new Error(value?.detail ?? value?.error ?? "The contact page could not be saved.");
      }
      const saved = (await response.json()) as AdminContactContent;
      setConcurrencyToken(saved.concurrencyToken);
      setMessage("Contact-page content was saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The contact page could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="editor-form" onSubmit={submit}>
      <div className="editor-grid">
        <Field label="Contact email" name="email" type="email" value={contact.email} />
        <Field label="Phone" name="phone" value={contact.phone ?? ""} />
      </div>
      <Field label="Eyebrow" name="eyebrow" value={contact.eyebrow} />
      <Field label="Page heading" name="heading" value={contact.heading} />
      <TextField label="Introduction" name="description" value={contact.description} />
      <TextField label="Response promise" name="promise" value={contact.promise} />
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="form-success" role="status">
          {message}
        </p>
      ) : null}
      <button className="primary-button" disabled={busy} type="submit">
        {busy ? "Saving…" : "Save contact page"}
      </button>
    </form>
  );
}
function Field({
  label,
  name,
  type = "text",
  value,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      <input defaultValue={value} name={name} required={name !== "phone"} type={type} />
    </label>
  );
}
function TextField({ label, name, value }: { label: string; name: string; value: string }) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      <textarea defaultValue={value} name={name} required rows={4} />
    </label>
  );
}
