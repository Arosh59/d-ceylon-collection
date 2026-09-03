interface SectionHeadingProps {
  align?: "left" | "center";
  eyebrow: string;
  heading: string;
  introduction?: string;
}

export function SectionHeading({
  align = "left",
  eyebrow,
  heading,
  introduction,
}: SectionHeadingProps) {
  const alignment = align === "center" ? "mx-auto text-center" : "";

  return (
    <div className={`max-w-3xl ${alignment}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-4xl text-balance sm:text-5xl">{heading}</h2>
      {introduction ? (
        <p className="mt-6 text-lg leading-8 text-ink-muted">{introduction}</p>
      ) : null}
    </div>
  );
}
