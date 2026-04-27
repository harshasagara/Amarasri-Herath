import { Navbar } from "./Navbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative text-white">
      {/* Background decorations */}
      <div className="fixed top-20 left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[150px] pointer-events-none" />
      
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 pt-28 pb-12 relative z-10">
        {children}
      </main>
    </div>
  );
}
