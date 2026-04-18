"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TopNav } from "@/components/top-nav"
import { ReviewRecord } from "@/lib/types"
import { getReviews } from "@/lib/store"
import { calcTotalScore } from "@/lib/review-utils"
import { FileText } from "lucide-react"

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([])

  useEffect(() => {
    setReviews(getReviews())
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground text-balance">All Reviews</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View and manage past competitor reviews.
            </p>
          </div>
          <Link
            href="/seed"
            className="shrink-0 rounded-md border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70"
          >
            Load Mock Review
          </Link>
        </div>

        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card/30 py-16">
            <FileText size={40} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No reviews yet. Create your first one!</p>
            <Link
              href="/"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              New Review
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((record) => {
              const { competitor: compTotal } = calcTotalScore(record.formData.scores)
              const submittedDate = new Date(record.submittedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
              return (
                <Link
                  key={record.id}
                  href={`/reviews/${record.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4 transition-colors hover:bg-secondary/40"
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {record.formData.competitorName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {record.formData.reviewerName} &middot; {submittedDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-primary">
                    <span>{compTotal}/80</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
