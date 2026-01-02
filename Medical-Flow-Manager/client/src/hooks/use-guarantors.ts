import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertGuarantor } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useGuarantors() {
  return useQuery({
    queryKey: [api.guarantors.list.path],
    queryFn: async () => {
      const res = await fetch(api.guarantors.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch guarantors");
      return api.guarantors.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateGuarantor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertGuarantor) => {
      const res = await fetch(api.guarantors.create.path, {
        method: api.guarantors.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create guarantor");
      }
      return api.guarantors.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.guarantors.list.path] });
      toast({ title: "Success", description: "Guarantor added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
