"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { TopNav } from "@/components/top-nav"
import { ReviewQueue } from "@/components/review-queue"

export default function QueuePage() {
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
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground text-balance">Review Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the queue of competitor sites to review. Click "Start Review" to begin a review session.
          </p>
        </div>
        <ReviewQueue />
      </main>
    </div>
  )
}
