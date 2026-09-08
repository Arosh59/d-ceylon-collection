import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const value = (await searchParams).token;
  const token = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  return (
    <main className="min-h-screen bg-[#ece9e1] px-4 pt-32 pb-16" id="main-content">
      <section
        className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 shadow-[0_30px_100px_rgba(14,35,66,0.14)] sm:p-12"
        aria-labelledby="reset-heading"
      >
        <p className="eyebrow">Account recovery</p>
        <h1 className="mt-3 text-4xl text-navy" id="reset-heading">
          Choose a new password
        </h1>
        <p className="mt-4 leading-7 text-ink-muted">
          Use at least eight characters. Completing this reset signs out your other sessions.
        </p>
        <ResetPasswordForm token={token} />
      </section>
    </main>
  );
}
