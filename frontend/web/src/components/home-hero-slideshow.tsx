import Image from "next/image";

export function HomeHeroSlideshow() {
  return (
    <div
      aria-label="Featured destination: Sigiriya"
      className="home-hero-slideshow absolute inset-0"
      role="img"
    >
      <Image
        alt="Sigiriya Rock rising above the green forest canopy"
        className="absolute inset-0 h-full w-full object-cover"
        fill
        priority
        sizes="100vw"
        src="/images/home/sigiriya-aerial.jpg"
        style={{ objectPosition: "50% 48%" }}
        unoptimized
      />
      <p className="absolute bottom-0 left-0 z-10 p-5 text-xs font-semibold tracking-[0.18em] text-white/80 uppercase sm:p-7">
        Sigiriya
      </p>
    </div>
  );
}
