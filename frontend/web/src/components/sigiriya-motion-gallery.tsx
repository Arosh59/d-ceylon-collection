"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface DestinationMotionSlide {
  alt: string;
  src: string;
}

interface DestinationMotionGalleryProps {
  alt: string;
  caption: string;
  imageSrc: string;
  slides?: readonly DestinationMotionSlide[] | undefined;
  variant: "colombo" | "ella" | "galle" | "kandy" | "sigiriya" | "tangalle";
}

export function DestinationMotionGallery({
  alt,
  caption,
  imageSrc,
  slides,
  variant,
}: DestinationMotionGalleryProps) {
  const [hovering, setHovering] = useState(false);
  const [motionPreference, setMotionPreference] = useState<"auto" | "paused" | "playing">("auto");
  const [activeSlide, setActiveSlide] = useState(0);
  const gallerySlides = slides?.length ? slides : [{ alt, src: imageSrc }];
  const motionActive = motionPreference === "playing" || (motionPreference === "auto" && hovering);

  useEffect(() => {
    if (!motionActive || gallerySlides.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % gallerySlides.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [gallerySlides.length, motionActive]);

  const goToSlide = (direction: -1 | 1) => {
    setActiveSlide(
      (currentSlide) => (currentSlide + direction + gallerySlides.length) % gallerySlides.length,
    );
  };

  return (
    <figure
      className="relative"
      data-motion-active={motionActive || undefined}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHovering(false);
      }}
      onFocusCapture={() => setHovering(true)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className={`destination-motion-gallery destination-motion-gallery--${variant} aspect-[16/7] rounded-[1.75rem] shadow-soft`}
        aria-label={`${variant} image gallery`}
        aria-roledescription="carousel"
        role="group"
      >
        <div
          className="destination-motion-gallery__track"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {gallerySlides.map((slide, index) => (
            <div className="destination-motion-gallery__slide" key={slide.src}>
              <Image
                alt={index === activeSlide ? slide.alt : ""}
                className="destination-motion-gallery__image object-cover"
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 1120px, 100vw"
                src={slide.src}
              />
            </div>
          ))}
        </div>
        <div aria-hidden="true" className="destination-motion-gallery__veil" />
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
      {gallerySlides.length > 1 ? (
        <>
          <p aria-live="polite" className="sr-only">
            Image {activeSlide + 1} of {gallerySlides.length}: {gallerySlides[activeSlide]?.alt}
          </p>
          <div className="absolute bottom-4 left-4 flex gap-2">
            <button
              aria-label="Previous image"
              className="rounded-full bg-navy/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-navy focus-visible:outline-gold"
              onClick={() => goToSlide(-1)}
              type="button"
            >
              Previous
            </button>
            <button
              aria-label="Next image"
              className="rounded-full bg-navy/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-navy focus-visible:outline-gold"
              onClick={() => goToSlide(1)}
              type="button"
            >
              Next
            </button>
          </div>
        </>
      ) : null}
      <button
        aria-pressed={motionActive}
        className="absolute right-4 bottom-4 rounded-full bg-navy/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-navy focus-visible:outline-gold"
        onClick={() => setMotionPreference(motionActive ? "paused" : "playing")}
        type="button"
      >
        {motionActive ? "Pause motion" : "Play motion"}
      </button>
    </figure>
  );
}

export function SigiriyaMotionGallery({ alt }: Pick<DestinationMotionGalleryProps, "alt">) {
  return (
    <DestinationMotionGallery
      alt={alt}
      caption="A slow panoramic motion reveals the Sigiriya Rock Fortress and its surrounding gardens."
      imageSrc="/images/destinations/sigiriya.jpg"
      variant="sigiriya"
    />
  );
}
