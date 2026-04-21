import { useState, useEffect } from "react"
import { ReviewRecord, ThumbnailImage } from "@/lib/types"
import { getSettings, updateGeneratedContent, updatePipelineStatus, getThumbnailLibrary, getVideoAsset, saveVideoAsset } from "@/lib/store"
import { buildAnswersString } from "@/lib/review-utils"
import { convertMarkdownToStyledHTML } from "@/lib/markdown-converter"
import { cn } from "@/lib/utils"
import { Download, ImageIcon, Save, Check } from "lucide-react"
import { CopyButton } from "./copy-button"
import { FileText, Video, Share2, Globe, ExternalLink, Loader2, Eye, EyeOff, Linkedin, Facebook } from "lucide-react"

interface OutputBlockProps {
  label: string
  content: string
  onSave: (value: string) => void
}

interface HTMLPreviewBlockProps {
  label: string
  htmlContent: string
  markdownContent: string
  viewAsHtml: boolean
  onToggleView: (asHtml: boolean) => void
  onDownload: () => void
  onSave: (markdown: string) => void
}

function HTMLPreviewBlock({ label, htmlContent, markdownContent, viewAsHtml, onToggleView, onDownload, onSave }: HTMLPreviewBlockProps) {
  const [value, setValue] = useState(markdownContent)
  const [saved, setSaved] = useState(false)
  const isDirty = value !== markdownContent

  // Keep in sync if parent content changes (e.g. after a re-generate)
  useEffect(() => {
    setValue(markdownContent)
    setSaved(false)
  }, [markdownContent])

  function handleSave() {
    onSave(value)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Generate HTML from current edited value for preview
  const currentHtmlContent = isDirty ? convertMarkdownToStyledHTML(value) : htmlContent

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
          {isDirty && !saved && (
            <span className="text-xs text-amber-400">Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={viewAsHtml ? currentHtmlContent : value} />
          <button
            type="button"
            onClick={() => onToggleView(!viewAsHtml)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
          >
            {viewAsHtml ? <EyeOff size={12} /> : <Eye size={12} />}
            {viewAsHtml ? "View Markdown" : "View Styled Preview"}
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
          >
            <Download size={12} />
            Download HTML
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saved ? <Check size={12} className="text-green-400" /> : <Save size={12} />}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
      {viewAsHtml ? (
        <div
          className="min-h-[160px] max-h-[500px] overflow-y-auto w-full rounded-md border border-border bg-[#1a1a1a] px-4 py-3 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: currentHtmlContent }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-h-[160px] max-h-[500px] w-full resize-y rounded-md border border-border bg-input px-3 py-2 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
        />
      )}
    </div>
  )
}

function OutputBlock({ label, content, onSave, onDownload }: OutputBlockProps) {
  const [value, setValue] = useState(content)
  const [saved, setSaved] = useState(false)
  const isDirty = value !== content

  // Keep in sync if parent content changes (e.g. after a re-generate)
  useEffect(() => {
    setValue(content)
    setSaved(false)
  }, [content])

  function handleSave() {
    onSave(value)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
          {isDirty && !saved && (
            <span className="text-xs text-amber-400">Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={value} />
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
            >
              <Download size={12} />
              Download
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saved ? <Check size={12} className="text-green-400" /> : <Save size={12} />}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => { setValue(e.target.value); setSaved(false) }}
        className="min-h-[160px] w-full resize-y rounded-md border border-border bg-input px-3 py-2 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  )
}

interface Props {
  record: ReviewRecord
}

export function ContentGeneration({ record: initialRecord }: Props) {
  const [record, setRecord] = useState(initialRecord)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [wpStatus, setWpStatus] = useState<{ url?: string; editUrl?: string } | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [thumbnailUrlVertical, setThumbnailUrlVertical] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoUrlVertical, setVideoUrlVertical] = useState<string | null>(null)
  const [videoProgress, setVideoProgress] = useState<string | null>(null)
  const [blogPostViewAsHtml, setBlogPostViewAsHtml] = useState(false)
  const [backgroundLibrary, setBackgroundLibrary] = useState<ThumbnailImage[]>([])
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null)
  const [viewBlogAsHtml, setViewBlogAsHtml] = useState(true)

  // Load background image library on mount
  useEffect(() => {
    getThumbnailLibrary().then(setBackgroundLibrary)
  }, [])

  // Hydrate saved thumbnails from record on mount
  useEffect(() => {
    if (initialRecord.generated.thumbnailDataUrl) {
      setThumbnailUrl(initialRecord.generated.thumbnailDataUrl)
    }
    if (initialRecord.generated.thumbnailVerticalDataUrl) {
      setThumbnailUrlVertical(initialRecord.generated.thumbnailVerticalDataUrl)
    }
  }, [initialRecord.generated.thumbnailDataUrl, initialRecord.generated.thumbnailVerticalDataUrl])

  // Hydrate saved videos from Cloudinary on mount
  useEffect(() => {
    if (initialRecord.generated.videoDataUrl) {
      setVideoUrl(initialRecord.generated.videoDataUrl)
    }
    if (initialRecord.generated.videoVerticalDataUrl) {
      setVideoUrlVertical(initialRecord.generated.videoVerticalDataUrl)
    }
  }, [initialRecord.generated.videoDataUrl, initialRecord.generated.videoVerticalDataUrl])

  // Hydrate saved voiceover from Supabase on mount
  useEffect(() => {
    async function loadVoiceover() {
      if (initialRecord.generated.voiceoverBase64) {
        try {
          // voiceoverBase64 now stores the Supabase key, not the actual data
          const voiceoverKey = initialRecord.generated.voiceoverBase64
          const base64 = await getVideoAsset(voiceoverKey)
          if (base64) {
            const binary = atob(base64)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
            // Detect format: voiceover- prefix means ElevenLabs MP3, avatar-video- means old HeyGen MP4
            const isMP3 = voiceoverKey.startsWith("voiceover-")
            const mimeType = isMP3 ? "audio/mpeg" : "video/mp4"
            const blob = new Blob([bytes], { type: mimeType })
            const url = URL.createObjectURL(blob)
            setAudioBlob(blob)
            setAudioUrl(url)
          }
        } catch (err) {
          // Silently ignore corrupt data or missing audio
        }
      }
    }
    loadVoiceover()
  }, [initialRecord.generated.voiceoverBase64])

  const answers = buildAnswersString(record.formData)

  async function callGenerate(type: "blog" | "video" | "social") {
    setError(null)
    setLoading(type)
    const settings = await getSettings()
    if (!settings.openaiApiKey) {
      setError("No OpenAI API key found. Please add it in Settings.")
      setLoading(null)
      return
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, answers, apiKey: settings.openaiApiKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Generation failed")

      const content = data.content as string

      if (type === "blog") {
        const updated = await updateGeneratedContent(record.id, { blogPost: content })
        if (updated) setRecord(updated)
        // Update pipeline status
        await updatePipelineStatus(record.id, { blogPostGenerated: true })
      } else if (type === "video") {
        // Replace Arousr with Arouser for voice script pronunciation
        const videoScript = content.replace(/Arousr/g, "Arouser")
        const updated = await updateGeneratedContent(record.id, { videoScript })
        if (updated) setRecord(updated)
        // Update pipeline status
        await updatePipelineStatus(record.id, { videoScriptGenerated: true })
      } else {
        // Parse social snippets
        const tweetMatch = content.match(/---TWEET---([\s\S]*?)(?=---INSTAGRAM---|$)/)
        const igMatch = content.match(/---INSTAGRAM---([\s\S]*?)(?=---REDDIT---|$)/)
        const redditMatch = content.match(/---REDDIT---([\s\S]*?)$/)
        const tweet = tweetMatch?.[1]?.trim() ?? ""
        const ig = igMatch?.[1]?.trim() ?? ""
        const reddit = redditMatch?.[1]?.trim() ?? ""
        const updated = await updateGeneratedContent(record.id, {
          tweetSnippet: tweet,
          instagramSnippet: ig,
          redditSnippet: reddit,
        })
        if (updated) setRecord(updated)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(null)
    }
  }

  async function generateLinkedInPost() {
    setError(null)
    setLoading("linkedin")
    const settings = await getSettings()

    if (!settings.openaiApiKey) {
      setError("OpenAI API key is missing. Add it in Admin Settings.")
      setLoading(null)
      return
    }

    const competitorName = record.formData.competitorName || "Competitor"
    const systemPrompt = `Write a LinkedIn post based on this competitor review of ${competitorName}. Follow these rules strictly:

TONE: Conversational and opinion-led, like an industry professional sharing a genuine observation. Not corporate. Not formal. Not a press release. Write the way a real person posts on LinkedIn — direct, specific, a little opinionated.

STRUCTURE:
- One short opening hook that states the core finding immediately — no throat-clearing, no "the landscape continually evolves" type openers
- Two or three short paragraphs covering the most interesting specific findings from the review — use real details, real numbers, real observations
- One paragraph positioning what a better platform does differently — mention Arousr naturally, not as an ad
- Three to five hashtags that are professional and platform-safe — avoid #AdultEntertainment or any tag likely to trigger LinkedIn content suppression. Use tags like #UserExperience #DigitalTrust #OnlineSafety #PlatformReview #DigitalWellness

LENGTH: 200-280 words maximum.

DO NOT mention: age policies, minimum age requirements, underage access, or any age-related safety concerns.
DO NOT use: corporate filler phrases like "the landscape continually evolves", "it is crucial", "paramount", "highlighting room for improvement"
DO NOT mention: the Arousr privacy score or any specific Arousr metrics — just mention it naturally as a platform that does things differently
DO NOT use: #AdultEntertainment or similar hashtags that could trigger content suppression on LinkedIn`

    const userContent = `Form Answers:\n${answers}\n\n${record.generated.blogPost ? `Blog Post Content:\n${record.generated.blogPost}` : ""}`

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          max_tokens: 1000,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message ?? "LinkedIn post generation failed")
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content?.trim() || ""
      const updated = await updateGeneratedContent(record.id, { linkedinPost: content })
      if (updated) setRecord(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(null)
    }
  }

  async function generateFacebookPost() {
    setError(null)
    setLoading("facebook")
    const settings = await getSettings()

    if (!settings.openaiApiKey) {
      setError("OpenAI API key is missing. Add it in Admin Settings.")
      setLoading(null)
      return
    }

    const competitorName = record.formData.competitorName || "Competitor"
    const systemPrompt = `Write a Facebook post based on this competitor review of ${competitorName}. Tone: conversational, engaging, informative but not overly formal. Frame it as sharing an interesting discovery with friends/followers. Structure: Start with an attention-grabbing opening line or question, 2-3 paragraphs covering the main findings (what stood out, pricing insights, user experience observations), end with a subtle mention of Arousr as an alternative worth checking out. Include a call-to-action like asking for opinions or experiences. Length: 150-250 words. Make it shareable and engaging for a general Facebook audience.`

    const userContent = `Form Answers:\n${answers}\n\n${record.generated.blogPost ? `Blog Post Content:\n${record.generated.blogPost}` : ""}`

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          max_tokens: 800,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message ?? "Facebook post generation failed")
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content?.trim() || ""
      
      // Use the horizontal thumbnail as the Facebook image if available
      const imageUrl = record.generated.thumbnailDataUrl || ""
      
      const updated = await updateGeneratedContent(record.id, { 
        facebookPost: content,
        facebookImageUrl: imageUrl 
      })
      if (updated) setRecord(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(null)
    }
  }

  async function generateVoiceover() {
    setError(null)
    setLoading("voiceover")
    const settings = await getSettings()

    if (!record.generated.videoScript) {
      setError("Generate a video script first before creating the voiceover.")
      setLoading(null)
      return
    }
    if (!settings.elevenLabsApiKey) {
      setError("ElevenLabs API key is missing. Add it in Admin Settings.")
      setLoading(null)
      return
    }
    if (!settings.elevenLabsVoiceId) {
      setError("ElevenLabs Voice ID is missing. Add it in Admin Settings.")
      setLoading(null)
      return
    }

    try {
      setVideoProgress("Generating voiceover with ElevenLabs...")
      
      // Call ElevenLabs API to generate speech
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${settings.elevenLabsVoiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": settings.elevenLabsApiKey,
        },
        body: JSON.stringify({
          text: record.generated.videoScript,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail?.message || errData.detail || `ElevenLabs API error: ${res.status}`)
      }

      // Get the audio as a blob
      const audioData = await res.arrayBuffer()
      const blob = new Blob([audioData], { type: "audio/mpeg" })
      
      // Convert to base64 for storage
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          resolve(result.split(",")[1])
        }
        reader.readAsDataURL(blob)
      })

      // Save to Supabase storage
      const voiceoverKey = `voiceover-${record.id}`
      await saveVideoAsset(voiceoverKey, base64)

      // Update record to mark that voiceover exists
      const updated = await updateGeneratedContent(record.id, {
        voiceoverBase64: voiceoverKey,
        voiceoverScriptHash: record.generated.videoScript ?? "",
      })
      if (updated) {
        setRecord(updated)
        // Update pipeline status
        await updatePipelineStatus(record.id, { avatarVideoGenerated: true })
        // Set blob for playback and video generation
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
      }
      setVideoProgress(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setVideoProgress(null)
    } finally {
      setLoading(null)
    }
  }

  async function generateThumbnailWithFormat(width: number, height: number) {
    const selectedImage = backgroundLibrary.find((img) => img.id === selectedBackgroundId)

    if (!selectedImage) {
      setError("Please select a background image first.")
      return null
    }

    const competitorName = record.formData.competitorName || "Competitor"
    const reviewerName = record.formData.reviewerName || "Reviewer"
    const settings = await getSettings()

    try {
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Failed to create canvas context")

      // Draw background using selected library image
      if (selectedImage) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error("Failed to load background image"))
          img.src = selectedImage.dataUrl
        })
        // Cover the canvas with the image
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height)
        const x = (canvas.width - img.width * scale) / 2
        const y = (canvas.height - img.height * scale) / 2
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
      } else {
        // Default gradient background if no image
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, "#1a1a2e")
        gradient.addColorStop(1, "#16213e")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Semi-transparent dark overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Scale text sizes proportionally
      const titleSize = Math.round(width * 0.056)
      const subtitleSize = Math.round(width * 0.028)
      const siteNameSize = Math.round(width * 0.022)

      // Title text: "Review: [Competitor Name]"
      ctx.fillStyle = "#ffffff"
      ctx.font = `bold ${titleSize}px system-ui, -apple-system, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(`Review: ${competitorName}`, canvas.width / 2, canvas.height / 2 - titleSize * 0.55)

      // Subtitle text: "Tested by [Reviewer Name]"
      ctx.font = `${subtitleSize}px system-ui, -apple-system, sans-serif`
      ctx.fillStyle = "#cccccc"
      ctx.fillText(`Tested by ${reviewerName}`, canvas.width / 2, canvas.height / 2 + subtitleSize * 1.4)

      // Site name at the bottom
      const siteName = settings.thumbnailSiteName || "Arousr"
      ctx.font = `bold ${siteNameSize}px system-ui, -apple-system, sans-serif`
      ctx.fillStyle = "#ffffff"
      ctx.fillText(siteName, canvas.width / 2, canvas.height - siteNameSize * 2.3)

      // Export as JPG
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
      return dataUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      return null
    }
  }

  async function generateThumbnail() {
    setError(null)
    setLoading("thumbnail")
    setThumbnailUrl(null)
    setThumbnailUrlVertical(null)

    try {
      // Generate horizontal thumbnail (1280x720)
      const horizontalUrl = await generateThumbnailWithFormat(1280, 720)
      if (horizontalUrl) setThumbnailUrl(horizontalUrl)

      // Generate vertical thumbnail (720x1280)
      const verticalUrl = await generateThumbnailWithFormat(720, 1280)
      if (verticalUrl) setThumbnailUrlVertical(verticalUrl)

      // Save thumbnails to record for persistence
      const updated = await updateGeneratedContent(record.id, {
        thumbnailDataUrl: horizontalUrl || undefined,
        thumbnailVerticalDataUrl: verticalUrl || undefined,
      })
      if (updated) setRecord(updated)
    } finally {
      setLoading(null)
    }
  }

  // --- Whisper caption types ---
  interface WhisperWord {
    word: string
    start: number
    end: number
  }

  // Fetch word-level captions from OpenAI Whisper
  async function fetchWhisperCaptions(blob: Blob): Promise<WhisperWord[]> {
    const settings = await getSettings()
    if (!settings.openaiApiKey) {
      console.log("[v0] No OpenAI API key - skipping captions")
      return []
    }

    // Determine file extension based on blob type
    const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("webm") ? "webm" : "mp3"
    const filename = `audio.${ext}`
    console.log("[v0] Sending to Whisper:", filename, "type:", blob.type, "size:", blob.size)

    const form = new FormData()
    form.append("file", new File([blob], filename, { type: blob.type }))
    form.append("model", "whisper-1")
    form.append("response_format", "verbose_json")
    form.append("timestamp_granularities[]", "word")

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${settings.openaiApiKey}` },
      body: form,
    })

    if (!res.ok) {
      const errText = await res.text()
      console.log("[v0] Whisper API error:", res.status, errText)
      return []
    }
    const data = await res.json()
    console.log("[v0] Whisper response - words count:", data.words?.length ?? 0)
    return (data.words as WhisperWord[]) ?? []
  }

  // Group flat word list into caption chunks of 4-5 words
  function buildCaptionGroups(
    words: WhisperWord[]
  ): Array<{ text: string; start: number; end: number }> {
    const WORDS_PER_GROUP = 4
    const groups: Array<{ text: string; start: number; end: number }> = []
    for (let i = 0; i < words.length; i += WORDS_PER_GROUP) {
      const chunk = words.slice(i, i + WORDS_PER_GROUP)
      groups.push({
        text: chunk.map((w) => w.word).join(" "),
        start: chunk[0].start,
        end: chunk[chunk.length - 1].end,
      })
    }
    return groups
  }

  // Core video generation function that supports both formats
  async function generateVideoWithFormat(
    width: number,
    height: number,
    formatLabel: string,
    captionGroups: Array<{ text: string; start: number; end: number }>
  ): Promise<Blob> {
    const settings = await getSettings()
    const CROSSFADE_DURATION = 0.5 // seconds
    const IMAGE_CYCLE_INTERVAL = 6 // seconds
    const LOGO_DURATION = 3 // seconds

    // Load all background images - use review screenshots if available, otherwise fall back to global library
    const images: HTMLImageElement[] = []
    const reviewScreenshots = record.formData.reviewScreenshots || []
    const imageSources = reviewScreenshots.length > 0 
      ? reviewScreenshots.map((dataUrl, i) => ({ id: `review-${i}`, dataUrl }))
      : backgroundLibrary
    
    console.log("[v0] Using", reviewScreenshots.length > 0 ? "review screenshots" : "global library", "for backgrounds:", imageSources.length, "images")
    
    for (const bgImg of imageSources) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Failed to load background image"))
        img.src = bgImg.dataUrl
      })
      images.push(img)
    }

    if (images.length === 0) {
      throw new Error("No background images available - upload screenshots in the review form or add images to the global library in Settings")
    }

    // Load logo video if available in IndexedDB
    let logoVideo: HTMLVideoElement | null = null
    const logoBase64 = await getVideoAsset("logo-video")
    if (logoBase64) {
      logoVideo = document.createElement("video")
      logoVideo.muted = true
      logoVideo.playsInline = true
      logoVideo.crossOrigin = "anonymous"
      const logoBlob = new Blob(
        [Uint8Array.from(atob(logoBase64), (c) => c.charCodeAt(0))],
        { type: "video/mp4" }
      )
      logoVideo.src = URL.createObjectURL(logoBlob)
      await new Promise<void>((resolve, reject) => {
        logoVideo!.onloadeddata = () => resolve()
        logoVideo!.onerror = () => reject(new Error("Failed to load logo video"))
        logoVideo!.load()
      })
    }

    // Avatar video removed - HeyGen integration is paused

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Failed to create canvas context")

    // Create audio context and decode audio
    const audioContext = new AudioContext()
    const arrayBuffer = await audioBlob!.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const audioDuration = audioBuffer.duration
    const totalDuration = audioDuration + LOGO_DURATION

    // Create audio source
    const audioDestination = audioContext.createMediaStreamDestination()
    const audioSource = audioContext.createBufferSource()
    audioSource.buffer = audioBuffer
    audioSource.connect(audioDestination)

    // Create video stream
    const videoStream = canvas.captureStream(60)

    // Combine streams
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks(),
    ])

    // Set up MediaRecorder
    const chunks: Blob[] = []
    let mimeType = "video/webm"
    const codecsToTry = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ]
    for (const codec of codecsToTry) {
      if (MediaRecorder.isTypeSupported(codec)) {
        mimeType = codec
        break
      }
    }

    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 8000000, // 8 Mbps for high quality
    })

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    const recordingPromise = new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" })
        resolve(blob)
      }
      mediaRecorder.onerror = (e) => reject(e)
    })

    // Helper to draw image covering canvas
    function drawImageCover(img: HTMLImageElement, alpha = 1) {
      ctx!.globalAlpha = alpha
      const scale = Math.max(width / img.width, height / img.height)
      const x = (width - img.width * scale) / 2
      const y = (height - img.height * scale) / 2
      ctx!.drawImage(img, x, y, img.width * scale, img.height * scale)
      ctx!.globalAlpha = 1
    }

    // Caption font size: 38px for horizontal, 52px for vertical
    const captionFontSize = width >= height ? 38 : 52

    // Helper: draw title overlay at top (fades out after 4s, gone by 4.5s)
    function drawTitle(elapsed: number) {
      const TITLE_HOLD = 4.0
      const TITLE_FADE = 0.5
      if (elapsed >= TITLE_HOLD + TITLE_FADE) return

      const alpha =
        elapsed < TITLE_HOLD
          ? 1
          : 1 - (elapsed - TITLE_HOLD) / TITLE_FADE

      const competitorName = record.formData.competitorName || "Competitor"
      const titleText = `Review: ${competitorName}`
      const titleSize = Math.round(Math.min(width, height) * 0.042)
      const padding = Math.round(titleSize * 0.7)
      const topY = Math.round(height * 0.055)

      ctx!.font = `bold ${titleSize}px system-ui, -apple-system, sans-serif`
      ctx!.textAlign = "center"
      ctx!.textBaseline = "middle"
      const textW = ctx!.measureText(titleText).width

      // Pill background
      ctx!.globalAlpha = alpha * 0.72
      ctx!.fillStyle = "#000000"
      const pillW = textW + padding * 2
      const pillH = titleSize + padding
      const pillX = width / 2 - pillW / 2
      const pillY = topY - pillH / 2
      const r = pillH / 2
      ctx!.beginPath()
      ctx!.moveTo(pillX + r, pillY)
      ctx!.lineTo(pillX + pillW - r, pillY)
      ctx!.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + pillH, r)
      ctx!.lineTo(pillX + pillW, pillY + pillH)
      ctx!.arcTo(pillX + pillW, pillY + pillH, pillX, pillY + pillH, r)
      ctx!.lineTo(pillX + r, pillY + pillH)
      ctx!.arcTo(pillX, pillY + pillH, pillX, pillY, r)
      ctx!.lineTo(pillX, pillY + r)
      ctx!.arcTo(pillX, pillY, pillX + pillW, pillY, r)
      ctx!.closePath()
      ctx!.fill()

      // Title text
      ctx!.globalAlpha = alpha
      ctx!.fillStyle = "#ffffff"
      ctx!.fillText(titleText, width / 2, topY)
      ctx!.globalAlpha = 1
    }

    // Helper: draw active caption at bottom
    function drawCaption(elapsed: number) {
      if (captionGroups.length === 0) return
      // Find the caption group active at this timestamp
      const group = captionGroups.find(
        (g) => elapsed >= g.start && elapsed <= g.end + 0.25
      )
      if (!group) return

      const padding = Math.round(captionFontSize * 0.55)
      const bottomY = height - Math.round(height * 0.075)

      ctx!.font = `bold ${captionFontSize}px system-ui, -apple-system, sans-serif`
      ctx!.textAlign = "center"
      ctx!.textBaseline = "middle"
      const textW = ctx!.measureText(group.text).width

      // Pill background
      const pillW = textW + padding * 2
      const pillH = captionFontSize + padding
      const pillX = width / 2 - pillW / 2
      const pillY = bottomY - pillH / 2
      const r = pillH / 2

      ctx!.globalAlpha = 0.68
      ctx!.fillStyle = "#000000"
      ctx!.beginPath()
      ctx!.moveTo(pillX + r, pillY)
      ctx!.lineTo(pillX + pillW - r, pillY)
      ctx!.arcTo(pillX + pillW, pillY, pillX + pillW, pillY + pillH, r)
      ctx!.lineTo(pillX + pillW, pillY + pillH)
      ctx!.arcTo(pillX + pillW, pillY + pillH, pillX, pillY + pillH, r)
      ctx!.lineTo(pillX + r, pillY + pillH)
      ctx!.arcTo(pillX, pillY + pillH, pillX, pillY, r)
      ctx!.lineTo(pillX, pillY + r)
      ctx!.arcTo(pillX, pillY, pillX + pillW, pillY, r)
      ctx!.closePath()
      ctx!.fill()

      ctx!.globalAlpha = 1
      ctx!.fillStyle = "#ffffff"
      ctx!.fillText(group.text, width / 2, bottomY)
    }

    // Animation loop variables
    let animationFrameId: number
    let isRecording = true
    const startTime = performance.now()
    let logoStarted = false

    function render() {
      if (!isRecording) return

      const elapsed = (performance.now() - startTime) / 1000

      if (elapsed >= audioDuration) {
        // --- Logo ending screen ---
        const logoElapsed = elapsed - audioDuration

        ctx!.fillStyle = "#000000"
        ctx!.fillRect(0, 0, width, height)

        if (logoVideo && logoElapsed >= 0.5) {
          if (!logoStarted) {
            logoVideo.currentTime = 0
            logoVideo.play().catch(() => {})
            logoStarted = true
          }

          const videoAspect = logoVideo.videoWidth / logoVideo.videoHeight
          const canvasAspect = width / height
          let drawWidth: number, drawHeight: number, drawX: number, drawY: number

          if (videoAspect > canvasAspect) {
            drawWidth = width * 0.6
            drawHeight = drawWidth / videoAspect
          } else {
            drawHeight = height * 0.6
            drawWidth = drawHeight * videoAspect
          }
          drawX = (width - drawWidth) / 2
          drawY = (height - drawHeight) / 2

          const logoFadeIn = Math.min(1, (logoElapsed - 0.5) / 0.3)
          ctx!.globalAlpha = logoFadeIn
          ctx!.drawImage(logoVideo, drawX, drawY, drawWidth, drawHeight)
          ctx!.globalAlpha = 1
        }
      } else {
        // --- Main content: cycling backgrounds ---
        const cycleTime = elapsed % (IMAGE_CYCLE_INTERVAL * images.length)
        const currentImageIndex = Math.floor(cycleTime / IMAGE_CYCLE_INTERVAL) % images.length
        const timeInCurrentImage = cycleTime % IMAGE_CYCLE_INTERVAL

        drawImageCover(images[currentImageIndex])

        if (images.length > 1 && timeInCurrentImage >= IMAGE_CYCLE_INTERVAL - CROSSFADE_DURATION) {
          const nextImageIndex = (currentImageIndex + 1) % images.length
          const crossAlpha =
            (timeInCurrentImage - (IMAGE_CYCLE_INTERVAL - CROSSFADE_DURATION)) / CROSSFADE_DURATION
          drawImageCover(images[nextImageIndex], crossAlpha)
        }

        // Title (top, first 4–4.5 s only)
        drawTitle(elapsed)

        // Captions shown throughout the video
        drawCaption(elapsed)
      }

      animationFrameId = requestAnimationFrame(render)
    }

    // Start recording and audio
    mediaRecorder.start(100)
    audioSource.start()
    render()

    // Progress tracking
    const progressInterval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000
      const percent = Math.min(100, Math.round((elapsed / totalDuration) * 100))
      setVideoProgress(`${formatLabel}: ${percent}%`)
    }, 500)

    // Wait for total duration
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        isRecording = false
        cancelAnimationFrame(animationFrameId)
        clearInterval(progressInterval)
        resolve()
      }, totalDuration * 1000)
    })

    // Cleanup
    mediaRecorder.stop()
    await audioContext.close()
    if (logoVideo) {
      logoVideo.pause()
      URL.revokeObjectURL(logoVideo.src)
    }

    return recordingPromise
  }

  async function generateVideo() {
    if (!audioBlob) {
      setError("Generate voiceover first.")
      return
    }

    // Check if we have background images (either from review or global library)
    const reviewScreenshots = record.formData.reviewScreenshots || []
    if (backgroundLibrary.length === 0 && reviewScreenshots.length === 0) {
      setError("Please add background images in Settings or upload screenshots in the review form.")
      return
    }

    setError(null)
    setLoading("video")
    setVideoUrl(null)
    setVideoUrlVertical(null)
    setVideoProgress("Generating voiceover and captions\u2026 then rendering video. This takes about 60 seconds.")

    try {
      // Fetch Whisper word-level captions
      const whisperWords = await fetchWhisperCaptions(audioBlob)
      const captionGroups = buildCaptionGroups(whisperWords)
      console.log("[v0] Caption groups generated:", captionGroups.length, "groups")
      console.log("[v0] First few captions:", captionGroups.slice(0, 3))

      // Generate horizontal video (1920x1080)
      setVideoProgress("Rendering horizontal video\u2026")
      const horizontalBlob = await generateVideoWithFormat(1920, 1080, "Horizontal (1920x1080)", captionGroups)
      const horizontalUrl = URL.createObjectURL(horizontalBlob)
      setVideoUrl(horizontalUrl)

      // Upload horizontal video directly to Cloudinary (bypasses server limits)
      setVideoProgress("Uploading horizontal video\u2026")
      const horizontalFormData = new FormData()
      horizontalFormData.append("file", horizontalBlob)
      horizontalFormData.append("upload_preset", "competitor_review_unsigned")
      horizontalFormData.append("public_id", `horizontal-${record.id}`)
      horizontalFormData.append("folder", "competitor-review-videos")
      const cloudName = await fetch("/api/cloudinary-config").then(r => r.json()).then(d => d.cloudName)
      const horizontalRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
        method: "POST",
        body: horizontalFormData,
      })
      const horizontalData = await horizontalRes.json()
      if (!horizontalRes.ok) throw new Error(horizontalData.error?.message || "Failed to upload horizontal video")

      // Generate vertical video (1080x1920)
      setVideoProgress("Rendering vertical video\u2026")
      const verticalBlob = await generateVideoWithFormat(1080, 1920, "Vertical (1080x1920)", captionGroups)
      const verticalUrl = URL.createObjectURL(verticalBlob)
      setVideoUrlVertical(verticalUrl)

      // Upload vertical video directly to Cloudinary
      setVideoProgress("Uploading vertical video\u2026")
      const verticalFormData = new FormData()
      verticalFormData.append("file", verticalBlob)
      verticalFormData.append("upload_preset", "competitor_review_unsigned")
      verticalFormData.append("public_id", `vertical-${record.id}`)
      verticalFormData.append("folder", "competitor-review-videos")
      const verticalRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
        method: "POST",
        body: verticalFormData,
      })
      const verticalData = await verticalRes.json()
      if (!verticalRes.ok) throw new Error(verticalData.error?.message || "Failed to upload vertical video")

      // Save video URLs to record for persistence
      const updated = await updateGeneratedContent(record.id, {
        videoDataUrl: horizontalData.secure_url,
        videoVerticalDataUrl: verticalData.secure_url,
      })
      if (updated) setRecord(updated)

      setVideoProgress(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setVideoProgress(null)
    } finally {
      setLoading(null)
    }
  }

  async function pushToWordPress() {
    setError(null)
    setLoading("wp")
    const settings = await getSettings()
    if (!settings.wpSiteUrl || !settings.wpUsername || !settings.wpAppPassword) {
      setError("WordPress credentials are missing. Please configure them in Settings.")
      setLoading(null)
      return
    }
    if (!record.generated.blogPost) {
      setError("Generate a blog post first before pushing to WordPress.")
      setLoading(null)
      return
    }

    try {
      const title = `Review: ${record.formData.competitorName} — Is It Worth It? (2026)`
      // Convert to HTML in case the blog post was edited as Markdown
      const blogPostHtml = record.generated.blogPost
      
      const res = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl: settings.wpSiteUrl,
          username: settings.wpUsername,
          appPassword: settings.wpAppPassword,
          title,
          content: blogPostHtml,
          formData: {
            reviewerName: record.formData.reviewerName,
            competitorName: record.formData.competitorName,
            competitorUrl: record.formData.competitorUrl,
            oneLineVerdict: record.formData.oneLineVerdict,
            scores: record.formData.scores,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "WordPress push failed")
      setWpStatus({ url: data.link, editUrl: data.editUrl })
      const updated = await updateGeneratedContent(record.id, { wordpressDraftUrl: data.editUrl })
      if (updated) setRecord(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(null)
    }
  }

  const actionBtn =
    "flex items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <div className="flex flex-col gap-6">
      {/* Action buttons */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Generate Content
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => callGenerate("blog")}
            disabled={loading !== null}
            className={actionBtn}
          >
            {loading === "blog" ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            Blog Post Draft
          </button>
          <button
            type="button"
            onClick={() => callGenerate("video")}
            disabled={loading !== null}
            className={actionBtn}
          >
            {loading === "video" ? <Loader2 size={15} className="animate-spin" /> : <Video size={15} />}
            Video Script
          </button>
          <button
            type="button"
            onClick={generateVoiceover}
            disabled={loading !== null || !record.generated.videoScript}
            className={actionBtn}
            title={!record.generated.videoScript ? "Generate a video script first" : audioUrl ? "Re-generate voiceover" : undefined}
          >
            {loading === "voiceover" ? <Loader2 size={15} className="animate-spin" /> : <Video size={15} />}
            {audioUrl ? "Re-generate Voiceover" : "Generate Voiceover"}
          </button>
          {/* Background image picker */}
          {backgroundLibrary.length > 0 && (
            <div className="col-span-full flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground">Select Background Image</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {backgroundLibrary.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedBackgroundId(img.id)}
                    className={cn(
                      "group relative overflow-hidden rounded-md border-2 transition-all",
                      selectedBackgroundId === img.id
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.label}
                      className="aspect-video w-full object-cover"
                    />
                    <span className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1 py-0.5 text-center text-xs text-white">
                      {img.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={generateThumbnail}
            disabled={loading !== null}
            className={actionBtn}
          >
            {loading === "thumbnail" ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
            Generate Thumbnail
          </button>
          {audioBlob && backgroundLibrary.length > 0 && (
            <button
              type="button"
              onClick={generateVideo}
              disabled={loading !== null}
              className={actionBtn}
            >
              {loading === "video" ? <Loader2 size={15} className="animate-spin" /> : <Video size={15} />}
              Generate Videos
            </button>
          )}
          <button
            type="button"
            onClick={() => callGenerate("social")}
            disabled={loading !== null}
            className={actionBtn}
          >
            {loading === "social" ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
            Social Snippets
          </button>
          <button
            type="button"
            onClick={generateLinkedInPost}
            disabled={loading !== null}
            className={actionBtn}
          >
            {loading === "linkedin" ? <Loader2 size={15} className="animate-spin" /> : <Linkedin size={15} />}
            Generate LinkedIn Post
          </button>
          <button
            type="button"
            onClick={generateFacebookPost}
            disabled={loading !== null}
            className={actionBtn}
          >
            {loading === "facebook" ? <Loader2 size={15} className="animate-spin" /> : <Facebook size={15} />}
            Generate Facebook Post
          </button>
          <button
            type="button"
            onClick={pushToWordPress}
            disabled={loading !== null}
            className={actionBtn}
          >
            {loading === "wp" ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
            Push to WordPress
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {videoProgress && (
          <div className="mt-3 flex items-center gap-3 rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-3">
            <Loader2 size={16} className="animate-spin text-blue-400" />
            <span className="text-sm text-blue-400">{videoProgress}</span>
          </div>
        )}

        {wpStatus && (
          <div className="mt-3 flex items-center gap-3 rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3">
            <span className="text-sm text-green-400">Draft saved to WordPress.</span>
            {wpStatus.editUrl && (
              <a
                href={wpStatus.editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Edit in WP Admin <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Blog post */}
      {record.generated.blogPost && (
        <div className="rounded-lg border border-border bg-card p-5">
          <HTMLPreviewBlock
            label="Blog Post Draft"
            htmlContent={convertMarkdownToStyledHTML(record.generated.blogPost)}
            markdownContent={record.generated.blogPost}
            viewAsHtml={blogPostViewAsHtml}
            onToggleView={setBlogPostViewAsHtml}
            onSave={async (v) => {
              const updated = await updateGeneratedContent(record.id, { blogPost: v })
              if (updated) setRecord(updated)
            }}
            onDownload={() => {
              const html = convertMarkdownToStyledHTML(record.generated.blogPost!)
              const blob = new Blob([html], { type: "text/html;charset=utf-8" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "review"}-blog-post.html`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}
          />
        </div>
      )}

      {/* Video script */}
      {record.generated.videoScript && (
        <div className="rounded-lg border border-border bg-card p-5">
          <OutputBlock
            label="Video Script"
            content={record.generated.videoScript}
            onSave={async (v) => {
              const updated = await updateGeneratedContent(record.id, { videoScript: v })
              if (updated) setRecord(updated)
            }}
          />
        </div>
      )}

      {/* Voiceover audio */}
      {audioUrl && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Voiceover
            </span>
            <a
              href={audioUrl}
              download={`${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "competitor"}-review.mp3`}
              className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
            >
              <Download size={12} />
              Download MP3
            </a>
          </div>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      {/* Generated Thumbnails */}
      {(thumbnailUrl || thumbnailUrlVertical) && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Generated Thumbnails
          </h3>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Horizontal Thumbnail */}
            {thumbnailUrl && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Horizontal (1280x720)</span>
                  <a
                    href={thumbnailUrl}
                    download={`${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "competitor"}-thumbnail-horizontal.jpg`}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
                  >
                    <Download size={12} />
                    Download
                  </a>
                </div>
                <img src={thumbnailUrl} alt="Generated horizontal thumbnail" className="w-full rounded-md" />
              </div>
            )}
            {/* Vertical Thumbnail */}
            {thumbnailUrlVertical && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Vertical (720x1280)</span>
                  <a
                    href={thumbnailUrlVertical}
                    download={`${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "competitor"}-thumbnail-vertical.jpg`}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
                  >
                    <Download size={12} />
                    Download
                  </a>
                </div>
                <img src={thumbnailUrlVertical} alt="Generated vertical thumbnail" className="aspect-[9/16] max-h-[400px] w-auto self-center rounded-md" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Videos */}
      {(videoUrl || videoUrlVertical) && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Generated Videos
          </h3>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Horizontal Video */}
            {videoUrl && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Horizontal (1920x1080)</span>
                  <a
                    href={videoUrl}
                    download={`${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "competitor"}-review-horizontal.webm`}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
                  >
                    <Download size={12} />
                    Download
                  </a>
                </div>
                <video controls src={videoUrl} className="w-full rounded-md" />
              </div>
            )}
            {/* Vertical Video */}
            {videoUrlVertical && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Vertical (1080x1920)</span>
                  <a
                    href={videoUrlVertical}
                    download={`${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "competitor"}-review-vertical.webm`}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
                  >
                    <Download size={12} />
                    Download
                  </a>
                </div>
                <video controls src={videoUrlVertical} className="aspect-[9/16] max-h-[400px] w-auto self-center rounded-md" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social snippets */}
      {(record.generated.tweetSnippet || record.generated.instagramSnippet || record.generated.redditSnippet) && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Social Snippets
          </h3>
          <div className="flex flex-col gap-5">
            {record.generated.tweetSnippet && (
              <OutputBlock
                label="Tweet (X)"
                content={record.generated.tweetSnippet}
                onSave={async (v) => {
                  const updated = await updateGeneratedContent(record.id, { tweetSnippet: v })
                  if (updated) setRecord(updated)
                }}
              />
            )}
            {record.generated.instagramSnippet && (
              <OutputBlock
                label="Instagram Caption"
                content={record.generated.instagramSnippet}
                onSave={async (v) => {
                  const updated = await updateGeneratedContent(record.id, { instagramSnippet: v })
                  if (updated) setRecord(updated)
                }}
              />
            )}
            {record.generated.redditSnippet && (
              <OutputBlock
                label="Reddit Comment"
                content={record.generated.redditSnippet}
                onSave={async (v) => {
                  const updated = await updateGeneratedContent(record.id, { redditSnippet: v })
                  if (updated) setRecord(updated)
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* LinkedIn Post */}
      {record.generated.linkedinPost && (
        <div className="rounded-lg border border-border bg-card p-5">
          <OutputBlock
            label="LinkedIn Post"
            content={record.generated.linkedinPost}
            onSave={async (v) => {
              const updated = await updateGeneratedContent(record.id, { linkedinPost: v })
              if (updated) setRecord(updated)
            }}
          />
        </div>
      )}

      {/* Facebook Post */}
      {record.generated.facebookPost && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Facebook Post
          </h3>
          <div className="flex flex-col gap-4">
            {/* Facebook Image */}
            {record.generated.facebookImageUrl && (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={record.generated.facebookImageUrl}
                  alt="Facebook post image"
                  className="w-full h-auto object-cover"
                />
                <a
                  href={record.generated.facebookImageUrl}
                  download={`${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "review"}-facebook-image.jpg`}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-md bg-black/70 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-black/90"
                >
                  <Download size={12} />
                  Download Image
                </a>
              </div>
            )}
            {/* Facebook Text */}
            <OutputBlock
              label="Post Text"
              content={record.generated.facebookPost}
              onSave={async (v) => {
                const updated = await updateGeneratedContent(record.id, { facebookPost: v })
                if (updated) setRecord(updated)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
