"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TopNav } from "@/components/top-nav"
import { ReviewRecord, PipelineStatus, TaskStatus } from "@/lib/types"
import { getReviews, updateTaskStatus, getSettings } from "@/lib/store"
import { calcTotalScore } from "@/lib/review-utils"
import { FileText, ChevronDown, ChevronUp, Check, Circle } from "lucide-react"

const DEFAULT_PIPELINE: PipelineStatus = {
  reviewSubmitted: true,
  reviewApproved: false,
  blogPostGenerated: false,
  videoScriptGenerated: false,
  voiceoverGenerated: false,
  avatarVideoGenerated: false,
  allContentReady: false,
}

const DEFAULT_TASKS: TaskStatus = {
  blogPublishedArousr: false,
  videoPostedYouTube: false,
  videoPostedXBIZ: false,
  videoEmbeddedBlog: false,
  blogPostedMedium: false,
  linkedInArticle: false,
  xPost: false,
  facebookPost: false,
}

const PIPELINE_LABELS: { key: keyof PipelineStatus; label: string; requiresAdmin?: boolean }[] = [
  { key: "reviewSubmitted", label: "Review Submitted" },
  { key: "reviewApproved", label: "Review Approved by Admin", requiresAdmin: true },
  { key: "blogPostGenerated", label: "Blog Post Draft Generated" },
  { key: "videoScriptGenerated", label: "Video Script Generated" },
  { key: "avatarVideoGenerated", label: "Avatar Video Generated" },
  { key: "allContentReady", label: "All Content Ready (Admin Approved)", requiresAdmin: true },
]

const TASK_LABELS: { key: keyof TaskStatus; label: string }[] = [
  { key: "blogPublishedArousr", label: "Blog Post Published on Arousr" },
  { key: "videoPostedYouTube", label: "Video Posted on YouTube" },
  { key: "videoPostedXBIZ", label: "Video Posted on XBIZ.tv" },
  { key: "videoEmbeddedBlog", label: "Video Embedded in Arousr Blog Post" },
  { key: "blogPostedMedium", label: "Blog Posted on Medium (with canonical link to Arousr)" },
  { key: "linkedInArticle", label: "LinkedIn Article Posted" },
  { key: "xPost", label: "X.com Post with Link to Arousr Blog" },
  { key: "facebookPost", label: "Facebook Post with Link to Medium Article" },
]

function ReviewCard({ record, onTaskUpdate }: { record: ReviewRecord; onTaskUpdate: (id: string, tasks: TaskStatus) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [storedAdminPassword, setStoredAdminPassword] = useState("")
  
  const pipeline = record.pipelineStatus || DEFAULT_PIPELINE
  const tasks = record.tasks || DEFAULT_TASKS

  useEffect(() => {
    getSettings().then((s) => setStoredAdminPassword(s.adminPassword))
  }, [])

  const pipelineComplete = Object.values(pipeline).filter(Boolean).length
  const pipelineTotal = Object.keys(pipeline).length
  const tasksComplete = Object.values(tasks).filter(Boolean).length
  const tasksTotal = Object.keys(tasks).length

  const { competitor: compTotal } = calcTotalScore(record.formData.scores)
  const submittedDate = new Date(record.submittedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const handleTaskToggle = async (key: keyof TaskStatus) => {
    const newTasks = { ...tasks, [key]: !tasks[key] }
    onTaskUpdate(record.id, newTasks)
    await updateTaskStatus(record.id, { [key]: !tasks[key] })
  }

  const isAdminVerified = adminPassword === storedAdminPassword && storedAdminPassword !== ""

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header - clickable to expand */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-secondary/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-foreground">
            {record.formData.competitorName}
          </h3>
          <p className="text-xs text-muted-foreground">
            {record.formData.reviewerName} &middot; {submittedDate}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <span className={pipelineComplete === pipelineTotal ? "text-green-500" : ""}>
              Pipeline: {pipelineComplete}/{pipelineTotal}
            </span>
            {" · "}
            <span className={tasksComplete === tasksTotal ? "text-green-500" : ""}>
              Tasks: {tasksComplete}/{tasksTotal}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-primary">{compTotal}/80</span>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-6">
          {/* Link to review details */}
          <Link
            href={`/reviews/${record.id}`}
            className="inline-block text-xs text-primary hover:underline"
          >
            View Full Review &rarr;
          </Link>

          {/* Section 1: Pipeline Status */}
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">
              Content Pipeline Status
            </h4>
            <div className="space-y-2">
              {PIPELINE_LABELS.map(({ key, label, requiresAdmin }) => {
                const isComplete = pipeline[key]
                return (
                  <div key={key} className="flex items-center gap-2">
                    {isComplete ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Circle size={16} className="text-muted-foreground" />
                    )}
                    <span className={`text-sm ${isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                      {label}
                      {requiresAdmin && <span className="text-xs ml-1">(Admin)</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 2: Manual Tasks */}
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">
              Tasks
            </h4>
            <div className="space-y-2">
              {TASK_LABELS.map(({ key, label }) => {
                const isComplete = tasks[key]
                return (
                  <label
                    key={key}
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isComplete}
                      onChange={() => handleTaskToggle(key)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <span className={`text-sm ${isComplete ? "text-foreground line-through" : "text-muted-foreground"} group-hover:text-foreground transition-colors`}>
                      {label}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Admin password input for admin-only actions */}
          {!isAdminVerified && storedAdminPassword && (
            <div className="pt-2 border-t border-border">
              <label className="text-xs text-muted-foreground">
                Enter admin password to approve content:
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 w-full max-w-xs rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Admin password"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([])

  useEffect(() => {
    getReviews().then(setReviews)
  }, [])

  const handleTaskUpdate = (id: string, tasks: TaskStatus) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, tasks } : r))
    )
  }

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
            {reviews.map((record) => (
              <ReviewCard
                key={record.id}
                record={record}
                onTaskUpdate={handleTaskUpdate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
