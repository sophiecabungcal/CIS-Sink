import { useMutation } from "@tanstack/react-query";
import { api, RecipeSuggestionResponse } from "@shared/routes";

export type Recipe = RecipeSuggestionResponse[number];

export function useRecipeSuggestions() {
  return useMutation({
    mutationFn: async (params?: { count?: number; excludeTitles?: string[]; pantryItemIds?: number[]; includeHousehold?: boolean }) => {
      const res = await fetch(api.recipes.suggest.path, {
        method: api.recipes.suggest.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params || {}),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to get recipe suggestions");
      return api.recipes.suggest.responses[200].parse(await res.json());
    },
  });
}
