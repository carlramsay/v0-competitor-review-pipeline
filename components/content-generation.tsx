import { useState, useEffect } from "react"
import { ReviewRecord, ThumbnailImage } from "@/lib/types"
import { getSettings, updateGeneratedContent, getThumbnailLibrary } from "@/lib/store"
import { buildAnswersString } from "@/lib/review-utils"
import { cn } from "@/lib/utils"
import { Download, ImageIcon, Save, Check } from "lucide-react"
import { CopyButton } from "./copy-button"
import { FileText, Video, Share2, Globe, ExternalLink, Loader2, Mic, Eye, EyeOff } from "lucide-react"

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
}

function HTMLPreviewBlock({ label, htmlContent, markdownContent, viewAsHtml, onToggleView, onDownload }: HTMLPreviewBlockProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <CopyButton text={viewAsHtml ? htmlContent : markdownContent} />
          <button
            type="button"
            onClick={() => onToggleView(!viewAsHtml)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
          >
            {viewAsHtml ? <EyeOff size={12} /> : <Eye size={12} />}
            {viewAsHtml ? "View Markdown" : "View HTML"}
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
          >
            <Download size={12} />
            Download HTML
          </button>
        </div>
      </div>
      {viewAsHtml ? (
        <div 
          className="min-h-[160px] max-h-[500px] overflow-y-auto w-full rounded-md border border-border bg-[#1a1a1a] px-4 py-3 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      ) : (
        <textarea
          value={markdownContent}
          readOnly
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
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoProgress, setVideoProgress] = useState<string | null>(null)
  const [backgroundLibrary, setBackgroundLibrary] = useState<ThumbnailImage[]>([])
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null)
  const [viewBlogAsHtml, setViewBlogAsHtml] = useState(true)

  // Load background image library on mount
  useEffect(() => {
    setBackgroundLibrary(getThumbnailLibrary())
  }, [])

  // Hydrate saved voiceover from localStorage on mount
  useEffect(() => {
    if (initialRecord.generated.voiceoverBase64) {
      try {
        const binary = atob(initialRecord.generated.voiceoverBase64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        const blob = new Blob([bytes], { type: "audio/mpeg" })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
      } catch (err) {
        // Silently ignore corrupt data
      }
    }
  }, [initialRecord.generated.voiceoverBase64])

  const answers = buildAnswersString(record.formData)

  async function callGenerate(type: "blog" | "video" | "social") {
    setError(null)
    setLoading(type)
    const settings = getSettings()
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
        const updated = updateGeneratedContent(record.id, { blogPost: content })
        if (updated) setRecord(updated)
      } else if (type === "video") {
        // Replace Arousr with Arouser for voice script pronunciation
        const videoScript = content.replace(/Arousr/g, "Arouser")
        const updated = updateGeneratedContent(record.id, { videoScript })
        if (updated) setRecord(updated)
      } else {
        // Parse social snippets
        const tweetMatch = content.match(/---TWEET---([\s\S]*?)(?=---INSTAGRAM---|$)/)
        const igMatch = content.match(/---INSTAGRAM---([\s\S]*?)(?=---REDDIT---|$)/)
        const redditMatch = content.match(/---REDDIT---([\s\S]*?)$/)
        const tweet = tweetMatch?.[1]?.trim() ?? ""
        const ig = igMatch?.[1]?.trim() ?? ""
        const reddit = redditMatch?.[1]?.trim() ?? ""
        const updated = updateGeneratedContent(record.id, {
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

  function downloadBlogPostHTML() {
    if (!record.generated.blogPost) return
    const blob = new Blob([record.generated.blogPost], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${record.formData.competitorName || "competitor"}-review.html`.toLowerCase().replace(/\s+/g, "-")
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function generateVoiceover() {
    setError(null)
    setLoading("voiceover")
    const settings = getSettings()

    if (!record.generated.videoScript) {
      setError("Generate a video script first before creating a voiceover.")
      setLoading(null)
      return
    }
    if (!settings.elevenlabsApiKey) {
      setError("ElevenLabs API key is missing. Add it in Admin Settings.")
      setLoading(null)
      return
    }
    if (!settings.elevenlabsVoiceId) {
      setError("ElevenLabs Voice ID is missing. Add it in Admin Settings.")
      setLoading(null)
      return
    }

    try {
      const res = await fetch("/api/voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: record.generated.videoScript,
          apiKey: settings.elevenlabsApiKey,
          voiceId: settings.elevenlabsVoiceId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Voiceover generation failed")
      }

      const blob = await res.blob()

      // Convert to base64 and persist in localStorage so it survives page reloads
      const arrayBuffer = await blob.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      )
      const updated = updateGeneratedContent(record.id, {
        voiceoverBase64: base64,
        voiceoverScriptHash: record.generated.videoScript ?? "",
      })
      if (updated) setRecord(updated)

      // Revoke previous object URL to avoid memory leaks
      if (audioUrl) URL.revokeObjectURL(audioUrl)

      setAudioUrl(URL.createObjectURL(blob))
      setAudioBlob(blob)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(null)
    }
  }

  async function generateThumbnail() {
    setError(null)

    const selectedImage = backgroundLibrary.find((img) => img.id === selectedBackgroundId)

    if (!selectedImage) {
      setError("Please select a background image first.")
      return
    }

    setLoading("thumbnail")
    setThumbnailUrl(null)
    const settings = getSettings()

    const competitorName = record.formData.competitorName || "Competitor"
    const reviewerName = record.formData.reviewerName || "Reviewer"

    try {
      const canvas = document.createElement("canvas")
      canvas.width = 1280
      canvas.height = 720
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

      // Title text: "Review: [Competitor Name]"
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 72px system-ui, -apple-system, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(`Review: ${competitorName}`, canvas.width / 2, canvas.height / 2 - 40)

      // Subtitle text: "Tested by [Reviewer Name]"
      ctx.font = "36px system-ui, -apple-system, sans-serif"
      ctx.fillStyle = "#cccccc"
      ctx.fillText(`Tested by ${reviewerName}`, canvas.width / 2, canvas.height / 2 + 40)

      // Site name at the bottom
      const siteName = settings.thumbnailSiteName || "Arousr"
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif"
      ctx.fillStyle = "#ffffff"
      ctx.fillText(siteName, canvas.width / 2, canvas.height - 50)

      // Export as JPG
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
      setThumbnailUrl(dataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(null)
    }
  }

  async function generateVideo() {
    if (!thumbnailUrl || !audioBlob) {
      setError("Generate both thumbnail and voiceover first.")
      return
    }

    setError(null)
    setLoading("video")
    setVideoUrl(null)
    setVideoProgress("Preparing video...")

    try {
      // Create a canvas from the thumbnail image
      const img = new Image()
      img.crossOrigin = "anonymous"
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Failed to load thumbnail"))
        img.src = thumbnailUrl
      })

      const canvas = document.createElement("canvas")
      canvas.width = 1280
      canvas.height = 720
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Failed to create canvas context")

      // Draw the thumbnail on the canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Create video stream from canvas (60 fps for better quality)
      const videoStream = canvas.captureStream(60)

      // Create audio context and source from the audio blob
      const audioContext = new AudioContext()
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Create a media stream destination for audio
      const audioDestination = audioContext.createMediaStreamDestination()
      const audioSource = audioContext.createBufferSource()
      audioSource.buffer = audioBuffer
      audioSource.connect(audioDestination)

      // Combine video and audio streams
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks(),
      ])

      // Set up MediaRecorder with higher bitrate for better quality
      const chunks: Blob[] = []
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp9,opus",
        videoBitsPerSecond: 5000000, // 5 Mbps for high quality
      })

      // Fallback to VP8 if VP9 not supported
      if (mediaRecorder.mimeType !== "video/webm;codecs=vp9,opus") {
        const fallbackRecorder = new MediaRecorder(combinedStream, {
          mimeType: "video/webm;codecs=vp8,opus",
          videoBitsPerSecond: 5000000,
        })
        Object.assign(mediaRecorder, fallbackRecorder)
      }

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

      // Start recording
      setVideoProgress("Recording video...")
      mediaRecorder.start(100) // Collect data every 100ms
      audioSource.start()

      // Track progress
      const audioDuration = audioBuffer.duration
      const startTime = Date.now()
      const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        const percent = Math.min(100, Math.round((elapsed / audioDuration) * 100))
        setVideoProgress(`Recording video... ${percent}%`)
      }, 500)

      // Wait for audio to finish
      await new Promise<void>((resolve) => {
        audioSource.onended = () => resolve()
      })

      clearInterval(progressInterval)
      setVideoProgress("Finalizing video...")

      // Stop recording
      mediaRecorder.stop()
      await audioContext.close()

      // Get the final video blob
      const videoBlob = await recordingPromise
      const url = URL.createObjectURL(videoBlob)
      setVideoUrl(url)
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
    const settings = getSettings()
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
      const updated = updateGeneratedContent(record.id, { wordpressDraftUrl: data.editUrl })
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
            title={!record.generated.videoScript ? "Generate a video script first" : audioUrl ? "Re-generate voiceover (uses ElevenLabs credits)" : undefined}
          >
            {loading === "voiceover" ? <Loader2 size={15} className="animate-spin" /> : <Mic size={15} />}
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
          {thumbnailUrl && audioBlob && (
            <button
              type="button"
              onClick={generateVideo}
              disabled={loading !== null}
              className={actionBtn}
            >
              {loading === "video" ? <Loader2 size={15} className="animate-spin" /> : <Video size={15} />}
              Generate Video
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
          <OutputBlock
            label="Blog Post Draft"
            content={record.generated.blogPost}
            onSave={(v) => {
              const updated = updateGeneratedContent(record.id, { blogPost: v })
              if (updated) setRecord(updated)
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
            onSave={(v) => {
              const updated = updateGeneratedContent(record.id, { videoScript: v })
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

      {/* Generated Thumbnail */}
      {thumbnailUrl && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Generated Thumbnail
            </span>
            <a
              href={thumbnailUrl}
              download={`${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "competitor"}-thumbnail.jpg`}
              className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
            >
              <Download size={12} />
              Download Thumbnail
            </a>
          </div>
          <img src={thumbnailUrl} alt="Generated thumbnail" className="w-full rounded-md" />
        </div>
      )}

      {/* Generated Video */}
      {videoUrl && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Generated Video
            </span>
            <a
              href={videoUrl}
              download={`${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "competitor"}-review.webm`}
              className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
            >
              <Download size={12} />
              Download Video
            </a>
          </div>
          <video controls src={videoUrl} className="w-full rounded-md" />
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
                onSave={(v) => {
                  const updated = updateGeneratedContent(record.id, { tweetSnippet: v })
                  if (updated) setRecord(updated)
                }}
              />
            )}
            {record.generated.instagramSnippet && (
              <OutputBlock
                label="Instagram Caption"
                content={record.generated.instagramSnippet}
                onSave={(v) => {
                  const updated = updateGeneratedContent(record.id, { instagramSnippet: v })
                  if (updated) setRecord(updated)
                }}
              />
            )}
            {record.generated.redditSnippet && (
              <OutputBlock
                label="Reddit Comment"
                content={record.generated.redditSnippet}
                onSave={(v) => {
                  const updated = updateGeneratedContent(record.id, { redditSnippet: v })
                  if (updated) setRecord(updated)
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
