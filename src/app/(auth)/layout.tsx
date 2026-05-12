import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Briefcase } from "lucide-react";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-white/20 rounded-xl">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white">HRFlow</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your<br />team with ease
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            HR & Internal Communication Platform built for modern organisations.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { n: "7+",    l: "Team Members"     },
              { n: "3",     l: "Departments"      },
              { n: "100%",  l: "Uptime"           },
              { n: "Fast",  l: "Performance"      },
            ].map(({ n, l }) => (
              <div key={l} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white font-bold text-2xl">{n}</p>
                <p className="text-white/70 text-sm">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-sm">© 2026 HRFlow. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-xl">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">HRFlow</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
