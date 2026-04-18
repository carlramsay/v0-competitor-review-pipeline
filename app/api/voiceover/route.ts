import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { script, apiKey, voiceId } = await req.json()

    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs API key is missing. Add it in Admin Settings." }, { status: 400 })
    }
    if (!voiceId) {
      return NextResponse.json({ error: "ElevenLabs Voice ID is missing. Add it in Admin Settings." }, { status: 400 })
    }
    if (!script || !script.trim()) {
      return NextResponse.json({ error: "No script text provided. Generate a video script first." }, { status: 400 })
    }

    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    })

    if (!elRes.ok) {
      const errText = await elRes.text()
      return NextResponse.json(
        { error: `ElevenLabs error (${elRes.status}): ${errText}` },
        { status: elRes.status }
      )
    }

    const audioBuffer = await elRes.arrayBuffer()

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'attachment; filename="voiceover.mp3"',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
