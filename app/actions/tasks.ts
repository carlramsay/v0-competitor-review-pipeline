"use server"

import postgres from "postgres"

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

export async function saveTasks(reviewId: string, tasks: Record<string, boolean>) {
  console.log("[v0] saveTasks called - reviewId:", reviewId)
  console.log("[v0] saveTasks - tasks to save:", JSON.stringify(tasks))
  console.log("[v0] saveTasks - connectionString exists:", !!connectionString)
  
  if (!connectionString) {
    return { success: false, error: "Database connection string not configured" }
  }
  
  const sql = postgres(connectionString, { ssl: "require" })
  
  try {
    const tasksJson = JSON.stringify(tasks)
    console.log("[v0] saveTasks - executing UPDATE with tasksJson:", tasksJson)
    
    const result = await sql`
      UPDATE reviews 
      SET tasks = ${tasksJson}::jsonb, updated_at = NOW() 
      WHERE id = ${reviewId}
      RETURNING tasks
    `
    
    console.log("[v0] saveTasks - UPDATE returned rows:", result.length)
    console.log("[v0] saveTasks - returned tasks:", JSON.stringify(result[0]?.tasks))
    
    await sql.end()
    
    if (result.length === 0) {
      return { success: false, error: "No rows updated" }
    }
    
    return { success: true, tasks: result[0].tasks }
  } catch (error) {
    console.error("[v0] saveTasks - ERROR:", error)
    await sql.end()
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getTasks(reviewId: string) {
  console.log("[v0] getTasks called - reviewId:", reviewId)
  
  if (!connectionString) {
    console.log("[v0] getTasks - no connection string!")
    return null
  }
  
  const sql = postgres(connectionString, { ssl: "require" })
  
  try {
    const result = await sql`
      SELECT tasks FROM reviews WHERE id = ${reviewId}
    `
    
    console.log("[v0] getTasks - SELECT returned rows:", result.length)
    console.log("[v0] getTasks - tasks from DB:", JSON.stringify(result[0]?.tasks))
    
    await sql.end()
    
    return result[0]?.tasks || null
  } catch (error) {
    console.error("[v0] getTasks - ERROR:", error)
    await sql.end()
    return null
  }
}
