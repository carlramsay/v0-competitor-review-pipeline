"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { AdminGuard } from "@/components/admin-guard"
import { AdminNav } from "@/components/admin-nav"
import { ReviewRecord } from "@/lib/types"
import { getReviewById } from "@/lib/store"
import { calcTotalScore } from "@/lib/review-utils"
import {
  SECTION_1_QUESTIONS,
  SECTION_2_QUESTIONS,
  SECTION_3_QUESTIONS,
  SECTION_4_QUESTIONS,
  SECTION_5_QUESTIONS,
  SECTION_6_QUESTIONS,
} from "@/lib/questions"
import { ReviewFormData } from "@/lib/types"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { title: "Signup & Verification", questions: SECTION_1_QUESTIONS },
  { title: "Interface & Navigation", questions: SECTION_2_QUESTIONS },
  { title: "Pricing & Value", questions: SECTION_3_QUESTIONS },
  { title: "Chat Quality & Interaction", questions: SECTION_4_QUESTIONS },
  { title: "Privacy & Safety", questions: SECTION_5_QUESTIONS },
  { title: "Overall Impression", questions: SECTION_6_QUESTIONS },
]

function AnswerBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("text-sm leading-relaxed text-foreground", !value && "italic text-muted-foreground")}>
        {value || "No answer provided."}
      </p>
    </div>
  )
}

function AdminReviewDetailContent() {
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
        <AdminNav />
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const { competitor, arousr } = calcTotalScore(record.formData.scores)
  const formData = record.formData
  const date = new Date(record.submittedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Back */}
        <Link
          href="/reviews"
          className="mb-5 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={13} />
          All Reviews
        </Link>

        {/* Header card */}
        <div className="mb-6 rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground text-balance">
                {formData.competitorName ? `${formData.competitorName} Review` : "Competitor Review"}
              </h1>
              {formData.competitorUrl && (
                <a
                  href={formData.competitorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  {formData.competitorUrl}
                </a>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                Reviewed by <span className="text-foreground">{formData.reviewerName}</span> on {date} &middot; Device:{" "}
                <span className="text-foreground">{formData.deviceUsed}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <div className="text-xs text-muted-foreground">Competitor score</div>
              <div className="text-2xl font-bold text-primary">{competitor}<span className="text-base font-normal text-muted-foreground">/80</span></div>
              <div className="text-xs text-muted-foreground">Arousr: <span className="text-foreground font-medium">{arousr}/80</span></div>
            </div>
          </div>
        </div>

        {/* Score table */}
        <section className="mb-6 rounded-lg border border-border bg-card overflow-hidden">
          <div className="border-b border-border bg-secondary/30 px-5 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Scores
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-2.5 text-left text-xs text-muted-foreground font-medium">Feature</th>
                <th className="px-4 py-2.5 text-center text-xs text-muted-foreground font-medium">Competitor</th>
                <th className="px-4 py-2.5 text-center text-xs text-muted-foreground font-medium">Arousr</th>
                <th className="px-4 py-2.5 text-left text-xs text-muted-foreground font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {formData.scores.map((row, i) => (
                <tr key={i} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-2.5 font-medium text-foreground">{row.feature}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn("font-semibold", row.competitorScore !== "" && Number(row.competitorScore) >= 7 ? "text-primary" : "text-muted-foreground")}>
                      {row.competitorScore !== "" ? row.competitorScore : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn("font-semibold", row.arousrScore !== "" && Number(row.arousrScore) >= 7 ? "text-primary" : "text-muted-foreground")}>
                      {row.arousrScore !== "" ? row.arousrScore : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.notes || "—"}</td>
                </tr>
              ))}
              <tr className="bg-secondary/30 font-semibold">
                <td className="px-5 py-2.5 text-xs uppercase tracking-wider text-muted-foreground">Total</td>
                <td className="px-4 py-2.5 text-center text-primary">{competitor}</td>
                <td className="px-4 py-2.5 text-center text-foreground">{arousr}</td>
                <td className="px-4 py-2.5" />
              </tr>
            </tbody>
          </table>
        </section>

        {/* Q&A Sections */}
        {SECTIONS.map((section, si) => (
          <section key={si} className="mb-6 rounded-lg border border-border bg-card overflow-hidden">
            <div className="border-b border-border bg-secondary/30 px-5 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {si + 1}. {section.title}
              </h2>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {section.questions.map((q) => (
                <div key={q.key} className="px-5 py-4">
                  <AnswerBlock
                    label={q.label}
                    value={String(formData[q.key as keyof ReviewFormData] ?? "")}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Review Screenshots */}
        {formData.reviewScreenshots && formData.reviewScreenshots.length > 0 && (
          <section className="mb-6 rounded-lg border border-border bg-card overflow-hidden">
            <div className="border-b border-border bg-secondary/30 px-5 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Review Screenshots ({formData.reviewScreenshots.length})
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {formData.reviewScreenshots.map((dataUrl, index) => (
                  <a
                    key={index}
                    href={dataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-video rounded-md overflow-hidden border border-border hover:border-primary transition-colors"
                  >
                    <img
                      src={dataUrl}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs text-white font-medium">View full size</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Meta */}
        <section className="mb-6 rounded-lg border border-border bg-card overflow-hidden">
          <div className="border-b border-border bg-secondary/30 px-5 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Meta
            </h2>
          </div>
          <div className="flex flex-col divide-y divide-border">
            <div className="px-5 py-4">
              <AnswerBlock label="How did you discover this competitor?" value={formData.q29 || ""} />
            </div>
            {formData.q30 && (
              <div className="px-5 py-4">
                <AnswerBlock label="Additional notes" value={formData.q30} />
              </div>
            )}
          </div>
        </section>

        {/* Generated content summary */}
        {(record.generated.blogPost || record.generated.wordpressDraftUrl) && (
          <section className="mb-6 rounded-lg border border-border bg-card overflow-hidden">
            <div className="border-b border-border bg-secondary/30 px-5 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Generated Content
              </h2>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              {record.generated.blogPost && (
                <div className="flex items-center justify-between rounded-md border border-border bg-secondary/20 px-4 py-3">
                  <span className="text-sm text-foreground">Blog post generated</span>
                  {record.generated.wordpressDraftUrl ? (
                    <a
                      href={record.generated.wordpressDraftUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View WordPress draft
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not pushed to WordPress</span>
                  )}
                </div>
              )}
              {record.generated.videoScript && (
                <div className="flex items-center justify-between rounded-md border border-border bg-secondary/20 px-4 py-3">
                  <span className="text-sm text-foreground">Video script generated</span>
                </div>
              )}
              {(record.generated.tweetSnippet || record.generated.instagramSnippet || record.generated.redditSnippet) && (
                <div className="flex items-center justify-between rounded-md border border-border bg-secondary/20 px-4 py-3">
                  <span className="text-sm text-foreground">Social snippets generated</span>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default function AdminReviewDetailPage() {
  return (
    <AdminGuard>
      <AdminReviewDetailContent />
    </AdminGuard>
  )
}
