"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, MessageSquare, Loader2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/avatar";
import { useConversations, useCreateConversation } from "@/hooks/use-messages";
import { useEmployees } from "@/hooks/use-employees";
import { useDepartments } from "@/hooks/use-departments";
import { useCurrentUser } from "@/hooks/use-current-user";
import { createConversationSchema, type CreateConversationInput } from "@/lib/validations/message";
import { ConversationType } from "@prisma/client";
import { formatRelativeTime, truncate, cn } from "@/lib/utils";

const EMPLOYEE_TYPES = [
  { value: ConversationType.DIRECT,           label: "Direct Message" },
  { value: ConversationType.EMPLOYEE_TO_DEPT, label: "Message a Department" },
];
const ADMIN_TYPES = [
  { value: ConversationType.DIRECT,             label: "Direct Message" },
  { value: ConversationType.EMPLOYEE_TO_DEPT,   label: "Employee → Department" },
  { value: ConversationType.DEPT_TO_DEPT,       label: "Department → Department" },
  { value: ConversationType.DEPT_TO_EMPLOYEE,   label: "Department → Employee" },
];

const TYPE_LABELS: Record<string, string> = {
  [ConversationType.DIRECT]:           "DM",
  [ConversationType.EMPLOYEE_TO_DEPT]: "→ Dept",
  [ConversationType.DEPT_TO_DEPT]:     "Dept ↔",
  [ConversationType.DEPT_TO_EMPLOYEE]: "Dept →",
};

export default function MessagesPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { user, isAdminOrHR } = useCurrentUser();
  const { data, isLoading } = useConversations();
  const createConvo = useCreateConversation();
  const { data: empData } = useEmployees({ pageSize: 200 });
  const { data: deptData } = useDepartments();
  const conversations = data?.data ?? [];

  const availableTypes = isAdminOrHR ? ADMIN_TYPES : EMPLOYEE_TYPES;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<CreateConversationInput>({
      resolver: zodResolver(createConversationSchema),
      defaultValues: { type: ConversationType.DIRECT },
    });

  const selectedType = watch("type");

  function onSubmit(data: CreateConversationInput) {
    createConvo.mutate(data, {
      onSuccess: (res) => {
        setOpen(false);
        reset();
        router.push(`/messages/${res.data.id}`);
      },
    });
  }

  function getConvoName(conv: {
    type: ConversationType;
    participants: { employee?: { user: { name: string } } | null; department?: { name: string } | null }[];
  }) {
    const others = conv.participants.filter((p) => p.employee?.user.name !== user?.name);
    const names = others.map((p) => p.employee?.user.name ?? p.department?.name).filter(Boolean);
    return names.length > 0 ? names.join(", ") : "Conversation";
  }

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  const otherEmployees = (empData?.data ?? []).filter(
    (e: { id: string; user: { name: string } }) => e.user.name !== user?.name
  );

  const filtered = conversations.filter((conv: {
    id: string; type: ConversationType; updatedAt: string;
    participants: { employee?: { user: { name: string } } | null; department?: { name: string } | null }[];
    messages: { content: string; sender: { user: { name: string } } }[];
  }) => {
    if (!search) return true;
    return getConvoName(conv).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Messages"
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Message</Button>}
      />

      {/* Search bar */}
      {conversations.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-muted/40 border-border/60"
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[72px] bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        conversations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description="Start a conversation with a colleague or department."
            action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Message</Button>}
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No results found"
            description={`No conversations matching "${search}"`}
          />
        )
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm divide-y divide-border/50">
          {filtered.map((conv: {
            id: string; type: ConversationType; updatedAt: string;
            participants: { employee?: { user: { name: string } } | null; department?: { name: string } | null }[];
            messages: { content: string; sender: { user: { name: string } } }[];
          }, idx: number) => {
            const lastMsg = conv.messages[0];
            const name = getConvoName(conv);
            const isUnread = idx < 2; // Simulate unread for first 2 (replace with real logic)
            const typeLabel = TYPE_LABELS[conv.type] ?? conv.type;

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3.5 transition-all group",
                  "hover:bg-primary/[.03] hover:border-l-2 hover:border-l-primary/40",
                  isUnread ? "bg-primary/[.015]" : "bg-card"
                )}
              >
                {/* Avatar with online indicator */}
                <div className="relative shrink-0">
                  <UserAvatar name={name} size="md" />
                  {isUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={cn("text-sm truncate", isUnread ? "font-bold" : "font-semibold")}>
                      {name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {typeLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(conv.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <p className={cn("text-xs truncate", isUnread ? "text-foreground/70" : "text-muted-foreground")}>
                    {lastMsg
                      ? `${lastMsg.sender.user.name}: ${truncate(lastMsg.content, 60)}`
                      : <span className="italic">No messages yet — start the conversation</span>
                    }
                  </p>
                </div>

                {/* Hover arrow */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Conversation</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                defaultValue={ConversationType.DIRECT}
                onValueChange={(v) => {
                  setValue("type", v as ConversationType);
                  setValue("recipientEmployeeId", undefined);
                  setValue("recipientDepartmentId", undefined);
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableTypes.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedType === ConversationType.DIRECT || selectedType === ConversationType.DEPT_TO_EMPLOYEE) && (
              <div className="space-y-2">
                <Label>Recipient</Label>
                <Select onValueChange={(v) => setValue("recipientEmployeeId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select a colleague" /></SelectTrigger>
                  <SelectContent>
                    {otherEmployees.map((e: { id: string; user: { name: string } }) => (
                      <SelectItem key={e.id} value={e.id}>{e.user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(selectedType === ConversationType.EMPLOYEE_TO_DEPT || selectedType === ConversationType.DEPT_TO_DEPT) && (
              <div className="space-y-2">
                <Label>Department</Label>
                <Select onValueChange={(v) => setValue("recipientDepartmentId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger>
                  <SelectContent>
                    {(deptData?.data ?? []).map((d: { id: string; name: string }) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Message</Label>
              <Input {...register("initialMessage")} placeholder="Type your message..." />
              {errors.initialMessage && (
                <p className="text-sm text-destructive">{errors.initialMessage.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
              <Button type="submit" disabled={createConvo.isPending}>
                {createConvo.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Send
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
