import Link from "next/link";

const items = [
  ["Overview", "/portal/customer"],
  ["Profile", "/portal/customer/profile"],
  ["Travellers", "/portal/customer/travellers"],
  ["Wishlist", "/portal/customer/wishlist"],
  ["Saved itineraries", "/portal/customer/saved-itineraries"],
  ["Travel planner", "/portal/customer/travel-plans"],
  ["Quotes", "/portal/customer/quotes"],
  ["Bookings", "/portal/customer/bookings"],
] as const;

export function CustomerPortalNav() {
  return (
    <nav aria-label="Customer portal" className="border-b border-navy/10 bg-white">
      <ul className="mx-auto flex w-full max-w-[78rem] gap-1 overflow-x-auto px-5 py-3 sm:px-8 lg:px-12">
        {items.map(([label, href]) => (
          <li key={href}>
            <Link
              className="block whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-navy hover:bg-mist"
              href={href}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
