import Link from "next/link";
import type { ReactNode } from "react";

interface ButtonLinkProps {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "text";
}

const variants = {
  primary: "bg-gold text-navy shadow-[0_12px_35px_rgba(200,164,93,0.2)] hover:bg-gold-light",
  secondary: "border border-white/35 text-white hover:border-gold hover:text-gold-light",
  text: "text-navy underline decoration-gold decoration-1 underline-offset-8 hover:text-gold-dark",
} as const;

export function ButtonLink({ children, href, variant = "primary" }: ButtonLinkProps) {
  return (
    <Link
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold tracking-[0.08em] uppercase transition-colors ${variants[variant]}`}
      href={href}
    >
      {children}
    </Link>
  );
}
