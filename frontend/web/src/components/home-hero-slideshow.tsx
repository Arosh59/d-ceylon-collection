"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const slides = [
  {
    alt: "Kandy's lakeside temple framed by pink blossoms and green hills",
    caption: "Kandy",
    position: "65% 50%",
    src: "/images/home/kandy-lake-temple.jpg",
  },
  {
    alt: "Sigiriya Rock rising above the green forest canopy",
    caption: "Sigiriya",
    position: "50% 48%",
    src: "/images/home/sigiriya-aerial.jpg",
  },
  {
    alt: "A blue train crossing a stone viaduct through Sri Lanka's misty hill country",
    caption: "Hill country",
    position: "50% 55%",
    src: "/images/home/hill-country-train.jpg",
  },
] as const;

const AUTOPLAY_DELAY = 6000;

export function HomeHeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const slideshowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_DELAY);

    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion]);

  const showSlide = (index: number) => {
    setActiveIndex(index);
    slideshowRef.current?.focus({ preventScroll: true });
  };

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  const activeSlide = slides[activeIndex] ?? slides[0]!;

  return (
    <div
      aria-label="Featured destinations slideshow"
      className="home-hero-slideshow absolute inset-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
      onFocus={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      ref={slideshowRef}
      role="region"
      tabIndex={-1}
    >
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;

        return (
          <div
            aria-hidden={!isActive}
            className="home-hero-slide absolute inset-0"
            data-active={isActive}
            key={slide.src}
          >
            <Image
              alt={isActive ? slide.alt : ""}
              className="absolute inset-0 h-full w-full object-cover"
              fill
              priority={index === 0}
              sizes="100vw"
              src={slide.src}
              style={{ objectPosition: slide.position }}
              unoptimized
            />
          </div>
        );
      })}

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 p-5 sm:p-7">
        <p
          aria-live="polite"
          className="text-xs font-semibold tracking-[0.18em] text-white/80 uppercase"
        >
          {activeSlide.caption} · {String(activeIndex + 1).padStart(2, "0")} /{" "}
          {String(slides.length).padStart(2, "0")}
        </p>
        <div className="flex items-center gap-2" role="group" aria-label="Slideshow controls">
          <button
            aria-label="Previous slide"
            className="home-hero-control"
            onClick={showPrevious}
            type="button"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
            className="home-hero-control"
            onClick={() => setIsPaused((paused) => !paused)}
            type="button"
          >
            <span aria-hidden="true">{isPaused ? "▶" : "Ⅱ"}</span>
          </button>
          <button
            aria-label="Next slide"
            className="home-hero-control"
            onClick={showNext}
            type="button"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div
        className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 gap-1.5 sm:flex sm:bottom-7"
        role="tablist"
        aria-label="Choose a destination image"
      >
        {slides.map((slide, index) => (
          <button
            aria-label={`Show ${slide.caption} slide`}
            aria-selected={index === activeIndex}
            className="home-hero-dot"
            key={slide.src}
            onClick={() => showSlide(index)}
            role="tab"
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
