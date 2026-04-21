"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { TopNav } from "@/components/top-nav"
import { ContentGeneration } from "@/components/content-generation"
import { ReviewRecord } from "@/lib/types"
import { getReviewById } from "@/lib/store"
import { calcTotalScore } from "@/lib/review-utils"
import Link from "next/link"
import { ArrowLeft, RefreshCw } from "lucide-react"

export default function GeneratePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [record, setRecord] = useState<ReviewRecord | null>(null)

  useEffect(() => {
    getReviewById(id).then((r) => {
      if (!r) {
        router.replace("/")
        return
      }
      setRecord(r)
    })
  }, [id, router])

  if (!record) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const { competitor: compTotal, arousr: arousrTotal } = calcTotalScore(record.formData.scores)
  const submittedDate = new Date(record.submittedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link
                href={`/reviews/${id}`}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={13} />
                Review
              </Link>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs text-muted-foreground">Content Generation</span>
            </div>
            <h1 className="text-xl font-bold text-foreground text-balance">
              {record.formData.competitorName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Reviewed by {record.formData.reviewerName} &middot; {submittedDate} &middot; Score:{" "}
              <span className="text-foreground font-medium">{compTotal}/80</span> competitor vs{" "}
              <span className="text-foreground font-medium">{arousrTotal}/80</span> Arousr
            </p>
          </div>
          <Link
            href={`/reviews/${id}`}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          >
            <RefreshCw size={13} />
            Edit Form
          </Link>
        </div>
        <ContentGeneration record={record} />
      </main>
    </div>
  )
}
