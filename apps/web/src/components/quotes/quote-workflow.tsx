"use client";

import type { AgentQuote, CustomerQuote, TravelPlan } from "@dceylon/sdk";
import { useActionState } from "react";

import {
  agentQuoteTransition,
  prepareQuote,
  sendQuote,
  updateQuoteDraft,
} from "@/app/portal/agent/quote-actions";
import { initialCustomerActionState } from "@/app/portal/customer/action-state";
import { customerQuoteTransition, requestQuote } from "@/app/portal/customer/quote-actions";
import { FormStatus } from "@/components/customer/form-status";

export function QuoteRequestForm({ plan }: { plan: TravelPlan }) {
  const [state, action] = useActionState(requestQuote, initialCustomerActionState);
  return (
    <form action={action} className="customer-form rounded-2xl border border-gold/30 bg-white p-6">
      <input name="travelPlanId" type="hidden" value={plan.id} />
      <input name="itineraryRevisionId" type="hidden" value={plan.currentRevision.id} />
      <div>
        <p className="font-bold text-navy">Request an itemized quote</p>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          This submits reviewed revision {String(plan.currentRevision.revisionNumber)} as stable
          context. It does not confirm availability or create a booking.
        </p>
      </div>
      <label className="filter-field">
        <span>Customer notes for the quote team</span>
        <textarea
          maxLength={2000}
          name="customerNotes"
          placeholder="Priorities, questions, or commercial context. Do not add payment credentials."
          rows={4}
        />
      </label>
      <FormStatus state={state} submitLabel="Request quote for reviewed draft" />
    </form>
  );
}

export function CustomerQuoteActions({ quote }: { quote: CustomerQuote }) {
  const [state, action] = useActionState(customerQuoteTransition, initialCustomerActionState);
  const current = quote.versions.find((version) => version.id === quote.currentVersionId);
  if (quote.status === "accepted" || quote.status === "withdrawn") return null;
  return (
    <form action={action} className="customer-form rounded-2xl border border-navy/10 bg-white p-6">
      <input name="quoteId" type="hidden" value={quote.id} />
      <input name="concurrencyToken" type="hidden" value={quote.concurrencyToken} />
      {current ? <input name="versionId" type="hidden" value={current.id} /> : null}
      <fieldset>
        <legend className="font-bold text-navy">Quote decision</legend>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Acceptance records your decision on this immutable quote version. It is not a booking or
          payment confirmation.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {quote.status === "sent" && current ? (
            <>
              <button className="button-primary" name="operation" type="submit" value="accept">
                Accept sent quote
              </button>
              <button className="button-secondary" name="operation" type="submit" value="decline">
                Decline sent quote
              </button>
            </>
          ) : null}
          {quote.status === "draft" || quote.status === "sent" ? (
            <button className="button-secondary" name="operation" type="submit" value="withdraw">
              Withdraw request
            </button>
          ) : null}
        </div>
      </fieldset>
      <FormStatus hideSubmit state={state} />
    </form>
  );
}

export function PrepareQuoteForm({
  quoteId,
  concurrencyToken,
}: {
  quoteId: string;
  concurrencyToken: string;
}) {
  const [state, action] = useActionState(prepareQuote, initialCustomerActionState);
  return (
    <form action={action} className="customer-form">
      <input name="quoteId" type="hidden" value={quoteId} />
      <input name="concurrencyToken" type="hidden" value={concurrencyToken} />
      <label className="filter-field">
        <span>Quote currency</span>
        <select defaultValue="USD" name="currency" required>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="LKR">LKR</option>
          <option value="USD">USD</option>
        </select>
      </label>
      <FormStatus state={state} submitLabel="Claim and prepare quote" />
    </form>
  );
}

export function AgentQuoteDraftForm({ quote }: { quote: AgentQuote }) {
  const [state, action] = useActionState(updateQuoteDraft, initialCustomerActionState);
  const draftLines = [
    ...quote.draft.lines,
    ...Array.from({ length: Math.max(0, 3 - quote.draft.lines.length) }, () => null),
  ];
  return (
    <form action={action} className="customer-form rounded-3xl border border-navy/10 bg-white p-6">
      <input name="quoteId" type="hidden" value={quote.id} />
      <input name="concurrencyToken" type="hidden" value={quote.concurrencyToken} />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="filter-field">
          <span>ISO currency</span>
          <select defaultValue={quote.draft.currency ?? "USD"} name="currency" required>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="LKR">LKR</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label className="filter-field">
          <span>Internal notes — never shown to customer</span>
          <textarea
            defaultValue={quote.draft.internalNotes ?? ""}
            maxLength={2000}
            name="internalNotes"
            rows={3}
          />
        </label>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <TextList
          label="Assumptions, one per line"
          name="assumptions"
          values={quote.draft.assumptions}
        />
        <TextList
          label="Inclusions, one per line"
          name="inclusions"
          values={quote.draft.inclusions}
        />
        <TextList
          label="Exclusions, one per line"
          name="exclusions"
          values={quote.draft.exclusions}
        />
      </div>
      <fieldset className="grid gap-5">
        <legend className="text-xl font-bold text-navy">Itemized services</legend>
        {draftLines.map((line, index) => (
          <div
            className="grid gap-4 rounded-2xl bg-mist p-5 lg:grid-cols-4"
            key={line?.id ?? index}
          >
            <label className="filter-field lg:col-span-2">
              <span>Line {String(index + 1)} title</span>
              <input
                defaultValue={line?.title ?? ""}
                maxLength={200}
                name="lineTitle"
                required={index === 0}
              />
            </label>
            <label className="filter-field">
              <span>Quantity</span>
              <input
                defaultValue={line?.quantity ?? (index === 0 ? 1 : "")}
                max={1000}
                min="0.01"
                name="lineQuantity"
                required={index === 0}
                step="0.01"
                type="number"
              />
            </label>
            <label className="filter-field">
              <span>Unit amount</span>
              <input
                defaultValue={line?.unitPrice.amount ?? ""}
                max="99999999.99"
                min={0}
                name="lineUnitAmount"
                required={index === 0}
                step="0.01"
                type="number"
              />
            </label>
            <label className="filter-field lg:col-span-4">
              <span>Description</span>
              <textarea
                defaultValue={line?.description ?? ""}
                maxLength={1000}
                name="lineDescription"
                rows={2}
              />
            </label>
          </div>
        ))}
      </fieldset>
      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="text-xl font-bold text-navy">Taxes and adjustments</legend>
        {(["tax", "adjustment"] as const).map((kind) => {
          const component = quote.draft.components.find((item) => item.kind === kind);
          return (
            <div className="grid gap-4 rounded-2xl border border-navy/10 p-5" key={kind}>
              <input name="componentKind" type="hidden" value={kind} />
              <label className="filter-field">
                <span>{kind === "tax" ? "Tax label" : "Adjustment label"}</span>
                <input
                  defaultValue={component?.label ?? ""}
                  maxLength={200}
                  name="componentLabel"
                />
              </label>
              <label className="filter-field">
                <span>Fixed amount</span>
                <input
                  defaultValue={component?.amount.amount ?? ""}
                  name="componentAmount"
                  step="0.01"
                  type="number"
                />
              </label>
            </div>
          );
        })}
      </fieldset>
      <label className="filter-field">
        <span>Customer terms</span>
        <textarea
          defaultValue={quote.draft.terms ?? ""}
          maxLength={5000}
          name="terms"
          required
          rows={5}
        />
      </label>
      {quote.draft.grandTotal ? (
        <p className="rounded-xl bg-navy p-4 font-bold text-white" role="status">
          Deterministic draft total: {formatMoney(quote.draft.grandTotal)}
        </p>
      ) : null}
      <FormStatus state={state} submitLabel="Save itemized quote draft" />
    </form>
  );
}

export function AgentQuoteLifecycle({
  quote,
  defaultExpiry,
}: {
  quote: AgentQuote;
  defaultExpiry: string;
}) {
  const [sendState, sendAction] = useActionState(sendQuote, initialCustomerActionState);
  const [transitionState, transitionAction] = useActionState(
    agentQuoteTransition,
    initialCustomerActionState,
  );
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {quote.status === "draft" && quote.draft.lines.length > 0 ? (
        <form action={sendAction} className="customer-form rounded-2xl border border-gold/40 p-5">
          <input name="quoteId" type="hidden" value={quote.id} />
          <input name="concurrencyToken" type="hidden" value={quote.concurrencyToken} />
          <label className="filter-field">
            <span>Quote expiry</span>
            <input defaultValue={defaultExpiry} name="expiresAtUtc" required type="date" />
          </label>
          <p className="text-sm leading-6 text-ink-muted">
            Sending creates an immutable version. It does not confirm availability or a booking.
          </p>
          <FormStatus state={sendState} submitLabel="Send immutable quote version" />
        </form>
      ) : null}
      {["sent", "declined", "expired"].includes(quote.status) ? (
        <form
          action={transitionAction}
          className="customer-form rounded-2xl border border-navy/10 p-5"
        >
          <input name="quoteId" type="hidden" value={quote.id} />
          <input name="concurrencyToken" type="hidden" value={quote.concurrencyToken} />
          <button className="button-primary" name="operation" type="submit" value="revise">
            Start revised draft
          </button>
          <button className="button-secondary" name="operation" type="submit" value="withdraw">
            Withdraw quote
          </button>
          <FormStatus hideSubmit state={transitionState} />
        </form>
      ) : null}
    </div>
  );
}

function TextList({ label, name, values }: { label: string; name: string; values: string[] }) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <textarea defaultValue={values.join("\n")} maxLength={10000} name={name} rows={5} />
    </label>
  );
}

export function formatMoney(money: { amount: number | string; currency: string }) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: money.currency,
  }).format(Number(money.amount));
}
