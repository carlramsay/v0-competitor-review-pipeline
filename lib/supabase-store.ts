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
  const errMsg = error instanceof Error ? error.message : String(error)
  
  // Check for common RLS/permission errors
  if (errMsg.includes("new row violates row-level security") ||
      errMsg.includes("violates row-level security policy") ||
      errMsg.includes("permission denied") ||
      errMsg.includes("RLS")) {
    throw new RLSError(`Permission denied: You don't have access to ${operation}. Please ensure you're logged in.`, error)
  }
  
  throw new Error(`${operation} failed: ${errMsg}`)
}

// Get current authenticated user ID
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// Check if user is authenticated
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new RLSError("You must be logged in to perform this action.")
  }
  return userId
}

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
  const userId = await getCurrentUserId()
  
  if (!userId) {
    console.warn("[v0] No authenticated user, returning empty reviews")
    return []
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
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
  const userId = await requireAuth()
  const supabase = createClient()
  
  try {
    const { error } = await supabase.from("reviews").upsert({
      id: record.id,
      user_id: userId, // Always set to current authenticated user
      submitted_at: record.submittedAt,
      form_data: record.formData,
      generated: record.generated,
      pipeline_status: record.pipelineStatus || { reviewSubmitted: true, reviewApproved: false, blogPostGenerated: false, videoScriptGenerated: false, avatarVideoGenerated: false, allContentReady: false },
      tasks: record.tasks || { blogPublishedArousr: false, videoPostedYouTube: false, videoPostedXBIZ: false, videoEmbeddedBlog: false, blogPostedMedium: false, linkedInArticle: false, xPost: false, facebookPost: false, instagramPost: false },
      updated_at: new Date().toISOString(),
    })

    if (error) {
      handleSupabaseError(error, "save review")
    }
  } catch (err) {
    if (err instanceof RLSError) throw err
    handleSupabaseError(err, "save review")
  }
}

export async function getReviewByCompetitorName(name: string, url?: string): Promise<ReviewRecord | null> {
  const supabase = createClient()
  const userId = await getCurrentUserId()
  
  if (!userId) {
    console.warn("[v0] No authenticated user for getReviewByCompetitorName")
    return null
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
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
  console.log("[v0] match.tasks from DB:", JSON.stringify(match.tasks))
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
  const userId = await getCurrentUserId()
  
  console.log("[v0] getReviewById called for id:", id, "userId:", userId)
  
  // RLS will automatically filter by user_id, but we add explicit check for clarity
  const query = supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
  
  // Only filter by user_id if user is authenticated
  if (userId) {
    query.eq("user_id", userId)
  }
  
  const { data, error } = await query.single()

  if (error || !data) {
    console.log("[v0] getReviewById error or no data:", error)
    return null
  }

  console.log("[v0] getReviewById - id:", data.id, "tasks from DB:", JSON.stringify(data.tasks))

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
  const userId = await requireAuth()
  const supabase = createClient()
  
  // First get the current record to preserve existing data (filtered by user_id via RLS)
  const { data: current, error: fetchError } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
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
  
  // Log what we're updating for debugging
  console.log("[v0] Updating generated content for review:", id)
  console.log("[v0] Existing keys:", Object.keys(existingGenerated))
  console.log("[v0] New keys being added/updated:", Object.keys(content))
  console.log("[v0] Final keys:", Object.keys(updatedGenerated))

  try {
    const { data, error } = await supabase
      .from("reviews")
      .update({
        generated: updatedGenerated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId) // Ensure we only update own reviews
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
  const userId = await requireAuth()
  const supabase = createClient()
  
  const { data: current, error: fetchError } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (fetchError || !current) {
    console.error("[v0] Error fetching review for pipeline update:", fetchError)
    return null
  }

  const updatedPipeline = { ...current.pipeline_status, ...updates }

  try {
    const { data, error } = await supabase
      .from("reviews")
      .update({
        pipeline_status: updatedPipeline,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      handleSupabaseError(error, "update pipeline status")
    }

    if (!data) return null

    return {
      id: data.id,
      userId: data.user_id,
      submittedAt: data.submitted_at,
      formData: data.form_data as ReviewFormData,
      generated: data.generated as GeneratedContent,
      pipelineStatus: data.pipeline_status as PipelineStatus | undefined,
      tasks: data.tasks as TaskStatus | undefined,
    }
  } catch (err) {
    if (err instanceof RLSError) throw err
    console.error("[v0] Error updating pipeline status:", err)
    return null
  }
}

export async function updateTaskStatus(
  id: string,
  updates: Partial<TaskStatus>
): Promise<ReviewRecord | null> {
  const userId = await requireAuth()
  const supabase = createClient()
  
  console.log("[v0] updateTaskStatus - authenticated userId:", userId)
  
  const { data: current, error: fetchError } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (fetchError || !current) {
    console.error("[v0] Error fetching review for task update:", fetchError)
    return null
  }
  
  console.log("[v0] updateTaskStatus - record.user_id:", current.user_id)

  const updatedTasks = { ...current.tasks, ...updates }

  try {
    const { data, error } = await supabase
      .from("reviews")
      .update({
        tasks: updatedTasks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()
    
    // Verify by re-fetching
    const { data: verify } = await supabase
      .from("reviews")
      .select("tasks")
      .eq("id", id)
      .single()
    
    console.log("[v0] updateTaskStatus - verify fetch tasks:", JSON.stringify(verify?.tasks))
    
    if (error) {
      console.error("[v0] updateTaskStatus - error:", error)
      handleSupabaseError(error, "update task status")
    }

    if (!data) return null

    return {
      id: data.id,
      userId: data.user_id,
      submittedAt: data.submitted_at,
      formData: data.form_data as ReviewFormData,
      generated: data.generated as GeneratedContent,
      pipelineStatus: data.pipeline_status as PipelineStatus | undefined,
      tasks: data.tasks as TaskStatus | undefined,
    }
  } catch (err) {
    if (err instanceof RLSError) throw err
    console.error("[v0] Error updating task status:", err)
    return null
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

export async function updateQueueItemStatusByUrl(
  url: string,
  status: "Not Started" | "In Progress" | "Completed"
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("queue_items")
    .update({
      status,
      status_updated_at: new Date().toISOString(),
    })
    .eq("url", url)

  if (error) {
    console.error("[v0] Error updating queue item status by URL:", error)
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
