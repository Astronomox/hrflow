"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    const result = await signIn("credentials", {
      email: data.email, password: data.password, redirect: false,
    });
    if (result?.error) {
      toast({ title: "Login failed", description: result.error, variant: "destructive" });
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-2">Welcome back</p>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground leading-tight">
          Sign in to HRFlow
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Enter your credentials to access your workspace
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            className="h-11 bg-muted/40 border-border/60 focus:bg-background transition-colors"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-11 bg-muted/40 border-border/60 focus:bg-background transition-colors pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-semibold shadow-md shadow-primary/20 gap-2 group"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</>
          ) : (
            <>Sign in <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">New to HRFlow?</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        <Link
          href="/register"
          className="text-primary font-semibold hover:underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
