import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Seed Items
  await storage.seedItems();

  // === API ROUTES ===

  // Middleware to ensure user is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Items (Reference)
  app.get(api.items.list.path, requireAuth, async (req, res) => {
    const { search, category } = req.query as { search?: string, category?: string };
    const items = await storage.getItems(search, category);
    res.json(items);
  });

  // Pantry
  app.get(api.pantry.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const { status } = req.query as { status?: string };
    const items = await storage.getPantryItems(userId, status);
    res.json(items);
  });

  app.get(api.pantry.get.path, requireAuth, async (req, res) => {
    const item = await storage.getPantryItem(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    // Check ownership
    const userId = (req.user as any).claims.sub;
    if (item.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
    }
    res.json(item);
  });

  app.post(api.pantry.create.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const input = api.pantry.create.input.parse(req.body);
      const item = await storage.createPantryItem(userId, input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.pantry.update.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const item = await storage.getPantryItem(id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
       // Check ownership
      const userId = (req.user as any).claims.sub;
      if (item.userId !== userId) {
          return res.status(403).json({ message: "Forbidden" });
      }

      const input = api.pantry.update.input.parse(req.body);
      const updated = await storage.updatePantryItem(id, input);
      res.json(updated);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.pantry.delete.path, requireAuth, async (req, res) => {
      const id = Number(req.params.id);
      const item = await storage.getPantryItem(id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
       // Check ownership
      const userId = (req.user as any).claims.sub;
      if (item.userId !== userId) {
          return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deletePantryItem(id);
      res.status(204).send();
  });

  // Recipes
  app.post(api.recipes.suggest.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const allPantryItems = await storage.getPantryItems(userId, 'active');
    
    if (allPantryItems.length === 0) {
      return res.json([]);
    }

    const { count = 10, excludeTitles = [], pantryItemIds, includeHousehold = false } = req.body || {};
    
    // If specific pantry item IDs are provided (custom recipe mode), filter to those items
    const pantryItems = pantryItemIds && pantryItemIds.length > 0
      ? allPantryItems.filter(p => pantryItemIds.includes(p.id))
      : allPantryItems;
    
    if (pantryItems.length === 0) {
      return res.json([]);
    }
    
    // Separate food and household items
    const foodItems = pantryItems.filter(p => p.item.itemType === 'food');
    const householdItems = pantryItems.filter(p => p.item.itemType === 'household');
    
    const foodIngredients = foodItems.map(p => p.item.name).join(", ");
    const householdIngredients = householdItems.map(p => p.item.name).join(", ");
    const allIngredients = pantryItems.map(p => p.item.name).join(", ");
    
    const isCustomMode = pantryItemIds && pantryItemIds.length > 0;
    
    const excludeClause = excludeTitles.length > 0 
      ? `Do NOT suggest these recipes as they were already suggested: ${excludeTitles.join(", ")}.` 
      : "";

    try {
      const customModeInstructions = isCustomMode 
        ? `The user has SPECIFICALLY selected these ingredients. Each recipe MUST use ALL or MOST of these specific ingredients as the main components. These are the primary ingredients the user wants to use up.`
        : `Each recipe should use SOME of the user's pantry ingredients, but NOT ALL of them need to be used together.`;

      // Build household recipe instructions if toggle is on
      const householdInstructions = includeHousehold && householdItems.length > 0
        ? `
HOUSEHOLD/CLEANING RECIPES:
The user has household items like: ${householdIngredients}
Include some DIY household recipes such as:
- Natural cleaning solutions (all-purpose cleaners, glass cleaners, bathroom cleaners)
- Laundry solutions (stain removers, fabric softeners)
- Air fresheners
- Pest repellents
- Deodorizers
For household recipes, set recipeType to "household".`
        : '';

      const recipeTypesInstruction = includeHousehold 
        ? `Generate a mix of food recipes${householdItems.length > 0 ? ' and household/cleaning recipes' : ''}. For food recipes, set recipeType to "food". For household/cleaning recipes, set recipeType to "household".`
        : 'Generate only food recipes. Set recipeType to "food" for all recipes.';

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that suggests recipes. Generate ${count} diverse suggestions.
            
IMPORTANT: 
- ${customModeInstructions}
- Recipes can include additional common ingredients the user might not have listed
- For food recipes: Provide a variety of meal types (breakfast, lunch, dinner, snacks, desserts)
- Include well-known recipes from popular sources when appropriate
${householdInstructions}

${recipeTypesInstruction}

Return a JSON object with a "recipes" array containing objects with these fields:
- title: string (recipe name)
- ingredients: string[] (full ingredient list with quantities)
- instructions: string[] (array of step-by-step instructions)
- matchCount: number (how many of the user's pantry items are used)
- prepTime: string (e.g., "30 mins", "1 hour", "5 mins")
- difficulty: string ("Easy", "Medium", or "Hard")
- sourceName: string | null (if inspired by a well-known source, provide the name, or null if original)
- recipeType: string ("food" or "household")

${excludeClause}`
          },
          {
            role: "user",
            content: `I have these items: ${allIngredients}. Please suggest ${count} recipes I could make using some of these items.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const suggestions = JSON.parse(content || "{\"recipes\": []}");
      const recipes = suggestions.recipes || suggestions; 
      
      res.json(recipes);
    } catch (error) {
      console.error("OpenAI Error:", error);
      res.status(500).json({ message: "Failed to generate recipes" });
    }
  });

  // Stats
  app.get(api.stats.get.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const stats = await storage.getComprehensiveStats(userId);
    
    // Calculate percentages for all-time stats (based on resolved items only)
    const resolvedTotal = stats.allTime.consumed + stats.allTime.disposed;
    const consumedPercent = resolvedTotal > 0 ? Math.round((stats.allTime.consumed / resolvedTotal) * 100) : 0;
    const disposedPercent = resolvedTotal > 0 ? Math.round((stats.allTime.disposed / resolvedTotal) * 100) : 0;
    
    res.json({
      allTime: {
        ...stats.allTime,
        consumedPercent,
        disposedPercent,
      },
      lastWeek: stats.lastWeek,
      lastMonth: stats.lastMonth,
      last3Months: stats.last3Months,
    });
  });

  // Saved Recipes
  app.get(api.savedRecipes.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const savedRecipes = await storage.getSavedRecipes(userId);
    res.json(savedRecipes);
  });

  app.get(api.savedRecipes.check.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const { title } = req.query as { title: string };
    if (!title) {
      return res.json({ saved: false, id: null });
    }
    const recipe = await storage.getSavedRecipe(userId, title);
    res.json({ saved: !!recipe, id: recipe?.id ?? null });
  });

  app.post(api.savedRecipes.save.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const input = api.savedRecipes.save.input.parse(req.body);
      
      // Check if already saved
      const existing = await storage.getSavedRecipe(userId, input.title);
      if (existing) {
        return res.status(409).json({ message: "Recipe already saved" });
      }

      const saved = await storage.saveRecipe({
        userId,
        title: input.title,
        ingredients: input.ingredients,
        instructions: input.instructions,
        prepTime: input.prepTime ?? null,
        difficulty: input.difficulty ?? null,
        sourceName: input.sourceName ?? null,
        matchCount: input.matchCount,
      });
      res.status(201).json(saved);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.savedRecipes.unsave.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const id = Number(req.params.id);
    await storage.unsaveRecipe(userId, id);
    res.status(204).send();
  });

  return httpServer;
}
