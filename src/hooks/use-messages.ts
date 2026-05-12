import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import type { CreateConversationInput, SendMessageInput } from "@/lib/validations/message";

const KEY = "messages";

export function useConversations() {
  return useQuery({
    queryKey: [KEY, "conversations"],
    queryFn: async () => {
      const res = await fetch("/api/messages/conversations");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 10000, // poll every 10s
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: [KEY, "messages", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!conversationId,
    refetchInterval: 5000,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: CreateConversationInput) => {
      const res = await fetch("/api/messages/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed"); }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: SendMessageInput) => {
      const res = await fetch(`/api/messages/conversations/${conversationId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to send");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "messages", conversationId] });
      qc.invalidateQueries({ queryKey: [KEY, "conversations"] });
    },
  });
}
