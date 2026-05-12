"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Mail, Phone, Building2, Calendar, Briefcase, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/avatar";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/components/ui/use-toast";
import { ROLES, EMPLOYMENT_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Role, EmploymentStatus } from "@prisma/client";

const profileSchema = z.object({
  phone: z.string().optional(),
  position: z.string().min(1, "Position is required"),
});
type ProfileInput = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ProfileInput) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile updated" });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  const profile = data?.data;

  useEffect(() => {
    if (profile?.employee) {
      reset({
        phone: profile.employee.phone ?? "",
        position: profile.employee.position ?? "",
      });
    }
  }, [profile, reset]);

  if (isLoading) return <Skeleton className="h-96 w-full rounded-lg" />;
  if (!profile) return <p className="text-muted-foreground">Profile not found.</p>;

  const emp = profile.employee;

  return (
    <div className="animate-fade-up max-w-3xl">
      <PageHeader title="My Profile" description="View and update your personal details" />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar card */}
        <Card className="md:col-span-1 border-border/60 shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
            <UserAvatar name={profile.name} size="lg" className="h-20 w-20 text-2xl" />
            <h2 className="font-bold text-base mt-2">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">{emp?.position ?? "—"}</p>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
              {ROLES[profile.role as Role]}
            </span>
            {emp?.status && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                {EMPLOYMENT_STATUSES[emp.status as EmploymentStatus]}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Details + edit */}
        <div className="md:col-span-2 space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader><CardTitle className="text-base">Account Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: Mail,      label: "Email",       value: profile.email,                           locked: true  },
                { icon: Shield,    label: "Role",        value: ROLES[profile.role as Role],             locked: true  },
                { icon: Building2, label: "Department",  value: emp?.department?.name ?? "Unassigned",   locked: true  },
                { icon: Calendar,  label: "Date Joined", value: emp?.dateJoined ? formatDate(emp.dateJoined) : "—", locked: true },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                  <span className="text-xs text-muted-foreground/50">locked</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader><CardTitle className="text-base">Editable Details</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="position">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      Position / Job Title
                    </div>
                  </Label>
                  <Input id="position" {...register("position")} />
                  {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Phone Number
                    </div>
                  </Label>
                  <Input id="phone" {...register("phone")} placeholder="+234 800 000 0000" />
                </div>
                <Button type="submit" disabled={mutation.isPending || !isDirty} className="w-full">
                  {mutation.isPending
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    : <><Save className="h-4 w-4 mr-2" />Save Changes</>
                  }
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
