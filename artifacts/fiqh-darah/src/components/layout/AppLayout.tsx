import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      <main className="flex-1 flex flex-col pb-[72px]">{children}</main>
      <BottomNav />
    </div>
  );
}
