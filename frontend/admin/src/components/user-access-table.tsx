"use client";

import { useState } from "react";
import type { AdminUserItem } from "@/lib/admin-content";

const roles = ["customer", "agent", "staff", "administrator"] as const;

export function UserAccessTable({ users }: { users: AdminUserItem[] }) {
  const [message, setMessage] = useState<Record<string, string>>({});
  async function save(user: AdminUserItem, form: HTMLFormElement) {
    const data = new FormData(form);
    setMessage((current) => ({ ...current, [user.id]: "Saving…" }));
    const response = await fetch(`/api/administration/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isActive: data.get("isActive") === "on",
        roles: data.getAll("roles").map(String),
      }),
    });
    if (response.ok) setMessage((current) => ({ ...current, [user.id]: "Saved" }));
    else {
      const value = (await response.json().catch(() => null)) as {
        detail?: string;
        error?: string;
      } | null;
      setMessage((current) => ({
        ...current,
        [user.id]: value?.detail ?? value?.error ?? "Could not save",
      }));
    }
  }
  return (
    <div className="grid gap-4 p-5">
      {users.map((user) => (
        <form
          className="user-access-card"
          key={user.id}
          onSubmit={(event) => {
            event.preventDefault();
            void save(user, event.currentTarget);
          }}
        >
          <div>
            <strong>{user.displayName}</strong>
            <small>{user.email ?? "No email"}</small>
          </div>
          <div className="role-options">
            {roles.map((role) => (
              <label key={role}>
                <input
                  defaultChecked={user.roles.includes(role)}
                  name="roles"
                  type="checkbox"
                  value={role}
                />{" "}
                {role}
              </label>
            ))}
          </div>
          <label className="active-toggle">
            <input defaultChecked={user.isActive} name="isActive" type="checkbox" /> Active
          </label>
          <button className="secondary-button" type="submit">
            Save access
          </button>
          <span aria-live="polite" className="text-xs text-slate-600">
            {message[user.id]}
          </span>
        </form>
      ))}
    </div>
  );
}
