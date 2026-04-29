"use client"

import { ShieldCheck, Home, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const tabs = [
  { label: "Queue", href: "/queue" },
]

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="mr-3 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
            aria-label="Home"
          >
            <Home size={18} />
          </Link>
          {tabs.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/" || pathname.startsWith("/generate")
                : tab.href === "/queue"
                ? pathname.startsWith("/queue")
                : pathname.startsWith(tab.href)
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
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              pathname.startsWith("/admin")
                ? "bg-secondary text-primary"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            )}
            aria-label="Admin"
          >
            <ShieldCheck size={16} />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          >
            <LogOut size={13} />
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
