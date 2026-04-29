"use client"

// Supabase-backed store - migrated from localStorage for persistent storage
// Updated for RLS: all operations require authenticated user
import { createClient } from "@/lib/supabase/client"
import { ReviewRecord, AppSettings, GeneratedContent, ThumbnailImage, QueueItem, ReviewFormData, PipelineStatus, TaskStatus } from "./types"

// RLS Error handling
export class RLSError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message)
    this.name = "RLSError"
  }
}

function handleSupabaseError(error: unknown, operation: string): never {
  // Handle Supabase error objects which have { message, code, details, hint }
  let errMsg: string
  if (error && typeof error === 'object' && 'message' in error) {
    errMsg = (error as { message: string }).message
  } else if (error instanceof Error) {
    errMsg = error.message
  } else {
    errMsg = JSON.stringify(error)
  }
  
  console.error(`[v0] Supabase ${operation} error:`, error)
  
  // Check for common RLS/permission errors
  if (errMsg.includes("new row violates row-level security") ||
      errMsg.includes("violates row-level security policy") ||
      errMsg.includes("permission denied") ||
      errMsg.includes("RLS")) {
    throw new RLSError(`Permission denied: You don't have access to ${operation}. Please ensure you're logged in.`, error)
  }
  
  throw new Error(`${operation} failed: ${errMsg}`)
}

// Single-user app - no user_id filtering needed
// Auth is handled by middleware cookie check

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
  elevenLabsApiKey: "",
  elevenLabsVoiceId: "",
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
    userId: row.user_id,
    submittedAt: row.submitted_at,
    formData: row.form_data as ReviewFormData,
    generated: row.generated as GeneratedContent,
    pipelineStatus: row.pipeline_status as PipelineStatus | undefined,
    tasks: row.tasks as TaskStatus | undefined,
  }))
}

export async function saveReview(record: ReviewRecord): Promise<void> {
  // Use server action to bypass RLS
  const { saveReviewAction } = await import("@/app/actions/db")
  const result = await saveReviewAction({
    id: record.id,
    userId: record.userId,
    submittedAt: record.submittedAt,
    formData: record.formData,
    generated: record.generated,
    pipelineStatus: record.pipelineStatus,
    tasks: record.tasks,
  })
  
  if (!result.success) {
    throw new Error(`save review failed: ${result.error}`)
  }
}

export async function getReviewByCompetitorName(name: string, url?: string): Promise<ReviewRecord | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("submitted_at", { ascending: false })

  if (error || !data) {
    return null
  }

  // Find review where competitorName or competitorUrl matches (case-insensitive)
  const match = data.find((row) => {
    const formData = row.form_data as ReviewFormData
    const nameMatch = formData.competitorName?.toLowerCase() === name?.toLowerCase()
    const urlMatch = url && formData.competitorUrl?.toLowerCase() === url?.toLowerCase()
    return nameMatch || urlMatch
  })

  if (!match) {
    return null
  }
  return {
    id: match.id,
    userId: match.user_id,
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
    userId: data.user_id,
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
  // Use server action to bypass RLS
  const { updateGeneratedContentAction } = await import("@/app/actions/db")
  const result = await updateGeneratedContentAction(id, content)
  
  if (!result.success) {
    console.error("[v0] Error updating generated content:", result.error)
    return null
  }
  
  // Fetch and return the updated record
  return getReviewById(id)
}

// Keep old implementation as backup (not used)
async function _updateGeneratedContentOld(
  id: string,
  content: Partial<GeneratedContent>
): Promise<ReviewRecord | null> {
  const supabase = createClient()
  
  // First get the current record to preserve existing data
  const { data: current, error: fetchError } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !current) {
    console.error("[v0] Error fetching review for update:", fetchError)
    return null
  }

  // Safely merge the generated content, preserving all existing fields
  // Handle case where current.generated might be null/undefined
  const existingGenerated = (current.generated || {}) as GeneratedContent
  const updatedGenerated: GeneratedContent = {
    ...existingGenerated,
    ...content,
  }

  try {
    const { data, error } = await supabase
      .from("reviews")
      .update({
        generated: updatedGenerated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      handleSupabaseError(error, "update generated content")
    }
    
    if (!data) {
      return null
    }

    return {
      id: data.id,
      userId: data.user_id,
      submittedAt: data.submitted_at,
      formData: data.form_data as ReviewFormData,
      generated: data.generated as GeneratedContent,
    }
  } catch (err) {
    if (err instanceof RLSError) throw err
    console.error("[v0] Error updating generated content:", err)
    return null
  }
}

// ============ PIPELINE STATUS & TASKS ============

export async function updatePipelineStatus(
  id: string,
  updates: Partial<PipelineStatus>
): Promise<ReviewRecord | null> {
  // Use server action to bypass RLS
  const { updatePipelineStatusAction } = await import("@/app/actions/db")
  const result = await updatePipelineStatusAction(id, updates)
  
  if (!result.success) {
    console.error("[v0] Error updating pipeline status:", result.error)
    return null
  }
  
  // Fetch and return the updated record
  return getReviewById(id)
}

export async function updateTaskStatus(
  id: string,
  updates: Partial<TaskStatus>
): Promise<ReviewRecord | null> {
  // Use server action to bypass RLS
  const { updateTaskStatusAction } = await import("@/app/actions/db")
  const result = await updateTaskStatusAction(id, updates)
  
  if (!result.success) {
    console.error("[v0] Error updating task status:", result.error)
    return null
  }
  
  // Fetch and return the updated record
  return getReviewById(id)
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
    elevenLabsApiKey: data.elevenlabs_api_key || "",
    elevenLabsVoiceId: data.elevenlabs_voice_id || "",
    logoVideoBase64: "",  // Large videos stored separately
    avatarVideoBase64: "", // Large videos stored separately
    arousrScores: data.arousr_scores || undefined,
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
    elevenlabs_api_key: settings.elevenLabsApiKey,
    elevenlabs_voice_id: settings.elevenLabsVoiceId,
    arousr_scores: settings.arousrScores,
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
  // Use server action to bypass RLS
  const { updateQueueItemStatusAction } = await import("@/app/actions/db")
  const result = await updateQueueItemStatusAction(id, status)
  
  if (!result.success) {
    console.error("[v0] Error updating queue item status:", result.error)
    throw new Error(result.error)
  }
}

export async function updateQueueItemStatusByUrl(
  url: string,
  status: "Not Started" | "In Progress" | "Completed"
): Promise<void> {
  // Use server action to bypass RLS
  const { updateQueueItemStatusByUrlAction } = await import("@/app/actions/db")
  const result = await updateQueueItemStatusByUrlAction(url, status)
  
  if (!result.success) {
    console.error("[v0] Error updating queue item status by URL:", result.error)
    throw new Error(result.error)
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
