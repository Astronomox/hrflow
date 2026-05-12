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
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ file, departmentId }: { file: File; departmentId?: string }) => {
      const form = new FormData();
      form.append("file", file);
      if (departmentId) form.append("departmentId", departmentId);
      const res = await fetch("/api/files", { method: "POST", body: form });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Upload failed"); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [KEY] }); toast({ title: "File uploaded successfully" }); },
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
