"use server"

import { createClient } from "@supabase/supabase-js"
import postgres from "postgres"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const connectionString = process.env.DATABASE_URL

export async function saveTasks(reviewId: string, tasks: Record<string, boolean> | string) {
  // Handle case where tasks is passed as a string or corrupted object
  let tasksObj: Record<string, boolean>
  if (typeof tasks === "string") {
    tasksObj = JSON.parse(tasks)
  } else if (tasks && typeof tasks === "object" && "0" in tasks) {
    const str = Object.values(tasks).join("")
    tasksObj = JSON.parse(str)
  } else {
    tasksObj = tasks as Record<string, boolean>
  }

  // Try direct Postgres first if available
  if (connectionString) {
    try {
      const sql = postgres(connectionString, { ssl: "require", prepare: false })
      const tasksJson = JSON.stringify(tasksObj)
      
      await sql`
        UPDATE reviews 
        SET tasks = ${tasksJson}::jsonb, updated_at = NOW() 
        WHERE id = ${reviewId}
      `
      
      // Verify immediately
      const verify = await sql`SELECT tasks FROM reviews WHERE id = ${reviewId}`
      await sql.end()
      
      return { success: true, tasks: verify[0]?.tasks }
    } catch (e) {
      console.error("Postgres error:", e)
    }
  }

  // Fallback to Supabase REST API
  if (!supabaseServiceKey) {
    return { success: false, error: "No database connection configured" }
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
  
  const { data, error } = await supabase
    .from("reviews")
    .update({ tasks: tasksObj, updated_at: new Date().toISOString() })
    .eq("id", reviewId)
    .select("tasks")
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true, tasks: data?.[0]?.tasks }
}

export async function getTasks(reviewId: string) {
  // Try direct Postgres first
  if (connectionString) {
    try {
      const sql = postgres(connectionString, { ssl: "require", prepare: false })
      const result = await sql`SELECT tasks FROM reviews WHERE id = ${reviewId}`
      await sql.end()
      
      const tasks = result[0]?.tasks
      if (typeof tasks === "string") {
        return JSON.parse(tasks)
      }
      return tasks
    } catch (e) {
      console.error("Postgres error:", e)
    }
  }

  // Fallback to Supabase
  if (!supabaseServiceKey) {
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
