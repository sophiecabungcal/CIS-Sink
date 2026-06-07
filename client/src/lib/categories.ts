import { Apple, Milk, Egg, Beef, Wheat, Salad, Carrot, Cookie, Sandwich, Soup, Fish, Coffee, Wine, Package, LucideIcon } from "lucide-react";

export const FOOD_CATEGORIES = [
  "Fruit",
  "Vegetable",
  "Dairy",
  "Meat",
  "Grain",
  "Pantry",
  "Spice",
  "Seafood",
  "Beverage",
  "Bakery",
  "Protein",
  "Produce",
  "Alcohol",
  "Other",
] as const;

export type FoodCategory = typeof FOOD_CATEGORIES[number];

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Fruit": Apple,
  "Vegetable": Carrot,
  "Dairy": Milk,
  "Meat": Beef,
  "Protein": Egg,
  "Grain": Wheat,
  "Bakery": Cookie,
  "Spice": Soup,
  "Produce": Salad,
  "Seafood": Fish,
  "Beverage": Coffee,
  "Alcohol": Wine,
  "Pantry": Sandwich,
  "Other": Package,
};

export const CATEGORY_COLORS: Record<string, string> = {
  "Fruit": "text-red-500",
  "Vegetable": "text-orange-500",
  "Dairy": "text-blue-400",
  "Meat": "text-rose-600",
  "Protein": "text-amber-400",
  "Grain": "text-amber-600",
  "Bakery": "text-amber-700",
  "Spice": "text-red-400",
  "Produce": "text-green-500",
  "Seafood": "text-cyan-500",
  "Beverage": "text-amber-800",
  "Alcohol": "text-purple-500",
  "Pantry": "text-yellow-600",
  "Other": "text-gray-500",
};
