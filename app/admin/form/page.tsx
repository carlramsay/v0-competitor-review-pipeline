"use client"

export const dynamic = "force-dynamic"

import { AdminNav } from "@/components/admin-nav"
import { ReviewForm } from "@/components/review-form"

export default function AdminFormPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <ReviewForm />
      </main>
    </div>
  )
}
