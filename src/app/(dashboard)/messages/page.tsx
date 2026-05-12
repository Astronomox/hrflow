"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, MessageSquare, Loader2 } from "lucide-react";
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
import { formatRelativeTime, truncate } from "@/lib/utils";

// Role-based conversation types
// Employees: Direct + Employee→Dept only
// HR/Admin: all types
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

export default function MessagesPage() {
  const [open, setOpen] = useState(false);
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

  // Filter out self from employee list
  const otherEmployees = (empData?.data ?? []).filter(
    (e: { id: string; user: { name: string } }) => e.user.name !== user?.name
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Messages"
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Message</Button>}
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Start a conversation with a colleague or department."
          action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Message</Button>}
        />
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
          {conversations.map((conv: {
            id: string; type: ConversationType; updatedAt: string;
            participants: { employee?: { user: { name: string } } | null; department?: { name: string } | null }[];
            messages: { content: string; sender: { user: { name: string } } }[];
          }) => {
            const lastMsg = conv.messages[0];
            const name = getConvoName(conv);
            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b last:border-0"
              >
                <UserAvatar name={name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate">{name}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatRelativeTime(conv.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {lastMsg
                      ? `${lastMsg.sender.user.name}: ${truncate(lastMsg.content, 60)}`
                      : "No messages yet"}
                  </p>
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
                  // Clear recipient fields when type changes
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
