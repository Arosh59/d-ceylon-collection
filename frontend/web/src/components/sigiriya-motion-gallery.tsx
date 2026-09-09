import Image from "next/image";

interface DestinationSlide {
  alt: string;
  src: string;
}

interface DestinationMotionGalleryProps {
  alt: string;
  caption: string;
  imageSrc: string;
  slides?: readonly DestinationSlide[] | undefined;
  variant: "colombo" | "ella" | "galle" | "kandy" | "sigiriya" | "tangalle";
}

export function DestinationMotionGallery({
  alt,
  caption,
  imageSrc,
  slides,
  variant,
}: DestinationMotionGalleryProps) {
  const image = slides?.[0] ?? { alt, src: imageSrc };
  return (
    <figure className="relative">
      <div
        className={`destination-motion-gallery destination-motion-gallery--${variant} aspect-[16/7] rounded-[1.75rem] shadow-soft`}
      >
        <Image
          alt={image.alt}
          className="destination-motion-gallery__image object-cover"
          fill
          priority
          quality={90}
          sizes="(min-width: 1024px) 1120px, 100vw"
          src={image.src}
        />
        <div aria-hidden="true" className="destination-motion-gallery__veil" />
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  );
}

export function SigiriyaMotionGallery({ alt }: Pick<DestinationMotionGalleryProps, "alt">) {
  return (
    <DestinationMotionGallery
      alt={alt}
      caption="Sigiriya Rock Fortress and its surrounding gardens."
      imageSrc="/images/destinations/sigiriya.jpg"
      variant="sigiriya"
    />
  );
}
