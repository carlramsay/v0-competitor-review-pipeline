"use server"

import postgres from "postgres"
import type { ReviewFormData } from "@/lib/types"

const connectionString = process.env.DATABASE_URL!

export async function saveDraftAction(formData: ReviewFormData): Promise<{ success: boolean; error?: string }> {
  if (!connectionString) {
    return { success: false, error: "DATABASE_URL not configured" }
  }
  
  const sql = postgres(connectionString, { ssl: "require", prepare: false })
  
  try {
    const formDataJson = JSON.stringify(formData)
    
    // Upsert the draft (id=1 is the single draft row)
    await sql`
      INSERT INTO draft (id, form_data, saved_at)
      VALUES (1, ${formDataJson}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        form_data = ${formDataJson}::jsonb,
        saved_at = NOW()
    `
    
    await sql.end()
    return { success: true }
  } catch (error) {
    try { await sql.end() } catch {}
    console.error("[v0] saveDraftAction error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getDraftAction(): Promise<{ formData: ReviewFormData; savedAt: string } | null> {
  if (!connectionString) {
    return null
  }
  
  const sql = postgres(connectionString, { ssl: "require", prepare: false })
  
  try {
    const result = await sql`
      SELECT form_data, saved_at FROM draft WHERE id = 1
    `
    
    await sql.end()
    
    if (result.length === 0 || !result[0].form_data) {
      return null
    }
    
    let formData = result[0].form_data
    if (typeof formData === "string") {
      formData = JSON.parse(formData)
    }
    
    return {
      formData: formData as ReviewFormData,
      savedAt: result[0].saved_at,
    }
  } catch (error) {
    try { await sql.end() } catch {}
    console.error("[v0] getDraftAction error:", error)
    return null
  }
}

export async function clearDraftAction(): Promise<{ success: boolean; error?: string }> {
  if (!connectionString) {
    return { success: false, error: "DATABASE_URL not configured" }
  }
  
  const sql = postgres(connectionString, { ssl: "require", prepare: false })
  
  try {
    await sql`DELETE FROM draft WHERE id = 1`
    await sql.end()
    return { success: true }
  } catch (error) {
    try { await sql.end() } catch {}
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
