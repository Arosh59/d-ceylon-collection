"use client";

export function ContactGuideButton() {
  return (
    <button
      className="mt-5 text-sm font-bold tracking-[0.1em] text-navy uppercase underline decoration-gold underline-offset-8"
      onClick={() => window.dispatchEvent(new CustomEvent("dceylon:open-concierge"))}
      type="button"
    >
      Open trip guide <span aria-hidden="true">↗</span>
    </button>
  );
}
