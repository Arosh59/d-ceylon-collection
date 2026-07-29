import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  AgentQuoteDraftForm,
  AgentQuoteLifecycle,
  CustomerQuoteActions,
  PrepareQuoteForm,
  QuoteRequestForm,
} from "./quote-workflow";
import { agentQuote, customerQuote } from "./quote-fixtures";
import { examplePlan } from "../customer/travel-planner.test";

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

describe("quote workflow controls", () => {
  it("creates a request from a reviewed itinerary without claiming a booking", () => {
    render(<QuoteRequestForm plan={examplePlan()} />);

    expect(screen.getByRole("button", { name: "Request quote for reviewed draft" })).toBeEnabled();
    expect(
      screen.getByText(/does not confirm availability or create a booking/u),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Customer notes for the quote team")).toHaveAttribute(
      "maxlength",
      "2000",
    );
  });

  it("distinguishes sent customer decisions from an accepted quote", () => {
    const { rerender } = render(<CustomerQuoteActions quote={customerQuote()} />);
    expect(screen.getByRole("button", { name: "Accept sent quote" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Decline sent quote" })).toBeInTheDocument();
    expect(screen.getByText(/not a booking or payment confirmation/u)).toBeInTheDocument();

    rerender(<CustomerQuoteActions quote={customerQuote("accepted")} />);
    expect(screen.queryByRole("button", { name: "Accept sent quote" })).not.toBeInTheDocument();
  });

  it("exposes an accessible agent pricing draft and immutable-send control", () => {
    const { rerender } = render(<PrepareQuoteForm concurrencyToken="token" quoteId="quote-1" />);
    expect(screen.getByLabelText("Quote currency")).toHaveValue("USD");

    rerender(<AgentQuoteDraftForm quote={agentQuote()} />);
    expect(screen.getByLabelText(/Internal notes/u)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Itemized services" })).toBeInTheDocument();
    expect(screen.getByText(/Deterministic draft total: \$1,345\.00/u)).toBeInTheDocument();

    rerender(<AgentQuoteLifecycle defaultExpiry="2027-02-15" quote={agentQuote()} />);
    expect(screen.getByRole("button", { name: "Send immutable quote version" })).toBeEnabled();
    expect(screen.getByText(/does not confirm availability or a booking/u)).toBeInTheDocument();
  });
});
