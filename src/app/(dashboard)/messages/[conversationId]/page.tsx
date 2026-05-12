"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/shared/avatar";
import { useConversations, useMessages, useSendMessage } from "@/hooks/use-messages";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatTime, cn } from "@/lib/utils";

export default function ConversationPage({ params }: { params: { conversationId: string } }) {
  const { data, isLoading } = useMessages(params.conversationId);
  const { data: convoData } = useConversations();
  const sendMessage = useSendMessage(params.conversationId);
  const { user } = useCurrentUser();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages  = data?.data ?? [];

  const conversation = convoData?.data?.find((c: { id: string }) => c.id === params.conversationId);
  const conversationName = (() => {
    if (!conversation) return "Conversation";
    const others = conversation.participants.filter(
      (p: { employee?: { user: { name: string } } | null }) => p.employee?.user.name !== user?.name
    );
    const names = others
      .map((p: { employee?: { user: { name: string } } | null; department?: { name: string } | null }) =>
        p.employee?.user.name ?? p.department?.name
      )
      .filter(Boolean);
    return names.length > 0 ? names.join(", ") : "Conversation";
  })();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend() {
    if (!input.trim()) return;
    sendMessage.mutate({ content: input });
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  let lastDate = "";

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-muted/20 shrink-0">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
          <Link href="/messages"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <UserAvatar name={conversationName} size="sm" />
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-none truncate">{conversationName}</p>
          {conversation && (
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">
              {conversation.type.replace(/_/g, " ").toLowerCase()}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Send className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs text-muted-foreground">Say hello to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg: {
              id: string; content: string; createdAt: string;
              sender: { id: string; user: { name: string } };
            }, i: number) => {
              const isOwn      = msg.sender.id === user?.employeeId;
              const showName   = !isOwn && (i === 0 || messages[i - 1]?.sender.id !== msg.sender.id);
              const showAvatar = showName;
              const msgDate    = new Date(msg.createdAt).toDateString();
              const showDate   = msgDate !== lastDate;
              if (showDate) lastDate = msgDate;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-border/60" />
                      <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded-full">
                        {new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <div className="flex-1 h-px bg-border/60" />
                    </div>
                  )}
                  <div className={cn("flex items-end gap-2 mb-1", isOwn && "flex-row-reverse")}>
                    <div className="w-6 shrink-0">
                      {showAvatar && !isOwn && <UserAvatar name={msg.sender.user.name} size="sm" className="h-6 w-6 text-[10px]" />}
                    </div>
                    <div className={cn("max-w-[72%]", isOwn && "items-end flex flex-col")}>
                      {showName && !isOwn && (
                        <p className="text-[11px] text-muted-foreground font-medium px-1 mb-0.5">{msg.sender.user.name}</p>
                      )}
                      <div className={cn(
                        "px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm",
                        isOwn
                          ? "bg-primary text-white rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      )}>
                        {msg.content}
                      </div>
                      <p className={cn("text-[10px] text-muted-foreground mt-0.5 px-1", isOwn && "text-right")}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border/60 p-3 flex items-center gap-2 bg-card/80 backdrop-blur-sm shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 border-0 bg-muted focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl px-4 h-10"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || sendMessage.isPending}
          className="rounded-xl h-10 w-10 shrink-0 shadow-sm"
        >
          {sendMessage.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />
          }
        </Button>
      </div>
    </div>
  );
}
