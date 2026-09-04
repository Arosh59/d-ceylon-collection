import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { HomeHeroSlideshow } from "@/components/home-hero-slideshow";
import { SectionHeading } from "@/components/ui/section-heading";
import { RevealOnView } from "@/components/reveal-on-view";
import Image from "next/image";

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
      <section className="relative grid min-h-[clamp(32rem,70svh,40rem)] items-end overflow-hidden bg-navy text-white">
        <HomeHeroSlideshow />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-navy/65 via-navy/20 to-transparent"
        />
        <Container className="home-hero-content pointer-events-none relative z-10 w-full pt-32 pb-12 sm:pt-36 sm:pb-16">
          <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-gold-light uppercase">
            Journeys across Sri Lanka
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl text-balance sm:text-6xl lg:text-7xl">
            Discover Ceylon.
            <span className="block text-gold-light">Rediscover Yourself.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
            Travel with intention through an island of living traditions, unhurried coastlines, and
            landscapes that invite a different perspective.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/catalogue">Explore journeys</ButtonLink>
            <ButtonLink href="/catalogue" variant="secondary">
              View catalogue
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-16">
        <Container>
          <SectionHeading
            eyebrow="Why D Ceylon"
            heading="Travel that leaves room for wonder."
            introduction="We believe the most memorable journeys are not rushed. They create space for genuine encounters, considered comfort, and a deeper relationship with place."
          />
          <ol className="mt-10 grid gap-px overflow-hidden rounded-[1.25rem] border border-navy/8 bg-navy/8 md:grid-cols-3 sm:mt-12">
            {principles.map((principle) => (
              <li className="bg-canvas p-6 sm:p-7" key={principle.marker}>
                <span className="font-serif text-2xl text-gold-dark">{principle.marker}</span>
                <h3 className="mt-8 text-2xl">{principle.title}</h3>
                <p className="mt-4 leading-7 text-ink-muted">{principle.description}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-[#efece4] py-14 sm:py-20">
        <Container className="grid items-center gap-10 lg:grid-cols-[0.84fr_1.16fr] lg:gap-16">
          <div>
            <p className="eyebrow">The island in layers</p>
            <h2 className="mt-4 max-w-xl text-4xl sm:text-5xl">
              From quiet coastlines to highland mornings.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted sm:text-lg sm:leading-8">
              Follow the rhythm of the island rather than a route on a map. We make room for the
              sea, the hills, and the small details that stay with you.
            </p>
            <div className="mt-7">
              <ButtonLink href="/destinations" variant="text">
                Explore the destinations
              </ButtonLink>
            </div>
          </div>
          <RevealOnView>
            <figure className="home-editorial-frame relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-navy shadow-soft">
              <Image
                alt="A quiet palm-fringed Sri Lankan coastline in warm dawn light"
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                src="/images/editorial/coastline-dawn.webp"
                unoptimized
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/80 to-transparent p-5 pt-16 text-sm font-semibold tracking-[0.12em] text-white uppercase">
                Unhurried by design
              </figcaption>
            </figure>
          </RevealOnView>
        </Container>
      </section>

      <section className="bg-mist py-14 sm:py-16">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Five ways to travel"
            heading="Begin with how you want to feel."
            introduction="Our collection framework will bring together places, stays, and experiences through five distinct perspectives."
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-[0.86fr_1.14fr] sm:mt-12">
            <RevealOnView>
              <figure className="home-editorial-frame relative h-full min-h-80 overflow-hidden rounded-[1.25rem] bg-navy shadow-soft">
                <Image
                  alt="A stone path beside a warm ochre heritage temple in Sri Lanka's hill country"
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 38vw, 100vw"
                  src="/images/editorial/kandy-heritage.webp"
                  unoptimized
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/90 to-transparent p-5 pt-20 font-serif text-2xl text-white">
                  Find your own way in.
                </figcaption>
              </figure>
            </RevealOnView>
            <div className="grid gap-4 sm:grid-cols-2">
              {collections.map((collection, index) => (
                <RevealOnView key={collection.name}>
                  <article
                    className={`flex h-full min-h-44 flex-col rounded-[1.25rem] bg-gradient-to-br p-5 text-white shadow-soft sm:p-6 ${collection.tone}`}
                  >
                    <p className="text-xs tracking-[0.18em] text-white/58 uppercase">
                      Collection {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-auto pt-10 text-3xl">{collection.name}</h3>
                    <p className="mt-3 text-sm text-white/70">{collection.note}</p>
                  </article>
                </RevealOnView>
              ))}
            </div>
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/collections" variant="text">
              Meet the collections
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="bg-navy py-14 text-white sm:py-16">
        <Container className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow text-gold-light">A journey worth shaping</p>
            <h2 className="mt-4 max-w-3xl text-4xl sm:text-5xl">
              Start with a place. Leave with a new perspective.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/66 sm:text-lg sm:leading-8">
              Start with a feeling, a landscape, or a single day you want to remember. We’ll help
              you find the right way into the island.
            </p>
          </div>
          <ButtonLink href="/catalogue">Explore the catalogue</ButtonLink>
        </Container>
      </section>
    </main>
  );
}
