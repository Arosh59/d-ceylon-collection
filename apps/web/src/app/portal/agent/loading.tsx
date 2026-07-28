export default function AgentPortalLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="min-h-[60vh] bg-canvas px-5 py-16"
      id="main-content"
    >
      <span className="sr-only">Loading agent portal</span>
      <div className="mx-auto h-64 max-w-4xl animate-pulse rounded-3xl bg-navy/8" />
    </main>
  );
}
