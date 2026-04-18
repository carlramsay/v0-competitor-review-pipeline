// HeyGen video generation service

interface HeyGenGenerateRequest {
  video_inputs: Array<{
    character: {
      type: "avatar"
      avatar_id: string
      avatar_style: "normal"
    }
    voice: {
      type: "text"
      input_text: string
      voice_id: string
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

export async function generateHeyGenAvatarVideo(
  apiKey: string,
  avatarId: string,
  voiceId: string,
  script: string
): Promise<string> {
  const payload: HeyGenGenerateRequest = {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: avatarId,
          avatar_style: "normal",
        },
        voice: {
          type: "text",
          input_text: script,
          voice_id: voiceId,
        },
        background: {
          type: "color",
          value: "#1a1a1a",
        },
      },
    ],
    dimension: {
      width: 1280,
      height: 720,
    },
  }

  // Submit video generation request
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
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  return base64
}
