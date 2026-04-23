import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("reviews")
    .select("tasks")
    .eq("id", id)
    .single()

  if (error) {
    console.error("[v0] API tasks fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("[v0] API tasks fetch result:", JSON.stringify(data?.tasks))
  return NextResponse.json({ tasks: data?.tasks })
}
