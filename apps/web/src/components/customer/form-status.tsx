"use client";

import { useFormStatus } from "react-dom";

import type { CustomerActionState } from "@/app/portal/customer/action-state";

export function FormStatus({
  state,
  submitLabel = "Save",
}: {
  state: CustomerActionState;
  submitLabel?: string;
}) {
  const { pending } = useFormStatus();
  const errors = Object.values(state.errors ?? {}).flat();

  return (
    <>
      {state.message ? (
        <div
          className={`rounded-xl border p-4 text-sm ${
            state.status === "success"
              ? "border-emerald-700/30 bg-emerald-50 text-emerald-900"
              : "border-red-700/30 bg-red-50 text-red-900"
          }`}
          role={state.status === "success" ? "status" : "alert"}
        >
          <p>{state.message}</p>
          {errors.length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <button className="button-primary" disabled={pending} type="submit">
        {pending ? "Saving…" : submitLabel}
      </button>
    </>
  );
}
