"use client"

import { ShieldCheck } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { label: "Queue", href: "/queue" },
  { label: "Reviews", href: "/reviews" },
]

export function TopNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-1">
          <span className="mr-4 text-sm font-semibold tracking-wide text-foreground/60">
            Review Pipeline
          </span>
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
      </div>
    </header>
  )
}
