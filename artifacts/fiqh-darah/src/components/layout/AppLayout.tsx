import { useState, useEffect, useCallback } from "react";
import { BottomNav } from "./BottomNav";
import { AdminPanel, PinModal, applyBranding } from "@/components/AdminPanel";
import { getAdminConfig } from "@/lib/adminConfig";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [tapCount, setTapCount] = useState(0);
  const [showPin, setShowPin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [config] = useState(getAdminConfig);

  // Apply saved branding on mount
  useEffect(() => {
    applyBranding(getAdminConfig());
  }, []);

  // 5-tap secret trigger
  const handleLogoTap = useCallback(() => {
    setTapCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setShowPin(true);
        return 0;
      }
      // Reset after 2 seconds of inactivity
      setTimeout(() => setTapCount(0), 2000);
      return next;
    });
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#fffaf1] selection:bg-primary/20">
      {/* Invisible logo tap target — top-left corner, accessible */}
      <div
        onClick={handleLogoTap}
        className="fixed top-0 left-0 w-12 h-12 z-40 opacity-0 select-none cursor-default"
        aria-hidden="true"
      />

      <main className="flex-1 flex flex-col pb-[64px]">{children}</main>
      <BottomNav />

      {/* Admin PIN modal */}
      {showPin && (
        <PinModal
          config={config}
          onSuccess={() => { setShowPin(false); setShowAdmin(true); }}
        />
      )}

      {/* Admin panel */}
      <AdminPanel open={showAdmin} onClose={() => setShowAdmin(false)} />
    </div>
  );
}
