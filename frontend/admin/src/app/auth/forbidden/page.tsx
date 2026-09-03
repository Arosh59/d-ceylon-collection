import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
        <h1 className="text-4xl font-serif">Administrative access denied</h1>
        <p className="mt-4 text-slate-600">
          Your account does not hold the required administrator role.
        </p>
        <Link className="mt-6 inline-block underline" href="/auth/sign-in">
          Return to sign in
        </Link>
      </section>
    </main>
  );
}
