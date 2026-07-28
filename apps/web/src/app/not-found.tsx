import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <main id="main-content">
      <section className="page-hero min-h-[70svh]">
        <Container>
          <p className="eyebrow text-gold-light">404 · A path less found</p>
          <h1 className="mt-5 max-w-3xl text-5xl text-white sm:text-7xl">
            This journey does not begin here.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/72">
            The page may have moved, or the address may not be part of our collection yet.
          </p>
          <div className="mt-9">
            <ButtonLink href="/">Return home</ButtonLink>
          </div>
        </Container>
      </section>
    </main>
  );
}
