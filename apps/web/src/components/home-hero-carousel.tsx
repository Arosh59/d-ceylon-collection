"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  {
    description: "A train crossing the Nine Arch Bridge in Sri Lanka's hill country",
    src: "/images/home/sri-lanka-train.webp",
  },
  {
    description: "Stilt fishers on Sri Lanka's southern coast at sunset",
    src: "/images/home/sri-lanka-stilt-fishers.jpg",
  },
  {
    description: "Colombo's skyline reflected in Beira Lake at night",
    src: "/images/home/sri-lanka-colombo-night.jpg",
  },
  {
    description: "A palm-fringed tropical beach on Sri Lanka's coast",
    src: "/images/home/sri-lanka-beach.jpg",
  },
  {
    description: "A forest waterfall flowing into a natural pool",
    src: "/images/home/sri-lanka-waterfall.jpg",
  },
  {
    description: "Tea fields across Sri Lanka's misty hill country",
    src: "/images/home/sri-lanka-tea-country.jpg",
  },
  {
    description: "Colombo Port City illuminated at night",
    src: "/images/home/sri-lanka-port-city.jpg",
  },
  {
    description: "An aerial view of Sigiriya Rock Fortress",
    src: "/images/home/sri-lanka-sigiriya.jpg",
  },
  {
    description: "A Sri Lankan landscape from the supplied archive",
    src: "/images/home/sri-lanka-landscape.avif",
  },
] as const;

export function HomeHeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [motionAllowed, setMotionAllowed] = useState(true);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setMotionAllowed(!mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  const autoAdvance = motionAllowed && playing;

  useEffect(() => {
    if (!autoAdvance) return;

    const interval = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % slides.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, [autoAdvance]);

  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div
          className="home-hero-carousel__track"
          data-slide-index={activeSlide}
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div className="home-hero-carousel__slide" key={slide.src}>
              <Image
                alt=""
                className="object-cover object-[68%_center]"
                fill
                priority={index === 0}
                sizes="100vw"
                src={slide.src}
              />
            </div>
          ))}
        </div>
      </div>
      {motionAllowed ? (
        <div className="absolute right-5 bottom-5 z-20 sm:right-8 sm:bottom-7">
          <p aria-live="polite" className="sr-only">
            Background image {activeSlide + 1} of {slides.length}:{" "}
            {slides[activeSlide]?.description}
          </p>
          <button
            aria-pressed={playing}
            className="rounded-full border border-white/45 bg-navy/70 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-white uppercase shadow-lg backdrop-blur transition hover:bg-navy focus-visible:outline-gold"
            onClick={() => setPlaying((isPlaying) => !isPlaying)}
            type="button"
          >
            {playing ? "Pause slideshow" : "Play slideshow"}
          </button>
        </div>
      ) : null}
    </>
  );
}
