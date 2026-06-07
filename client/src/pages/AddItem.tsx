import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useItems } from "@/hooks/use-items";
import { useCreatePantryItem } from "@/hooks/use-pantry";
import { BottomNav } from "@/components/BottomNav";
import { Search, ChevronLeft, Calendar as CalendarIcon, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Step = "select" | "details";

export default function AddItem() {
  const [_, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("select");
  const [search, setSearch] = useState("");
  const { data: items } = useItems({ search });
  const createMutation = useCreatePantryItem();

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState("pcs");
  const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
  const [condition, setCondition] = useState([100]); // 0-100 scale

  useEffect(() => {
    const bgColor = step === "select" ? '#BE5B50' : '#FBDB93';
    document.body.style.backgroundColor = bgColor;
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [step]);

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
    setStep("details");
    // Default unit based on category could go here
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;

    // Calculate expiration based on condition and shelf life
    let expirationDate = undefined;
    if (selectedItem.defaultShelfLife) {
      // Simple logic: if condition is 50%, remove 50% of shelf life
      const conditionFactor = condition[0] / 100;
      const adjustedShelfLife = Math.floor(selectedItem.defaultShelfLife * conditionFactor);
      expirationDate = format(addDays(purchaseDate, adjustedShelfLife), "yyyy-MM-dd");
    }

    // Map condition slider to text
    let conditionText = "Fresh";
    if (condition[0] < 30) conditionText = "Old";
    else if (condition[0] < 70) conditionText = "Ripe/Good";
    
    await createMutation.mutateAsync({
      userId: "current-user", // In real app, this comes from auth context or is handled by backend
      itemId: selectedItem.id,
      quantity,
      unit,
      purchaseDate: format(purchaseDate, "yyyy-MM-dd"),
      expirationDate,
      condition: conditionText,
      status: "active"
    });

    setLocation("/");
  };

  const getConditionLabel = (val: number) => {
    if (val > 80) return "Fresh / New";
    if (val > 50) return "Good / Ripe";
    if (val > 20) return "Okay";
    return "Expiring Soon";
  };

  return (
    <div className={cn("min-h-screen pb-20", step === "select" ? "bg-[#BE5B50]" : "bg-[#FBDB93]")}>
      <header className={cn(
        "sticky top-0 z-10 px-6 py-4 flex items-center gap-4 border-b backdrop-blur-sm",
        step === "select" 
          ? "bg-[#BE5B50]/90 border-white/20" 
          : "bg-[#FBDB93]/90 border-[#641B2E]/20"
      )}>
        {step === "details" && (
          <button 
            onClick={() => setStep("select")} 
            className="p-2 -ml-2 rounded-full text-[#641B2E]"
            data-testid="button-back"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <h1 className={cn(
          "text-xl font-display font-bold",
          step === "select" ? "text-white" : "text-[#641B2E]"
        )}>
          {step === "select" ? "Add Item" : "Item Details"}
        </h1>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {step === "select" ? (
            <motion.div 
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <Input 
                  placeholder="What did you buy?" 
                  className="pl-10 h-12 rounded-xl text-lg shadow-sm bg-white border-transparent text-[#641B2E] placeholder:text-gray-400 focus:border-[#8A2D3B] focus:bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  data-testid="input-search-items"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {items?.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    className="flex flex-col items-center p-4 rounded-2xl border transition-all shadow-sm hover:shadow-md text-center bg-white border-transparent"
                    data-testid={`button-item-${item.id}`}
                  >
                    <div className="text-3xl mb-2">
                      {item.imageUrl ? <img src={item.imageUrl} className="w-10 h-10 object-cover rounded-full" alt={item.name} /> : null}
                    </div>
                    <span className="font-medium text-[#641B2E]">{item.name}</span>
                    <span className="text-xs mt-1 text-[#8A2D3B]">{item.category}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl shadow-sm">
                   {selectedItem.imageUrl ? <img src={selectedItem.imageUrl} className="w-full h-full object-cover rounded-xl" alt={selectedItem.name} /> : null}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#641B2E]">{selectedItem.name}</h2>
                  <p className="text-sm text-[#8A2D3B]">{selectedItem.category}</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold text-[#641B2E]">Quantity</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    step="0.1"
                    min="0.1"
                    value={quantity} 
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="text-center text-lg h-12 rounded-xl bg-white text-[#641B2E] border-transparent"
                    data-testid="input-quantity"
                  />
                  <select 
                    value={unit} 
                    onChange={(e) => setUnit(e.target.value)}
                    className="h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 bg-white text-[#641B2E] border-transparent"
                    data-testid="select-unit"
                  >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="box">box</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold text-[#641B2E]">Purchase Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal h-12 rounded-xl bg-white text-[#641B2E] border-transparent",
                        !purchaseDate && "opacity-70"
                      )}
                      data-testid="button-purchase-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {purchaseDate ? format(purchaseDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start">
                    <Calendar
                      mode="single"
                      selected={purchaseDate}
                      onSelect={(date) => date && setPurchaseDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-6">
                 <div className="flex justify-between items-center gap-2 flex-wrap">
                   <Label className="text-base font-semibold flex items-center gap-2 text-[#641B2E]">
                     Condition
                     <Info size={14} className="text-[#641B2E]/70" />
                   </Label>
                   <span className="text-sm font-medium px-3 py-1 rounded-full bg-white text-[#641B2E]">
                     {getConditionLabel(condition[0])}
                   </span>
                 </div>
                 <Slider
                   defaultValue={[100]}
                   max={100}
                   step={10}
                   value={condition}
                   onValueChange={setCondition}
                   className="py-4"
                   data-testid="slider-condition"
                 />
                 <p className="text-xs text-[#641B2E]/70">
                   This helps us estimate when it will expire. Lower value means it expires sooner.
                 </p>
              </div>

              <Button 
                size="lg" 
                className="w-full text-lg rounded-xl shadow-lg bg-[#BE5B50] text-white border-0 hover:bg-[#a84d43] active:bg-[#944339]" 
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                data-testid="button-add-to-pantry"
              >
                {createMutation.isPending ? "Adding..." : "Add to Pantry"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}
