import { useEffect } from "react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/BottomNav";
import { ChevronLeft, Clock, ChefHat, BookOpen, Bookmark } from "lucide-react";
import { motion } from "framer-motion";
import type { Recipe } from "@/hooks/use-recipes";
import { useSaveRecipe, useUnsaveRecipe, useSavedRecipes } from "@/hooks/use-saved-recipes";
import { useToast } from "@/hooks/use-toast";

interface RecipeDetailProps {
  recipe: Recipe | null;
  onBack: () => void;
  backUrl?: string;
}

export default function RecipeDetail({ recipe, onBack, backUrl = "/recipes" }: RecipeDetailProps) {
  const [_, setLocation] = useLocation();
  const { data: savedRecipes } = useSavedRecipes();
  const saveRecipe = useSaveRecipe();
  const unsaveRecipe = useUnsaveRecipe();
  const { toast } = useToast();

  useEffect(() => {
    if (!recipe) {
      setLocation(backUrl);
    }
  }, [recipe, setLocation, backUrl]);

  if (!recipe) {
    return null;
  }

  const isSaved = savedRecipes?.some(r => r.title === recipe.title) ?? false;
  const savedId = savedRecipes?.find(r => r.title === recipe.title)?.id ?? null;

  const handleToggleSave = () => {
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

  const handleBack = () => {
    onBack();
    setLocation(backUrl);
  };

  return (
    <div className="min-h-screen bg-[#FBDB93] pb-24">
      <header className="sticky top-0 z-10 px-4 py-4 flex items-center gap-4 bg-[#FBDB93]/90 backdrop-blur-sm border-b border-[#641B2E]/10">
        <button 
          onClick={handleBack} 
          className="p-2 -ml-2 rounded-full text-[#641B2E]"
          data-testid="button-back-to-recipes"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-display font-bold text-[#641B2E] line-clamp-1 flex-1">
          {recipe.title}
        </h1>
        <button
          onClick={handleToggleSave}
          className={`p-2 rounded-full transition-colors ${
            isSaved 
              ? 'bg-[#BE5B50] text-white' 
              : 'bg-white text-[#641B2E] hover:bg-white/80'
          }`}
          data-testid="button-save-recipe-detail"
        >
          <Bookmark size={20} className={isSaved ? 'fill-current' : ''} />
        </button>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4 text-sm text-[#641B2E]">
            {recipe.prepTime && (
              <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full">
                <Clock size={16} />
                <span>{recipe.prepTime}</span>
              </div>
            )}
            {recipe.difficulty && (
              <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full">
                <ChefHat size={16} />
                <span>{recipe.difficulty}</span>
              </div>
            )}
            <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full">
              <span>Uses {recipe.matchCount} pantry items</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-[#641B2E] flex items-center gap-2">
              Ingredients
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, idx) => (
                <li 
                  key={idx} 
                  className="flex items-start gap-3 text-[#641B2E]"
                  data-testid={`ingredient-${idx}`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#BE5B50] mt-2 flex-shrink-0" />
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-[#641B2E]">
              Instructions
            </h2>
            <ol className="space-y-4">
              {(Array.isArray(recipe.instructions) ? recipe.instructions : [recipe.instructions]).map((step, idx) => (
                <li 
                  key={idx} 
                  className="flex items-start gap-3 text-[#641B2E]"
                  data-testid={`step-${idx}`}
                >
                  <span className="w-6 h-6 rounded-full bg-[#BE5B50] text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {recipe.sourceName && (
            <div className="bg-white/70 rounded-2xl px-4 py-3 flex items-center gap-3">
              <BookOpen size={18} className="text-[#641B2E]/60" />
              <span className="text-sm text-[#641B2E]/80">
                Recipe sourced from <span className="font-semibold">{recipe.sourceName}</span>
              </span>
            </div>
          )}

        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
