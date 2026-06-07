import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useItems(params?: { search?: string; category?: string }) {
  const queryString = params
    ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
    : "";

  return useQuery({
    queryKey: [api.items.list.path, params],
    queryFn: async () => {
      const res = await fetch(`${api.items.list.path}${queryString}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch items");
      return api.items.list.responses[200].parse(await res.json());
    },
  });
}
