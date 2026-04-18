"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { TopNav } from "@/components/top-nav"
import { ReviewRecord } from "@/lib/types"
import { getReviewById } from "@/lib/store"
import { calcTotalScore } from "@/lib/review-utils"
import { ContentGeneration } from "@/components/content-generation"
import { ArrowLeft, Zap } from "lucide-react"

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [record, setRecord] = useState<ReviewRecord | null>(null)

  useEffect(() => {
    getReviewById(id).then((r) => {
      if (!r) {
        router.replace("/reviews")
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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link
                href="/reviews"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={13} />
                Reviews
              </Link>
            </div>
            <h1 className="text-xl font-bold text-foreground text-balance">
              {record.formData.competitorName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              By {record.formData.reviewerName} &middot; {submittedDate} &middot; Device: {record.formData.deviceUsed}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Score: <span className="font-medium text-foreground">{compTotal}/80</span> competitor &nbsp;|&nbsp;{" "}
              <span className="font-medium text-foreground">{arousrTotal}/80</span> Arousr
            </p>
          </div>
          <Link
            href={`/generate/${record.id}`}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Zap size={14} />
            Generate Content
          </Link>
        </div>
        <ContentGeneration record={record} />
      </main>
    </div>
  )
}
