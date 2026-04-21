import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { text, voice_id, apiKey } = await req.json()

    if (!text || !voice_id || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields: text, voice_id, apiKey" },
        { status: 400 }
      )
    }

    const response = await fetch("https://api.heygen.com/v1/voice.tts", {
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

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json(
        { error: `HeyGen API error: ${errText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("HeyGen TTS error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
