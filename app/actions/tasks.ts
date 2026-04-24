"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function saveTasks(reviewId: string, tasks: Record<string, boolean>) {
  console.log("[v0] saveTasks called, reviewId:", reviewId)
  console.log("[v0] Service key exists:", !!supabaseServiceKey)
  console.log("[v0] Service key length:", supabaseServiceKey?.length)
  
  if (!supabaseServiceKey) {
    console.error("[v0] SUPABASE_SERVICE_ROLE_KEY is not set!")
    return { success: false, error: "Service role key not configured" }
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
  
  console.log("[v0] Updating tasks:", JSON.stringify(tasks))
  
  const { data, error } = await supabase
    .from("reviews")
    .update({ tasks, updated_at: new Date().toISOString() })
    .eq("id", reviewId)
    .select("id, tasks")
  
  console.log("[v0] Update result - data:", JSON.stringify(data), "error:", error?.message)

  if (error) {
    console.error("Save tasks error:", error)
    return { success: false, error: error.message }
  }
  
  if (!data || data.length === 0) {
    console.error("[v0] No rows updated! reviewId may not exist:", reviewId)
    return { success: false, error: "No rows updated" }
  }

  return { success: true, tasks: data[0]?.tasks }
}

export async function getTasks(reviewId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
  
  const { data, error } = await supabase
    .from("reviews")
    .select("tasks")
    .eq("id", reviewId)
    .single()

  if (error) {
    console.error("Get tasks error:", error)
    return null
  }

  return data?.tasks
}
