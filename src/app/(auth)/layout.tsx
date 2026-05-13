import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Users, Clock, Shield, Zap } from "lucide-react";

const features = [
  { icon: Users,  text: "Team & employee management"  },
  { icon: Clock,  text: "Attendance & leave tracking"  },
  { icon: Shield, text: "Role-based access control"    },
  { icon: Zap,    text: "Real-time internal messaging" },
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ─────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-14"
        style={{ background: "linear-gradient(145deg, hsl(226 70% 48%) 0%, hsl(226 70% 38%) 40%, hsl(240 60% 28%) 100%)" }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <img src="/hrflow-mark.png" alt="HRFlow" style={{ width: 48, height: 48 }} />
          <div>
            <span className="font-bold text-xl text-white tracking-tight">HRFlow</span>
            <p className="text-[10px] text-white/50 leading-none mt-0.5 uppercase tracking-widest">Workspace</p>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/15 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/80 font-medium">Built for modern organisations</span>
          </div>

          <h2 className="text-[2.6rem] font-bold text-white leading-[1.1] tracking-tight mb-5">
            Manage your<br />
            <span className="text-white/60">team with ease.</span>
          </h2>

          <p className="text-white/55 text-base leading-relaxed mb-10 max-w-sm">
            HR & Internal Communication Platform — attendance, leave, messaging and files, unified in one place.
          </p>

          <div className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 border border-white/15 shrink-0">
                  <Icon className="h-3.5 w-3.5 text-white/80" />
                </div>
                <span className="text-sm text-white/70">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/30 text-xs">© 2026 HRFlow. All rights reserved.</p>
      </div>

      {/* ── Right form panel ─────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background relative">
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, hsl(226 70% 55%) 1px, transparent 0)",
            backgroundSize: "40px 40px"
          }}
        />
        <div className="w-full max-w-sm relative">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <img src="/hrflow-mark.png" alt="HRFlow" style={{ width: 40, height: 40 }} />
            <span className="font-bold text-lg tracking-tight">HRFlow</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
