import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useRecipeSuggestions, type Recipe } from "@/hooks/use-recipes";
import { usePantryItems } from "@/hooks/use-pantry";
import { useSaveRecipe, useUnsaveRecipe, useSavedRecipes } from "@/hooks/use-saved-recipes";
import { BottomNav } from "@/components/BottomNav";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ChefHat, Sparkles, Clock, AlertCircle, Plus, ShoppingBag, ArrowLeft, BookOpen, Bookmark, Home } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

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

interface RecipesProps {
  onSelectRecipe: (recipe: Recipe) => void;
  recipes: Recipe[];
  hasGeneratedRecipes: boolean;
  onRecipesGenerated: (recipes: Recipe[], append?: boolean) => void;
  onClearRecipes: () => void;
  customPantryItemIds: number[] | null;
  onClearCustomMode: () => void;
  isCustomMode: boolean;
  shouldTriggerGeneration?: boolean;
  onGenerationTriggered?: () => void;
}

export default function Recipes({ 
  onSelectRecipe, 
  recipes, 
  hasGeneratedRecipes, 
  onRecipesGenerated,
  onClearRecipes,
  customPantryItemIds,
  onClearCustomMode,
  isCustomMode,
  shouldTriggerGeneration,
  onGenerationTriggered
}: RecipesProps) {
  const [_, setLocation] = useLocation();
  const { mutate, isPending } = useRecipeSuggestions();
  const { data: pantryItems, isLoading: isPantryLoading } = usePantryItems();
  const { data: savedRecipes } = useSavedRecipes();
  const saveRecipe = useSaveRecipe();
  const unsaveRecipe = useUnsaveRecipe();
  const { toast } = useToast();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [includeHousehold, setIncludeHousehold] = useState(false);

  const activeItems = pantryItems?.filter(item => item.status === 'active') || [];
  const hasHouseholdItems = activeItems.some(item => item.item.itemType === 'household');
  const hasPantryItems = activeItems.length > 0;

  // Auto-trigger generation when coming from custom recipe selection
  useEffect(() => {
    if (shouldTriggerGeneration && customPantryItemIds && customPantryItemIds.length > 0 && !isPending) {
      onGenerationTriggered?.();
      setGenerationError(null);
      mutate({ count: 10, pantryItemIds: customPantryItemIds, includeHousehold }, {
        onSuccess: (data) => {
          onRecipesGenerated(data, false);
        },
        onError: (err) => {
          setGenerationError(err instanceof Error ? err.message : "Failed to generate recipes");
        }
      });
    }
  }, [shouldTriggerGeneration]);

  const isRecipeSaved = (title: string) => {
    return savedRecipes?.some(r => r.title === title) ?? false;
  };

  const getSavedRecipeId = (title: string) => {
    return savedRecipes?.find(r => r.title === title)?.id ?? null;
  };

  const handleToggleSave = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    const savedId = getSavedRecipeId(recipe.title);
    
    if (savedId) {
      unsaveRecipe.mutate(savedId, {
        onSuccess: () => {
          toast({ title: "Recipe removed from saved" });
        },
        onError: () => {
          toast({ title: "Failed to remove recipe", variant: "destructive" });
        }
      });
    } else {
      const instructions = Array.isArray(recipe.instructions) 
        ? JSON.stringify(recipe.instructions) 
        : recipe.instructions;
      
      saveRecipe.mutate({
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions,
        prepTime: recipe.prepTime ?? null,
        difficulty: recipe.difficulty ?? null,
        sourceName: recipe.sourceName ?? null,
        matchCount: recipe.matchCount,
      }, {
        onSuccess: () => {
          toast({ title: "Recipe saved!" });
        },
        onError: () => {
          toast({ title: "Failed to save recipe", variant: "destructive" });
        }
      });
    }
  };

  const handleGetSuggestions = () => {
    setGenerationError(null);
    const params: { count: number; pantryItemIds?: number[]; includeHousehold?: boolean } = { count: 10, includeHousehold };
    if (customPantryItemIds && customPantryItemIds.length > 0) {
      params.pantryItemIds = customPantryItemIds;
    }
    mutate(params, {
      onSuccess: (data) => {
        onRecipesGenerated(data, false);
      },
      onError: (err) => {
        setGenerationError(err instanceof Error ? err.message : "Failed to generate recipes");
      }
    });
  };

  const handleGetMore = () => {
    setIsLoadingMore(true);
    const excludeTitles = recipes.map(r => r.title);
    const params: { count: number; excludeTitles: string[]; pantryItemIds?: number[]; includeHousehold?: boolean } = { 
      count: 5, 
      excludeTitles,
      includeHousehold
    };
    if (customPantryItemIds && customPantryItemIds.length > 0) {
      params.pantryItemIds = customPantryItemIds;
    }
    mutate(params, {
      onSuccess: (data) => {
        onRecipesGenerated(data, true);
        setIsLoadingMore(false);
      },
      onError: () => {
        setIsLoadingMore(false);
      }
    });
  };

  const handleRecipeClick = (recipe: Recipe) => {
    onSelectRecipe(recipe);
    setLocation("/recipes/detail");
  };

  const handleBackToMain = () => {
    onClearRecipes();
    onClearCustomMode();
    setGenerationError(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Smart Recipes" subtitle="Cook with what you have" />

      <main className="px-4 py-6 max-w-md mx-auto min-h-[60vh]">
        {isPantryLoading && (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-16 h-16 border-4 border-[#BE5B50] border-t-transparent rounded-full animate-spin" />
            <p className="font-medium text-foreground">Loading your pantry...</p>
          </div>
        )}

        {!isPantryLoading && !hasPantryItems && (
           <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-6">
             <div className="w-32 h-32 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-4">
               <ShoppingBag size={64} />
             </div>
             <h2 className="text-2xl font-bold font-display max-w-[250px]">Your pantry is empty</h2>
             <p className="text-muted-foreground max-w-xs">
               Add some items to your pantry first, and we'll suggest delicious recipes you can make!
             </p>
             <Button 
               size="lg" 
               className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 bg-[#BE5B50] hover:bg-[#a84d43] text-white"
               onClick={() => setLocation("/add")}
               data-testid="button-add-items"
             >
               <Plus className="mr-2" size={20} />
               Add Items
             </Button>
           </div>
        )}

        {!isPantryLoading && hasPantryItems && !hasGeneratedRecipes && !isPending && (
           <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-6">
             <div className="w-32 h-32 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-4">
               <ChefHat size={64} />
             </div>
             <h2 className="text-2xl font-bold font-display max-w-[200px]">What should I cook today?</h2>
             <p className="text-muted-foreground max-w-xs">
               You have {activeItems.length} item{activeItems.length !== 1 ? 's' : ''} in your pantry. Let's find some delicious recipes!
             </p>
             
             {/* Household Toggle */}
             {hasHouseholdItems && (
               <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-[#BE5B50]/10 rounded-full flex items-center justify-center">
                     <Home size={20} className="text-[#BE5B50]" />
                   </div>
                   <div>
                     <Label htmlFor="household-toggle" className="text-sm font-medium text-[#641B2E] cursor-pointer">
                       Include Household Recipes
                     </Label>
                     <p className="text-xs text-[#641B2E]/60">DIY cleaners, air fresheners, etc.</p>
                   </div>
                 </div>
                 <Switch
                   id="household-toggle"
                   checked={includeHousehold}
                   onCheckedChange={setIncludeHousehold}
                   data-testid="switch-include-household"
                 />
               </div>
             )}
             
             <div className="w-full space-y-3 pt-4">
               <Button 
                 size="lg" 
                 className="w-full h-14 text-lg rounded-2xl shadow-lg bg-[#BE5B50] hover:bg-[#a84d43] text-white"
                 onClick={handleGetSuggestions}
                 data-testid="button-get-suggestions"
               >
                 <Sparkles className="mr-2" size={20} />
                 Suggest Recipes
               </Button>
               
               <Button 
                 size="lg" 
                 variant="outline"
                 className="w-full h-14 text-lg rounded-2xl border-2 border-[#641B2E]/20 text-[#641B2E] bg-white"
                 onClick={() => setLocation("/recipes/custom")}
                 data-testid="button-custom-recipes"
               >
                 <ChefHat className="mr-2" size={20} />
                 Custom Recipe
               </Button>
             </div>
           </div>
        )}

        {isPending && !isLoadingMore && (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
             <div className="w-16 h-16 border-4 border-[#BE5B50] border-t-transparent rounded-full animate-spin" />
             <p className="font-medium text-foreground animate-pulse">Finding recipes for you...</p>
          </div>
        )}

        {generationError && !isPending && (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-6">
            <div className="w-32 h-32 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-4">
              <AlertCircle size={64} />
            </div>
            <h2 className="text-2xl font-bold font-display max-w-[250px]">Something went wrong</h2>
            <p className="text-muted-foreground max-w-xs">
              We couldn't generate recipes at this time. Please try again.
            </p>
            <div className="space-y-3">
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 bg-[#BE5B50] hover:bg-[#a84d43] text-white"
                onClick={handleGetSuggestions}
                data-testid="button-retry"
              >
                <Sparkles className="mr-2" size={20} />
                Try Again
              </Button>
              <Button 
                variant="ghost"
                className="w-full text-[#641B2E]"
                onClick={handleBackToMain}
                data-testid="button-back-to-main"
              >
                <ArrowLeft className="mr-2" size={16} />
                Back to Options
              </Button>
            </div>
          </div>
        )}

        {!generationError && hasGeneratedRecipes && !isPending && recipes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-6">
            <div className="w-32 h-32 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-4">
              <ChefHat size={64} />
            </div>
            <h2 className="text-2xl font-bold font-display max-w-[250px]">No recipes found</h2>
            <p className="text-muted-foreground max-w-xs">
              We couldn't find recipes with your current pantry items. Try adding more ingredients!
            </p>
            <div className="space-y-3">
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 bg-[#BE5B50] hover:bg-[#a84d43] text-white"
                onClick={() => setLocation("/add")}
                data-testid="button-add-more-items"
              >
                <Plus className="mr-2" size={20} />
                Add More Items
              </Button>
              <Button 
                variant="ghost"
                className="w-full text-[#641B2E]"
                onClick={handleBackToMain}
                data-testid="button-back-to-main"
              >
                <ArrowLeft className="mr-2" size={16} />
                Back to Options
              </Button>
            </div>
          </div>
        )}

        {recipes.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={handleBackToMain}
                className="p-2 -ml-2 rounded-full text-[#641B2E] hover:bg-[#641B2E]/10 transition-colors"
                data-testid="button-back-to-options"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#641B2E]">
                  {recipes.length} Recipe{recipes.length !== 1 ? 's' : ''} Found
                </h2>
                {isCustomMode && (
                  <p className="text-xs text-[#BE5B50] font-medium" data-testid="text-custom-mode-indicator">
                    Custom recipe mode
                  </p>
                )}
              </div>
              <Button 
                variant="outline"
                size="sm"
                className="gap-1 bg-white border-[#BE5B50] text-[#BE5B50] hover:bg-[#BE5B50] hover:text-white"
                onClick={handleGetMore}
                disabled={isLoadingMore}
                data-testid="button-find-more"
              >
                {isLoadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Finding...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Find More
                  </>
                )}
              </Button>
            </div>

            {recipes.map((recipe, idx) => (
              <motion.button
                key={`${recipe.title}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="w-full text-left bg-white rounded-2xl overflow-hidden border border-transparent shadow-sm hover:shadow-md transition-all"
                onClick={() => handleRecipeClick(recipe)}
                data-testid={`recipe-card-${idx}`}
              >
                <div className="h-24 bg-gradient-to-br from-[#BE5B50]/10 to-[#FBDB93]/30 relative overflow-hidden">
                  <button
                    onClick={(e) => handleToggleSave(recipe, e)}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                      isRecipeSaved(recipe.title) 
                        ? 'bg-[#BE5B50] text-white' 
                        : 'bg-white/90 text-[#641B2E] hover:bg-white'
                    }`}
                    data-testid={`button-save-recipe-${idx}`}
                  >
                    <Bookmark size={16} className={isRecipeSaved(recipe.title) ? 'fill-current' : ''} />
                  </button>
                  <div className="absolute bottom-3 left-4 flex gap-2">
                    <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold shadow-sm text-[#641B2E]">
                      Uses {recipe.matchCount} pantry items
                    </span>
                    {recipe.recipeType === 'household' && (
                      <span className="bg-[#BE5B50] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1" data-testid="badge-household-recipe">
                        <Home size={12} /> Household
                      </span>
                    )}
                  </div>
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

            {isLoadingMore && (
              <div className="flex items-center justify-center py-8 gap-3">
                <div className="w-8 h-8 border-3 border-[#BE5B50] border-t-transparent rounded-full animate-spin" />
                <span className="text-[#641B2E]/70">Finding more recipes...</span>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
