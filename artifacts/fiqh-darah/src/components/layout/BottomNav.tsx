import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

function CycleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 7h6M9 11h6" />
    </svg>
  );
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Beranda", Icon: CycleIcon },
    { href: "/kalkulator", label: "Kalkulator", Icon: CalendarIcon },
    { href: "/panduan", label: "Panduan", Icon: BookIcon },
    { href: "/panduan#golongan", label: "Profil", Icon: PersonIcon },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    if (href.includes("#")) return false;
    return location.startsWith(href);
  };

  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 z-50 h-[64px] flex items-center justify-around px-2">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 w-16 h-full select-none"
          >
            <div className={cn(
              "w-12 h-8 rounded-full flex items-center justify-center transition-all duration-200",
              active ? "bg-[#FFD1DC]" : ""
            )}>
              <item.Icon className={cn(
                "w-5 h-5 transition-all duration-200",
                active ? "stroke-[#E0426E] stroke-[2]" : "text-gray-400"
              )} />
            </div>
            <span className={cn(
              "text-[10px] font-semibold leading-none tracking-wide transition-colors duration-200",
              active ? "text-[#E0426E]" : "text-gray-400"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
