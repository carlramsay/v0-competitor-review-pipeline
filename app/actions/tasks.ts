"use server"

import { createClient } from "@/lib/supabase/server"

export async function saveTasks(reviewId: string, tasks: { [key: string]: boolean } | string) {
  const supabase = await createClient()
  
  // Parse tasks if it's a string or corrupted object
  let tasksObj: Record<string, boolean>
  if (typeof tasks === "string") {
    tasksObj = JSON.parse(tasks)
  } else if (tasks && typeof tasks === "object" && "0" in tasks) {
    const str = Object.values(tasks).join("")
    tasksObj = JSON.parse(str)
  } else {
    tasksObj = tasks as Record<string, boolean>
  }
  
  const { data, error } = await supabase
    .from("reviews")
    .update({ tasks: tasksObj, updated_at: new Date().toISOString() })
    .eq("id", reviewId)
    .select("tasks")
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true, tasks: data?.tasks }
}

export async function getTasks(reviewId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("reviews")
    .select("tasks")
    .eq("id", reviewId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data.tasks || null
}
