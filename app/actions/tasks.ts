"use server"

import postgres from "postgres"

const connectionString = process.env.DATABASE_URL!

export async function saveTasks(reviewId: string, tasks: { [key: string]: boolean } | string) {
  if (!connectionString) {
    return { success: false, error: "DATABASE_URL not configured" }
  }
  
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
  
  const sql = postgres(connectionString, { ssl: "require", prepare: false })
  
  try {
    const tasksJson = JSON.stringify(tasksObj)
    
    const result = await sql`
      UPDATE reviews 
      SET tasks = ${tasksJson}::jsonb, updated_at = NOW() 
      WHERE id = ${reviewId}
      RETURNING tasks
    `
    
    await sql.end()
    
    if (result.length === 0) {
      return { success: false, error: "No rows updated" }
    }
    
    return { success: true, tasks: result[0].tasks }
  } catch (error) {
    try { await sql.end() } catch {}
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getTasks(reviewId: string) {
  if (!connectionString) {
    return null
  }
  
  const sql = postgres(connectionString, { ssl: "require", prepare: false })
  
  try {
    const result = await sql`
      SELECT tasks FROM reviews WHERE id = ${reviewId}
    `
    
    await sql.end()
    
    const tasks = result[0]?.tasks
    
    if (typeof tasks === "string") {
      try {
        return JSON.parse(tasks)
      } catch {
        return null
      }
    }
    
    return tasks || null
  } catch (error) {
    try { await sql.end() } catch {}
    return null
  }
}
