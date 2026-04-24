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
  const { tasks } = await request.json()
  console.log("[v0] POST /api/reviews/tasks - id:", id, "tasks:", JSON.stringify(tasks))
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("reviews")
    .update({ tasks, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("tasks")
    .single()

  console.log("[v0] POST tasks result:", JSON.stringify(data?.tasks), "error:", error?.message)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tasks: data?.tasks })
}
