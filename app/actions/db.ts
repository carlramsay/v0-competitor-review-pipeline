"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { ReviewRecord, GeneratedContent, PipelineStatus, TaskStatus, QueueItem } from "@/lib/types"

// Server action to save a review (bypasses RLS)
export async function saveReviewAction(record: {
  id: string
  userId?: string
  submittedAt: string
  formData: Record<string, unknown>
  generated?: Record<string, unknown>
  pipelineStatus?: Record<string, unknown>
  tasks?: Record<string, boolean>
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    const { error } = await supabase.from("reviews").upsert({
      id: record.id,
      user_id: record.userId || "single-user",
      submitted_at: record.submittedAt,
      form_data: record.formData,
      generated: record.generated || {},
      pipeline_status: record.pipelineStatus || {},
      tasks: record.tasks || {
        blogPublishedArousr: false,
        videoPostedYouTube: false,
        videoPostedXBIZ: false,
        videoEmbeddedBlog: false,
        blogPostedMedium: false,
        linkedInArticle: false,
        xPost: false,
        facebookPost: false,
      },
      updated_at: new Date().toISOString(),
    })
    
    if (error) {
      console.error("[v0] saveReviewAction error:", error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    console.error("[v0] saveReviewAction exception:", err)
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

// Server action to update generated content
export async function updateGeneratedContentAction(
  id: string,
  content: Partial<GeneratedContent>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    // First get the current record
    const { data: current, error: fetchError } = await supabase
      .from("reviews")
      .select("generated")
      .eq("id", id)
      .single()
    
    if (fetchError) {
      return { success: false, error: fetchError.message }
    }
    
    const updatedGenerated = { ...(current?.generated || {}), ...content }
    
    const { error } = await supabase
      .from("reviews")
      .update({
        generated: updatedGenerated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

// Server action to update task status
export async function updateTaskStatusAction(
  id: string,
  tasks: Partial<TaskStatus>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    // First get the current record
    const { data: current, error: fetchError } = await supabase
      .from("reviews")
      .select("tasks")
      .eq("id", id)
      .single()
    
    if (fetchError) {
      return { success: false, error: fetchError.message }
    }
    
    const updatedTasks = { ...(current?.tasks || {}), ...tasks }
    
    const { error } = await supabase
      .from("reviews")
      .update({
        tasks: updatedTasks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

// Server action to update queue item status
export async function updateQueueItemStatusAction(
  id: string,
  status: "Not Started" | "In Progress" | "Completed"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from("queue_items")
      .update({
        status,
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", id)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

// Server action to update queue item status by URL
export async function updateQueueItemStatusByUrlAction(
  url: string,
  status: "Not Started" | "In Progress" | "Completed"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from("queue_items")
      .update({
        status,
        status_updated_at: new Date().toISOString(),
      })
      .eq("url", url)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

// Server action to update pipeline status
export async function updatePipelineStatusAction(
  id: string,
  updates: Partial<PipelineStatus>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    
    // First get the current record
    const { data: current, error: fetchError } = await supabase
      .from("reviews")
      .select("pipeline_status")
      .eq("id", id)
      .single()
    
    if (fetchError) {
      return { success: false, error: fetchError.message }
    }
    
    const updatedStatus = { ...(current?.pipeline_status || {}), ...updates }
    
    const { error } = await supabase
      .from("reviews")
      .update({
        pipeline_status: updatedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
