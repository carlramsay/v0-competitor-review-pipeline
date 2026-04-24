"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function saveTasks(reviewId: string, tasks: Record<string, boolean>) {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })
  
  const { error } = await supabase
    .from("reviews")
    .update({ tasks, updated_at: new Date().toISOString() })
    .eq("id", reviewId)

  if (error) {
    console.error("Save tasks error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getTasks(reviewId: string) {
  const supabase = createClient(supabaseUrl, supabaseKey, {
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
