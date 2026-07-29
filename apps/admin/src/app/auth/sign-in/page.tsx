import { SignInButton } from "./sign-in-button";

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="w-full max-w-md rounded-3xl border border-navy/15 bg-white p-8 shadow-xl">
        <p className="text-sm font-bold tracking-[0.16em] text-gold uppercase">Restricted access</p>
        <h1 className="mt-4 text-4xl font-serif">D Ceylon Administration</h1>
        <p className="mt-4 leading-7 text-slate-600">
          Sign in with an approved administrator account. Customer, agent, and staff roles do not
          receive administrative access.
        </p>
        <SignInButton />
      </section>
    </main>
  );
}
