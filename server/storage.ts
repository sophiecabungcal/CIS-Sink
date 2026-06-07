import {
  items,
  pantryItems,
  savedRecipes,
  type Item,
  type PantryItem,
  type InsertPantryItem,
  type CreatePantryItemRequest,
  type UpdatePantryItemRequest,
  type PantryItemResponse,
  type SavedRecipe,
  type InsertSavedRecipe,
  users,
  type User,
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, desc, asc, gte, sql } from "drizzle-orm";

export interface IStorage {
  // Items (Reference)
  getItems(search?: string, category?: string): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  seedItems(): Promise<void>;

  // Pantry
  getPantryItems(userId: string, status?: string): Promise<PantryItemResponse[]>;
  getPantryItem(id: number): Promise<PantryItemResponse | undefined>;
  createPantryItem(userId: string, item: CreatePantryItemRequest): Promise<PantryItem>;
  updatePantryItem(id: number, updates: UpdatePantryItemRequest): Promise<PantryItem>;
  deletePantryItem(id: number): Promise<void>;
  
  // Stats
  getPantryStats(userId: string): Promise<{ consumed: number; disposed: number; total: number }>;
  getComprehensiveStats(userId: string): Promise<{
    allTime: { consumed: number; disposed: number; active: number; total: number };
    lastWeek: { added: number; consumed: number; disposed: number };
    lastMonth: { added: number; consumed: number; disposed: number };
    last3Months: { added: number; consumed: number; disposed: number };
  }>;

  // Saved Recipes
  getSavedRecipes(userId: string): Promise<SavedRecipe[]>;
  getSavedRecipe(userId: string, title: string): Promise<SavedRecipe | undefined>;
  saveRecipe(recipe: InsertSavedRecipe): Promise<SavedRecipe>;
  unsaveRecipe(userId: string, recipeId: number): Promise<void>;

  // User (for association if needed, though Auth storage handles auth)
  getUser(id: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getItems(search?: string, category?: string): Promise<Item[]> {
    let query = db.select().from(items);
    
    if (search) {
      query = query.where(ilike(items.name, `%${search}%`));
    }
    
    if (category) {
      // If we had a where clause before, we'd need to use 'and', but simple logic for now
      // This is a simplified version. Correct Drizzle chaining:
      // We need to construct conditions array
    }
    
    // Simple fetch for now, can filter in memory or refine query if needed
    // But let's do it right
    const conditions = [];
    if (search) conditions.push(ilike(items.name, `%${search}%`));
    if (category) conditions.push(eq(items.category, category));
    
    if (conditions.length > 0) {
      return await db.select().from(items).where(and(...conditions));
    }
    
    return await db.select().from(items);
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async seedItems(): Promise<void> {
    const seedData = [
      // Fruits
      { name: "Apple", category: "Fruit", itemType: "food", defaultShelfLife: 7 },
      { name: "Banana", category: "Fruit", itemType: "food", defaultShelfLife: 5 },
      { name: "Orange", category: "Fruit", itemType: "food", defaultShelfLife: 14 },
      { name: "Lemon", category: "Fruit", itemType: "food", defaultShelfLife: 21 },
      { name: "Lime", category: "Fruit", itemType: "food", defaultShelfLife: 21 },
      { name: "Strawberry", category: "Fruit", itemType: "food", defaultShelfLife: 5 },
      { name: "Blueberry", category: "Fruit", itemType: "food", defaultShelfLife: 7 },
      { name: "Grapes", category: "Fruit", itemType: "food", defaultShelfLife: 7 },
      { name: "Avocado", category: "Fruit", itemType: "food", defaultShelfLife: 5 },
      { name: "Mango", category: "Fruit", itemType: "food", defaultShelfLife: 5 },
      { name: "Pineapple", category: "Fruit", itemType: "food", defaultShelfLife: 5 },
      { name: "Watermelon", category: "Fruit", itemType: "food", defaultShelfLife: 7 },
      { name: "Peach", category: "Fruit", itemType: "food", defaultShelfLife: 5 },
      { name: "Pear", category: "Fruit", itemType: "food", defaultShelfLife: 7 },
      { name: "Cherries", category: "Fruit", itemType: "food", defaultShelfLife: 5 },
      { name: "Raspberries", category: "Fruit", itemType: "food", defaultShelfLife: 3 },
      { name: "Kiwi", category: "Fruit", itemType: "food", defaultShelfLife: 14 },
      { name: "Grapefruit", category: "Fruit", itemType: "food", defaultShelfLife: 14 },
      { name: "Coconut", category: "Fruit", itemType: "food", defaultShelfLife: 30 },
      { name: "Plum", category: "Fruit", itemType: "food", defaultShelfLife: 5 },
      { name: "Cantaloupe", category: "Fruit", itemType: "food", defaultShelfLife: 7 },
      { name: "Honeydew", category: "Fruit", itemType: "food", defaultShelfLife: 7 },
      { name: "Blackberries", category: "Fruit", itemType: "food", defaultShelfLife: 3 },
      { name: "Cranberries", category: "Fruit", itemType: "food", defaultShelfLife: 14 },
      // Dairy
      { name: "Milk", category: "Dairy", itemType: "food", defaultShelfLife: 7 },
      { name: "Eggs", category: "Dairy", itemType: "food", defaultShelfLife: 21 },
      { name: "Cheese", category: "Dairy", itemType: "food", defaultShelfLife: 14 },
      { name: "Yogurt", category: "Dairy", itemType: "food", defaultShelfLife: 10 },
      { name: "Butter", category: "Dairy", itemType: "food", defaultShelfLife: 30 },
      { name: "Cream", category: "Dairy", itemType: "food", defaultShelfLife: 7 },
      { name: "Cottage Cheese", category: "Dairy", itemType: "food", defaultShelfLife: 14 },
      { name: "Sour Cream", category: "Dairy", itemType: "food", defaultShelfLife: 14 },
      { name: "Heavy Cream", category: "Dairy", itemType: "food", defaultShelfLife: 10 },
      { name: "Cream Cheese", category: "Dairy", itemType: "food", defaultShelfLife: 21 },
      { name: "Parmesan", category: "Dairy", itemType: "food", defaultShelfLife: 60 },
      { name: "Mozzarella", category: "Dairy", itemType: "food", defaultShelfLife: 14 },
      { name: "Cheddar", category: "Dairy", itemType: "food", defaultShelfLife: 30 },
      { name: "Ricotta", category: "Dairy", itemType: "food", defaultShelfLife: 14 },
      { name: "Feta", category: "Dairy", itemType: "food", defaultShelfLife: 30 },
      { name: "Almond Milk", category: "Dairy", itemType: "food", defaultShelfLife: 7 },
      { name: "Oat Milk", category: "Dairy", itemType: "food", defaultShelfLife: 7 },
      // Vegetables
      { name: "Carrot", category: "Vegetable", itemType: "food", defaultShelfLife: 14 },
      { name: "Spinach", category: "Vegetable", itemType: "food", defaultShelfLife: 5 },
      { name: "Onion", category: "Vegetable", itemType: "food", defaultShelfLife: 30 },
      { name: "Garlic", category: "Vegetable", itemType: "food", defaultShelfLife: 90 },
      { name: "Tomato", category: "Vegetable", itemType: "food", defaultShelfLife: 7 },
      { name: "Potato", category: "Vegetable", itemType: "food", defaultShelfLife: 30 },
      { name: "Bell Pepper", category: "Vegetable", itemType: "food", defaultShelfLife: 7 },
      { name: "Cucumber", category: "Vegetable", itemType: "food", defaultShelfLife: 7 },
      { name: "Lettuce", category: "Vegetable", itemType: "food", defaultShelfLife: 5 },
      { name: "Celery", category: "Vegetable", itemType: "food", defaultShelfLife: 14 },
      { name: "Broccoli", category: "Vegetable", itemType: "food", defaultShelfLife: 7 },
      { name: "Asparagus", category: "Vegetable", itemType: "food", defaultShelfLife: 5 },
      { name: "Cauliflower", category: "Vegetable", itemType: "food", defaultShelfLife: 7 },
      { name: "Zucchini", category: "Vegetable", itemType: "food", defaultShelfLife: 7 },
      { name: "Eggplant", category: "Vegetable", itemType: "food", defaultShelfLife: 7 },
      { name: "Green Beans", category: "Vegetable", itemType: "food", defaultShelfLife: 7 },
      { name: "Mushrooms", category: "Vegetable", itemType: "food", defaultShelfLife: 7 },
      { name: "Corn", category: "Vegetable", itemType: "food", defaultShelfLife: 5 },
      { name: "Cabbage", category: "Vegetable", itemType: "food", defaultShelfLife: 14 },
      { name: "Kale", category: "Vegetable", itemType: "food", defaultShelfLife: 7 },
      { name: "Brussels Sprouts", category: "Vegetable", itemType: "food", defaultShelfLife: 7 },
      { name: "Sweet Potato", category: "Vegetable", itemType: "food", defaultShelfLife: 30 },
      { name: "Beets", category: "Vegetable", itemType: "food", defaultShelfLife: 14 },
      { name: "Radishes", category: "Vegetable", itemType: "food", defaultShelfLife: 14 },
      { name: "Artichoke", category: "Vegetable", itemType: "food", defaultShelfLife: 7 },
      { name: "Leek", category: "Vegetable", itemType: "food", defaultShelfLife: 14 },
      { name: "Ginger", category: "Vegetable", itemType: "food", defaultShelfLife: 30 },
      { name: "Jalapeño", category: "Vegetable", itemType: "food", defaultShelfLife: 14 },
      { name: "Squash", category: "Vegetable", itemType: "food", defaultShelfLife: 14 },
      { name: "Pumpkin", category: "Vegetable", itemType: "food", defaultShelfLife: 90 },
      { name: "Turnip", category: "Vegetable", itemType: "food", defaultShelfLife: 14 },
      // Meat
      { name: "Chicken Breast", category: "Meat", itemType: "food", defaultShelfLife: 2 },
      { name: "Ground Beef", category: "Meat", itemType: "food", defaultShelfLife: 2 },
      { name: "Bacon", category: "Meat", itemType: "food", defaultShelfLife: 7 },
      { name: "Salmon", category: "Meat", itemType: "food", defaultShelfLife: 2 },
      { name: "Pork Chops", category: "Meat", itemType: "food", defaultShelfLife: 3 },
      { name: "Turkey", category: "Meat", itemType: "food", defaultShelfLife: 2 },
      { name: "Ham", category: "Meat", itemType: "food", defaultShelfLife: 5 },
      { name: "Sausage", category: "Meat", itemType: "food", defaultShelfLife: 5 },
      { name: "Shrimp", category: "Meat", itemType: "food", defaultShelfLife: 2 },
      { name: "Tuna", category: "Meat", itemType: "food", defaultShelfLife: 2 },
      { name: "Cod", category: "Meat", itemType: "food", defaultShelfLife: 2 },
      { name: "Lamb", category: "Meat", itemType: "food", defaultShelfLife: 3 },
      { name: "Duck", category: "Meat", itemType: "food", defaultShelfLife: 2 },
      { name: "Crab", category: "Meat", itemType: "food", defaultShelfLife: 2 },
      { name: "Lobster", category: "Meat", itemType: "food", defaultShelfLife: 1 },
      { name: "Tilapia", category: "Meat", itemType: "food", defaultShelfLife: 2 },
      { name: "Mussels", category: "Meat", itemType: "food", defaultShelfLife: 2 },
      // Grains
      { name: "Rice", category: "Grain", itemType: "food", defaultShelfLife: 365 },
      { name: "Pasta", category: "Grain", itemType: "food", defaultShelfLife: 365 },
      { name: "Bread", category: "Grain", itemType: "food", defaultShelfLife: 5 },
      { name: "Oats", category: "Grain", itemType: "food", defaultShelfLife: 180 },
      { name: "Flour", category: "Grain", itemType: "food", defaultShelfLife: 180 },
      { name: "Quinoa", category: "Grain", itemType: "food", defaultShelfLife: 365 },
      { name: "Couscous", category: "Grain", itemType: "food", defaultShelfLife: 365 },
      { name: "Barley", category: "Grain", itemType: "food", defaultShelfLife: 365 },
      { name: "Brown Rice", category: "Grain", itemType: "food", defaultShelfLife: 180 },
      { name: "Cornmeal", category: "Grain", itemType: "food", defaultShelfLife: 365 },
      { name: "Whole Wheat Flour", category: "Grain", itemType: "food", defaultShelfLife: 90 },
      { name: "Almond Flour", category: "Grain", itemType: "food", defaultShelfLife: 90 },
      { name: "Breadcrumbs", category: "Grain", itemType: "food", defaultShelfLife: 180 },
      { name: "Tortillas", category: "Grain", itemType: "food", defaultShelfLife: 14 },
      { name: "Pita Bread", category: "Grain", itemType: "food", defaultShelfLife: 7 },
      { name: "Bagels", category: "Grain", itemType: "food", defaultShelfLife: 5 },
      { name: "Crackers", category: "Grain", itemType: "food", defaultShelfLife: 180 },
      { name: "Cereal", category: "Grain", itemType: "food", defaultShelfLife: 180 },
      { name: "Granola", category: "Grain", itemType: "food", defaultShelfLife: 180 },
      // Pantry
      { name: "Tomato Sauce", category: "Pantry", itemType: "food", defaultShelfLife: 180 },
      { name: "Olive Oil", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Honey", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Salt", category: "Pantry", itemType: "food", defaultShelfLife: 1825 },
      { name: "Pepper", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Sugar", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Soy Sauce", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Baking Powder", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Vanilla Extract", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Cinnamon", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Paprika", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Cumin", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Oregano", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Basil (Dried)", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Thyme", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Rosemary", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Cayenne Pepper", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Garlic Powder", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Onion Powder", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Chili Powder", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Nutmeg", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Turmeric", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Curry Powder", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Italian Seasoning", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Bay Leaves", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Mustard", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Ketchup", category: "Pantry", itemType: "food", defaultShelfLife: 180 },
      { name: "Mayonnaise", category: "Pantry", itemType: "food", defaultShelfLife: 60 },
      { name: "Hot Sauce", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Worcestershire Sauce", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Maple Syrup", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Peanut Butter", category: "Pantry", itemType: "food", defaultShelfLife: 180 },
      { name: "Jam", category: "Pantry", itemType: "food", defaultShelfLife: 180 },
      { name: "Vegetable Oil", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Coconut Milk", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Chicken Broth", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Beef Broth", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Vegetable Broth", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Canned Tomatoes", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Canned Beans", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Canned Corn", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Canned Tuna", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Salsa", category: "Pantry", itemType: "food", defaultShelfLife: 180 },
      { name: "Vinegar (Apple Cider)", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Vinegar (Balsamic)", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Lentils", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Chickpeas", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Black Beans", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Chocolate Chips", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Cocoa Powder", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Brown Sugar", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Powdered Sugar", category: "Pantry", itemType: "food", defaultShelfLife: 730 },
      { name: "Yeast", category: "Pantry", itemType: "food", defaultShelfLife: 120 },
      { name: "Gelatin", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Almonds", category: "Pantry", itemType: "food", defaultShelfLife: 180 },
      { name: "Walnuts", category: "Pantry", itemType: "food", defaultShelfLife: 180 },
      { name: "Cashews", category: "Pantry", itemType: "food", defaultShelfLife: 180 },
      { name: "Pecans", category: "Pantry", itemType: "food", defaultShelfLife: 180 },
      { name: "Peanuts", category: "Pantry", itemType: "food", defaultShelfLife: 180 },
      { name: "Sunflower Seeds", category: "Pantry", itemType: "food", defaultShelfLife: 180 },
      { name: "Chia Seeds", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Flax Seeds", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      { name: "Pumpkin Seeds", category: "Pantry", itemType: "food", defaultShelfLife: 180 },
      { name: "Pine Nuts", category: "Pantry", itemType: "food", defaultShelfLife: 90 },
      { name: "Sesame Seeds", category: "Pantry", itemType: "food", defaultShelfLife: 365 },
      // Household / Cleaning items (can be used for DIY cleaning recipes)
      { name: "White Vinegar", category: "Cleaning", itemType: "household", defaultShelfLife: 1825 },
      { name: "Baking Soda", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Dish Soap", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Rubbing Alcohol", category: "Cleaning", itemType: "household", defaultShelfLife: 1095 },
      { name: "Hydrogen Peroxide", category: "Cleaning", itemType: "household", defaultShelfLife: 365 },
      { name: "Castile Soap", category: "Cleaning", itemType: "household", defaultShelfLife: 1095 },
      { name: "Essential Oil (Lavender)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Essential Oil (Tea Tree)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Essential Oil (Lemon)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Essential Oil (Peppermint)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Cornstarch", category: "Household", itemType: "household", defaultShelfLife: 365 },
      { name: "Borax", category: "Cleaning", itemType: "household", defaultShelfLife: 1825 },
      { name: "Washing Soda", category: "Cleaning", itemType: "household", defaultShelfLife: 1825 },
      { name: "Coconut Oil", category: "Household", itemType: "household", defaultShelfLife: 730 },
      { name: "Essential Oil (Eucalyptus)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Essential Oil (Orange)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Essential Oil (Rosemary)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Essential Oil (Clove)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Essential Oil (Cinnamon)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Essential Oil (Frankincense)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Essential Oil (Cedarwood)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Essential Oil (Bergamot)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Essential Oil (Geranium)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Essential Oil (Ylang Ylang)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Citric Acid", category: "Cleaning", itemType: "household", defaultShelfLife: 1095 },
      { name: "Epsom Salt", category: "Cleaning", itemType: "household", defaultShelfLife: 1825 },
      { name: "Sea Salt", category: "Cleaning", itemType: "household", defaultShelfLife: 1825 },
      { name: "Witch Hazel", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Aloe Vera Gel", category: "Cleaning", itemType: "household", defaultShelfLife: 365 },
      { name: "Glycerin", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Beeswax", category: "Household", itemType: "household", defaultShelfLife: 1825 },
      { name: "Shea Butter", category: "Household", itemType: "household", defaultShelfLife: 730 },
      { name: "Jojoba Oil", category: "Household", itemType: "household", defaultShelfLife: 730 },
      { name: "Sweet Almond Oil", category: "Household", itemType: "household", defaultShelfLife: 365 },
      { name: "Vitamin E Oil", category: "Household", itemType: "household", defaultShelfLife: 730 },
      { name: "Arrowroot Powder", category: "Household", itemType: "household", defaultShelfLife: 730 },
      { name: "Bentonite Clay", category: "Household", itemType: "household", defaultShelfLife: 1825 },
      { name: "Activated Charcoal", category: "Household", itemType: "household", defaultShelfLife: 1825 },
      { name: "Diatomaceous Earth", category: "Household", itemType: "household", defaultShelfLife: 1825 },
      { name: "Lemon Juice", category: "Household", itemType: "household", defaultShelfLife: 7 },
      { name: "Cream of Tartar", category: "Household", itemType: "household", defaultShelfLife: 730 },
      { name: "Oxygen Bleach", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Ammonia", category: "Cleaning", itemType: "household", defaultShelfLife: 1095 },
      { name: "Murphy Oil Soap", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Liquid Soap (Unscented)", category: "Cleaning", itemType: "household", defaultShelfLife: 730 },
      { name: "Spray Bottles", category: "Household", itemType: "household", defaultShelfLife: 3650 },
      { name: "Microfiber Cloths", category: "Household", itemType: "household", defaultShelfLife: 1825 },
      { name: "Steel Wool", category: "Household", itemType: "household", defaultShelfLife: 1825 },
      { name: "Pumice Stone", category: "Household", itemType: "household", defaultShelfLife: 1825 },
    ];

    // Get existing items to check for duplicates
    const existingItems = await db.select().from(items);
    const existingNames = new Set(existingItems.map(i => i.name.toLowerCase()));
    
    // Filter to only new items that don't exist yet
    const newItems = seedData.filter(item => !existingNames.has(item.name.toLowerCase()));
    
    if (newItems.length > 0) {
      await db.insert(items).values(newItems);
      console.log(`Seeded ${newItems.length} new items`);
    }
  }

  async getPantryItems(userId: string, status?: string): Promise<PantryItemResponse[]> {
    const conditions = [eq(pantryItems.userId, userId)];
    if (status) {
      conditions.push(eq(pantryItems.status, status));
    } else {
      // Default to active if not specified? 
      // The route schema says status is optional, if not provided maybe return all or active?
      // Let's return all if not specified, but usually users want active.
      // Let's assume the frontend will filter or request specific status.
      // But typically "My Pantry" means active items.
      // Let's not filter if status is undefined, unless we want to default to 'active'.
      // I'll leave it as: return all if no status param.
    }

    const rows = await db.select({
      pantryItem: pantryItems,
      item: items,
    })
    .from(pantryItems)
    .innerJoin(items, eq(pantryItems.itemId, items.id))
    .where(and(...conditions))
    .orderBy(desc(pantryItems.purchaseDate));

    return rows.map(r => ({ ...r.pantryItem, item: r.item }));
  }

  async getPantryItem(id: number): Promise<PantryItemResponse | undefined> {
    const rows = await db.select({
      pantryItem: pantryItems,
      item: items,
    })
    .from(pantryItems)
    .innerJoin(items, eq(pantryItems.itemId, items.id))
    .where(eq(pantryItems.id, id));

    if (rows.length === 0) return undefined;
    return { ...rows[0].pantryItem, item: rows[0].item };
  }

  async createPantryItem(userId: string, item: CreatePantryItemRequest): Promise<PantryItem> {
    const [newItem] = await db.insert(pantryItems).values({ ...item, userId }).returning();
    return newItem;
  }

  async updatePantryItem(id: number, updates: UpdatePantryItemRequest): Promise<PantryItem> {
    const [updated] = await db.update(pantryItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pantryItems.id, id))
      .returning();
    return updated;
  }

  async deletePantryItem(id: number): Promise<void> {
    await db.delete(pantryItems).where(eq(pantryItems.id, id));
  }

  async getPantryStats(userId: string): Promise<{ consumed: number; disposed: number; total: number }> {
    const allItems = await db.select().from(pantryItems).where(eq(pantryItems.userId, userId));
    const consumed = allItems.filter(i => i.status === 'consumed').length;
    const disposed = allItems.filter(i => i.status === 'disposed').length;
    const total = allItems.length;
    return { consumed, disposed, total };
  }

  async getComprehensiveStats(userId: string): Promise<{
    allTime: { consumed: number; disposed: number; active: number; total: number };
    lastWeek: { added: number; consumed: number; disposed: number };
    lastMonth: { added: number; consumed: number; disposed: number };
    last3Months: { added: number; consumed: number; disposed: number };
  }> {
    const allItems = await db.select().from(pantryItems).where(eq(pantryItems.userId, userId));
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const allTime = {
      consumed: allItems.filter(i => i.status === 'consumed').length,
      disposed: allItems.filter(i => i.status === 'disposed').length,
      active: allItems.filter(i => i.status === 'active').length,
      total: allItems.length,
    };

    const getStatsForPeriod = (sinceDate: Date) => {
      const itemsInPeriod = allItems.filter(item => {
        const createdAt = item.createdAt ? new Date(item.createdAt) : null;
        const updatedAt = item.updatedAt ? new Date(item.updatedAt) : null;
        return createdAt && createdAt >= sinceDate;
      });
      
      const consumedInPeriod = allItems.filter(item => {
        const updatedAt = item.updatedAt ? new Date(item.updatedAt) : null;
        return item.status === 'consumed' && updatedAt && updatedAt >= sinceDate;
      });
      
      const disposedInPeriod = allItems.filter(item => {
        const updatedAt = item.updatedAt ? new Date(item.updatedAt) : null;
        return item.status === 'disposed' && updatedAt && updatedAt >= sinceDate;
      });

      return {
        added: itemsInPeriod.length,
        consumed: consumedInPeriod.length,
        disposed: disposedInPeriod.length,
      };
    };

    return {
      allTime,
      lastWeek: getStatsForPeriod(oneWeekAgo),
      lastMonth: getStatsForPeriod(oneMonthAgo),
      last3Months: getStatsForPeriod(threeMonthsAgo),
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getSavedRecipes(userId: string): Promise<SavedRecipe[]> {
    return await db.select()
      .from(savedRecipes)
      .where(eq(savedRecipes.userId, userId))
      .orderBy(asc(savedRecipes.title));
  }

  async getSavedRecipe(userId: string, title: string): Promise<SavedRecipe | undefined> {
    const [recipe] = await db.select()
      .from(savedRecipes)
      .where(and(eq(savedRecipes.userId, userId), eq(savedRecipes.title, title)));
    return recipe;
  }

  async saveRecipe(recipe: InsertSavedRecipe): Promise<SavedRecipe> {
    const [saved] = await db.insert(savedRecipes).values(recipe).returning();
    return saved;
  }

  async unsaveRecipe(userId: string, recipeId: number): Promise<void> {
    await db.delete(savedRecipes)
      .where(and(eq(savedRecipes.userId, userId), eq(savedRecipes.id, recipeId)));
  }
}

export const storage = new DatabaseStorage();
