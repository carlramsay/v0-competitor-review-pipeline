"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSettings } from "@/lib/store"
import { setAdminSession, isAdminAuthenticated } from "@/lib/admin-auth"
import { Eye, EyeOff, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

const inputClass =
  "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"

export default function Home() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [checking, setChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if already authenticated
  useEffect(() => {
    if (isAdminAuthenticated()) {
      setIsAuthenticated(true)
    }
    setChecking(false)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const settings = await getSettings()
    const stored = settings.adminPassword

    if (!stored) {
      setError("No password has been configured. Set one in Settings first.")
      return
    }

    if (password !== stored) {
      setError("Incorrect password.")
      setPassword("")
      return
    }

    setAdminSession()
    setIsAuthenticated(true)
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo / heading */}
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden shadow-lg">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-ad-glJJvyaXrD5KoylEleVYC12hDTkUL8.jpg"
                alt="Arousr Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground">Reviews Platform</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your password to continue.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  className={cn(inputClass, "pr-10")}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError("")
                  }}
                  placeholder="Enter password"
                  autoFocus
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="mt-1 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Lock size={14} />
              Sign in
            </button>
          </form>
        </div>
      </main>
    )
  }

  // Show navigation if authenticated
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-ad-glJJvyaXrD5KoylEleVYC12hDTkUL8.jpg"
            alt="Arousr Logo"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Reviews Platform
        </h1>

        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link
            href="/queue"
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-center transition-colors hover:bg-primary/90"
          >
            Queue
          </Link>
          <Link
            href="/admin/settings"
            className="px-6 py-3 rounded-lg border border-border text-foreground font-medium text-center transition-colors hover:bg-secondary"
          >
            Admin
          </Link>
        </div>
      </div>
    </main>
  )
}
