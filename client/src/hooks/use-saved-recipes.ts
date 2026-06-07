import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SavedRecipe } from "@shared/schema";
import type { SaveRecipeInput } from "@shared/routes";

export function useSavedRecipes() {
  return useQuery<SavedRecipe[]>({
    queryKey: ["/api/saved-recipes"],
  });
}

export function useCheckSavedRecipe(title: string) {
  return useQuery<{ saved: boolean; id: number | null }>({
    queryKey: ["/api/saved-recipes/check", title],
    queryFn: async () => {
      const res = await fetch(`/api/saved-recipes/check?title=${encodeURIComponent(title)}`);
      if (!res.ok) throw new Error("Failed to check saved recipe");
      return res.json();
    },
    enabled: !!title,
  });
}

export function useSaveRecipe() {
  return useMutation({
    mutationFn: async (recipe: SaveRecipeInput) => {
      return apiRequest("POST", "/api/saved-recipes", recipe);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-recipes/check"] });
    },
  });
}

export function useUnsaveRecipe() {
  return useMutation({
    mutationFn: async (recipeId: number) => {
      return apiRequest("DELETE", `/api/saved-recipes/${recipeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-recipes/check"] });
    },
  });
}
