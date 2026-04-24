"use server"

import postgres from "postgres"

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

export async function saveTasks(reviewId: string, tasks: Record<string, boolean>) {
  if (!connectionString) {
    return { success: false, error: "Database connection string not configured" }
  }
  
  const sql = postgres(connectionString, { ssl: "require" })
  
  try {
    const tasksJson = JSON.stringify(tasks)
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
    await sql.end()
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getTasks(reviewId: string) {
  if (!connectionString) {
    return null
  }
  
  const sql = postgres(connectionString, { ssl: "require" })
  
  try {
    const result = await sql`
      SELECT tasks FROM reviews WHERE id = ${reviewId}
    `
    
    await sql.end()
    
    return result[0]?.tasks || null
  } catch (error) {
    await sql.end()
    return null
  }
}
