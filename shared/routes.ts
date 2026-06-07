import { z } from 'zod';
import { insertPantryItemSchema, insertSavedRecipeSchema, pantryItems, items, savedRecipes } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  items: {
    list: {
      method: 'GET' as const,
      path: '/api/items',
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof items.$inferSelect>()),
      },
    },
  },
  pantry: {
    list: {
      method: 'GET' as const,
      path: '/api/pantry',
      input: z.object({
        status: z.enum(['active', 'consumed', 'disposed']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof pantryItems.$inferSelect & { item: typeof items.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/pantry/:id',
      responses: {
        200: z.custom<typeof pantryItems.$inferSelect & { item: typeof items.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/pantry',
      input: insertPantryItemSchema,
      responses: {
        201: z.custom<typeof pantryItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/pantry/:id',
      input: insertPantryItemSchema.partial(),
      responses: {
        200: z.custom<typeof pantryItems.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/pantry/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  recipes: {
    suggest: {
      method: 'POST' as const,
      path: '/api/recipes/suggest',
      input: z.object({
        count: z.number().optional(), // Number of recipes to generate (default 10, or 5 for "more")
        excludeTitles: z.array(z.string()).optional(), // Titles to exclude when generating more
        pantryItemIds: z.array(z.number()).optional(), // Specific pantry item IDs for custom recipe mode
        includeHousehold: z.boolean().optional(), // Include household/cleaning recipes in suggestions
      }),
      responses: {
        200: z.array(z.object({
          title: z.string(),
          ingredients: z.array(z.string()),
          instructions: z.union([z.array(z.string()), z.string()]), // Can be array or string
          matchCount: z.number(),
          prepTime: z.string().optional().nullable(),
          difficulty: z.string().optional().nullable(),
          sourceUrl: z.string().optional().nullable(), // URL to original recipe if from external source
          sourceName: z.string().optional().nullable(), // Name of the source (e.g., "AllRecipes", "Food Network")
          recipeType: z.enum(['food', 'household']).optional().nullable(), // Type of recipe (food or household/cleaning)
        })),
      },
    },
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.object({
          allTime: z.object({
            consumed: z.number(),
            disposed: z.number(),
            active: z.number(),
            total: z.number(),
            consumedPercent: z.number(),
            disposedPercent: z.number(),
          }),
          lastWeek: z.object({
            added: z.number(),
            consumed: z.number(),
            disposed: z.number(),
          }),
          lastMonth: z.object({
            added: z.number(),
            consumed: z.number(),
            disposed: z.number(),
          }),
          last3Months: z.object({
            added: z.number(),
            consumed: z.number(),
            disposed: z.number(),
          }),
        }),
      },
    },
  },
  savedRecipes: {
    list: {
      method: 'GET' as const,
      path: '/api/saved-recipes',
      responses: {
        200: z.array(z.custom<typeof savedRecipes.$inferSelect>()),
      },
    },
    save: {
      method: 'POST' as const,
      path: '/api/saved-recipes',
      input: z.object({
        title: z.string(),
        ingredients: z.array(z.string()),
        instructions: z.string(),
        prepTime: z.string().nullable().optional(),
        difficulty: z.string().nullable().optional(),
        sourceName: z.string().nullable().optional(),
        matchCount: z.number(),
      }),
      responses: {
        201: z.custom<typeof savedRecipes.$inferSelect>(),
        409: errorSchemas.validation, // Already saved
      },
    },
    unsave: {
      method: 'DELETE' as const,
      path: '/api/saved-recipes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    check: {
      method: 'GET' as const,
      path: '/api/saved-recipes/check',
      input: z.object({
        title: z.string(),
      }),
      responses: {
        200: z.object({
          saved: z.boolean(),
          id: z.number().nullable(),
        }),
      },
    },
  },
};

// ============================================
// HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type ItemListResponse = z.infer<typeof api.items.list.responses[200]>;
export type PantryListResponse = z.infer<typeof api.pantry.list.responses[200]>;
export type CreatePantryItemInput = z.infer<typeof api.pantry.create.input>;
export type UpdatePantryItemInput = z.infer<typeof api.pantry.update.input>;
export type RecipeSuggestionResponse = z.infer<typeof api.recipes.suggest.responses[200]>;
export type StatsResponse = z.infer<typeof api.stats.get.responses[200]>;
export type SavedRecipesListResponse = z.infer<typeof api.savedRecipes.list.responses[200]>;
export type SaveRecipeInput = z.infer<typeof api.savedRecipes.save.input>;
