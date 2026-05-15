import { Link, useLocation } from "wouter";
import { BookOpen, Calculator, Home as HomeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Beranda", icon: HomeIcon },
    { href: "/kalkulator", label: "Kalkulator", icon: Calculator },
    { href: "/panduan", label: "Panduan", icon: BookOpen },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-pink-100/60">
      <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" data-testid="nav-brand">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FF85A1] to-[#e8629e] flex items-center justify-center shadow-md shadow-pink-200">
            <span className="text-lg leading-none select-none">🌸</span>
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">Fiqh Darah</span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-[#FF85A1]/15 text-[#e8629e]"
                    : "text-muted-foreground hover:bg-pink-50 hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 1.75} />
                <span className="hidden sm:inline-block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
