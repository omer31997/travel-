import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ patientId, file }: { patientId: number; file: File }) => {
      const formData = new FormData();
      formData.append("patientId", patientId.toString());
      formData.append("file", file);

      const res = await fetch(api.documents.upload.path, {
        method: api.documents.upload.method,
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error("Cannot upload to locked file");
        throw new Error("Failed to upload document");
      }
      
      return api.documents.upload.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate the patient details query to show new doc
      queryClient.invalidateQueries({ queryKey: [api.patients.get.path, variables.patientId] });
      toast({ title: "Success", description: "Document uploaded successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, patientId }: { id: number; patientId: number }) => {
      const url = buildUrl(api.documents.delete.path, { id });
      const res = await fetch(url, { 
        method: api.documents.delete.method,
        credentials: "include" 
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error("Cannot delete from locked file");
        throw new Error("Failed to delete document");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.patients.get.path, variables.patientId] });
      toast({ title: "Deleted", description: "Document removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
