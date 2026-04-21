"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { TopNav } from "@/components/top-nav"
import { ReviewForm } from "@/components/review-form"
import { ReviewRecord } from "@/lib/types"
import { getReviewById } from "@/lib/store"

export default function EditReviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [record, setRecord] = useState<ReviewRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReviewById(id).then((r) => {
      if (!r) {
        router.replace("/reviews")
        return
      }
      setRecord(r)
      setLoading(false)
    })
  }, [id, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <TopNav />
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  if (!record) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold text-foreground text-center">
          {record.formData.competitorName} Review
        </h1>
        <ReviewForm initialData={record.formData} reviewId={record.id} />
      </div>
    </main>
  )
}
