import { useState } from "react";
import { useLocation } from "wouter";
import { usePantryItems } from "@/hooks/use-pantry";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ChefHat, Sparkles, Search } from "lucide-react";
import { motion } from "framer-motion";

interface CustomRecipeSelectionProps {
  onGenerateCustomRecipes: (pantryItemIds: number[]) => void;
}

export default function CustomRecipeSelection({ onGenerateCustomRecipes }: CustomRecipeSelectionProps) {
  const [_, setLocation] = useLocation();
  const { data: pantryItems, isLoading } = usePantryItems();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const activeItems = pantryItems?.filter(item => item.status === 'active') || [];
  
  const filteredItems = activeItems.filter(item =>
    item.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleItem = (id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 10) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleGenerateRecipes = () => {
    if (selectedIds.length > 0) {
      onGenerateCustomRecipes(selectedIds);
      setLocation("/recipes");
    }
  };

  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.item.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof activeItems>);

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title="Custom Recipe" subtitle="Select ingredients to use" />

      <main className="px-4 py-6 max-w-md mx-auto">
        <button 
          onClick={() => setLocation("/recipes")}
          className="flex items-center gap-2 text-[#641B2E] mb-4"
          data-testid="button-back-to-recipes"
        >
          <ArrowLeft size={20} />
          <span>Back to Recipes</span>
        </button>

        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3 text-[#641B2E]">
            <ChefHat size={24} />
            <div>
              <h2 className="font-bold">Select 1-10 ingredients</h2>
              <p className="text-sm text-[#641B2E]/70">
                We'll find recipes that specifically use these items
              </p>
            </div>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#641B2E]/50" size={20} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-10 pr-4 bg-white rounded-xl border-0 focus:ring-2 focus:ring-[#641B2E] text-[#641B2E] placeholder:text-[#641B2E]/50"
            data-testid="input-search-items"
          />
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-[#BE5B50] border-t-transparent rounded-full animate-spin" />
            <p className="font-medium text-foreground">Loading pantry...</p>
          </div>
        )}

        {!isLoading && activeItems.length === 0 && (
          <div className="text-center py-12 text-[#641B2E]/70">
            <p>No active items in your pantry.</p>
            <Button 
              className="mt-4 bg-[#BE5B50] hover:bg-[#a84d43] text-white"
              onClick={() => setLocation("/add")}
              data-testid="button-add-items"
            >
              Add Items
            </Button>
          </div>
        )}

        {!isLoading && Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h3 className="text-sm font-bold text-[#641B2E]/70 uppercase tracking-wide mb-2">
              {category}
            </h3>
            <div className="space-y-2">
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isDisabled = !isSelected && selectedIds.length >= 10;
                
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleToggleItem(item.id)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 p-3 bg-white rounded-xl transition-all ${
                      isSelected 
                        ? 'ring-2 ring-[#BE5B50] bg-[#BE5B50]/5' 
                        : isDisabled 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-[#FBDB93]/20'
                    }`}
                    data-testid={`item-${item.id}`}
                  >
                    <Checkbox 
                      checked={isSelected}
                      className="border-[#641B2E]/30 data-[state=checked]:bg-[#BE5B50] data-[state=checked]:border-[#BE5B50]"
                    />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-[#641B2E]">{item.item.name}</p>
                      <p className="text-xs text-[#641B2E]/60">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#641B2E]/10 p-4 shadow-lg">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-[#641B2E]/70">
              {selectedIds.length} of 10 items selected
            </span>
            {selectedIds.length > 0 && (
              <button 
                onClick={() => setSelectedIds([])}
                className="text-[#BE5B50] font-medium"
                data-testid="button-clear-selection"
              >
                Clear All
              </button>
            )}
          </div>
          <Button
            size="lg"
            className="w-full h-14 text-lg rounded-2xl bg-[#BE5B50] hover:bg-[#a84d43] text-white disabled:opacity-50"
            disabled={selectedIds.length === 0}
            onClick={handleGenerateRecipes}
            data-testid="button-generate-custom-recipes"
          >
            <Sparkles className="mr-2" size={20} />
            Find Recipes ({selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''})
          </Button>
        </div>
      </div>
    </div>
  );
}
