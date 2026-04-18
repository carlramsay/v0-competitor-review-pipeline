import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload to Vercel Blob with public access so Shotstack can fetch it
    const blob = await put(`voiceovers/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    console.log("[v0] Blob upload result:", blob)
    console.log("[v0] Blob URL:", blob.url)

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
