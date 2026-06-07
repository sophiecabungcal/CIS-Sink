import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useSavedRecipes, useUnsaveRecipe } from "@/hooks/use-saved-recipes";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";
import { Search, Filter, X, ArrowUpDown, Clock, ChefHat, Bookmark, BookOpen } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { SavedRecipe } from "@shared/schema";
import type { Recipe } from "@/hooks/use-recipes";

const DIFFICULTY_OPTIONS = ["All", "Easy", "Medium", "Hard"];
const TIME_OPTIONS = ["All", "Quick (< 30 min)", "Medium (30-60 min)", "Long (> 60 min)"];

type SortOption = "title-asc" | "title-desc" | "recent";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "title-asc", label: "Title (A-Z)" },
  { value: "title-desc", label: "Title (Z-A)" },
  { value: "recent", label: "Recently Saved" },
];

function parseTimeMinutes(prepTime: string | null): number | null {
  if (!prepTime) return null;
  const lower = prepTime.toLowerCase();
  const hourMatch = lower.match(/(\d+)\s*hour/);
  const minMatch = lower.match(/(\d+)\s*min/);
  let total = 0;
  if (hourMatch) total += parseInt(hourMatch[1]) * 60;
  if (minMatch) total += parseInt(minMatch[1]);
  if (total === 0 && lower.includes('min')) {
    const numMatch = lower.match(/(\d+)/);
    if (numMatch) total = parseInt(numMatch[1]);
  }
  return total > 0 ? total : null;
}

function extractIngredientName(ingredient: string): string | null {
  const cleaned = ingredient
    .replace(/\(.*?\)/g, '')
    .replace(/,.*$/, '')
    .trim();
  
  const words = cleaned.split(/\s+/);
  
  const measurementPatterns = /^(cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons|oz|ounce|ounces|lb|lbs|pound|pounds|g|gram|grams|kg|ml|l|liter|liters|pinch|dash|handful|clove|cloves|slice|slices|piece|pieces|can|cans|package|packages|bunch|bunches|\d+\/?\d*|½|¼|¾|⅓|⅔|⅛)/i;
  
  const prepPatterns = /^(fresh|freshly|dried|chopped|minced|diced|sliced|grated|shredded|crushed|ground|melted|softened|room|temperature|large|medium|small|whole|half|cooked|raw|peeled|deveined|boneless|skinless|lean|extra|virgin|optional|to|taste|for|garnish|cooking|about|approximately)$/i;
  
  const ingredientWords = words.filter(word => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (!cleanWord || cleanWord.length < 2) return false;
    if (measurementPatterns.test(cleanWord)) return false;
    if (prepPatterns.test(cleanWord)) return false;
    return true;
  });
  
  if (ingredientWords.length === 0) return null;
  
  const mainIngredient = ingredientWords.slice(-2).join(' ');
  return mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1).toLowerCase();
}

interface SavedRecipesProps {
  onSelectRecipe: (recipe: Recipe) => void;
}

export default function SavedRecipes({ onSelectRecipe }: SavedRecipesProps) {
  const [_, setLocation] = useLocation();
  const { data: savedRecipes, isLoading, error } = useSavedRecipes();
  const unsaveRecipe = useUnsaveRecipe();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedTime, setSelectedTime] = useState("All");
  const [sortOption, setSortOption] = useState<SortOption>("title-asc");
  const [filterOpen, setFilterOpen] = useState(false);

  const filteredAndSortedRecipes = useMemo(() => {
    if (!savedRecipes) return [];

    let result = [...savedRecipes].filter(recipe => 
      recipe.title.toLowerCase().includes(search.toLowerCase())
    );

    if (selectedDifficulty !== "All") {
      result = result.filter(recipe => 
        recipe.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    if (selectedTime !== "All") {
      result = result.filter(recipe => {
        const minutes = parseTimeMinutes(recipe.prepTime);
        if (minutes === null) return false;
        switch (selectedTime) {
          case "Quick (< 30 min)":
            return minutes < 30;
          case "Medium (30-60 min)":
            return minutes >= 30 && minutes <= 60;
          case "Long (> 60 min)":
            return minutes > 60;
          default:
            return true;
        }
      });
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "recent":
          return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return result;
  }, [savedRecipes, search, selectedDifficulty, selectedTime, sortOption]);

  const activeFiltersCount = [
    selectedDifficulty !== "All",
    selectedTime !== "All",
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSelectedDifficulty("All");
    setSelectedTime("All");
  };

  const handleRecipeClick = (savedRecipe: SavedRecipe) => {
    let instructions: string | string[] = savedRecipe.instructions;
    try {
      const parsed = JSON.parse(savedRecipe.instructions);
      if (Array.isArray(parsed)) {
        instructions = parsed;
      }
    } catch {
      // Not JSON, use as string
    }

    const recipe: Recipe = {
      title: savedRecipe.title,
      ingredients: savedRecipe.ingredients,
      instructions,
      matchCount: savedRecipe.matchCount,
      prepTime: savedRecipe.prepTime,
      difficulty: savedRecipe.difficulty,
      sourceName: savedRecipe.sourceName,
    };
    onSelectRecipe(recipe);
    setLocation("/saved-recipes/detail");
  };

  const handleUnsave = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    unsaveRecipe.mutate(id, {
      onSuccess: () => {
        toast({ title: "Recipe removed from saved" });
      },
      onError: () => {
        toast({ title: "Failed to remove recipe", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FBDB93] pb-24">
      <AppHeader title="Saved Recipes" subtitle="Your recipe collection" />

      <main className="px-4 py-4 max-w-md mx-auto space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#641B2E]/50" size={18} />
            <Input
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-white border-transparent focus:border-[#8A2D3B] focus:bg-white transition-all text-[#641B2E] placeholder:text-[#641B2E]/50"
              data-testid="input-search-saved-recipes"
            />
          </div>

          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-xl relative bg-white border-transparent hover:bg-gray-50"
                data-testid="button-filter-saved-recipes"
              >
                <Filter size={18} />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#BE5B50] text-white text-xs flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-white p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#641B2E]">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleClearFilters}
                      className="text-[#BE5B50] h-auto p-1"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#641B2E]/70">Difficulty</label>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="bg-white" data-testid="select-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map(diff => (
                        <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#641B2E]/70">Prep Time</label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger className="bg-white" data-testid="select-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#641B2E]/70">Sort by</label>
                  <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                    <SelectTrigger className="bg-white" data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedDifficulty !== "All" && (
              <Badge 
                variant="secondary" 
                className="bg-white text-[#641B2E] gap-1 cursor-pointer"
                onClick={() => setSelectedDifficulty("All")}
              >
                {selectedDifficulty}
                <X size={12} />
              </Badge>
            )}
            {selectedTime !== "All" && (
              <Badge 
                variant="secondary" 
                className="bg-white text-[#641B2E] gap-1 cursor-pointer"
                onClick={() => setSelectedTime("All")}
              >
                {selectedTime}
                <X size={12} />
              </Badge>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#BE5B50] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-[#BE5B50]">
            Failed to load saved recipes
          </div>
        )}

        {!isLoading && !error && filteredAndSortedRecipes.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 space-y-4"
          >
            <div className="w-20 h-20 rounded-full bg-white mx-auto flex items-center justify-center">
              <Bookmark className="w-10 h-10 text-[#641B2E]/30" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#641B2E]">
                {search || activeFiltersCount > 0 ? "No recipes found" : "No saved recipes yet"}
              </h3>
              <p className="text-sm text-[#641B2E]/70 mt-1">
                {search || activeFiltersCount > 0 
                  ? "Try adjusting your search or filters"
                  : "Save recipes from Smart Recipes to find them here"}
              </p>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filteredAndSortedRecipes.map((recipe, idx) => (
              <motion.button
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: idx * 0.03 }}
                className="w-full text-left bg-white rounded-2xl overflow-hidden border border-transparent shadow-sm hover:shadow-md transition-all"
                onClick={() => handleRecipeClick(recipe)}
                data-testid={`saved-recipe-card-${idx}`}
              >
                <div className="h-20 bg-gradient-to-br from-[#BE5B50]/10 to-[#FBDB93]/30 relative overflow-hidden">
                  <button
                    onClick={(e) => handleUnsave(recipe.id, e)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-[#BE5B50] text-white transition-colors hover:bg-[#BE5B50]/80"
                    data-testid={`button-unsave-recipe-${idx}`}
                  >
                    <Bookmark size={16} className="fill-current" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-display font-bold text-[#641B2E] mb-2">{recipe.title}</h3>
                  
                  <div className="flex gap-3 mb-3 text-xs text-[#641B2E]/70">
                    {recipe.prepTime && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} /> {recipe.prepTime}
                      </div>
                    )}
                    {recipe.difficulty && (
                      <div className="flex items-center gap-1">
                        <ChefHat size={14} /> {recipe.difficulty}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {recipe.ingredients
                      .map(extractIngredientName)
                      .filter((name): name is string => name !== null)
                      .slice(0, 4)
                      .map((name, i) => (
                        <span key={i} className="text-xs bg-[#FBDB93]/50 px-2 py-1 rounded-md text-[#641B2E]">
                          {name}
                        </span>
                      ))}
                    {recipe.ingredients.length > 4 && (
                      <span className="text-xs bg-[#FBDB93]/50 px-2 py-1 rounded-md text-[#641B2E]">
                        +{recipe.ingredients.length - 4} more
                      </span>
                    )}
                  </div>

                  {recipe.sourceName && (
                    <div className="mt-3 pt-3 border-t border-[#641B2E]/10 flex items-center gap-2 text-xs text-[#641B2E]/60">
                      <BookOpen size={12} />
                      <span>Sourced from <span className="font-medium">{recipe.sourceName}</span></span>
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}
