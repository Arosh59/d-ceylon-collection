import type { AgentQuote, CustomerQuote } from "@dceylon/sdk";

const version = {
  id: "quote-version-1",
  versionNumber: 1,
  sentAtUtc: "2027-02-01T00:00:00Z",
  expiresAtUtc: "2027-02-15T00:00:00Z",
  currency: "USD",
  subtotal: { amount: 1250, currency: "USD" },
  taxTotal: { amount: 100, currency: "USD" },
  adjustmentTotal: { amount: -5, currency: "USD" },
  grandTotal: { amount: 1345, currency: "USD" },
  assumptions: ["Subject to supplier confirmation."],
  inclusions: ["Private ground transport."],
  exclusions: ["International flights."],
  terms: "This quote is not a booking confirmation.",
  lines: [
    {
      id: "quote-line-1",
      position: 1,
      title: "Private Sri Lanka journey",
      description: "Reviewed itinerary services.",
      quantity: 1,
      unitPrice: { amount: 1250, currency: "USD" },
      lineTotal: { amount: 1250, currency: "USD" },
    },
  ],
  components: [
    {
      id: "quote-tax-1",
      position: 1,
      kind: "tax",
      label: "Local taxes",
      amount: { amount: 100, currency: "USD" },
    },
  ],
};

const request = {
  id: "quote-request-1",
  travelPlanId: "plan-1",
  itineraryRevisionId: "revision-1",
  itineraryRevisionNumber: 1,
  itineraryTitle: "Reviewed Ella draft",
  travelStartDate: "2027-02-10",
  travelEndDate: "2027-02-12",
  ruleVersion: "dceylon-deterministic-v1",
  itineraryFingerprint: "a".repeat(64),
  customerNotes: "Please prepare a transparent itemized quote.",
  requestedAtUtc: "2027-01-20T00:00:00Z",
};

export function customerQuote(status = "sent"): CustomerQuote {
  return {
    id: "quote-1",
    status,
    request,
    organisationId: "organisation-1",
    currentVersionId: version.id,
    versions: [version],
    concurrencyToken: "customer-quote-token",
    createdAtUtc: "2027-01-20T00:00:00Z",
    updatedAtUtc: "2027-02-01T00:00:00Z",
  };
}

export function agentQuote(status = "draft"): AgentQuote {
  return {
    id: "quote-1",
    status,
    request,
    organisationId: "organisation-1",
    draft: {
      currency: "USD",
      assumptions: ["Subject to supplier confirmation."],
      inclusions: ["Private ground transport."],
      exclusions: ["International flights."],
      terms: "This quote is not a booking confirmation.",
      internalNotes: "Agent-only preparation context.",
      lines: version.lines,
      components: version.components,
      subtotal: version.subtotal,
      taxTotal: version.taxTotal,
      adjustmentTotal: version.adjustmentTotal,
      grandTotal: version.grandTotal,
    },
    currentVersionId: status === "draft" ? null : version.id,
    versions: status === "draft" ? [] : [version],
    concurrencyToken: "agent-quote-token",
    createdAtUtc: "2027-01-20T00:00:00Z",
    updatedAtUtc: "2027-02-01T00:00:00Z",
  };
}
