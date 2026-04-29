"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { ReviewForm } from "@/components/review-form"
import { TopNav } from "@/components/top-nav"

export default function FormPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace("/")
    } else {
      setChecking(false)
    }
  }, [router])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <ReviewForm />
      </div>
    </main>
  )
}
