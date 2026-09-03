"use client";

import type { TravelPlan } from "@dceylon/sdk";
import { useActionState } from "react";

import { initialCustomerActionState } from "@/app/portal/customer/action-state";
import {
  regenerateTravelPlan,
  reorderItineraryItem,
  saveItineraryItem,
  updateItineraryDay,
} from "@/app/portal/customer/planner-actions";

import { FormStatus } from "./form-status";

export function RegenerateDraft({ plan }: { plan: TravelPlan }) {
  const [state, action] = useActionState(regenerateTravelPlan, initialCustomerActionState);
  return (
    <form
      action={action}
      className="customer-form rounded-2xl border border-gold/30 bg-gold/10 p-5"
    >
      <input name="id" type="hidden" value={plan.id} />
      <input name="concurrencyToken" type="hidden" value={plan.concurrencyToken} />
      <p className="text-sm leading-6 text-ink-muted">
        Regeneration uses rule {plan.currentRevision.ruleVersion} and creates a preserved revision.
      </p>
      <FormStatus state={state} submitLabel="Regenerate deterministic draft" />
    </form>
  );
}

export function DayEditor({
  planId,
  day,
}: {
  planId: string;
  day: TravelPlan["currentRevision"]["days"][number];
}) {
  const [state, action] = useActionState(updateItineraryDay, initialCustomerActionState);
  return (
    <form action={action} className="customer-form">
      <input name="id" type="hidden" value={planId} />
      <input name="dayId" type="hidden" value={day.id} />
      <input name="concurrencyToken" type="hidden" value={day.concurrencyToken} />
      <label className="filter-field">
        <span>Day {String(day.dayNumber)} title</span>
        <input defaultValue={day.title} maxLength={200} name="title" required />
      </label>
      <FormStatus state={state} submitLabel="Update day title" />
    </form>
  );
}

export function ItemEditor({
  planId,
  item,
  days,
}: {
  planId: string;
  item: TravelPlan["currentRevision"]["days"][number]["items"][number];
  days: TravelPlan["currentRevision"]["days"];
}) {
  const [editState, editAction] = useActionState(saveItineraryItem, initialCustomerActionState);
  const [moveState, moveAction] = useActionState(reorderItineraryItem, initialCustomerActionState);
  return (
    <details className="mt-4 rounded-xl border border-navy/10 p-4">
      <summary className="cursor-pointer font-bold text-navy">Edit or reorder {item.title}</summary>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <form action={editAction} className="customer-form">
          <input name="id" type="hidden" value={planId} />
          <input name="itemId" type="hidden" value={item.id} />
          <input name="concurrencyToken" type="hidden" value={item.concurrencyToken} />
          <label className="filter-field">
            <span>Item title</span>
            <input defaultValue={item.title} maxLength={200} name="title" required />
          </label>
          <label className="filter-field">
            <span>Draft notes</span>
            <textarea defaultValue={item.notes ?? ""} maxLength={2000} name="notes" rows={3} />
          </label>
          <label className="filter-field">
            <span>Duration in minutes</span>
            <input
              defaultValue={item.durationMinutes ?? ""}
              max={1440}
              min={1}
              name="durationMinutes"
              type="number"
            />
          </label>
          <label className="filter-field">
            <span>Destination slug</span>
            <input defaultValue={item.destinationSlug} name="destinationSlug" required />
          </label>
          <input name="position" type="hidden" value={String(item.position)} />
          <FormStatus state={editState} submitLabel="Update draft item" />
        </form>
        <form action={moveAction} className="customer-form">
          <input name="id" type="hidden" value={planId} />
          <input name="itemId" type="hidden" value={item.id} />
          <input name="concurrencyToken" type="hidden" value={item.concurrencyToken} />
          <label className="filter-field">
            <span>Move to day</span>
            <select name="targetDayId" required>
              {days.map((day) => (
                <option key={day.id} value={day.id}>
                  Day {String(day.dayNumber)}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Position</span>
            <input
              defaultValue={String(item.position)}
              max={100}
              min={1}
              name="position"
              required
              type="number"
            />
          </label>
          <FormStatus state={moveState} submitLabel="Reorder item" />
        </form>
      </div>
    </details>
  );
}

export function NewItemForm({
  planId,
  dayId,
  destinationSlug,
}: {
  planId: string;
  dayId: string;
  destinationSlug: string;
}) {
  const [state, action] = useActionState(saveItineraryItem, initialCustomerActionState);
  return (
    <details className="mt-5 rounded-xl border border-dashed border-navy/20 p-4">
      <summary className="cursor-pointer font-bold text-navy">Add a custom draft item</summary>
      <form action={action} className="customer-form mt-5">
        <input name="id" type="hidden" value={planId} />
        <input name="dayId" type="hidden" value={dayId} />
        <label className="filter-field">
          <span>Item title</span>
          <input maxLength={200} name="title" required />
        </label>
        <label className="filter-field">
          <span>Draft notes</span>
          <textarea maxLength={2000} name="notes" rows={3} />
        </label>
        <div className="grid gap-5 sm:grid-cols-3">
          <label className="filter-field">
            <span>Duration minutes</span>
            <input max={1440} min={1} name="durationMinutes" type="number" />
          </label>
          <label className="filter-field">
            <span>Destination slug</span>
            <input defaultValue={destinationSlug} name="destinationSlug" required />
          </label>
          <label className="filter-field">
            <span>Position (optional)</span>
            <input min={1} name="position" type="number" />
          </label>
        </div>
        <FormStatus state={state} submitLabel="Add draft item" />
      </form>
    </details>
  );
}
