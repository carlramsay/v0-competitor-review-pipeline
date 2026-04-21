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
          type: "talking_photo",
          talking_photo_id: avatarId,
        },
        voice: {
          type: "text",
          input_text: script,
          voice_id: voiceId,
          speed: 1.0,
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
  console.log("[v0] Using avatar ID:", avatarId)
  
  const generateRes = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(payload),
  })

  const responseText = await generateRes.text()
  console.log("[v0] HeyGen generate response status:", generateRes.status)
  console.log("[v0] HeyGen generate response body:", responseText)

  if (!generateRes.ok) {
    let errData
    try {
      errData = JSON.parse(responseText)
    } catch {
      errData = { error: { message: responseText } }
    }
    console.error("[v0] HeyGen error parsed:", errData)
    throw new Error(`HeyGen error (${generateRes.status}): ${errData.error?.message || errData.message || responseText}`)
  }

  const generateData = JSON.parse(responseText)
  console.log("[v0] HeyGen generate data:", generateData)
  const videoId = generateData.data?.video_id

  if (!videoId) {
    console.error("[v0] No video ID in response data:", generateData)
    throw new Error("No video ID returned from HeyGen API")
  }
  
  console.log("[v0] HeyGen video ID received:", videoId)

  // Poll for completion
  let status = "pending"
  let videoUrl: string | undefined
  let attempts = 0
  const maxAttempts = 120 // 10 minutes with 5s polling

  console.log("[v0] Starting to poll for video status...")

  while ((status === "pending" || status === "processing") && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    attempts++

    console.log(`[v0] Polling attempt ${attempts}/${maxAttempts}...`)

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
      console.error("[v0] Status check failed:", statusRes.status, statusRes.statusText)
      throw new Error(`Failed to check HeyGen video status: ${statusRes.statusText}`)
    }

    const statusData = (await statusRes.json()) as HeyGenStatusResponse
    status = statusData.data.status
    videoUrl = statusData.data.video_url

    console.log(`[v0] Video status: ${status}`, videoUrl ? `URL: ${videoUrl.substring(0, 50)}...` : "")

    if (status === "failed") {
      console.error("[v0] Video generation failed:", statusData.data.error)
      throw new Error(`HeyGen video generation failed: ${statusData.data.error || "Unknown error"}`)
    }
  }

  if (status !== "completed" || !videoUrl) {
    console.error("[v0] Video did not complete. Status:", status, "Attempts:", attempts)
    throw new Error("HeyGen video generation timed out or did not complete")
  }

  console.log("[v0] Video completed! Downloading from:", videoUrl)

  // Download the MP4
  const videoRes = await fetch(videoUrl)
  if (!videoRes.ok) {
    console.error("[v0] Download failed:", videoRes.status, videoRes.statusText)
    throw new Error(`Failed to download HeyGen video: ${videoRes.statusText}`)
  }

  console.log("[v0] Download successful, converting to base64...")

  const arrayBuffer = await videoRes.arrayBuffer()
  console.log("[v0] Video size:", arrayBuffer.byteLength, "bytes")
  
  // Convert to base64 in a browser-compatible way
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  console.log("[v0] Base64 conversion complete, length:", base64.length)
  return base64
}
