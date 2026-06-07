import { useState, useEffect, useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import type { Recipe } from "@/hooks/use-recipes";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AddItem from "@/pages/AddItem";
import Recipes from "@/pages/Recipes";
import RecipeDetail from "@/pages/RecipeDetail";
import SavedRecipes from "@/pages/SavedRecipes";
import CustomRecipeSelection from "@/pages/CustomRecipeSelection";
import Stats from "@/pages/Stats";
import Login from "@/pages/Login";

function Router() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [hasGeneratedRecipes, setHasGeneratedRecipes] = useState(false);
  const [customPantryItemIds, setCustomPantryItemIds] = useState<number[] | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [shouldTriggerCustomGeneration, setShouldTriggerCustomGeneration] = useState(false);
  const previousLocation = useRef(location);

  useEffect(() => {
    const isRecipePage = location.startsWith('/recipes') || location.startsWith('/saved-recipes');
    const wasRecipePage = previousLocation.current.startsWith('/recipes') || previousLocation.current.startsWith('/saved-recipes');
    
    if (wasRecipePage && !isRecipePage) {
      setRecipes([]);
      setHasGeneratedRecipes(false);
      setSelectedRecipe(null);
      setCustomPantryItemIds(null);
      setIsCustomMode(false);
    }
    
    previousLocation.current = location;
  }, [location]);

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleBackFromDetail = () => {
    setSelectedRecipe(null);
  };

  const handleClearRecipes = () => {
    setRecipes([]);
    setHasGeneratedRecipes(false);
  };

  const handleClearCustomMode = () => {
    setCustomPantryItemIds(null);
    setIsCustomMode(false);
  };

  const handleRecipesGenerated = (newRecipes: Recipe[], append: boolean = false) => {
    if (append) {
      setRecipes(prev => [...prev, ...newRecipes]);
    } else {
      setRecipes(newRecipes);
    }
    setHasGeneratedRecipes(true);
  };

  const handleGenerateCustomRecipes = (pantryItemIds: number[]) => {
    setCustomPantryItemIds(pantryItemIds);
    setIsCustomMode(true);
    setShouldTriggerCustomGeneration(true);
    setLocation("/recipes");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/add" component={AddItem} />
      <Route path="/recipes">
        <Recipes 
          onSelectRecipe={handleSelectRecipe}
          recipes={recipes}
          hasGeneratedRecipes={hasGeneratedRecipes}
          onRecipesGenerated={handleRecipesGenerated}
          onClearRecipes={handleClearRecipes}
          customPantryItemIds={customPantryItemIds}
          onClearCustomMode={handleClearCustomMode}
          isCustomMode={isCustomMode}
          shouldTriggerGeneration={shouldTriggerCustomGeneration}
          onGenerationTriggered={() => setShouldTriggerCustomGeneration(false)}
        />
      </Route>
      <Route path="/recipes/custom">
        <CustomRecipeSelection onGenerateCustomRecipes={handleGenerateCustomRecipes} />
      </Route>
      <Route path="/recipes/detail">
        <RecipeDetail recipe={selectedRecipe} onBack={handleBackFromDetail} backUrl="/recipes" />
      </Route>
      <Route path="/saved-recipes">
        <SavedRecipes onSelectRecipe={handleSelectRecipe} />
      </Route>
      <Route path="/saved-recipes/detail">
        <RecipeDetail recipe={selectedRecipe} onBack={handleBackFromDetail} backUrl="/saved-recipes" />
      </Route>
      <Route path="/stats" component={Stats} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
