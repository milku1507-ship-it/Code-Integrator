import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CalcIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={active ? "#6C63FF" : "none"} stroke={active ? "#6C63FF" : "currentColor"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="3" />
      <path d="M8 6h8M8 10h8M8 14h4" stroke={active ? "white" : "currentColor"} />
      <circle cx="16" cy="17" r="2" fill={active ? "white" : "none"} stroke={active ? "white" : "currentColor"} />
    </svg>
  );
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/", label: "Beranda", renderIcon: (active: boolean) => <HomeIcon className={cn("w-[20px] h-[20px] transition-all duration-200", active ? "stroke-[#6C63FF]" : "stroke-gray-400")} /> },
  { href: "/kalkulator", label: "Kalkulator", renderIcon: (active: boolean) => <CalcIcon className="w-[20px] h-[20px] transition-all duration-200" active={active} /> },
  { href: "/profil", label: "Profil", renderIcon: (active: boolean) => <PersonIcon className={cn("w-[20px] h-[20px] transition-all duration-200", active ? "stroke-[#6C63FF]" : "stroke-gray-400")} /> },
];

export function BottomNav() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 z-50 h-[64px] flex items-center justify-around px-2">
      {NAV_ITEMS.map(({ href, label, renderIcon }) => {
        const active = isActive(href);
        return (
          <Link key={href} href={href} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full select-none">
            <div className={cn(
              "w-12 h-8 rounded-full flex items-center justify-center transition-all duration-200",
              active ? "bg-[#EDE9FE]" : ""
            )}>
              {renderIcon(active)}
            </div>
            <span className={cn(
              "text-[10px] font-semibold leading-none tracking-wide",
              active ? "text-[#6C63FF]" : "text-gray-400"
            )}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
