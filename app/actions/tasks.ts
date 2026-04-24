"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
    db: { schema: 'public' }
  })
}

export async function saveTasks(reviewId: string, tasks: Record<string, boolean> | string) {
  if (!supabaseServiceKey) {
    return { success: false, error: "Service role key not configured" }
  }
  
  // Handle case where tasks is passed as a string or corrupted object
  let tasksObj: Record<string, boolean>
  if (typeof tasks === "string") {
    tasksObj = JSON.parse(tasks)
  } else if (tasks && typeof tasks === "object" && "0" in tasks) {
    // Tasks was corrupted from spreading a string - reconstruct from values
    const str = Object.values(tasks).join("")
    tasksObj = JSON.parse(str)
  } else {
    tasksObj = tasks as Record<string, boolean>
  }
  
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from("reviews")
    .update({ 
      tasks: tasksObj, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", reviewId)
    .select("tasks")
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  if (!data || data.length === 0) {
    return { success: false, error: "No rows updated" }
  }
  
  return { success: true, tasks: data[0].tasks }
}

export async function getTasks(reviewId: string) {
  if (!supabaseServiceKey) {
    return null
  }
  
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from("reviews")
    .select("tasks")
    .eq("id", reviewId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  const tasks = data.tasks
  
  // Handle case where tasks is stored as a string
  if (typeof tasks === "string") {
    try {
      return JSON.parse(tasks)
    } catch {
      return null
    }
  }
  
  return tasks
}
