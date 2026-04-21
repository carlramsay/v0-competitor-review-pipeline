"use server"

export async function generateHeyGenTTS(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<{ success: true; audioUrl: string } | { success: false; error: string }> {
  try {
    if (!text || !voiceId || !apiKey) {
      return { success: false, error: "Missing required fields: text, voiceId, apiKey" }
    }

    const response = await fetch("https://api.heygen.com/v1/voice.tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return { success: false, error: `HeyGen API error: ${errText}` }
    }

    const data = await response.json()
    const audioUrl = data.data?.url
    
    if (!audioUrl) {
      return { success: false, error: "No audio URL returned from HeyGen" }
    }

    return { success: true, audioUrl }
  } catch (error) {
    console.error("HeyGen TTS error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function generateHeyGenAudioTTS(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<{ success: true; audioUrl: string } | { success: false; error: string }> {
  try {
    if (!text || !voiceId || !apiKey) {
      return { success: false, error: "Missing required fields: text, voiceId, apiKey" }
    }

    const response = await fetch("https://api.heygen.com/v1/audio/text_to_speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return { success: false, error: `HeyGen API error: ${errText}` }
    }

    const data = await response.json()
    const audioUrl = data.data?.audio_url
    
    if (!audioUrl) {
      return { success: false, error: "No audio URL returned from HeyGen" }
    }

    return { success: true, audioUrl }
  } catch (error) {
    console.error("HeyGen Audio TTS error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
