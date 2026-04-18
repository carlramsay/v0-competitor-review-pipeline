"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/top-nav"
import { getSettings, saveSettings } from "@/lib/store"
import { Eye, EyeOff, Check, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

const inputClass =
  "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"

export default function SetupPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [alreadySet, setAlreadySet] = useState(false)

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings.adminPassword) {
        setAlreadySet(true)
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!password.trim()) {
      setError("Please enter a password")
      return
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    const settings = await getSettings()
    await saveSettings({ ...settings, adminPassword: password })
    setSaved(true)
    setTimeout(() => {
      router.push("/admin")
    }, 1500)
  }

  if (alreadySet) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="mx-auto max-w-md px-4 py-16">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock size={24} className="text-primary" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Admin Already Configured</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              An admin password has already been set. To change settings, log in to the admin area.
            </p>
            <a
              href="/admin"
              className="mt-6 inline-block rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Go to Admin Login
            </a>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-lg border border-border bg-card p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock size={24} className="text-primary" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Set Admin Password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a password to protect the admin area where you can manage settings and review submissions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={cn(inputClass, "pr-10")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide" : "Show"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className={inputClass}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm admin password"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={saved}
              className="mt-2 flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              {saved ? (
                <>
                  <Check size={15} />
                  Password Set - Redirecting...
                </>
              ) : (
                "Set Password & Continue"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
