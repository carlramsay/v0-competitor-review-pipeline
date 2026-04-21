import { useState, useEffect, useRef } from "react"
import { ReviewRecord, ThumbnailImage } from "@/lib/types"
import { getSettings, updateGeneratedContent, updatePipelineStatus, getThumbnailLibrary, getVideoAsset, saveVideoAsset } from "@/lib/store"
import { buildAnswersString } from "@/lib/review-utils"
import { convertMarkdownToStyledHTML } from "@/lib/markdown-converter"
import { cn } from "@/lib/utils"
import { Download, ImageIcon, Save, Check, RefreshCw } from "lucide-react"
import { CopyButton } from "./copy-button"
import { FileText, Video, Share2, Globe, ExternalLink, Loader2, Eye, EyeOff, Linkedin, Facebook, Twitter, Instagram, MessageSquare } from "lucide-react"

// Reusable editable text block with Copy and Save buttons
interface EditableBlockProps {
  label: string
  content: string
  onSave: (value: string) => void
  onGenerate?: () => void
  isGenerating?: boolean
  generateLabel?: string
  onChange?: (value: string) => void // Called on every edit to track current value
}

function EditableBlock({ label, content, onSave, onGenerate, isGenerating, generateLabel = "Generate", onChange }: EditableBlockProps) {
  const [value, setValue] = useState(content)
  const [saved, setSaved] = useState(false)
  const isDirty = value !== content
  
  useEffect(() => {
    setValue(content)
    setSaved(false)
  }, [content])
  
  function handleChange(newValue: string) {
    setValue(newValue)
    onChange?.(newValue)
  }

  function handleSave() {
    onSave(value)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const btnClass = "flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-40"

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
          {onGenerate && (
            <button type="button" onClick={onGenerate} disabled={isGenerating} className={btnClass}>
              {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              {generateLabel}
            </button>
          )}
          <CopyButton text={value} />
          <button type="button" onClick={handleSave} disabled={!isDirty} className={btnClass}>
            {saved ? <Check size={12} className="text-green-400" /> : <Save size={12} />}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => { handleChange(e.target.value); setSaved(false) }}
        className="min-h-[160px] w-full resize-y rounded-md border border-border bg-input px-3 py-2 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  )
}

// HTML preview block with View Markdown toggle
interface HTMLPreviewBlockProps {
  label: string
  htmlContent: string
  markdownContent: string
  viewAsHtml: boolean
  onToggleView: (asHtml: boolean) => void
  onDownload: () => void
  onSave: (markdown: string) => void
  onGenerate?: () => void
  isGenerating?: boolean
}

function HTMLPreviewBlock({ label, htmlContent, markdownContent, viewAsHtml, onToggleView, onDownload, onSave, onGenerate, isGenerating }: HTMLPreviewBlockProps) {
  const [value, setValue] = useState(markdownContent)
  const [saved, setSaved] = useState(false)
  const isDirty = value !== markdownContent

  useEffect(() => {
    setValue(markdownContent)
    setSaved(false)
  }, [markdownContent])

  function handleSave() {
    onSave(value)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const currentHtmlContent = isDirty ? convertMarkdownToStyledHTML(value) : htmlContent
  const btnClass = "flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-40"

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
          {isDirty && !saved && (
            <span className="text-xs text-amber-400">Unsaved changes</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onGenerate && (
            <button type="button" onClick={onGenerate} disabled={isGenerating} className={btnClass}>
              {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Generate
            </button>
          )}
          <CopyButton text={viewAsHtml ? currentHtmlContent : value} />
          <button type="button" onClick={() => onToggleView(!viewAsHtml)} className={btnClass}>
            {viewAsHtml ? <EyeOff size={12} /> : <Eye size={12} />}
            {viewAsHtml ? "View Markdown" : "View Styled Preview"}
          </button>
          <button type="button" onClick={onDownload} className={btnClass}>
            <Download size={12} />
            Download HTML
          </button>
          <button type="button" onClick={handleSave} disabled={!isDirty} className={btnClass}>
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
  const [blogPostViewAsHtml, setBlogPostViewAsHtml] = useState(true)
  const [backgroundLibrary, setBackgroundLibrary] = useState<ThumbnailImage[]>([])
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null)
  
  // Ref to track the current video script value (including unsaved edits)
  const videoScriptRef = useRef(initialRecord.generated.videoScript || "")
  
  // Keep ref in sync with saved record
  useEffect(() => {
    videoScriptRef.current = record.generated.videoScript || ""
  }, [record.generated.videoScript])

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
          const voiceoverKey = initialRecord.generated.voiceoverBase64
          const base64 = await getVideoAsset(voiceoverKey)
          if (base64) {
            const binary = atob(base64)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
            const blob = new Blob([bytes], { type: "audio/mpeg" })
            const url = URL.createObjectURL(blob)
            setAudioBlob(blob)
            setAudioUrl(url)
          }
        } catch (err) {
          // Silently ignore corrupt data
        }
      }
    }
    loadVoiceover()
  }, [initialRecord.generated.voiceoverBase64])

  const answers = buildAnswersString(record.formData)

  // ==================== GENERATION FUNCTIONS ====================

  async function generateBlogPost() {
    setError(null)
    setLoading("blog")
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
        body: JSON.stringify({ type: "blog", answers, apiKey: settings.openaiApiKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Generation failed")

      const updated = await updateGeneratedContent(record.id, { blogPost: data.content })
      if (updated) setRecord(updated)
      await updatePipelineStatus(record.id, { blogPostGenerated: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(null)
    }
  }

  async function generateVideoScript() {
    setError(null)
    setLoading("video")
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
        body: JSON.stringify({ type: "video", answers, apiKey: settings.openaiApiKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Generation failed")

      // Replace Arousr with Arouser for voice script pronunciation
      const videoScript = (data.content as string).replace(/Arousr/g, "Arouser")
      const updated = await updateGeneratedContent(record.id, { videoScript })
      if (updated) setRecord(updated)
      await updatePipelineStatus(record.id, { videoScriptGenerated: true })
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
    
    // Use the current script from ref (includes unsaved edits)
    const currentScript = videoScriptRef.current

    if (!currentScript) {
      setError("Generate a video script first before creating the voiceover.")
      setLoading(null)
      return
    }
    if (!settings.heygenApiKey) {
      setError("HeyGen API key is missing. Add it in Admin Settings.")
      setLoading(null)
      return
    }
    if (!settings.heygenVoiceId) {
      setError("HeyGen Voice ID is missing. Add it in Admin Settings.")
      setLoading(null)
      return
    }

    try {
      setVideoProgress("Generating voiceover with HeyGen...")

      // Call HeyGen Starfish TTS API
      const res = await fetch("https://api.heygen.com/v1/audio/text_to_speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": settings.heygenApiKey,
        },
        body: JSON.stringify({
          text: currentScript,
          voice_id: settings.heygenVoiceId,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error?.message || errData.detail || `HeyGen API error: ${res.status}`)
      }

      const data = await res.json()
      const audioFileUrl = data.data?.audio_url

      if (!audioFileUrl) {
        throw new Error("No audio URL returned from HeyGen API")
      }

      // Download the audio file
      const audioRes = await fetch(audioFileUrl)
      if (!audioRes.ok) {
        throw new Error(`Failed to download audio: ${audioRes.statusText}`)
      }

      const audioData = await audioRes.arrayBuffer()
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

      // Update record - also save the current script to ensure consistency
      const updated = await updateGeneratedContent(record.id, {
        voiceoverBase64: voiceoverKey,
        voiceoverScriptHash: currentScript,
        videoScript: currentScript, // Save the script that was used
      })
      if (updated) {
        setRecord(updated)
        await updatePipelineStatus(record.id, { voiceoverGenerated: true })
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

  async function generateTweet() {
    setError(null)
    setLoading("tweet")
    const settings = await getSettings()
    if (!settings.openaiApiKey) {
      setError("No OpenAI API key found. Please add it in Settings.")
      setLoading(null)
      return
    }

    const competitorName = record.formData.competitorName || "Competitor"
    const systemPrompt = `Write a tweet based on this competitor review of ${competitorName}. Follow these rules:
TONE: Direct and factual. No fluff. State the finding, back it with a specific detail, mention Arousr.
STRUCTURE:
- One sentence stating the core finding about the competitor with a specific score or detail
- One sentence with a specific observation from the review
- One sentence mentioning Arousr by name with its score as contrast
- Two to three hashtags
LENGTH: Under 280 characters total including hashtags.
DO NOT use: vague phrases like "users might want to look elsewhere", "worth considering", or any soft language.
DO NOT skip: the Arousr mention with its score.
DO NOT mention: age policies or age verification concerns.
ALWAYS include: at least one specific number or score from the review.`

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
          max_tokens: 300,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message ?? "Tweet generation failed")
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content?.trim() || ""
      const updated = await updateGeneratedContent(record.id, { tweetSnippet: content })
      if (updated) setRecord(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(null)
    }
  }

  async function generateInstagramCaption() {
    setError(null)
    setLoading("instagram")
    const settings = await getSettings()
    if (!settings.openaiApiKey) {
      setError("No OpenAI API key found. Please add it in Settings.")
      setLoading(null)
      return
    }

    const competitorName = record.formData.competitorName || "Competitor"
    const systemPrompt = `Write an Instagram caption based on this competitor review of ${competitorName}. Follow these rules:
TONE: Casual, direct, written from a brand perspective — not first person singular. No "I found myself" or "if you're like me." Write as if the Arousr brand account is sharing a genuine platform review with their audience.
STRUCTURE:
- One hook sentence that states the core finding or creates curiosity
- Two to three sentences covering the most interesting specific findings from the review — use real details from the reviewer's answers, not vague summaries
- One sentence mentioning Arousr naturally as the alternative — not salesy, just factual
- One engagement question to drive comments
- Three to five relevant hashtags at the end
LENGTH: 130-180 words.
SPECIFIC DETAILS: Always include at least one concrete observation from the reviewer — a specific number, a specific moment, or a specific quote (cleaned up if needed for the platform). Vague phrases like "lack of safety features" should be replaced with what specifically was missing.
MANDATORY REQUIREMENTS (every caption must have ALL of these):
- Must include "Arousr" by name as an alternative — every single caption, no exceptions
- Must end with 3-5 hashtags — never skip hashtags
- Must include at least one specific number or detail from the reviewer's answers — never be vague
DO NOT use: "here's the tea", "I found myself", "if you're like me", "might want to explore other options", or any other vague sign-offs.
DO NOT mention: age policies, age verification bypass, or any age-related concerns.
DO NOT end with: "stay safe", "chat wisely", "choose wisely", or any generic sign-off phrase.`

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
          max_tokens: 500,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message ?? "Instagram caption generation failed")
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content?.trim() || ""
      const updated = await updateGeneratedContent(record.id, { instagramSnippet: content })
      if (updated) setRecord(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(null)
    }
  }

  async function generateRedditComment() {
    setError(null)
    setLoading("reddit")
    const settings = await getSettings()
    if (!settings.openaiApiKey) {
      setError("No OpenAI API key found. Please add it in Settings.")
      setLoading(null)
      return
    }

    const competitorName = record.formData.competitorName || "Competitor"
    const systemPrompt = `Write a Reddit comment based on this competitor review of ${competitorName}. Follow these rules:
TONE: Genuine, first-person, like a real user sharing their experience. Conversational and unpolished. No brand voice. No promotional language whatsoever.
STRUCTURE:
- One sentence establishing that you personally tested the platform
- Two to three sentences covering the most specific and interesting findings — use real numbers and real observations from the reviewer's answers
- One honest closing sentence summarizing the experience without pushing an alternative
LENGTH: 80-120 words maximum.
DO NOT mention Arousr at all. Reddit users immediately recognize unprompted brand mentions as shilling and will downvote or report the comment. Arousr should only be mentioned if someone specifically asks for an alternative in a reply thread — never in the initial comment.
DO NOT use: corporate language, "in contrast", "reflected in their score", "for those prioritizing", or any phrasing that sounds like marketing copy.
DO NOT mention: age policies, age verification bypass, or any age-related concerns.
DO write: like a real person who tested the platform and is sharing an honest take with no agenda.`

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
          max_tokens: 400,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message ?? "Reddit comment generation failed")
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content?.trim() || ""
      const updated = await updateGeneratedContent(record.id, { redditSnippet: content })
      if (updated) setRecord(updated)
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
    const systemPrompt = `Write a Facebook post based on this competitor review of ${competitorName}. Follow these rules strictly:

TONE: Conversational, engaging, informative but not overly formal. Write from a brand voice perspective — do NOT use first person singular ("I", "me", "my", "if you're like me"). Use "we" or address the reader directly with "you".

STRUCTURE:
- Start with an attention-grabbing opening line or question
- 2-3 paragraphs covering the main findings (what stood out, pricing insights, user experience observations)
- End with a subtle mention of Arousr as an alternative worth checking out
- Include a call-to-action at the end encouraging comments or engagement (e.g., "Have you tried this platform? Drop your experience in the comments!")

DO NOT mention: age verification bypass, age policies, minimum age requirements, or any age-related concerns.

LENGTH: 150-250 words. Make it shareable and engaging for a general Facebook audience.`

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
      const imageUrl = record.generated.thumbnailDataUrl || ""

      const updated = await updateGeneratedContent(record.id, {
        facebookPost: content,
        facebookImageUrl: imageUrl,
      })
      if (updated) setRecord(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
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

      if (selectedImage) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error("Failed to load background image"))
          img.src = selectedImage.dataUrl
        })
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height)
        const x = (canvas.width - img.width * scale) / 2
        const y = (canvas.height - img.height * scale) / 2
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
      } else {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, "#1a1a2e")
        gradient.addColorStop(1, "#16213e")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0.55)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const titleSize = Math.round(width * 0.056)
      const subtitleSize = Math.round(width * 0.028)
      const siteNameSize = Math.round(width * 0.022)

      ctx.fillStyle = "#ffffff"
      ctx.font = `bold ${titleSize}px system-ui, -apple-system, sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(`Review: ${competitorName}`, canvas.width / 2, canvas.height / 2 - titleSize * 0.55)

      ctx.font = `${subtitleSize}px system-ui, -apple-system, sans-serif`
      ctx.fillStyle = "#cccccc"
      ctx.fillText(`Tested by ${reviewerName}`, canvas.width / 2, canvas.height / 2 + subtitleSize * 1.4)

      const siteName = settings.thumbnailSiteName || "Arousr"
      ctx.font = `bold ${siteNameSize}px system-ui, -apple-system, sans-serif`
      ctx.fillStyle = "#ffffff"
      ctx.fillText(siteName, canvas.width / 2, canvas.height - siteNameSize * 2.3)

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
      const horizontalUrl = await generateThumbnailWithFormat(1280, 720)
      if (horizontalUrl) setThumbnailUrl(horizontalUrl)

      const verticalUrl = await generateThumbnailWithFormat(720, 1280)
      if (verticalUrl) setThumbnailUrlVertical(verticalUrl)

      const updated = await updateGeneratedContent(record.id, {
        thumbnailDataUrl: horizontalUrl || undefined,
        thumbnailVerticalDataUrl: verticalUrl || undefined,
      })
      if (updated) setRecord(updated)
    } finally {
      setLoading(null)
    }
  }

  // Video generation functions (keeping existing implementation)
  interface WhisperWord { word: string; start: number; end: number }

  async function fetchWhisperCaptions(blob: Blob): Promise<WhisperWord[]> {
    const settings = await getSettings()
    if (!settings.openaiApiKey) return []

    const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("webm") ? "webm" : "mp3"
    const filename = `audio.${ext}`

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

    if (!res.ok) return []
    const data = await res.json()
    return (data.words as WhisperWord[]) ?? []
  }

  function buildCaptionGroups(words: WhisperWord[]): Array<{ text: string; start: number; end: number }> {
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

  async function generateVideoWithFormat(
    width: number,
    height: number,
    formatLabel: string,
    captionGroups: Array<{ text: string; start: number; end: number }>
  ): Promise<Blob> {
    const settings = await getSettings()
    const isVertical = height > width // Derive from dimensions
    const CROSSFADE_DURATION = 0.5
    const IMAGE_CYCLE_INTERVAL = 6
    const LOGO_DURATION = 3

    const images: HTMLImageElement[] = []
    const reviewScreenshots = record.formData.reviewScreenshots || []
    const imageSources = reviewScreenshots.length > 0
      ? reviewScreenshots.map((dataUrl, i) => ({ id: `review-${i}`, dataUrl }))
      : backgroundLibrary

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
      throw new Error("No background images available")
    }

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

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Failed to create canvas context")

    const audioContext = new AudioContext()
    const arrayBuffer = await audioBlob!.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const audioDuration = audioBuffer.duration
    const totalDuration = audioDuration + LOGO_DURATION

    const audioDestination = audioContext.createMediaStreamDestination()
    const audioSource = audioContext.createBufferSource()
    audioSource.buffer = audioBuffer
    audioSource.connect(audioDestination)

    const videoStream = canvas.captureStream(60)
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks(),
    ])

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
      videoBitsPerSecond: 8000000,
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

    // Draw image with blurred/dimmed background fill
    function drawImageWithBlurredBg(img: HTMLImageElement, alpha = 1) {
      ctx!.globalAlpha = alpha
      
      // First: draw blurred background that fills the entire canvas
      const bgScale = Math.max(width / img.width, height / img.height) * 1.2
      const bgX = (width - img.width * bgScale) / 2
      const bgY = (height - img.height * bgScale) / 2
      
      // Apply blur and dim effect using a temporary canvas
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = width
      tempCanvas.height = height
      const tempCtx = tempCanvas.getContext("2d")!
      tempCtx.filter = "blur(20px) brightness(0.4)"
      tempCtx.drawImage(img, bgX, bgY, img.width * bgScale, img.height * bgScale)
      ctx!.drawImage(tempCanvas, 0, 0)
      
      // Second: draw the main image fitted (contain) within the canvas
      const imgAspect = img.width / img.height
      const areaAspect = width / height
      
      let drawWidth: number, drawHeight: number, drawX: number, drawY: number
      
      if (imgAspect > areaAspect) {
        // Image is wider - fit to width
        drawWidth = width * 0.92
        drawHeight = drawWidth / imgAspect
      } else {
        // Image is taller - fit to height
        drawHeight = height * 0.88
        drawWidth = drawHeight * imgAspect
      }
      
      // Center in canvas
      drawX = (width - drawWidth) / 2
      drawY = (height - drawHeight) / 2
      
      // Add a subtle shadow/border around the main image
      ctx!.shadowColor = "rgba(0, 0, 0, 0.5)"
      ctx!.shadowBlur = 20
      ctx!.shadowOffsetX = 0
      ctx!.shadowOffsetY = 4
      ctx!.drawImage(img, drawX, drawY, drawWidth, drawHeight)
      ctx!.shadowBlur = 0
      ctx!.shadowOffsetX = 0
      ctx!.shadowOffsetY = 0
      
      ctx!.globalAlpha = 1
    }
    
    // Legacy cover function for logo screen
    function drawImageCover(img: HTMLImageElement, alpha = 1) {
      ctx!.globalAlpha = alpha
      const scale = Math.max(width / img.width, height / img.height)
      const x = (width - img.width * scale) / 2
      const y = (height - img.height * scale) / 2
      ctx!.drawImage(img, x, y, img.width * scale, img.height * scale)
      ctx!.globalAlpha = 1
    }

    const captionFontSize = width >= height ? 38 : 52
    console.log(`[v0] Video format: ${formatLabel}, dimensions: ${width}x${height}, captionFontSize: ${captionFontSize}, captionGroups: ${captionGroups.length}`)
  
  function drawTitle(elapsed: number) {
      const TITLE_HOLD = 4.0
      const TITLE_FADE = 0.5
      if (elapsed >= TITLE_HOLD + TITLE_FADE) return

      const alpha = elapsed < TITLE_HOLD ? 1 : 1 - (elapsed - TITLE_HOLD) / TITLE_FADE
      const competitorName = record.formData.competitorName || "Competitor"
      const titleText = `Review: ${competitorName}`
      const titleSize = Math.round(Math.min(width, height) * 0.042)
      const padding = Math.round(titleSize * 0.7)
      const topY = Math.round(height * 0.055)

      ctx!.font = `bold ${titleSize}px system-ui, -apple-system, sans-serif`
      ctx!.textAlign = "center"
      ctx!.textBaseline = "middle"
      const textW = ctx!.measureText(titleText).width

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

      ctx!.globalAlpha = alpha
      ctx!.fillStyle = "#ffffff"
      ctx!.fillText(titleText, width / 2, topY)
      ctx!.globalAlpha = 1
    }

    function drawCaption(elapsed: number) {
      if (captionGroups.length === 0) return
      const group = captionGroups.find((g) => elapsed >= g.start && elapsed <= g.end + 0.25)
      if (!group) return

      const padding = Math.round(captionFontSize * 0.55)
      const bottomY = height - Math.round(height * 0.075)

      ctx!.font = `bold ${captionFontSize}px system-ui, -apple-system, sans-serif`
      ctx!.textAlign = "center"
      ctx!.textBaseline = "middle"
      const textW = ctx!.measureText(group.text).width

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

    let animationFrameId: number
    let isRecording = true
    const startTime = performance.now()
    let logoStarted = false

    function render() {
      if (!isRecording) return

      const elapsed = (performance.now() - startTime) / 1000

      if (elapsed >= audioDuration) {
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
        const cycleTime = elapsed % (IMAGE_CYCLE_INTERVAL * images.length)
        const currentImageIndex = Math.floor(cycleTime / IMAGE_CYCLE_INTERVAL) % images.length
        const timeInCurrentImage = cycleTime % IMAGE_CYCLE_INTERVAL

        // Draw screenshot with blurred background
        drawImageWithBlurredBg(images[currentImageIndex])

        if (images.length > 1 && timeInCurrentImage >= IMAGE_CYCLE_INTERVAL - CROSSFADE_DURATION) {
          const nextImageIndex = (currentImageIndex + 1) % images.length
          const crossAlpha = (timeInCurrentImage - (IMAGE_CYCLE_INTERVAL - CROSSFADE_DURATION)) / CROSSFADE_DURATION
          drawImageWithBlurredBg(images[nextImageIndex], crossAlpha)
        }

        drawTitle(elapsed)
        drawCaption(elapsed)
      }

      animationFrameId = requestAnimationFrame(render)
    }

    mediaRecorder.start(100)
    audioSource.start()
    render()

    const progressInterval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000
      const percent = Math.min(100, Math.round((elapsed / totalDuration) * 100))
      setVideoProgress(`${formatLabel}: ${percent}%`)
    }, 500)

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        isRecording = false
        cancelAnimationFrame(animationFrameId)
        clearInterval(progressInterval)
        resolve()
      }, totalDuration * 1000)
    })

    mediaRecorder.stop()
    audioSource.stop()
    await audioContext.close()

    return recordingPromise
  }

  async function generateVideo() {
    if (!audioBlob) {
      setError("Generate a voiceover first before creating the video.")
      return
    }

    setError(null)
    setLoading("generateVideo")
    setVideoProgress("Transcribing audio for captions...")

    try {
      const words = await fetchWhisperCaptions(audioBlob)
      const captionGroups = buildCaptionGroups(words)

      setVideoProgress("Generating horizontal video...")
      const horizontalBlob = await generateVideoWithFormat(1920, 1080, "Horizontal", captionGroups)
      const horizontalUrl = URL.createObjectURL(horizontalBlob)
      setVideoUrl(horizontalUrl)

      setVideoProgress("Generating vertical video...")
      const verticalBlob = await generateVideoWithFormat(1080, 1920, "Vertical", captionGroups)
      const verticalUrl = URL.createObjectURL(verticalBlob)
      setVideoUrlVertical(verticalUrl)

      const updated = await updateGeneratedContent(record.id, {
        videoDataUrl: horizontalUrl,
        videoVerticalDataUrl: verticalUrl,
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

  // Generates slideshow videos with voiceover and captions
  async function generateFullVideo() {
    const currentScript = videoScriptRef.current
    
    if (!currentScript) {
      setError("Generate a video script first.")
      return
    }

    setError(null)
    setLoading("fullVideo")
    
    try {
      // Check if voiceover needs to be regenerated (script changed since last voiceover)
      const voiceoverScript = record.generated.voiceoverScriptHash || ""
      const scriptChanged = currentScript !== voiceoverScript
      
      let currentAudioBlob = audioBlob
      
      if (!currentAudioBlob || scriptChanged) {
        // Generate/regenerate voiceover with current script
        setVideoProgress("Step 1/4: Generating voiceover...")
        const settings = await getSettings()
        
        if (!settings.heygenApiKey || !settings.heygenVoiceId) {
          setError("HeyGen API key or Voice ID missing. Add them in Admin Settings.")
          setLoading(null)
          return
        }
        
        const ttsRes = await fetch("https://api.heygen.com/v1/voice.tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": settings.heygenApiKey,
          },
          body: JSON.stringify({
            text: currentScript,
            voice_id: settings.heygenVoiceId,
          }),
        })
        
        if (!ttsRes.ok) {
          const errText = await ttsRes.text()
          throw new Error(`HeyGen TTS error: ${errText}`)
        }
        
        const ttsData = await ttsRes.json()
        const audioUrl = ttsData.data?.url
        if (!audioUrl) throw new Error("No audio URL returned from HeyGen")
        
        const audioRes = await fetch(audioUrl)
        if (!audioRes.ok) throw new Error("Failed to download voiceover audio")
        
        const blob = await audioRes.blob()
        currentAudioBlob = blob
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        
        // Save voiceover to storage
        const arrayBuffer = await blob.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ""
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64 = btoa(binary)
        const voiceoverKey = `voiceover-${record.id}`
        await saveVideoAsset(voiceoverKey, base64)
        
        // Update record with new voiceover
        const updated = await updateGeneratedContent(record.id, {
          voiceoverBase64: voiceoverKey,
          voiceoverScriptHash: currentScript,
          videoScript: currentScript,
        })
        if (updated) setRecord(updated)
        
      }
      
      // Transcribe audio for captions
      const stepPrefix = scriptChanged ? "Step 2/4" : "Step 1/3"
      setVideoProgress(`${stepPrefix}: Transcribing audio for captions...`)
      const words = await fetchWhisperCaptions(currentAudioBlob!)
      const captionGroups = buildCaptionGroups(words)
      
      // Generate horizontal slideshow video
      const hStep = scriptChanged ? "Step 3/4" : "Step 2/3"
      setVideoProgress(`${hStep}: Generating horizontal video...`)
      const horizontalBlob = await generateVideoWithFormat(1920, 1080, "Horizontal", captionGroups)
      const horizontalUrl = URL.createObjectURL(horizontalBlob)
      setVideoUrl(horizontalUrl)
      
      // Generate vertical slideshow video
      const vStep = scriptChanged ? "Step 4/4" : "Step 3/3"
      setVideoProgress(`${vStep}: Generating vertical video...`)
      const verticalBlob = await generateVideoWithFormat(1080, 1920, "Vertical", captionGroups)
      const verticalUrl = URL.createObjectURL(verticalBlob)
      setVideoUrlVertical(verticalUrl)
      
      // Save to record
      const updatedRecord = await updateGeneratedContent(record.id, {
        videoDataUrl: horizontalUrl,
        videoVerticalDataUrl: verticalUrl,
      })
      if (updatedRecord) setRecord(updatedRecord)
      
      setVideoProgress(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error generating videos")
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
      setError("WordPress credentials are missing. Add them in Admin Settings.")
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

  const btnClass = "flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-40"

  return (
    <div className="flex flex-col gap-6">
      {/* Error display */}
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Progress display */}
      {videoProgress && (
        <div className="flex items-center gap-3 rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-3">
          <Loader2 size={16} className="animate-spin text-blue-400" />
          <span className="text-sm text-blue-400">{videoProgress}</span>
        </div>
      )}

      {/* WordPress status */}
      {wpStatus && (
        <div className="flex items-center gap-3 rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3">
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

      {/* 1. Blog Post Draft */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText size={16} />
          1. Blog Post Draft
        </h2>
        <HTMLPreviewBlock
          label="Blog Post"
          htmlContent={convertMarkdownToStyledHTML(record.generated.blogPost || "")}
          markdownContent={record.generated.blogPost || ""}
          viewAsHtml={blogPostViewAsHtml}
          onToggleView={setBlogPostViewAsHtml}
          onGenerate={generateBlogPost}
          isGenerating={loading === "blog"}
          onSave={async (v) => {
            const updated = await updateGeneratedContent(record.id, { blogPost: v })
            if (updated) setRecord(updated)
          }}
          onDownload={() => {
            const html = convertMarkdownToStyledHTML(record.generated.blogPost || "")
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
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={pushToWordPress} disabled={loading !== null} className={btnClass}>
            {loading === "wp" ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
            Push to WordPress
          </button>
        </div>
      </div>

      {/* 2. Thumbnails */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
          <ImageIcon size={16} />
          2. Thumbnails
        </h2>

        {/* Background image picker */}
        {backgroundLibrary.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Select Background Image</p>
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
                  <img src={img.dataUrl} alt={img.label} className="aspect-video w-full object-cover" />
                  <span className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1 py-0.5 text-center text-xs text-white">
                    {img.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button type="button" onClick={generateThumbnail} disabled={loading !== null} className={btnClass}>
          {loading === "thumbnail" ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
          Generate Thumbnails
        </button>

        {/* Generated Thumbnails */}
        {(thumbnailUrl || thumbnailUrlVertical) && (
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {thumbnailUrl && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Horizontal (1280x720)</span>
                  <a
                    href={thumbnailUrl}
                    download={`${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "competitor"}-thumbnail-horizontal.jpg`}
                    className={btnClass}
                  >
                    <Download size={12} />
                    Download
                  </a>
                </div>
                <img src={thumbnailUrl} alt="Horizontal thumbnail" className="w-full rounded-md" />
              </div>
            )}
            {thumbnailUrlVertical && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Vertical (720x1280)</span>
                  <a
                    href={thumbnailUrlVertical}
                    download={`${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "competitor"}-thumbnail-vertical.jpg`}
                    className={btnClass}
                  >
                    <Download size={12} />
                    Download
                  </a>
                </div>
                <img src={thumbnailUrlVertical} alt="Vertical thumbnail" className="aspect-[9/16] max-h-[400px] w-auto self-center rounded-md" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Video Script */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
          <Video size={16} />
          3. Video Script
        </h2>
        <EditableBlock
          label="Video Script"
          content={record.generated.videoScript || ""}
          onGenerate={generateVideoScript}
          isGenerating={loading === "video"}
          generateLabel="Generate Video Script"
          onChange={(v) => { videoScriptRef.current = v }}
          onSave={async (v) => {
            videoScriptRef.current = v
            const updated = await updateGeneratedContent(record.id, { videoScript: v })
            if (updated) setRecord(updated)
          }}
        />
        {(record.generated.videoScript || videoScriptRef.current) && audioBlob && (
          <div className="mt-4">
            <button type="button" onClick={generateFullVideo} disabled={loading !== null} className={btnClass}>
              {loading === "fullVideo" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Video size={12} />
              )}
              Generate Video
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              Generates horizontal and vertical slideshow videos with voiceover and captions
            </p>
          </div>
        )}

        {videoProgress && (
          <div className="mt-4 text-sm text-muted-foreground">{videoProgress}</div>
        )}

        {/* Slideshow Videos */}
        {(videoUrl || videoUrlVertical) && (
          <div className="mt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Slideshow Videos</h3>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {videoUrl && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Horizontal (1920x1080)</span>
                  <a
                    href={videoUrl}
                    download={`${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "competitor"}-review-horizontal.webm`}
                    className={btnClass}
                  >
                    <Download size={12} />
                    Download
                  </a>
                </div>
                <video controls src={videoUrl} className="w-full rounded-md" />
              </div>
            )}
            {videoUrlVertical && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Vertical (1080x1920)</span>
                  <a
                    href={videoUrlVertical}
                    download={`${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "competitor"}-review-vertical.webm`}
                    className={btnClass}
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
      </div>

      {/* 4. Voiceover */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
          <Video size={16} />
          4. Voiceover
        </h2>
        <button
          type="button"
          onClick={generateVoiceover}
          disabled={loading !== null || !record.generated.videoScript}
          className={btnClass}
          title={!record.generated.videoScript ? "Generate a video script first" : undefined}
        >
          {loading === "voiceover" ? <Loader2 size={12} className="animate-spin" /> : <Video size={12} />}
          Generate Voiceover
        </button>
        {!record.generated.videoScript && (
          <p className="mt-2 text-xs text-muted-foreground">Generate a video script first</p>
        )}

        {audioUrl && (
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Audio Preview
              </span>
              <a
                href={audioUrl}
                download={`${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "competitor"}-review.mp3`}
                className={btnClass}
              >
                <Download size={12} />
                Download MP3
              </a>
            </div>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}
      </div>

      {/* 5. LinkedIn Post */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
          <Linkedin size={16} />
          5. LinkedIn Post
        </h2>
        <EditableBlock
          label="LinkedIn Post"
          content={record.generated.linkedinPost || ""}
          onGenerate={generateLinkedInPost}
          isGenerating={loading === "linkedin"}
          generateLabel="Generate"
          onSave={async (v) => {
            const updated = await updateGeneratedContent(record.id, { linkedinPost: v })
            if (updated) setRecord(updated)
          }}
        />
      </div>

      {/* 6. Facebook Post */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
          <Facebook size={16} />
          6. Facebook Post
        </h2>
        {record.generated.facebookImageUrl && (
          <div className="relative mb-4 rounded-lg overflow-hidden border border-border">
            <img src={record.generated.facebookImageUrl} alt="Facebook post image" className="w-full h-auto object-cover" />
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
        <EditableBlock
          label="Facebook Post"
          content={record.generated.facebookPost || ""}
          onGenerate={generateFacebookPost}
          isGenerating={loading === "facebook"}
          generateLabel="Generate"
          onSave={async (v) => {
            const updated = await updateGeneratedContent(record.id, { facebookPost: v })
            if (updated) setRecord(updated)
          }}
        />
      </div>

      {/* 7. Tweet */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
          <Twitter size={16} />
          7. Tweet
        </h2>
        <EditableBlock
          label="Tweet"
          content={record.generated.tweetSnippet || ""}
          onGenerate={generateTweet}
          isGenerating={loading === "tweet"}
          generateLabel="Generate"
          onSave={async (v) => {
            const updated = await updateGeneratedContent(record.id, { tweetSnippet: v })
            if (updated) setRecord(updated)
          }}
        />
      </div>

      {/* 8. Instagram Caption */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
          <Instagram size={16} />
          8. Instagram Caption
        </h2>
        <EditableBlock
          label="Instagram Caption"
          content={record.generated.instagramSnippet || ""}
          onGenerate={generateInstagramCaption}
          isGenerating={loading === "instagram"}
          generateLabel="Generate"
          onSave={async (v) => {
            const updated = await updateGeneratedContent(record.id, { instagramSnippet: v })
            if (updated) setRecord(updated)
          }}
        />
      </div>

      {/* 9. Reddit Comment */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageSquare size={16} />
          9. Reddit Comment
        </h2>
        <EditableBlock
          label="Reddit Comment"
          content={record.generated.redditSnippet || ""}
          onGenerate={generateRedditComment}
          isGenerating={loading === "reddit"}
          generateLabel="Generate"
          onSave={async (v) => {
            const updated = await updateGeneratedContent(record.id, { redditSnippet: v })
            if (updated) setRecord(updated)
          }}
        />
      </div>
    </div>
  )
}
