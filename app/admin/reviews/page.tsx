"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AdminGuard } from "@/components/admin-guard"
import { AdminNav } from "@/components/admin-nav"
import { ReviewRecord } from "@/lib/types"
import { getReviews } from "@/lib/store"
import { calcTotalScore } from "@/lib/review-utils"
import { FileText, ExternalLink } from "lucide-react"

function AdminReviewsContent() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([])

  useEffect(() => {
    setReviews(getReviews())
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground text-balance">Reviews</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {reviews.length} total review{reviews.length !== 1 ? "s" : ""} submitted.
            </p>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card/30 py-16">
            <FileText size={40} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No reviews have been submitted yet.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Competitor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Reviewer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Device
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Score
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    View
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.map((record) => {
                  const { competitor, arousr } = calcTotalScore(record.formData.scores)
                  const date = new Date(record.submittedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                  return (
                    <tr key={record.id} className="transition-colors hover:bg-secondary/20">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-foreground">
                          {record.formData.competitorName}
                        </div>
                        {record.formData.competitorUrl && (
                          <a
                            href={record.formData.competitorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {record.formData.competitorUrl.replace(/^https?:\/\//, "")}
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {record.formData.reviewerName}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{date}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {record.formData.deviceUsed}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-medium text-primary">{competitor}</span>
                        <span className="text-muted-foreground">/80</span>
                        <span className="mx-1.5 text-muted-foreground/40">|</span>
                        <span className="font-medium text-foreground">{arousr}</span>
                        <span className="text-muted-foreground">/80</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/admin/reviews/${record.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

export default function AdminReviewsPage() {
  return (
    <AdminGuard>
      <AdminReviewsContent />
    </AdminGuard>
  )
}
