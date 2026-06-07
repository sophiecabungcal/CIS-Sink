import { usePantryItems, useUpdatePantryItem } from "@/hooks/use-pantry";
import { BottomNav } from "@/components/BottomNav";
import { PantryCard } from "@/components/PantryCard";
import { AppHeader } from "@/components/AppHeader";
import { Search, Filter, X, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { differenceInDays } from "date-fns";
import { FOOD_CATEGORIES } from "@/lib/categories";

const CATEGORIES = ["All", ...FOOD_CATEGORIES];

type SortOption = "default" | "name-asc" | "name-desc" | "expiry-asc" | "expiry-desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default", label: "Default (A-Z, then Expiry)" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "expiry-asc", label: "Expiring Soon First" },
  { value: "expiry-desc", label: "Expiring Last First" },
];

export default function Home() {
  const { data: items, isLoading, error } = usePantryItems('active');
  const updateMutation = useUpdatePantryItem();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [filterOpen, setFilterOpen] = useState(false);

  const filteredAndSortedItems = useMemo(() => {
    if (!items) return [];

    let result = [...items].filter(item => 
      item.item.name.toLowerCase().includes(search.toLowerCase())
    );

    if (selectedCategory !== "All") {
      result = result.filter(item => item.item.category === selectedCategory);
    }

    result.sort((a, b) => {
      const getDaysLeft = (exp: string | null) => {
        if (!exp) return Infinity;
        return differenceInDays(new Date(exp), new Date());
      };

      switch (sortOption) {
        case "name-asc":
          return a.item.name.localeCompare(b.item.name);
        case "name-desc":
          return b.item.name.localeCompare(a.item.name);
        case "expiry-asc":
          return getDaysLeft(a.expirationDate) - getDaysLeft(b.expirationDate);
        case "expiry-desc":
          return getDaysLeft(b.expirationDate) - getDaysLeft(a.expirationDate);
        case "default":
        default:
          const nameCompare = a.item.name.localeCompare(b.item.name);
          if (nameCompare !== 0) return nameCompare;
          return getDaysLeft(a.expirationDate) - getDaysLeft(b.expirationDate);
      }
    });

    return result;
  }, [items, search, selectedCategory, sortOption]);

  const handleConsume = (id: number) => {
    updateMutation.mutate({ id, status: 'consumed' });
  };

  const handleDispose = (id: number) => {
    updateMutation.mutate({ id, status: 'disposed' });
  };

  const clearFilters = () => {
    setSelectedCategory("All");
    setSortOption("default");
    setSearch("");
  };

  const hasActiveFilters = selectedCategory !== "All" || sortOption !== "default" || search !== "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Loading pantry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-xl font-bold text-destructive mb-2">Something went wrong</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  const searchAndFilterContent = (
    <>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search items..." 
            className="pl-10 rounded-xl bg-white border-transparent focus:border-[#8A2D3B] focus:bg-white transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-xl relative bg-white border-transparent hover:bg-gray-50"
              data-testid="button-filter"
            >
              <Filter size={18} />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" aria-label="Filters active" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 bg-white" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-foreground">Filters</h4>
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    data-testid="button-clear-filters"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} data-testid={`option-category-${cat.toLowerCase()}`}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Sort by</label>
                <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                  <SelectTrigger data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} data-testid={`option-sort-${opt.value}`}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {(selectedCategory !== "All" || sortOption !== "default") && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedCategory !== "All" && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-category-filter">
              {selectedCategory}
              <span
                role="button"
                tabIndex={0}
                className="ml-1 cursor-pointer rounded-full p-0.5 hover-elevate"
                onClick={() => setSelectedCategory("All")}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedCategory("All")}
                data-testid="button-remove-category"
                aria-label="Remove category filter"
              >
                <X size={12} />
              </span>
            </Badge>
          )}
          {sortOption !== "default" && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-sort-filter">
              <ArrowUpDown size={12} />
              {SORT_OPTIONS.find(o => o.value === sortOption)?.label}
              <span
                role="button"
                tabIndex={0}
                className="ml-1 cursor-pointer rounded-full p-0.5 hover-elevate"
                onClick={() => setSortOption("default")}
                onKeyDown={(e) => e.key === 'Enter' && setSortOption("default")}
                data-testid="button-remove-sort"
                aria-label="Remove sort filter"
              >
                <X size={12} />
              </span>
            </Badge>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader 
        title="My Pantry" 
        subtitle="Manage your inventory"
        rightContent={searchAndFilterContent}
      />

      <main className="px-4 py-6 space-y-4 max-w-md mx-auto">
        <AnimatePresence initial={false}>
          {filteredAndSortedItems.length > 0 ? (
            filteredAndSortedItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <PantryCard 
                  item={item} 
                  onConsume={handleConsume}
                  onDispose={handleDispose}
                />
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground" data-testid="text-no-items">No items found</h3>
              <p className="text-muted-foreground mt-1">
                {search || selectedCategory !== "All" 
                  ? "Try adjusting your search or filters" 
                  : "Your pantry is empty. Time to go shopping!"}
              </p>
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={clearFilters}
                  data-testid="button-clear-all-filters"
                >
                  Clear all filters
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}
