import Image from "next/image";

import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const principles = [
  {
    marker: "01",
    title: "Locally considered",
    description: "Journeys shaped by people who understand the island beyond a list of landmarks.",
  },
  {
    marker: "02",
    title: "Calmly personal",
    description: "A thoughtful pace, room for curiosity, and details aligned with how you travel.",
  },
  {
    marker: "03",
    title: "Meaningfully connected",
    description:
      "Encounters that honour place, tradition, community, and the stories between them.",
  },
] as const;

const collections = [
  { name: "Root", note: "Culture · Heritage · Belonging", tone: "from-[#725035] to-[#2d3028]" },
  { name: "Flow", note: "Ocean · Wellness · Renewal", tone: "from-[#557979] to-[#18394b]" },
  { name: "Awaken", note: "Energy · Discovery · Adventure", tone: "from-[#9b5f35] to-[#432725]" },
  { name: "Breathe", note: "Nature · Mountains · Space", tone: "from-[#506b51] to-[#1d3935]" },
  {
    name: "Rediscover",
    note: "Reflection · Meaning · Legacy",
    tone: "from-[#4d496e] to-[#27233e]",
  },
] as const;

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="relative grid min-h-[95svh] place-items-center overflow-hidden bg-navy text-white">
        <Image
          alt=""
          className="object-cover object-[68%_center]"
          fill
          priority
          sizes="100vw"
          src="/images/hill-country-hero.png"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,38,0.9)_0%,rgba(7,20,38,0.69)_42%,rgba(7,20,38,0.16)_100%)]"
        />
        <div
          aria-hidden="true"
          className="hero-grain absolute inset-0 opacity-20 mix-blend-soft-light"
        />
        <Container className="relative z-10 pt-28 pb-20">
          <p className="text-xs font-semibold tracking-[0.28em] text-gold-light uppercase">
            Journeys across Sri Lanka
          </p>
          <h1 className="mt-7 max-w-5xl text-6xl text-balance sm:text-7xl lg:text-[6.7rem]">
            Discover Ceylon.
            <span className="block text-gold-light">Rediscover Yourself.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
            Travel with intention through an island of living traditions, unhurried coastlines, and
            landscapes that invite a different perspective.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink href="/collections">Explore collections</ButtonLink>
            <ButtonLink href="/catalogue" variant="secondary">
              Browse journeys
            </ButtonLink>
          </div>
        </Container>
        <p className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[0.65rem] tracking-[0.22em] text-white/45 uppercase">
          Begin with curiosity
        </p>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Why D Ceylon"
            heading="Travel that leaves room for wonder."
            introduction="We believe the most memorable journeys are not rushed. They create space for genuine encounters, considered comfort, and a deeper relationship with place."
          />
          <ol className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-navy/8 bg-navy/8 md:grid-cols-3">
            {principles.map((principle) => (
              <li className="bg-canvas p-8 sm:p-10" key={principle.marker}>
                <span className="font-serif text-3xl text-gold-dark">{principle.marker}</span>
                <h3 className="mt-10 text-2xl">{principle.title}</h3>
                <p className="mt-4 leading-7 text-ink-muted">{principle.description}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-mist py-20 sm:py-28">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Five ways to travel"
            heading="Begin with how you want to feel."
            introduction="Our collection framework will bring together places, stays, and experiences through five distinct perspectives."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-6">
            {collections.map((collection, index) => (
              <article
                className={`relative min-h-72 overflow-hidden rounded-[1.75rem] bg-gradient-to-br p-7 text-white shadow-soft ${
                  collection.tone
                } ${index < 2 ? "md:col-span-3" : "md:col-span-2"}`}
                key={collection.name}
              >
                <div
                  aria-hidden="true"
                  className="absolute -right-16 -bottom-20 size-60 rounded-full border border-white/15"
                />
                <p className="relative text-xs tracking-[0.18em] text-white/58 uppercase">
                  Collection {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="relative mt-28 text-4xl">{collection.name}</h3>
                <p className="relative mt-3 text-sm text-white/70">{collection.note}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/collections" variant="text">
              Meet the collections
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="bg-navy py-20 text-white sm:py-28">
        <Container className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow text-gold-light">A journey worth shaping</p>
            <h2 className="mt-5 max-w-3xl text-5xl sm:text-6xl">
              Start with a place. Leave with a new perspective.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/66">
              The catalogue foundation is connected and ready for the curated destinations and
              products arriving in the next phase.
            </p>
          </div>
          <ButtonLink href="/catalogue">Explore the catalogue</ButtonLink>
        </Container>
      </section>
    </main>
  );
}
