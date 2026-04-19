"use client"

// Supabase-backed store - migrated from localStorage for persistent storage
import { createClient } from "@/lib/supabase/client"
import { ReviewRecord, AppSettings, GeneratedContent, ThumbnailImage, QueueItem, ReviewFormData, PipelineStatus, TaskStatus } from "./types"

const DEFAULT_SETTINGS: AppSettings = {
  wpSiteUrl: "",
  wpUsername: "",
  wpAppPassword: "",
  openaiApiKey: "",
  adminPassword: "",
  thumbnailSiteName: "Arousr",
  heygenApiKey: "",
  heygenAvatarId: "",
  heygenVoiceId: "",
  logoVideoBase64: "",
  avatarVideoBase64: "",
}

// ============ REVIEWS ============

export async function getReviews(): Promise<ReviewRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("submitted_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching reviews:", error)
    return []
  }

  return (data || []).map((row) => ({
    id: row.id,
    submittedAt: row.submitted_at,
    formData: row.form_data as ReviewFormData,
    generated: row.generated as GeneratedContent,
    pipelineStatus: row.pipeline_status as PipelineStatus | undefined,
    tasks: row.tasks as TaskStatus | undefined,
  }))
}

export async function saveReview(record: ReviewRecord): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("reviews").upsert({
    id: record.id,
    submitted_at: record.submittedAt,
    form_data: record.formData,
    generated: record.generated,
    pipeline_status: record.pipelineStatus || { reviewSubmitted: true, reviewApproved: false, blogPostGenerated: false, videoScriptGenerated: false, avatarVideoGenerated: false, allContentReady: false },
    tasks: record.tasks || { blogPublishedArousr: false, videoPostedYouTube: false, videoPostedXBIZ: false, videoEmbeddedBlog: false, blogPostedMedium: false, linkedInArticle: false, xPost: false, facebookPost: false, instagramPost: false },
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("[v0] Error saving review:", error)
    throw error
  }
}

export async function getReviewByCompetitorName(name: string, url?: string): Promise<ReviewRecord | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("submitted_at", { ascending: false })

  if (error || !data) {
    console.error("[v0] Error fetching reviews by name:", error)
    return null
  }

  console.log("[v0] Looking for review with name:", name, "url:", url)
  console.log("[v0] Found", data.length, "reviews to search")

  // Find review where competitorName or competitorUrl matches (case-insensitive)
  const match = data.find((row) => {
    const formData = row.form_data as ReviewFormData
    const nameMatch = formData.competitorName?.toLowerCase() === name?.toLowerCase()
    const urlMatch = url && formData.competitorUrl?.toLowerCase() === url?.toLowerCase()
    console.log("[v0] Checking review:", formData.competitorName, "nameMatch:", nameMatch, "urlMatch:", urlMatch)
    return nameMatch || urlMatch
  })

  if (!match) {
    console.log("[v0] No matching review found")
    return null
  }

  console.log("[v0] Found matching review:", match.id)
  return {
    id: match.id,
    submittedAt: match.submitted_at,
    formData: match.form_data as ReviewFormData,
    generated: match.generated as GeneratedContent,
    pipelineStatus: match.pipeline_status as PipelineStatus | undefined,
    tasks: match.tasks as TaskStatus | undefined,
  }
}

export async function getReviewById(id: string): Promise<ReviewRecord | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    submittedAt: data.submitted_at,
    formData: data.form_data as ReviewFormData,
    generated: data.generated as GeneratedContent,
    pipelineStatus: data.pipeline_status as PipelineStatus | undefined,
    tasks: data.tasks as TaskStatus | undefined,
  }
}

export async function updateGeneratedContent(
  id: string,
  content: Partial<GeneratedContent>
): Promise<ReviewRecord | null> {
  const supabase = createClient()
  
  // First get the current record
  const { data: current, error: fetchError } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !current) {
    console.error("[v0] Error fetching review for update:", fetchError)
    return null
  }

  // Merge the generated content
  const updatedGenerated = { ...current.generated, ...content }

  const { data, error } = await supabase
    .from("reviews")
    .update({
      generated: updatedGenerated,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error || !data) {
    console.error("[v0] Error updating generated content:", error)
    return null
  }

  return {
    id: data.id,
    submittedAt: data.submitted_at,
    formData: data.form_data as ReviewFormData,
    generated: data.generated as GeneratedContent,
  }
}

// ============ PIPELINE STATUS & TASKS ============

export async function updatePipelineStatus(
  id: string,
  updates: Partial<PipelineStatus>
): Promise<ReviewRecord | null> {
  const supabase = createClient()
  
  const { data: current, error: fetchError } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !current) {
    console.error("[v0] Error fetching review for pipeline update:", fetchError)
    return null
  }

  const updatedPipeline = { ...current.pipeline_status, ...updates }

  const { data, error } = await supabase
    .from("reviews")
    .update({
      pipeline_status: updatedPipeline,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error || !data) {
    console.error("[v0] Error updating pipeline status:", error)
    return null
  }

  return {
    id: data.id,
    submittedAt: data.submitted_at,
    formData: data.form_data as ReviewFormData,
    generated: data.generated as GeneratedContent,
    pipelineStatus: data.pipeline_status as PipelineStatus | undefined,
    tasks: data.tasks as TaskStatus | undefined,
  }
}

export async function updateTaskStatus(
  id: string,
  updates: Partial<TaskStatus>
): Promise<ReviewRecord | null> {
  const supabase = createClient()
  
  const { data: current, error: fetchError } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !current) {
    console.error("[v0] Error fetching review for task update:", fetchError)
    return null
  }

  const updatedTasks = { ...current.tasks, ...updates }

  const { data, error } = await supabase
    .from("reviews")
    .update({
      tasks: updatedTasks,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error || !data) {
    console.error("[v0] Error updating task status:", error)
    return null
  }

  return {
    id: data.id,
    submittedAt: data.submitted_at,
    formData: data.form_data as ReviewFormData,
    generated: data.generated as GeneratedContent,
    pipelineStatus: data.pipeline_status as PipelineStatus | undefined,
    tasks: data.tasks as TaskStatus | undefined,
  }
}

// ============ SETTINGS ============

export async function getSettings(): Promise<AppSettings> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .single()

  if (error || !data) {
    return { ...DEFAULT_SETTINGS }
  }

  return {
    wpSiteUrl: data.wp_site_url || "",
    wpUsername: data.wp_username || "",
    wpAppPassword: data.wp_app_password || "",
    openaiApiKey: data.openai_api_key || "",
    adminPassword: data.admin_password || "",
    thumbnailSiteName: data.thumbnail_site_name || "Arousr",
    heygenApiKey: data.heygen_api_key || "",
    heygenAvatarId: data.heygen_avatar_id || "",
    heygenVoiceId: data.heygen_voice_id || "",
    logoVideoBase64: "",  // Large videos stored separately
    avatarVideoBase64: "", // Large videos stored separately
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("app_settings").upsert({
    id: 1,
    wp_site_url: settings.wpSiteUrl,
    wp_username: settings.wpUsername,
    wp_app_password: settings.wpAppPassword,
    openai_api_key: settings.openaiApiKey,
    admin_password: settings.adminPassword,
    thumbnail_site_name: settings.thumbnailSiteName,
    heygen_api_key: settings.heygenApiKey,
    heygen_avatar_id: settings.heygenAvatarId,
    heygen_voice_id: settings.heygenVoiceId,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("[v0] Error saving settings:", error)
    throw error
  }
}

// ============ THUMBNAIL LIBRARY ============

export async function getThumbnailLibrary(): Promise<ThumbnailImage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("thumbnail_images")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching thumbnails:", error)
    return []
  }

  return (data || []).map((row) => ({
    id: row.id,
    label: row.label,
    dataUrl: row.data_url,
  }))
}

export async function saveThumbnailLibrary(images: ThumbnailImage[]): Promise<void> {
  const supabase = createClient()
  
  // Delete all existing and insert new ones
  await supabase.from("thumbnail_images").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  
  if (images.length > 0) {
    const { error } = await supabase.from("thumbnail_images").insert(
      images.map((img) => ({
        id: img.id,
        label: img.label,
        data_url: img.dataUrl,
      }))
    )
    if (error) {
      console.error("[v0] Error saving thumbnails:", error)
      throw error
    }
  }
}

export async function addThumbnailImage(image: ThumbnailImage): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("thumbnail_images").insert({
    id: image.id,
    label: image.label,
    data_url: image.dataUrl,
  })

  if (error) {
    console.error("[v0] Error adding thumbnail:", error)
    throw error
  }
}

export async function deleteThumbnailImage(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("thumbnail_images").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting thumbnail:", error)
    throw error
  }
}

// ============ DRAFT ============

export async function saveDraft(formData: ReviewFormData): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("draft").upsert({
    id: 1,
    form_data: formData,
    saved_at: new Date().toISOString(),
  })

  if (error) {
    console.error("[v0] Error saving draft:", error)
    throw error
  }
}

export async function getDraft(): Promise<{ formData: ReviewFormData; savedAt: string } | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("draft")
    .select("*")
    .eq("id", 1)
    .single()

  if (error || !data || !data.form_data) {
    return null
  }

  return {
    formData: data.form_data as ReviewFormData,
    savedAt: data.saved_at,
  }
}

export async function clearDraft(): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("draft").update({
    form_data: null,
    saved_at: null,
  }).eq("id", 1)

  if (error) {
    console.error("[v0] Error clearing draft:", error)
  }
}

// ============ QUEUE ============

export async function getQueue(): Promise<QueueItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("queue_items")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching queue:", error)
    return []
  }

  return (data || []).map((row) => ({
    id: row.id,
    url: row.url,
    name: row.name || "",
    status: row.status as "Not Started" | "In Progress" | "Completed",
    statusUpdatedAt: row.status_updated_at,
  }))
}

export async function saveQueue(queue: QueueItem[]): Promise<void> {
  const supabase = createClient()
  
  // Delete all and insert new
  await supabase.from("queue_items").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  
  if (queue.length > 0) {
    const { error } = await supabase.from("queue_items").insert(
      queue.map((item) => ({
        id: item.id,
        url: item.url,
        name: item.name,
        status: item.status,
        status_updated_at: item.statusUpdatedAt,
      }))
    )
    if (error) {
      console.error("[v0] Error saving queue:", error)
      throw error
    }
  }
}

export async function addToQueue(url: string, name = ""): Promise<QueueItem> {
  const supabase = createClient()
  const item: QueueItem = {
    id: crypto.randomUUID(),
    url,
    name,
    status: "Not Started",
    statusUpdatedAt: new Date().toISOString(),
  }

  const { error } = await supabase.from("queue_items").insert({
    id: item.id,
    url: item.url,
    name: item.name,
    status: item.status,
    status_updated_at: item.statusUpdatedAt,
  })

  if (error) {
    console.error("[v0] Error adding to queue:", error)
    throw error
  }

  return item
}

export async function updateQueueItemStatus(
  id: string,
  status: "Not Started" | "In Progress" | "Completed"
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("queue_items")
    .update({
      status,
      status_updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("[v0] Error updating queue item status:", error)
    throw error
  }
}

export async function updateQueueItemName(id: string, name: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("queue_items")
    .update({ name })
    .eq("id", id)

  if (error) {
    console.error("[v0] Error updating queue item name:", error)
    throw error
  }
}

export async function removeFromQueue(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("queue_items").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error removing from queue:", error)
    throw error
  }
}

export async function getSortedQueue(): Promise<QueueItem[]> {
  const queue = await getQueue()
  const statusOrder = { "In Progress": 0, "Not Started": 1, "Completed": 2 }
  return [...queue].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
}

// ============ VIDEO ASSETS ============

export async function saveVideoAsset(key: string, base64Data: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("video_assets").upsert({
    key,
    base64_data: base64Data,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("[v0] Error saving video asset:", error)
    throw error
  }
}

export async function getVideoAsset(key: string): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("video_assets")
    .select("base64_data")
    .eq("key", key)
    .single()

  if (error || !data) {
    return null
  }

  return data.base64_data
}

export async function deleteVideoAsset(key: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("video_assets").delete().eq("key", key)

  if (error) {
    console.error("[v0] Error deleting video asset:", error)
  }
}
