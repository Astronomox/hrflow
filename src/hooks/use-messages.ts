"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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
    refetchInterval: 8000,
  });
}

export function useMessages(conversationId: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: [KEY, "messages", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!conversationId,
    staleTime: Infinity,
  });

  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    if (esRef.current) esRef.current.close();

    const es = new EventSource(`/api/messages/stream?conversationId=${conversationId}`);
    esRef.current = es;

    es.addEventListener("messages", (event) => {
      const newMessages = JSON.parse(event.data);
      if (!newMessages.length) return;
      qc.setQueryData([KEY, "messages", conversationId], (old: { data: unknown[] } | undefined) => {
        if (!old) return old;
        const existing = old.data ?? [];
        const existingIds = new Set(existing.map((m: { id: string }) => m.id));
        const fresh = newMessages.filter((m: { id: string }) => !existingIds.has(m.id));
        if (!fresh.length) return old;
        return { ...old, data: [...existing, ...fresh] };
      });
      qc.invalidateQueries({ queryKey: [KEY, "conversations"] });
    });

    es.addEventListener("error", () => {
      if (es.readyState === EventSource.CLOSED) {
        qc.invalidateQueries({ queryKey: [KEY, "messages", conversationId] });
      }
    });

    return () => { es.close(); esRef.current = null; };
  }, [conversationId, qc]);

  return query;
}

export function useCreateConversation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: CreateConversationInput) => {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed"); }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: SendMessageInput) => {
      const res = await fetch(`/api/messages/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json();
    },

    // Optimistic update — message appears instantly before server confirms
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: [KEY, "messages", conversationId] });
      const previous = qc.getQueryData([KEY, "messages", conversationId]);

      qc.setQueryData([KEY, "messages", conversationId], (old: { data: unknown[] } | undefined) => {
        if (!old) return old;
        const optimistic = {
          id: `optimistic-${Date.now()}`,
          conversationId,
          content: data.content,
          createdAt: new Date().toISOString(),
          sender: {
            id: "optimistic",
            user: { name: "You" },
          },
          files: [],
          _optimistic: true,
        };
        return { ...old, data: [...(old.data ?? []), optimistic] };
      });

      return { previous };
    },

    // If server fails — roll back the optimistic message and show error
    onError: (_err, _data, context) => {
      if (context?.previous) {
        qc.setQueryData([KEY, "messages", conversationId], context.previous);
      }
      toast({ title: "Message failed to send", description: "Please try again.", variant: "destructive" });
    },

    // On success — remove the optimistic message; SSE will push the real one
    onSuccess: () => {
      qc.setQueryData([KEY, "messages", conversationId], (old: { data: { id: string }[] } | undefined) => {
        if (!old) return old;
        return { ...old, data: old.data.filter((m) => !m.id.startsWith("optimistic-")) };
      });
      qc.invalidateQueries({ queryKey: [KEY, "conversations"] });
    },
  });
}
