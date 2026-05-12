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
    <nav className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md shadow-sm shadow-primary/5">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" data-testid="nav-brand">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
            <span className="text-primary font-bold text-base leading-none">F</span>
          </div>
          <span className="font-semibold text-base tracking-tight text-foreground">Fiqh Darah</span>
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline-block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
