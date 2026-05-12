import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

const KEY = "files";

export function useFiles(scope: "mine" | "department" | "all" = "mine") {
  return useQuery({
    queryKey: [KEY, scope],
    queryFn: async () => {
      const res = await fetch(`/api/files?scope=${scope}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    // Always refetch when tab is focused so uploads appear immediately
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ file, visibility = "private" }: { file: File; visibility?: string }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("visibility", visibility);
      const res = await fetch("/api/files", { method: "POST", body: form });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Upload failed"); }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all scopes so the file appears immediately regardless of tab
      qc.invalidateQueries({ queryKey: [KEY] });
      toast({ title: "File uploaded" });
    },
    onError: (e: Error) => toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast({ title: "File deleted" }); },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });
}
