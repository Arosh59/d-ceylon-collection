"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Conversation = {
  answer: string;
  links?: { href: string; label: string }[];
  prompt: string;
};

const suggestions: Conversation[] = [
  {
    prompt: "I want a slower trip",
    answer:
      "Begin with Breathe or Flow. They are made for open space, gentle mornings, and landscapes that do the talking.",
    links: [
      { href: "/collections/breathe", label: "Explore Breathe" },
      { href: "/collections/flow", label: "Explore Flow" },
    ],
  },
  {
    prompt: "Show me the highlands",
    answer:
      "Ella is a beautiful place to start: tea country, misty valleys, rail journeys, and room to wander.",
    links: [{ href: "/destinations/ella", label: "Discover Ella" }],
  },
  {
    prompt: "I love culture and history",
    answer:
      "Root brings together heritage, living traditions, and the small details that make a place feel remembered.",
    links: [
      { href: "/collections/root", label: "Explore Root" },
      { href: "/destinations", label: "Browse destinations" },
    ],
  },
];

export function TripConcierge() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    const openConcierge = () => setOpen(true);
    window.addEventListener("dceylon:open-concierge", openConcierge);
    return () => window.removeEventListener("dceylon:open-concierge", openConcierge);
  }, []);

  function chooseSuggestion(suggestion: Conversation) {
    setConversation(suggestion);
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 sm:right-7 sm:bottom-7">
      {open ? (
        <section
          aria-label="Trip concierge"
          className="mb-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1.6rem] border border-navy/10 bg-white shadow-[0_25px_80px_rgba(14,35,66,0.22)]"
        >
          <div className="bg-navy p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-gold-light uppercase">
                  D Ceylon guide
                </p>
                <h2 className="mt-2 font-serif text-2xl">Where should we begin?</h2>
              </div>
              <span
                aria-hidden="true"
                className="grid size-9 place-items-center rounded-full border border-gold/60 font-serif text-lg text-gold-light"
              >
                D
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/65">
              A few gentle starting points for finding your kind of Sri Lanka.
            </p>
          </div>
          <div className="p-4">
            {conversation ? (
              <div className="rounded-2xl bg-mist p-4">
                <p className="text-xs font-semibold tracking-[0.12em] text-gold-dark uppercase">
                  You asked
                </p>
                <p className="mt-2 text-sm font-semibold text-navy">{conversation.prompt}</p>
                <p className="mt-3 text-sm leading-6 text-ink-muted">{conversation.answer}</p>
                {conversation.links ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {conversation.links.map((link) => (
                      <Link
                        className="rounded-full bg-navy px-3 py-2 text-xs font-semibold text-white transition hover:bg-gold hover:text-navy"
                        href={link.href}
                        key={link.href}
                        onClick={() => setOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
                <button
                  className="mt-4 text-xs font-semibold text-navy underline decoration-gold underline-offset-4"
                  onClick={() => setConversation(null)}
                  type="button"
                >
                  Ask something else
                </button>
              </div>
            ) : (
              <div className="grid gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    className="rounded-xl border border-navy/10 px-4 py-3 text-left text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold/10"
                    key={suggestion.prompt}
                    onClick={() => chooseSuggestion(suggestion)}
                    type="button"
                  >
                    {suggestion.prompt}
                  </button>
                ))}
                <Link
                  className="mt-2 px-4 py-2 text-center text-xs font-semibold tracking-[0.1em] text-gold-dark uppercase underline decoration-gold underline-offset-4"
                  href="/catalogue"
                  onClick={() => setOpen(false)}
                >
                  Browse every journey
                </Link>
              </div>
            )}
          </div>
        </section>
      ) : null}
      <button
        aria-expanded={open}
        aria-label={open ? "Close trip concierge" : "Open trip concierge"}
        className="ml-auto flex min-h-14 items-center gap-3 rounded-full bg-gold px-5 text-sm font-bold text-navy shadow-[0_12px_35px_rgba(14,35,66,0.25)] transition hover:bg-gold-light"
        onClick={() => setOpen((isOpen) => !isOpen)}
        type="button"
      >
        <span
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-full bg-navy text-sm text-gold-light"
        >
          ✦
        </span>
        <span>{open ? "Close guide" : "Plan with us"}</span>
      </button>
    </div>
  );
}
