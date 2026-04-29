"use server"

import postgres from "postgres"

const connectionString = process.env.DATABASE_URL!

export async function saveTasks(reviewId: string, tasks: { [key: string]: boolean } | string) {
  console.log("[v0] saveTasks called for reviewId:", reviewId, "tasks:", JSON.stringify(tasks))
  
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
  
  console.log("[v0] saveTasks tasksObj:", JSON.stringify(tasksObj))
  
  const sql = postgres(connectionString, { ssl: "require", prepare: false })
  
  try {
    const tasksJson = JSON.stringify(tasksObj)
    
    console.log("[v0] saveTasks executing UPDATE with tasksJson:", tasksJson)
    
    const result = await sql`
      UPDATE reviews 
      SET tasks = ${tasksJson}::jsonb, updated_at = NOW() 
      WHERE id = ${reviewId}
      RETURNING tasks
    `
    
    await sql.end()
    
    console.log("[v0] saveTasks result:", JSON.stringify(result))
    
    if (result.length === 0) {
      return { success: false, error: "No rows updated" }
    }
    
    return { success: true, tasks: result[0].tasks }
  } catch (error) {
    console.log("[v0] saveTasks error:", error)
    try { await sql.end() } catch {}
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getTasks(reviewId: string) {
  console.log("[v0] getTasks called for reviewId:", reviewId)
  
  if (!connectionString) {
    console.log("[v0] getTasks: No DATABASE_URL")
    return null
  }
  
  const sql = postgres(connectionString, { ssl: "require", prepare: false })
  
  try {
    const result = await sql`
      SELECT tasks FROM reviews WHERE id = ${reviewId}
    `
    
    await sql.end()
    
    console.log("[v0] getTasks raw result:", JSON.stringify(result))
    
    const tasks = result[0]?.tasks
    
    console.log("[v0] getTasks tasks value:", JSON.stringify(tasks), "type:", typeof tasks)
    
    if (typeof tasks === "string") {
      try {
        const parsed = JSON.parse(tasks)
        console.log("[v0] getTasks parsed string tasks:", JSON.stringify(parsed))
        return parsed
      } catch {
        console.log("[v0] getTasks: Failed to parse string tasks")
        return null
      }
    }
    
    console.log("[v0] getTasks returning:", JSON.stringify(tasks))
    return tasks || null
  } catch (error) {
    console.log("[v0] getTasks error:", error)
    try { await sql.end() } catch {}
    return null
  }
}
