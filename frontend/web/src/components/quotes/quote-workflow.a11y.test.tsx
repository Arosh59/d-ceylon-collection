import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";

import {
  AgentQuoteDraftForm,
  CreateBookingForm,
  CreatePaymentForm,
  CustomerQuoteActions,
  PrepareQuoteForm,
} from "./quote-workflow";
import { agentQuote, customerQuote } from "./quote-fixtures";

vi.mock("@/app/portal/customer/quote-actions", () => ({
  customerQuoteTransition: vi.fn(),
  requestQuote: vi.fn(),
}));
vi.mock("@/app/portal/customer/booking-actions", () => ({
  createBooking: vi.fn(),
  createPayment: vi.fn(),
}));
vi.mock("@/app/portal/agent/quote-actions", () => ({
  agentQuoteTransition: vi.fn(),
  prepareQuote: vi.fn(),
  sendQuote: vi.fn(),
  updateQuoteDraft: vi.fn(),
}));

describe("quote workflow accessibility", () => {
  it.each([
    ["customer decision", <CustomerQuoteActions key="customer" quote={customerQuote()} />],
    ["create booking", <CreateBookingForm key="booking" quote={customerQuote("accepted")} />],
    ["create payment", <CreatePaymentForm bookingId="booking-1" key="payment" />],
    ["agent claim", <PrepareQuoteForm concurrencyToken="token" key="prepare" quoteId="quote-1" />],
    ["agent pricing draft", <AgentQuoteDraftForm key="draft" quote={agentQuote()} />],
  ])("has no detectable violations in %s controls", async (_name, view) => {
    const { container } = render(view);
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
