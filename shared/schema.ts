import { pgTable, text, serial, integer, boolean, timestamp, date, varchar, jsonb, index, real } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Replit Auth uses string IDs
  username: text("username"), // Made nullable to match Replit Auth OIDC claims
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // Fruit, Vegetable, Dairy, Spice, Grain, Meat, Other, Cleaning, Household
  itemType: text("item_type").default("food").notNull(), // food or household
  defaultShelfLife: integer("default_shelf_life"), // In days
  imageUrl: text("image_url"),
});

export const pantryItems = pgTable("pantry_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // No FK constraint to avoid complex auth sync issues, but normally would have it
  itemId: integer("item_id").notNull(),
  quantity: real("quantity").notNull().default(1),
  unit: text("unit").default("pcs"), // pcs, kg, g, l, etc.
  purchaseDate: date("purchase_date").defaultNow().notNull(),
  expirationDate: date("expiration_date"), // calculated or manual
  condition: text("condition").default("Fresh"), // Fresh, Good, Ripe, Old
  status: text("status").default("active").notNull(), // active, consumed, disposed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const savedRecipes = pgTable("saved_recipes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  ingredients: text("ingredients").array().notNull(),
  instructions: text("instructions").notNull(), // Stored as JSON string for array or plain text
  prepTime: text("prep_time"),
  difficulty: text("difficulty"),
  sourceName: text("source_name"),
  matchCount: integer("match_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const pantryItemsRelations = relations(pantryItems, ({ one }) => ({
  item: one(items, {
    fields: [pantryItems.itemId],
    references: [items.id],
  }),
  user: one(users, {
    fields: [pantryItems.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users);
export const insertItemSchema = createInsertSchema(items);
export const insertPantryItemSchema = createInsertSchema(pantryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export const insertSavedRecipeSchema = createInsertSchema(savedRecipes).omit({
  id: true,
  createdAt: true,
});

// === EXPLICIT API CONTRACT TYPES ===

export type User = typeof users.$inferSelect;
export type Item = typeof items.$inferSelect;
export type PantryItem = typeof pantryItems.$inferSelect;
export type SavedRecipe = typeof savedRecipes.$inferSelect;

export type InsertPantryItem = z.infer<typeof insertPantryItemSchema>;
export type InsertSavedRecipe = z.infer<typeof insertSavedRecipeSchema>;

// Request types
export type CreatePantryItemRequest = InsertPantryItem;
export type UpdatePantryItemRequest = Partial<InsertPantryItem>;

// Response types
// We need a joined type for the frontend to display item details
export type PantryItemResponse = PantryItem & {
  item: Item;
};

export type ItemResponse = Item;

export type RecipeSuggestion = {
  title: string;
  ingredients: string[];
  instructions: string;
  matchCount: number; // How many pantry items used
};

export type WasteStats = {
  allTime: {
    consumed: number;
    disposed: number;
    active: number;
    total: number;
    consumedPercent: number;
    disposedPercent: number;
  };
  lastWeek: { added: number; consumed: number; disposed: number };
  lastMonth: { added: number; consumed: number; disposed: number };
  last3Months: { added: number; consumed: number; disposed: number };
};
