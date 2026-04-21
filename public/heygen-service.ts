// HeyGen video generation service

interface HeyGenGenerateRequest {
  video_inputs: Array<{
    character: {
      type: "avatar" | "talking_photo"
      avatar_id?: string
      talking_photo_id?: string
      avatar_style?: "normal" | "closeUp" | "circle"
      scale?: number
      offset?: { x: number; y: number }
    }
    voice: {
      type: "text"
      input_text: string
      voice_id: string
      speed?: number
      emotion?: "Excited" | "Friendly" | "Serious" | "Soothing" | "Broadcaster"
    }
    background: {
      type: "color"
      value: string
    }
  }>
  dimension: {
    width: number
    height: number
  }
}

interface HeyGenStatusResponse {
  data: {
    status: "pending" | "processing" | "completed" | "failed"
    video_url?: string
    error?: string
  }
}

// Fetch avatars and log full raw API response
async function logAvatarsList(apiKey: string): Promise<void> {
  try {
    const res = await fetch("https://api.heygen.com/v2/avatars", {
      headers: { "X-Api-Key": apiKey },
    })
    if (!res.ok) {
      console.warn(`[v0] Failed to fetch avatars list: ${res.status}`)
      return
    }
    const data = await res.json()
    console.log("[v0] FULL AVATARS API RESPONSE:", JSON.stringify(data, null, 2))
  } catch (err) {
    console.warn("[v0] Error fetching avatars list:", err)
  }
}

export async function generateHeyGenAvatarVideo(
  apiKey: string,
  avatarId: string,
  voiceId: string,
  script: string,
  isPortrait: boolean = true
): Promise<string> {
  // Log full avatars list for debugging
  await logAvatarsList(apiKey)

  // Portrait format (9:16) for vertical video, landscape (16:9) for horizontal
  const dimension = isPortrait 
    ? { width: 1080, height: 1920 }
    : { width: 1920, height: 1080 }

  const payload: HeyGenGenerateRequest = {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: avatarId,
          avatar_style: "closeUp", // Close-up for better lip sync visibility
          scale: 1.0,
          offset: { x: 0, y: 0 }, // Centered
        },
        voice: {
          type: "text",
          input_text: script,
          voice_id: voiceId,
          speed: 1.0,
          emotion: "Friendly",
        },
        background: {
          type: "color",
          value: "#1a1a1a",
        },
      },
    ],
    dimension,
  }

  // Submit video generation request
  console.log("[v0] Sending HeyGen payload:", JSON.stringify(payload, null, 2))
  const generateRes = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(payload),
  })

  if (!generateRes.ok) {
    const errData = await generateRes.json()
    console.error("[v0] HeyGen error:", errData)
    throw new Error(`HeyGen error (${generateRes.status}): ${errData.error?.message || "Unknown error"}`)
  }

  const generateData = await generateRes.json()
  const videoId = generateData.data?.video_id

  if (!videoId) {
    throw new Error("No video ID returned from HeyGen API")
  }

  // Poll for completion
  let status = "processing"
  let videoUrl: string | undefined
  let attempts = 0
  const maxAttempts = 120 // 10 minutes with 5s polling

  while (status === "processing" && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    attempts++

    const statusRes = await fetch(
      `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
      {
        method: "GET",
        headers: {
          "X-Api-Key": apiKey,
        },
      }
    )

    if (!statusRes.ok) {
      throw new Error(`Failed to check HeyGen video status: ${statusRes.statusText}`)
    }

    const statusData = (await statusRes.json()) as HeyGenStatusResponse
    status = statusData.data.status
    videoUrl = statusData.data.video_url

    if (status === "failed") {
      throw new Error(`HeyGen video generation failed: ${statusData.data.error || "Unknown error"}`)
    }
  }

  if (status !== "completed" || !videoUrl) {
    throw new Error("HeyGen video generation timed out or did not complete")
  }

  // Download the MP4
  const videoRes = await fetch(videoUrl)
  if (!videoRes.ok) {
    throw new Error(`Failed to download HeyGen video: ${videoRes.statusText}`)
  }

  const arrayBuffer = await videoRes.arrayBuffer()
  // Convert to base64 in a browser-compatible way
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  return base64
}
