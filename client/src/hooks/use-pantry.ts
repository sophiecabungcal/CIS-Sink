import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreatePantryItemInput, type UpdatePantryItemInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function usePantryItems(status?: 'active' | 'consumed' | 'disposed') {
  const queryString = status ? `?status=${status}` : "";
  
  return useQuery({
    queryKey: [api.pantry.list.path, status],
    queryFn: async () => {
      const res = await fetch(`${api.pantry.list.path}${queryString}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch pantry items");
      return api.pantry.list.responses[200].parse(await res.json());
    },
  });
}

export function usePantryItem(id: number) {
  return useQuery({
    queryKey: [api.pantry.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.pantry.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch pantry item");
      return api.pantry.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreatePantryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreatePantryItemInput) => {
      const res = await fetch(api.pantry.create.path, {
        method: api.pantry.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
           const error = api.pantry.create.responses[400].parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error("Failed to add item to pantry");
      }
      return api.pantry.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pantry.list.path] });
      toast({ title: "Success", description: "Item added to your pantry" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdatePantryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdatePantryItemInput) => {
      const url = buildUrl(api.pantry.update.path, { id });
      const res = await fetch(url, {
        method: api.pantry.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update item");
      return api.pantry.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pantry.list.path] });
      toast({ title: "Updated", description: "Pantry item updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useDeletePantryItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.pantry.delete.path, { id });
      const res = await fetch(url, { method: api.pantry.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pantry.list.path] });
      toast({ title: "Deleted", description: "Item removed from pantry" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}
