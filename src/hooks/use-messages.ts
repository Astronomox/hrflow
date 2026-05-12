"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { CreateConversationInput, SendMessageInput } from "@/lib/validations/message";

const KEY = "messages";

// Conversations list — still polls at 8s (new convos appear)
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

// Messages in a conversation — uses SSE for real-time, falls back to React Query cache
export function useMessages(conversationId: string) {
  const qc = useQueryClient();

  // Initial fetch
  const query = useQuery({
    queryKey: [KEY, "messages", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!conversationId,
    staleTime: Infinity, // SSE keeps it fresh — don't auto-refetch
  });

  // SSE listener
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    // Close any existing connection
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource(`/api/messages/stream?conversationId=${conversationId}`);
    esRef.current = es;

    es.addEventListener("messages", (event) => {
      const newMessages = JSON.parse(event.data);
      if (!newMessages.length) return;

      // Append new messages to the existing cache
      qc.setQueryData([KEY, "messages", conversationId], (old: { data: unknown[] } | undefined) => {
        if (!old) return old;
        const existing = old.data ?? [];
        const existingIds = new Set(existing.map((m: { id: string }) => m.id));
        const fresh = newMessages.filter((m: { id: string }) => !existingIds.has(m.id));
        if (!fresh.length) return old;
        return { ...old, data: [...existing, ...fresh] };
      });

      // Also refresh conversation list so "last message" updates
      qc.invalidateQueries({ queryKey: [KEY, "conversations"] });
    });

    es.addEventListener("error", () => {
      // SSE connection dropped — fall back to polling
      if (es.readyState === EventSource.CLOSED) {
        qc.invalidateQueries({ queryKey: [KEY, "messages", conversationId] });
      }
    });

    return () => {
      es.close();
      esRef.current = null;
    };
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
    onSuccess: () => {
      // Invalidate to trigger a refetch — SSE will pick it up on the other end
      qc.invalidateQueries({ queryKey: [KEY, "messages", conversationId] });
      qc.invalidateQueries({ queryKey: [KEY, "conversations"] });
    },
  });
}
