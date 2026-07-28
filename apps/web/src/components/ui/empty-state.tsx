import { ButtonLink } from "./button-link";

interface EmptyStateProps {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  title: string;
}

export function EmptyState({
  actionHref = "/",
  actionLabel = "Return home",
  description,
  title,
}: EmptyStateProps) {
  return (
    <section
      aria-labelledby="empty-state-title"
      className="rounded-[2rem] border border-navy/10 bg-white px-6 py-16 text-center shadow-soft sm:px-12"
    >
      <p className="eyebrow">The journey is taking shape</p>
      <h2 className="mt-4 text-3xl" id="empty-state-title">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl leading-7 text-ink-muted">{description}</p>
      <div className="mt-8">
        <ButtonLink href={actionHref} variant="text">
          {actionLabel}
        </ButtonLink>
      </div>
    </section>
  );
}
