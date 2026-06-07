import { Link, useLocation } from "wouter";
import { LayoutGrid, ChefHat, PlusCircle, PieChart, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: LayoutGrid, label: "Pantry" },
    { href: "/recipes", icon: ChefHat, label: "Recipes" },
    { href: "/add", icon: PlusCircle, label: "Add", isPrimary: true },
    { href: "/saved-recipes", icon: Bookmark, label: "Saved" },
    { href: "/stats", icon: PieChart, label: "Stats" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border pb-safe">
      <div className="flex justify-around items-end h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center w-16 pb-2 transition-all duration-200 cursor-pointer",
                  isActive ? "text-primary -translate-y-1" : "text-muted-foreground hover:text-foreground",
                  item.isPrimary && "mb-4"
                )}
              >
                {item.isPrimary ? (
                  <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-lg shadow-primary/25 hover:scale-105 transition-transform">
                    <item.icon size={28} strokeWidth={2.5} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
