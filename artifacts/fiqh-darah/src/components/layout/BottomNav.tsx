import { Link, useLocation } from "wouter";
import { Home as HomeIcon, CalendarDays, BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Beranda", icon: HomeIcon },
    { href: "/kalkulator", label: "Kalender", icon: CalendarDays },
    { href: "/panduan", label: "Panduan", icon: BookOpen },
    { href: "/panduan#golongan", label: "Panduan+", icon: Sparkles },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    if (href.includes("#")) return false;
    return location.startsWith(href);
  };

  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 z-50 h-[68px] flex items-center justify-around px-2 safe-area-pb">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-2xl transition-all duration-200 select-none",
              active
                ? "text-[#B76E79]"
                : "text-muted-foreground/60 hover:text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-10 h-7 rounded-2xl flex items-center justify-center transition-all duration-200",
              active ? "bg-[#FFD1DC]/60" : ""
            )}>
              <item.icon
                className={cn("w-5 h-5 transition-all", active ? "stroke-[2.5]" : "stroke-[1.75]")}
              />
            </div>
            <span className={cn(
              "text-[10px] font-bold leading-none tracking-wide",
              active ? "text-[#B76E79]" : "text-muted-foreground/50"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
