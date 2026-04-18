export type QueueStatus = "Not Started" | "In Progress" | "Completed"

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

  // Section 7 — Scores
  scores: ScoreRow[]

  // Section 8 — Meta
  q29: string
  q30: string
}

export interface GeneratedContent {
  blogPost?: string
  blogPostMarkdown?: string
  videoScript?: string
  voiceoverBase64?: string
  voiceoverScriptHash?: string
  tweetSnippet?: string
  instagramSnippet?: string
  redditSnippet?: string
  linkedinPost?: string
  wordpressDraftUrl?: string
}

export interface ReviewRecord {
  id: string
  submittedAt: string
  formData: ReviewFormData
  generated: GeneratedContent
}

export interface ThumbnailImage {
  id: string
  label: string
  dataUrl: string // resized base64 JPEG
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
  logoVideoBase64?: string // base64 encoded MP4 for video ending screen
  avatarVideoBase64?: string // base64 encoded MP4 for presenter avatar PiP
}
