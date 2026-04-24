"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { clearAdminSession } from "@/lib/admin-auth"
import { LogOut, ShieldCheck } from "lucide-react"

const tabs = [
  { label: "Reviews", href: "/admin/reviews" },
  { label: "Settings", href: "/admin/settings" },
]

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    clearAdminSession()
    router.replace("/admin")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-1">
          <div className="mr-4 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-primary" />
            <span className="text-sm font-semibold tracking-wide text-foreground/60">
              Admin
            </span>
          </div>
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </header>
  )
}
