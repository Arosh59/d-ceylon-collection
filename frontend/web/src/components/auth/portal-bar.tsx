import { LogoutButton } from "./logout-button";

interface PortalBarProps {
  displayName: string;
  portalName: string;
}

export function PortalBar({ displayName, portalName }: PortalBarProps) {
  return (
    <div className="border-b border-white/10 bg-navy pt-24 text-white">
      <div className="mx-auto flex min-h-20 w-full max-w-[78rem] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-gold-light uppercase">
            {portalName}
          </p>
          <p className="mt-1 text-sm text-white/75">Signed in as {displayName}</p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
