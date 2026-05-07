import BottomNav from "../components/BottomNav";

export default function BiologyPage() {
  return (
    <main className="min-h-screen bg-[#131314] px-5 pb-28 pt-12">
      <section className="mx-auto max-w-md">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#d9ee4f" }}>
          Biology
        </p>
        <h1 className="text-white text-3xl font-black">Biology</h1>
        <p className="mt-3 text-neutral-500">Recovery and body metrics will live here.</p>
      </section>
      <BottomNav />
    </main>
  );
}
