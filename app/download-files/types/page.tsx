"use client"

import { useState } from "react"

const typesFileContent = `export type QueueStatus = "Not Started" | "In Progress" | "Completed"

export interface QueueItem {
  id: string
  url: string
  name: string
  status: QueueStatus
  statusUpdatedAt: string
}

export interface ScoreRow {
  feature: string
  competitorScore: number | ""
  arousrScore: number | ""
  notes: string
}

export interface ReviewFormData {
  // Header fields
  reviewerName: string
  competitorName: string
  competitorUrl: string
  date: string
  deviceUsed: "Mobile" | "Desktop" | "Both"

  // Section 1 — Signup & Verification
  q1: string
  q2: string
  q3: string
  q4: string
  q5: string

  // Section 2 — Interface & Navigation
  q6: string
  q7: string
  q8: string
  q9: string

  // Section 3 — Pricing & Value
  q10: string
  q11: string // number USD
  q12: string
  q13: string

  // Section 4 — Chat Quality & Interaction
  q14: string // number minutes
  q15: string
  q16: string
  q17: string
  q18: string
  q19: string

  // Section 5 — Privacy & Safety
  q20: string
  q21: string
  q22: string
  q23: string
  q24: string
  q25: string
  q26: string
  q27: string
  q28: string

  // Section 6.5 — Review Screenshots (for video backgrounds)
  // Array of base64 data URLs, ordered by priority (index 0 = first in video)
  reviewScreenshots?: string[]

  // Section 7 — Scores
  scores: ScoreRow[]

  // Section 8 — Meta
  q29: string
  q30: string
}

export interface GeneratedContent {
  blogPost?: string
  blogPostMarkdown?: string
  blogPostTitle?: string // single editable blog post title
  blogPostTitles?: string[] // 3 title variations (deprecated)
  blogPostMeta?: string // meta description 150-160 chars
  videoTitle?: string // video title under 70 chars
  blogPostYouTubeTitle?: string // YouTube title under 70 chars (deprecated, use videoTitle)
  videoScript?: string
  voiceoverBase64?: string
  voiceoverScriptHash?: string
  tweetSnippet?: string
  instagramSnippet?: string
  redditSnippet?: string
  linkedinPost?: string
  facebookPost?: string
  facebookImageUrl?: string
  wordpressDraftUrl?: string
  thumbnailDataUrl?: string
  thumbnailVerticalDataUrl?: string
  videoDataUrl?: string
  videoVerticalDataUrl?: string
}

export interface PipelineStatus {
  reviewSubmitted: boolean
  reviewApproved: boolean
  blogPostGenerated: boolean
  videoScriptGenerated: boolean
  avatarVideoGenerated: boolean
  allContentReady: boolean
}

export interface TaskStatus {
  blogPublishedArousr: boolean
  videoPostedYouTube: boolean
  videoPostedXBIZ: boolean
  videoEmbeddedBlog: boolean
  blogPostedMedium: boolean
  linkedInArticle: boolean
  xPost: boolean
  facebookPost: boolean
  instagramPost: boolean
}

export interface ReviewRecord {
  id: string
  userId?: string // Owner user ID for RLS
  submittedAt: string
  formData: ReviewFormData
  generated: GeneratedContent
  pipelineStatus?: PipelineStatus
  tasks?: TaskStatus
}

export interface ThumbnailImage {
  id: string
  label: string
  dataUrl: string // resized base64 JPEG
}

export interface ArousrScores {
  ease_of_signup: number
  interface_ux: number
  mobile_experience: number
  host_variety: number
  response_time: number
  chat_quality: number
  pricing_transparency: number
  privacy_safety: number
  total: number
}

export interface AppSettings {
  wpSiteUrl: string
  wpUsername: string
  wpAppPassword: string
  openaiApiKey: string
  adminPassword: string
  thumbnailSiteName: string // site name or logo text for bottom of thumbnail
  heygenApiKey: string
  heygenAvatarId: string
  heygenVoiceId: string
  elevenLabsApiKey: string
  elevenLabsVoiceId: string
  logoVideoBase64?: string // base64 encoded MP4 for video ending screen
  avatarVideoBase64?: string // base64 encoded MP4 for presenter avatar PiP
  arousrScores?: ArousrScores // Arousr benchmark scores for content generation
}
`

export default function DownloadTypesPage() {
  const [downloaded, setDownloaded] = useState(false)

  function downloadFile() {
    const blob = new Blob([typesFileContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "types.ts"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Download Types</h1>
        <p className="mb-8 text-muted-foreground">
          File: lib/types.ts
        </p>

        <div className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            This file contains the ArousrScores interface and AppSettings with arousrScores field.
          </p>
          <button
            onClick={downloadFile}
            className={`w-full rounded-md px-4 py-3 text-sm font-medium transition-colors ${
              downloaded
                ? "bg-green-600 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {downloaded ? "Downloaded - types.ts" : "Download types.ts"}
          </button>
        </div>

        <div className="mt-6 text-sm text-muted-foreground">
          <p>Upload this file to GitHub at:</p>
          <code className="mt-2 block rounded bg-muted px-3 py-2 font-mono text-xs">
            lib/types.ts
          </code>
        </div>

        <a href="/download-files" className="mt-6 block text-sm text-primary hover:underline">
          Back to all files
        </a>
      </div>
    </div>
  )
}
