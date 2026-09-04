import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ContactGuideButton } from "@/components/contact-guide-button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Start a conversation about a thoughtful journey through Sri Lanka.",
};

const contactEmail = "hello@dceyloncollection.com";

export default function ContactPage() {
  return (
    <main id="main-content">
      <section className="page-hero">
        <Container>
          <p className="eyebrow text-gold-light">Contact D Ceylon</p>
          <h1 className="mt-5 max-w-4xl text-5xl text-white sm:text-7xl">
            Tell us what you’re hoping to find.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            A place, a feeling, or a first question is enough. We’ll help you find a considered way
            into Sri Lanka.
          </p>
        </Container>
      </section>

      <Container className="grid gap-8 py-12 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <section
          className="rounded-[2rem] bg-white p-7 shadow-soft sm:p-10"
          aria-labelledby="contact-heading"
        >
          <p className="eyebrow">Start a conversation</p>
          <h2 className="mt-4 text-4xl text-navy" id="contact-heading">
            Let’s shape the first step together.
          </h2>
          <p className="mt-5 leading-7 text-ink-muted">
            Share a little about your dates, your pace, or the places you’re drawn to. There’s no
            perfect way to begin.
          </p>
          <div className="mt-8 grid gap-4">
            <a
              className="group flex items-center justify-between rounded-2xl border border-navy/10 p-5 transition hover:border-gold hover:bg-gold/8"
              href={`mailto:${contactEmail}`}
            >
              <span>
                <span className="block text-xs font-semibold tracking-[0.16em] text-gold-dark uppercase">
                  Email us
                </span>
                <span className="mt-2 block text-lg font-semibold text-navy">{contactEmail}</span>
              </span>
              <span
                aria-hidden="true"
                className="text-2xl text-gold-dark transition-transform group-hover:translate-x-1"
              >
                ↗
              </span>
            </a>
            <div className="rounded-2xl bg-mist p-5">
              <p className="text-xs font-semibold tracking-[0.16em] text-gold-dark uppercase">
                A gentle promise
              </p>
              <p className="mt-3 leading-7 text-ink-muted">
                We’ll reply with a human point of view, not a packed itinerary or a hard sell.
              </p>
            </div>
          </div>
          <Link
            className="mt-8 inline-flex text-sm font-bold tracking-[0.12em] text-navy uppercase underline decoration-gold decoration-2 underline-offset-8"
            href="/auth/sign-up"
          >
            Save your ideas first{" "}
            <span aria-hidden="true" className="ml-2">
              ↗
            </span>
          </Link>
        </section>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <figure className="relative min-h-72 overflow-hidden rounded-[2rem] bg-navy shadow-soft sm:col-span-2 lg:col-span-1 lg:min-h-[25rem]">
            <Image
              alt="A quiet palm-fringed Sri Lankan coastline in warm dawn light"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              src="/images/editorial/coastline-dawn.webp"
              unoptimized
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/90 to-transparent p-6 pt-20 font-serif text-2xl text-white">
              Come as you are.
            </figcaption>
          </figure>
          <div className="rounded-[2rem] border border-navy/10 bg-[#efece4] p-6 sm:col-span-2 lg:col-span-1">
            <p className="eyebrow">Before you write</p>
            <p className="mt-3 text-lg leading-8 text-navy">
              Not sure where to begin? Open the guide and choose the feeling that sounds most like
              you.
            </p>
            <ContactGuideButton />
          </div>
        </div>
      </Container>
    </main>
  );
}
