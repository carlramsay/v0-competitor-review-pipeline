import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { text, voice_id, apiKey } = await req.json()

    if (!apiKey) {
      return NextResponse.json({ error: "HeyGen API key is required" }, { status: 400 })
    }

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!voice_id) {
      return NextResponse.json({ error: "Voice ID is required" }, { status: 400 })
    }

    const res = await fetch("https://api.heygen.com/v1/audio/text_to_speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        text,
        voice_id,
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      console.error("[v0] HeyGen Audio TTS error:", errData)
      return NextResponse.json(
        { error: errData.error?.message || errData.detail || `HeyGen API error: ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[v0] HeyGen Audio route error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
