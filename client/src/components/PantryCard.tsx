import { PantryListResponse } from "@shared/routes";
import { format, differenceInDays } from "date-fns";
import { AlertTriangle, Clock, Trash2, Utensils, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/lib/categories";

function getCategoryIcon(category: string): React.ReactNode {
  const IconComponent = CATEGORY_ICONS[category] || Package;
  const colorClass = CATEGORY_COLORS[category] || "text-muted-foreground";
  return <IconComponent className={cn("w-8 h-8", colorClass)} />;
}

interface PantryCardProps {
  item: PantryListResponse[number];
  onConsume: (id: number) => void;
  onDispose: (id: number) => void;
}

export function PantryCard({ item, onConsume, onDispose }: PantryCardProps) {
  const isPerishable = !!item.expirationDate;
  const daysLeft = item.expirationDate 
    ? differenceInDays(new Date(item.expirationDate), new Date()) 
    : null;

  let statusColor = "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
  let statusText = "Fresh";

  if (daysLeft !== null) {
    if (daysLeft < 0) {
      statusColor = "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      statusText = "Expired";
    } else if (daysLeft <= 3) {
      statusColor = "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
      statusText = "Expiring Soon";
    }
  }

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 hover:shadow-md transition-shadow relative overflow-hidden group" data-testid={`pantry-card-${item.id}`}>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden" data-testid={`item-icon-${item.id}`}>
           {item.item.imageUrl ? (
             <img src={item.item.imageUrl} alt={item.item.name} className="w-full h-full object-cover" />
           ) : (
             getCategoryIcon(item.item.category)
           )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-lg text-foreground truncate" data-testid={`item-name-${item.id}`}>{item.item.name}</h3>
              <p className="text-sm text-muted-foreground" data-testid={`item-details-${item.id}`}>{item.quantity} {item.unit} • {item.item.category}</p>
            </div>
            {isPerishable && (
              <span className={cn("text-xs font-semibold px-2 py-1 rounded-full border shrink-0", statusColor)} data-testid={`item-status-${item.id}`}>
                {statusText}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
             <div className="text-xs text-muted-foreground flex items-center gap-1">
               <Clock size={12} />
               <span>Purchased {format(new Date(item.purchaseDate), 'MMM d')}</span>
             </div>

             <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="secondary"
                      className="rounded-full"
                      title="Mark Consumed" 
                      data-testid={`button-consume-${item.id}`}
                    >
                      <Utensils size={16} className="text-green-600 dark:text-green-400" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Mark as Consumed?</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground">Great! Did you finish all {item.quantity} {item.unit} of {item.item.name}?</p>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <DialogClose asChild>
                        <Button variant="outline" data-testid="button-cancel-consume">Cancel</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button onClick={() => onConsume(item.id)} data-testid="button-confirm-consume">Confirm</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="secondary"
                      className="rounded-full"
                      title="Mark Disposed" 
                      data-testid={`button-dispose-${item.id}`}
                    >
                      <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                       <DialogTitle>Mark as Disposed?</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                        <AlertTriangle size={32} />
                      </div>
                      <p className="text-center text-muted-foreground">
                        Disposing of items adds to your waste stats. Try to use ingredients before they expire!
                      </p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                       <DialogClose asChild>
                          <Button variant="outline" data-testid="button-cancel-dispose">Cancel</Button>
                       </DialogClose>
                       <DialogClose asChild>
                          <Button variant="destructive" onClick={() => onDispose(item.id)} data-testid="button-confirm-dispose">Dispose Item</Button>
                       </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
