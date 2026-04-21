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

    const res = await fetch("https://api.heygen.com/v1/voice.tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        text,
        voice_id,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("[v0] HeyGen TTS error:", errText)
      return NextResponse.json(
        { error: `HeyGen TTS error: ${errText}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[v0] HeyGen TTS route error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
