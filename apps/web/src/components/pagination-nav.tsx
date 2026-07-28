import Link from "next/link";

interface PaginationNavProps {
  ariaLabel?: string;
  basePath: string;
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    pageNumber: number | string;
    totalPages: number | string;
  };
  query: Record<string, string | undefined>;
}

export function PaginationNav({
  ariaLabel = "Pagination",
  basePath,
  pagination,
  query,
}: PaginationNavProps) {
  if (Number(pagination.totalPages) <= 1) {
    return null;
  }

  const link = (pageNumber: number) => {
    const parameters = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) {
        parameters.set(key, value);
      }
    }
    parameters.set("page", String(pageNumber));
    return `${basePath}?${parameters.toString()}`;
  };

  return (
    <nav aria-label={ariaLabel} className="mt-12 flex items-center justify-between">
      {pagination.hasPreviousPage ? (
        <Link className="button-secondary" href={link(Number(pagination.pageNumber) - 1)}>
          Previous page
        </Link>
      ) : (
        <span />
      )}
      <p aria-live="polite" className="text-sm text-ink-muted">
        Page {pagination.pageNumber} of {pagination.totalPages}
      </p>
      {pagination.hasNextPage ? (
        <Link className="button-secondary" href={link(Number(pagination.pageNumber) + 1)}>
          Next page
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
