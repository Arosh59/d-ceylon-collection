import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";

import { AgentQuoteDraftForm, CustomerQuoteActions, PrepareQuoteForm } from "./quote-workflow";
import { agentQuote, customerQuote } from "./quote-fixtures";

vi.mock("@/app/portal/customer/quote-actions", () => ({
  customerQuoteTransition: vi.fn(),
  requestQuote: vi.fn(),
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
