import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log("[v0] GET /api/reviews/tasks - id:", id)
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("reviews")
    .select("tasks")
    .eq("id", id)
    .single()

  console.log("[v0] GET tasks result:", JSON.stringify(data?.tasks), "error:", error?.message)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tasks: data?.tasks })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const tasks = body.tasks
  console.log("[v0] POST tasks - received:", JSON.stringify(tasks))
  
  const supabase = await createClient()
  
  // Update the tasks
  const { error: updateError } = await supabase
    .from("reviews")
    .update({ tasks, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (updateError) {
    console.log("[v0] POST tasks - update error:", updateError.message)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Verify by fetching again
  const { data: verify, error: verifyError } = await supabase
    .from("reviews")
    .select("tasks")
    .eq("id", id)
    .single()

  console.log("[v0] POST tasks - after update verification:", JSON.stringify(verify?.tasks))

  if (verifyError) {
    return NextResponse.json({ error: verifyError.message }, { status: 500 })
  }

  return NextResponse.json({ tasks: verify?.tasks, saved: true })
}
