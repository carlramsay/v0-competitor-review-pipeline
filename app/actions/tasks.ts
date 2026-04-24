"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function saveTasks(reviewId: string, tasks: Record<string, boolean> | string) {
  console.log("[v0] saveTasks called - reviewId:", reviewId)
  
  // Handle case where tasks is passed as a string or corrupted object
  let tasksObj: Record<string, boolean>
  if (typeof tasks === "string") {
    tasksObj = JSON.parse(tasks)
  } else if (tasks && typeof tasks === "object" && "0" in tasks) {
    // Fix corrupted object where keys are indices
    const str = Object.values(tasks).join("")
    tasksObj = JSON.parse(str)
  } else {
    tasksObj = tasks as Record<string, boolean>
  }
  
  console.log("[v0] saveTasks - parsed tasksObj:", JSON.stringify(tasksObj))

  if (!supabaseServiceKey) {
    console.error("[v0] saveTasks - No service key!")
    return { success: false, error: "No database connection configured" }
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
  
  console.log("[v0] saveTasks - calling supabase update")
  
  const { data, error } = await supabase
    .from("reviews")
    .update({ tasks: tasksObj, updated_at: new Date().toISOString() })
    .eq("id", reviewId)
    .select("tasks")
  
  console.log("[v0] saveTasks - supabase response data:", JSON.stringify(data))
  console.log("[v0] saveTasks - supabase response error:", error?.message)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  // Double check with a fresh read
  const { data: verifyData } = await supabase
    .from("reviews")
    .select("tasks")
    .eq("id", reviewId)
    .single()
  
  console.log("[v0] saveTasks - verify read:", JSON.stringify(verifyData?.tasks))
  
  return { success: true, tasks: data?.[0]?.tasks }
}

export async function getTasks(reviewId: string) {
  console.log("[v0] getTasks called - reviewId:", reviewId)
  
  if (!supabaseServiceKey) {
    console.error("[v0] getTasks - No service key!")
    return null
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
  
  const { data, error } = await supabase
    .from("reviews")
    .select("tasks")
    .eq("id", reviewId)
    .single()
  
  console.log("[v0] getTasks - data:", JSON.stringify(data?.tasks))
  console.log("[v0] getTasks - error:", error?.message)
  
  if (error || !data) {
    return null
  }
  
  const tasks = data.tasks
  if (typeof tasks === "string") {
    try {
      return JSON.parse(tasks)
    } catch {
      return null
    }
  }
  
  return tasks
}
