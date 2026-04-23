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
  oneLineVerdict?: string // VA-entered one-sentence summary of the platform
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
