import BottomNav from "../components/BottomNav";

export default function JournalPage() {
  return (
    <main className="min-h-screen bg-[var(--app-bg)] px-5 pb-28 pt-12">
      <section className="mx-auto max-w-md">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#d9ee4f" }}>
          Journal
        </p>
        <h1 className="text-[var(--app-text)] text-3xl font-black">Journal</h1>
        <p className="mt-3 text-[var(--app-text-muted)]">Training notes will live here.</p>
      </section>
      <BottomNav />
    </main>
  );
}
