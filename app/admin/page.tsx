"use client"

export const dynamic = "force-dynamic"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    if (isAdminAuthenticated()) {
      router.replace("/reviews")
    } else {
      router.replace("/")
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  )
}
