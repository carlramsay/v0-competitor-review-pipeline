"use server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function saveTasks(reviewId: string, tasks: Record<string, boolean>) {
  if (!supabaseServiceKey) {
    return { success: false, error: "Service role key not configured" }
  }
  
  // Use direct REST API call
  const response = await fetch(
    `${supabaseUrl}/rest/v1/reviews?id=eq.${reviewId}`,
    {
      method: "PATCH",
      headers: {
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({ 
        tasks, 
        updated_at: new Date().toISOString() 
      }),
      cache: "no-store",
    }
  )
  
  if (!response.ok) {
    const errorText = await response.text()
    return { success: false, error: errorText }
  }
  
  const result = await response.json()
  return { success: true, tasks: result?.[0]?.tasks }
}

export async function getTasks(reviewId: string) {
  if (!supabaseServiceKey) {
    return null
  }
  
  const response = await fetch(
    `${supabaseUrl}/rest/v1/reviews?id=eq.${reviewId}&select=tasks`,
    {
      method: "GET",
      headers: {
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      cache: "no-store",
    }
  )
  
  if (!response.ok) {
    return null
  }
  
  const data = await response.json()
  return data?.[0]?.tasks
}
