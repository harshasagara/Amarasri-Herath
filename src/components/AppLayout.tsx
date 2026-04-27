import { Navbar } from "./Navbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative text-white">
      {/* Anti-gravity floating orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 pt-24 md:pt-28 landscape:pt-16 pb-12 relative z-10">
        {children}
      </main>
    </div>
  );
}
