import { redirect } from "next/navigation";

import { SignInButton } from "./sign-in-button";
import {
  getAdminAuthenticationConfigurationError,
  getAdminAuthenticationEnvironment,
} from "@/lib/auth-environment";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  if (getAdminAuthenticationConfigurationError()) redirect("/auth/configuration");
  const environment = getAdminAuthenticationEnvironment();
  const localAuthEnabled = environment.authenticationMode === "local";

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="sign-in-heading">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            DC
          </span>
          <span>
            <strong>D Ceylon</strong>
            <small>Administration</small>
          </span>
        </div>
        <div className="mt-10">
          <span className={localAuthEnabled ? "mode-badge local" : "mode-badge"}>
            <span className="mode-dot" aria-hidden="true" />
            {localAuthEnabled ? "Development workspace" : "Secure administrator access"}
          </span>
        </div>
        <h1 className="auth-heading" id="sign-in-heading">
          Welcome back
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          {localAuthEnabled
            ? "Use the administrator credentials from frontend/admin/.env.local to open this local workspace."
            : "Continue through the managed identity provider with an approved administrator account."}
        </p>
        <SignInButton localAuthEnabled={localAuthEnabled} />
        <p className="mt-7 border-t border-navy/10 pt-5 text-xs leading-5 text-slate-500">
          Access is restricted to administrator accounts. Activity may be recorded for security and
          support.
        </p>
      </section>
    </main>
  );
}
