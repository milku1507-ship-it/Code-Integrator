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
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" data-testid="nav-brand">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">F</span>
          </div>
          <span className="font-medium text-lg tracking-tight text-foreground">Fiqh Darah</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-4">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
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
