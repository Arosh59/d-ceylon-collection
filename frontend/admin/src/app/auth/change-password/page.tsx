import Image from "next/image";

import { ChangePasswordForm } from "./change-password-form";

export const dynamic = "force-dynamic";

export default function ChangePasswordPage() {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="change-password-heading">
        <div className="brand-lockup">
          <Image
            alt=""
            className="brand-mark"
            height={48}
            priority
            src="/brand/d-ceylon-mark-navy.webp"
            width={48}
          />
          <span>
            <strong>D’Ceylon</strong>
            <small>Administration</small>
          </span>
        </div>
        <p className="eyebrow mt-10">Account security</p>
        <h1 className="auth-heading" id="change-password-heading">
          Choose a private password
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Your temporary administrator password must be replaced before you can use the workspace.
        </p>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
