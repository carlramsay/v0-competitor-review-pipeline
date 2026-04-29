import { useState, useEffect, useRef } from "react"
import { ReviewRecord, TaskStatus } from "@/lib/types"
import { getSettings, updateGeneratedContent, updatePipelineStatus, updateTaskStatus, updateQueueItemStatusByUrl, getVideoAsset, saveVideoAsset } from "@/lib/store"
import { buildAnswersString, buildScoresTableHTML } from "@/lib/review-utils"
import { convertMarkdownToStyledHTML } from "@/lib/markdown-converter"
import { generateHeyGenTTS, generateHeyGenAudioTTS } from "@/lib/heygen-actions"
import { cn } from "@/lib/utils"
import { Download, ImageIcon, Save, Check, RefreshCw } from "lucide-react"
import { CopyButton } from "./copy-button"
import { FileText, Video, Share2, Globe, ExternalLink, Loader2, Eye, EyeOff, Linkedin, Facebook, Twitter, MessageSquare, ChevronDown, Copy } from "lucide-react"

// Reusable editable text block with Copy and Save buttons
interface EditableBlockProps {
  label: string
  content: string
  onSave: (value: string) => void
  onGenerate?: () => void
  isGenerating?: boolean
  generateLabel?: string
  onChange?: (value: string) => void // Called on every edit to track current value
  rows?: number // Number of rows for the textarea (default: auto based on min-h-[160px])
}

function EditableBlock({ label, content, onSave, onGenerate, isGenerating, generateLabel = "Generate", onChange, rows }: EditableBlockProps) {
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
        rows={rows}
        className={cn(
          "w-full resize-y rounded-md border border-border bg-input px-3 py-2 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-ring",
          rows ? "" : "min-h-[160px]"
        )}
      />
    </div>
  )
}

// Task labels and defaults
const DEFAULT_TASKS: TaskStatus = {
  blogPublishedArousr: false,
  videoPostedYouTube: false,
  videoPostedXBIZ: false,
  videoEmbeddedBlog: false,
  blogPostedMedium: false,
  linkedInArticle: false,
  xPost: false,
  facebookPost: false,
}

const TASK_LABELS: { key: keyof TaskStatus; label: string }[] = [
  { key: "blogPublishedArousr", label: "Blog Post Published on Arousr" },
  { key: "videoPostedYouTube", label: "Video Posted on YouTube" },
  { key: "videoPostedXBIZ", label: "Video Posted on XBIZ.tv" },
  { key: "videoEmbeddedBlog", label: "Video Embedded in Arousr Blog Post" },
  { key: "blogPostedMedium", label: "Blog Posted on Medium (with canonical link to Arousr)" },
  { key: "linkedInArticle", label: "LinkedIn Article Posted" },
  { key: "xPost", label: "X.com Post with Link to Arousr Blog" },
  { key: "facebookPost", label: "Facebook Post with Link to Medium Article" },
]

// Tasks section component
function TasksSection({ record, setRecord }: { record: ReviewRecord; setRecord: (r: ReviewRecord) => void }) {
  const [localTasks, setLocalTasks] = useState<TaskStatus | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Always fetch fresh tasks from database on mount using getReviewById
  useEffect(() => {
    async function fetchTasks() {
      setLoadingTasks(true)
      try {
        const { getReviewById } = await import("@/lib/store")
        const freshRecord = await getReviewById(record.id)
        if (freshRecord?.tasks) {
          setLocalTasks(freshRecord.tasks)
        } else {
          setLocalTasks(DEFAULT_TASKS)
        }
      } catch (err) {
        console.error("Fetch tasks error:", err)
        setLocalTasks(DEFAULT_TASKS)
      } finally {
        setLoadingTasks(false)
      }
    }
    fetchTasks()
  }, [record.id])

  const handleToggle = async (key: keyof TaskStatus) => {
    if (!localTasks) return
    
    const updated: TaskStatus = { ...localTasks, [key]: !localTasks[key] }
    setLocalTasks(updated)
    
    // Auto-save to database using server action (bypasses RLS)
    setSaving(true)
    setError(null)
    try {
      const { updateTaskStatusAction } = await import("@/app/actions/db")
      const result = await updateTaskStatusAction(record.id, updated)
      
      if (!result.success) {
        // Revert on error
        setLocalTasks(localTasks)
        setError(result.error || "Save failed")
        return
      }
      
      // Update the parent record with the new tasks
      setRecord({ ...record, tasks: updated })
      
      setSaved(true)
      setHasChanges(false)
      setTimeout(() => setSaved(false), 1500)
    } catch (err) {
      // Revert on error
      setLocalTasks(localTasks)
      console.error("Error saving tasks:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setSaving(false)
    }
  }

  const tasks = localTasks || DEFAULT_TASKS
  const tasksComplete = Object.values(tasks).filter(Boolean).length
  const tasksTotal = Object.keys(tasks).length

  if (loadingTasks || !localTasks) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-center p-8">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading tasks...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Distribution Tasks
        </h2>
        <span className={cn(
          "text-xs font-medium",
          tasksComplete === tasksTotal ? "text-green-500" : "text-muted-foreground"
        )}>
          {tasksComplete}/{tasksTotal} complete
        </span>
      </div>
      <div className="p-5 space-y-3">
        {TASK_LABELS.map(({ key, label }) => {
          const isComplete = tasks[key]
          return (
            <label
              key={key}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={isComplete}
                onChange={() => handleToggle(key)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <span className={cn(
                "text-sm transition-colors",
                isComplete ? "text-foreground line-through" : "text-muted-foreground",
                "group-hover:text-foreground"
              )}>
                {label}
              </span>
            </label>
          )
        })}
      </div>
      {(saving || saved || error) && (
      <div className="flex items-center justify-end border-t border-border bg-secondary/20 px-5 py-3">
        <div className="flex items-center gap-2">
          {saving && (
            <>
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Saving...</span>
            </>
          )}
          {saved && !saving && <span className="text-xs text-green-500">Saved!</span>}
          {error && <span className="text-xs text-red-500">Error: {error}</span>}
        </div>
      </div>
      )}
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
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoProgress, setVideoProgress] = useState<string | null>(null)
  const [blogPostViewAsHtml, setBlogPostViewAsHtml] = useState(true)
  
  // Collapsible section states (collapsed by default)
  const [collapsed, setCollapsed] = useState({
    blogPost: true,
    thumbnails: true,
    video: true,
    voiceover: true,
    social: true,
  })
  
  // Track which item was copied (for copy button feedback)
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  
  // Local meta description state for editing
  const [localMetaDescription, setLocalMetaDescription] = useState(record.generated.blogPostMeta || "")
  const [metaSaving, setMetaSaving] = useState(false)
  const [metaSaved, setMetaSaved] = useState(false)
  
  const copyToClipboard = async (text: string, itemId: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedItem(itemId)
    setTimeout(() => setCopiedItem(null), 2000)
  }
  
  // Ref to track the current video script value (including unsaved edits)
  const videoScriptRef = useRef(initialRecord.generated.videoScript || "")
  
  // Keep ref in sync with saved record
  useEffect(() => {
    videoScriptRef.current = record.generated.videoScript || ""
  }, [record.generated.videoScript])

  // Sync localMetaDescription when record updates from server
  useEffect(() => {
    if (record.generated.blogPostMeta && record.generated.blogPostMeta !== localMetaDescription) {
      setLocalMetaDescription(record.generated.blogPostMeta)
    }
  }, [record.generated.blogPostMeta])

  // Hydrate saved video from storage on mount
  useEffect(() => {
    async function loadVideo() {
      console.log("[v0] Loading video, videoDataUrl:", initialRecord.generated.videoDataUrl)
      if (initialRecord.generated.videoDataUrl) {
        try {
          const videoKey = initialRecord.generated.videoDataUrl
          console.log("[v0] Fetching video with key:", videoKey)
          const base64 = await getVideoAsset(videoKey)
          console.log("[v0] Got video base64, length:", base64?.length)
          if (base64) {
            const binary = atob(base64)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
            const blob = new Blob([bytes], { type: "video/mp4" })
            const url = URL.createObjectURL(blob)
            setVideoUrl(url)
          }
        } catch (err) {
          console.error("Failed to load video:", err)
        }
      }
    }
    loadVideo()
  }, [initialRecord.generated.videoDataUrl])

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

    // Build answers with Arousr benchmark scores from settings
    const answers = buildAnswersString(record.formData, settings.arousrScores)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "blog", answers, apiKey: settings.openaiApiKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Generation failed")

      // Parse the response to extract blog post and metadata fields
      const fullContent = data.content as string
      let blogPost = fullContent
      let blogPostTitle = ""
      let blogPostMeta = ""

      // Check if the response contains the metadata section
      const titleMatch = fullContent.match(/---TITLE---\s*([\s\S]*?)---META---/)
      const metaMatch = fullContent.match(/---META---\s*([\s\S]*?)---END---/)

      if (titleMatch) {
        // Strip metadata from blog post
        blogPost = fullContent.split("---TITLE---")[0].trim()
        
        // Parse single title
        const titleSection = titleMatch[1]
        const titleLine = titleSection.match(/Title:\s*(.+)/)
        blogPostTitle = titleLine?.[1]?.trim() || ""
      }

      if (metaMatch) {
        const metaSection = metaMatch[1]
        const metaLine = metaSection.match(/Meta:\s*(.+)/)
        blogPostMeta = metaLine?.[1]?.trim() || ""
      }

      // Build scores table in JavaScript code (not GPT-4o) and insert before conclusion
      const scoresTable = buildScoresTableHTML(
        record.formData.competitorName || "Competitor",
        record.formData.scores
      )
      
      // Find the Conclusion section and insert scores table before it
      const conclusionMatch = blogPost.match(/<h2[^>]*>.*?Conclusion.*?<\/h2>/i)
      if (conclusionMatch && conclusionMatch.index !== undefined) {
        blogPost = blogPost.slice(0, conclusionMatch.index) + scoresTable + "\n\n" + blogPost.slice(conclusionMatch.index)
      } else {
        // Fallback: append at the end if no conclusion found
        blogPost = blogPost + "\n\n" + scoresTable
      }

      const updated = await updateGeneratedContent(record.id, { 
        blogPost,
        blogPostTitle,
        blogPostMeta,
      })
      if (updated) setRecord(updated)
      await updatePipelineStatus(record.id, { blogPostGenerated: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(null)
    }
  }

  async function generateBlogTitle() {
    setError(null)
    setLoading("blogTitle")
    const settings = await getSettings()
    if (!settings.openaiApiKey) {
      setError("No OpenAI API key found. Please add it in Settings.")
      setLoading(null)
      return
    }

    // Calculate scores from form_data.scores - never let GPT-4o calculate
    const competitorTotal = record.formData.scores.reduce(
      (sum, row) => sum + (typeof row.competitorScore === "number" ? row.competitorScore : 0), 0
    )
    const arousrTotal = record.formData.scores.reduce(
      (sum, row) => sum + (typeof row.arousrScore === "number" ? row.arousrScore : 0), 0
    )
    const gap = arousrTotal - competitorTotal

    const competitorName = record.formData.competitorName || "Competitor"
    const oneLineVerdict = record.formData.q24 || ""
    
    const prompt = `You generate one blog post title per call for a competitor review site.

INPUTS:
COMPETITOR: ${competitorName}
COMPETITOR SCORE: ${competitorTotal}/80
AROUSR SCORE: ${arousrTotal}/80
SCORE GAP: ${gap} points
KEY FINDINGS: ${oneLineVerdict}

STRICT RULES:
- Competitor name must appear in every title
- Maximum 50 characters
- Never use exclamation marks
- Never wrap output in quotes
- Never use: "open chats", "exploring", "testing", "navigating", 
  "deep-dive", "firsthand", "in-depth", "is it worth it", 
  "digital age", "emerging rivals", "iconic", "survive", 
  "dominating", "relevant", "hold up", "suitable for"
- Never reference age, verification bypass, legal issues, 
  or compliance
- Never use: fake, scam, fraud, dangerous, illegal
- Tone is neutral and observational — not an attack
- Never use: "struggles", "fails", "frustration"

HOOK ROTATION — each call must use a different hook:
Pick the hook that has NOT been used most recently:
- VERDICT: overall tone or feeling ("clunky but charming")
- SCORE: use the exact score if surprisingly low or high
- GAP: reference the point difference vs Arousr
- DETAIL: one specific observation from KEY FINDINGS
- RETRO: the nostalgic/mIRC angle specific to this review

BANNED HOOKS (used too often — do not use):
- "open chats" in any form
- Security or privacy as the primary hook
- Anonymous chat as the hook

GOOD EXAMPLES:
Chat Avenue (2026): mIRC Vibes, Modern Gaps
Chat Avenue Review: Free, But at What Cost
Chat Avenue vs Arousr — 16 Points Apart
Chat Avenue: Great for 2003, Clunky for 2026
Chat Avenue (2026): Retro Charm, Real Limitations
Chat Avenue Review: 51/80 and Showing Its Age

BAD EXAMPLES — never produce these:
Chat Avenue: Open Chats, But Questionable Privacy
Chat Avenue: Open Chats with Questionable Security
Chat Avenue: Anonymous Chats Amid Privacy Concerns
Chat Avenue: Privacy Concerns and Easy Access
Chat Avenue's Open Chats: Casual Yet Convenient
Chat Avenue Review: Open Chats, Security Lapses
Chat Avenue: Nostalgic Charm Meets Digital Age
Chat Avenue: Navigating Retro Charm and Limitations
Will Chat Avenue Survive Against Emerging Rivals in 2026?

OUTPUT: one title only — no explanation, no quotes, no extra punctuation.`

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "custom", 
          prompt,
          apiKey: settings.openaiApiKey 
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Generation failed")

      const updated = await updateGeneratedContent(record.id, { blogPostTitle: data.content.trim() })
      if (updated) setRecord(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(null)
    }
  }

  async function generateMetaDescription() {
    setError(null)
    setLoading("meta")
    const settings = await getSettings()
    if (!settings.openaiApiKey) {
      setError("No OpenAI API key found. Please add it in Settings.")
      setLoading(null)
      return
    }

    // Calculate scores from form_data.scores - never let GPT-4o calculate
    const competitorTotal = record.formData.scores.reduce(
      (sum, row) => sum + (typeof row.competitorScore === "number" ? row.competitorScore : 0), 0
    )
    const arousrTotal = record.formData.scores.reduce(
      (sum, row) => sum + (typeof row.arousrScore === "number" ? row.arousrScore : 0), 0
    )

    const competitorName = record.formData.competitorName || "Competitor"
    const oneLineVerdict = record.formData.q24 || ""

    const prompt = `Write one meta description for this competitor review.

COMPETITOR: ${competitorName}
COMPETITOR SCORE: ${competitorTotal}/80
AROUSR SCORE: ${arousrTotal}/80
KEY FINDINGS: ${oneLineVerdict}

Rules:
- Length: 150-160 characters exactly — count carefully
- Must mention the competitor name
- Must include the exact score (e.g. ${competitorTotal}/80)
- Must feel factual and observational — not promotional
- Never use: "Discover", "Find out", "Learn why", "might be", 
  "could be", "perhaps"
- Never use clickbait or call-to-action language
- May mention Arousr but only as a factual comparison, 
  not as a recommendation
- No age, legal, or compliance references
- Include one specific finding from KEY FINDINGS

Good example:
"Chat Avenue scores 51/80 in our hands-on test. Free access 
and retro charm, but limited safety features and unmoderated 
chats. Here's how it compares to Arousr."

Output: one meta description only, no explanation, no quotes.`

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
            { role: "system", content: "You generate SEO meta descriptions for blog posts." },
            { role: "user", content: prompt },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? "Generation failed")

      const metaDescription = data.choices[0].message.content.trim().replace(/^["']|["']$/g, "")
      setLocalMetaDescription(metaDescription)
      setMetaSaved(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(null)
    }
  }

  async function saveMetaDescription() {
    setMetaSaving(true)
    try {
      const updated = await updateGeneratedContent(record.id, { blogPostMeta: localMetaDescription })
      if (updated) setRecord(updated)
      setMetaSaved(true)
      setTimeout(() => setMetaSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save meta description")
    } finally {
      setMetaSaving(false)
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

    // Calculate scores from form_data.scores - never let GPT-4o calculate
    const competitorTotal = record.formData.scores.reduce(
      (sum, row) => sum + (typeof row.competitorScore === "number" ? row.competitorScore : 0), 0
    )
    const arousrTotal = record.formData.scores.reduce(
      (sum, row) => sum + (typeof row.arousrScore === "number" ? row.arousrScore : 0), 0
    )
    const gap = arousrTotal - competitorTotal

    const competitorName = record.formData.competitorName || "Competitor"
    const oneLineVerdict = record.formData.q24 || ""
    const reviewerName = record.formData.reviewerName || "Reviewer"

    // Build answers with form data for context
    const answers = buildAnswersString(record.formData, settings.arousrScores)

    const prompt = `Write a video script for this competitor review.

COMPETITOR: ${competitorName}
COMPETITOR SCORE: ${competitorTotal}/80
AROUSR SCORE: ${arousrTotal}/80
SCORE GAP: ${gap} points
KEY FINDINGS: ${oneLineVerdict}
REVIEWER: ${reviewerName}

Rules:
- Length: 150-180 words maximum — count carefully, do not exceed
- Podcast monologue style — conversational, first person, spoken word
- One point per section maximum — do not over-explain
- Use specific observations and details from the review
- Never invent statistics, ratios, or numbers the reviewer did not provide
- Never use generic sign-offs like "That's a wrap", "Stay safe", 
  "Until next time", or "See you next time"
- Never reference age, age verification, legal issues, or compliance
- Never use provocative or defamatory words: fake, scam, fraud, dangerous
- Tone is neutral and observational — not an attack on the competitor
- Arousr must be spelled "Arouser" throughout — this is a video script 
  for audio, phonetic spelling is intentional
- The closing line must include the exact score gap and feel punchy 
  and specific — never vague or generic

Structure (follow this order):
1. One sentence intro — what the platform is
2. Signup — one key observation only
3. Interface — one key observation only
4. Pricing — one key observation only
5. Chat quality — one key observation; if the reviewer provided a 
   direct quote or specific example of a message they received, 
   use it verbatim or near-verbatim — do not sanitize or generalize; 
   a raw, specific observation is more valuable than a polished summary
6. Privacy/safety — one key observation only
7. Closing — score gap vs Arouser, punchy final line

Good closing example:
"Chat Avenue scores 51/80 versus Arouser's 67. Free and accessible 
— but if safety and quality matter, the gap tells the story."

Output: script only, no section headers, no explanation.

REVIEW DATA:
${answers}`

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
            { role: "system", content: "You write video scripts for competitor review videos." },
            { role: "user", content: prompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? "Generation failed")

      const videoScript = data.choices[0].message.content.trim()
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

      // Call HeyGen TTS via server action (avoids CORS)
      const ttsResult = await generateHeyGenAudioTTS(
        currentScript,
        settings.heygenVoiceId,
        settings.heygenApiKey
      )

      if (!ttsResult.success) {
        throw new Error(ttsResult.error)
      }

      const audioFileUrl = ttsResult.audioUrl

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

    // Calculate scores from form_data.scores - never let GPT-4o calculate
    const competitorTotal = record.formData.scores.reduce(
      (sum, row) => sum + (typeof row.competitorScore === "number" ? row.competitorScore : 0), 0
    )
    const arousrTotal = record.formData.scores.reduce(
      (sum, row) => sum + (typeof row.arousrScore === "number" ? row.arousrScore : 0), 0
    )
    const gap = arousrTotal - competitorTotal

    const competitorName = record.formData.competitorName || "Competitor"
    const oneLineVerdict = record.formData.q24 || ""

    const prompt = `Write a tweet for this competitor review.

COMPETITOR: ${competitorName}
COMPETITOR SCORE: ${competitorTotal}/80
AROUSR SCORE: ${arousrTotal}/80
SCORE GAP: ${gap} points
KEY FINDINGS: ${oneLineVerdict}

Rules:
- Maximum 240 characters including hashtags — count every 
  character carefully before outputting
- Direct and factual — no fluff, no filler words
- Must include the exact competitor score
- Must include Arousr with its exact score
- Must include one specific detail from the review — 
  a price, a feature, or a specific observation
- Never use exclamation marks
- Never use promotional language about Arousr
- No age, legal, or compliance references
- Never use #Arousr as a hashtag — it looks promotional

Format: one or two punchy sentences followed by hashtags.

Hashtags — always end with exactly these:
#ChatReview #PrivacyMatters

Good example:
"Chat Avenue scores 51/80 — free anonymous chats, 90s 
interface, but weak privacy and no block/report options. 
Arousr scores 67/80 in the same test. #ChatReview #PrivacyMatters"

Output: tweet text only, no explanation, no extra commentary.`

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
            { role: "system", content: "You write tweets for competitor review content." },
            { role: "user", content: prompt },
          ],
          max_tokens: 300,
          temperature: 0.7,
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

  async function generateRedditComment() {
    setError(null)
    setLoading("reddit")
    const settings = await getSettings()
    if (!settings.openaiApiKey) {
      setError("No OpenAI API key found. Please add it in Settings.")
      setLoading(null)
      return
    }

    // Calculate scores from form_data.scores - never let GPT-4o calculate
    const competitorTotal = record.formData.scores.reduce(
      (sum, row) => sum + (typeof row.competitorScore === "number" ? row.competitorScore : 0), 0
    )

    const competitorName = record.formData.competitorName || "Competitor"
    const oneLineVerdict = record.formData.q24 || ""
    
    // Extract reviewer quotes from relevant form fields
    const reviewerQuotes = [
      record.formData.q14, // Chat quality observations
      record.formData.q15, // Specific chat examples
      record.formData.q24, // One-line verdict
    ].filter(Boolean).join(" | ")

    const prompt = `Generate a Reddit comment for this competitor review.

COMPETITOR: ${competitorName}
COMPETITOR SCORE: ${competitorTotal}/80
KEY FINDINGS: ${oneLineVerdict}
REVIEWER QUOTES: ${reviewerQuotes}

Rules:
- Length: 80-120 words
- Tone: genuine first-person user voice — write like a real 
  person sharing their experience on Reddit, not a reviewer
- Never mention Arousr — this must feel like an independent 
  user post, not a comparison review
- Never use marketing language, promotional phrases, or 
  corporate tone
- Never use clichés like "hit-and-miss", "worth a look", 
  "at the end of the day"
- No age, legal, or compliance references
- No exclamation marks
- No score unless it fits naturally in the flow — Reddit 
  users don't typically cite formal scores
- Be direct and honest — Reddit users appreciate blunt, 
  specific observations

If the reviewer provided a specific crude or memorable quote 
about chat quality, include it near-verbatim — Reddit 
audiences respond well to raw, unfiltered observations. 
This makes the post feel authentic.

Opening: start with what you did, not a general statement 
about the platform.
Example: "Tried ${competitorName} last week out of curiosity..."

Closing: a direct honest opinion about who this platform 
is or isn't for — specific, not vague.
Example: "Fine for a quick anonymous chat but don't expect 
much in terms of privacy or safety features."

Output: comment text only, no explanation, no hashtags, 
no extra commentary.`

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
            { role: "system", content: "You write Reddit comments that sound like genuine user posts." },
            { role: "user", content: prompt },
          ],
          max_tokens: 400,
          temperature: 0.7,
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

    // Calculate scores from form_data.scores - never let GPT-4o calculate
    const competitorTotal = record.formData.scores.reduce(
      (sum, row) => sum + (typeof row.competitorScore === "number" ? row.competitorScore : 0), 0
    )
    const arousrTotal = record.formData.scores.reduce(
      (sum, row) => sum + (typeof row.arousrScore === "number" ? row.arousrScore : 0), 0
    )
    const gap = arousrTotal - competitorTotal

    const competitorName = record.formData.competitorName || "Competitor"
    const oneLineVerdict = record.formData.q24 || ""
    const reviewerName = record.formData.reviewerName || "Reviewer"

    // Build answers with Arousr benchmark scores from settings
    const answers = buildAnswersString(record.formData, settings.arousrScores)

    const prompt = `Write a LinkedIn post for this competitor review.

COMPETITOR: ${competitorName}
COMPETITOR SCORE: ${competitorTotal}/80
AROUSR SCORE: ${arousrTotal}/80
SCORE GAP: ${gap} points
KEY FINDINGS: ${oneLineVerdict}
REVIEWER: ${reviewerName}

Rules:
- Length: 200-280 words
- Tone: conversational and opinion-led — write like a real person 
  sharing a professional observation, not a press release
- Never repeat the same noun phrase twice in one sentence
- Never use corporate language like: "critical safety protocols", 
  "absence of", "in contrast", "it is worth noting", "it should 
  be mentioned", "raises several concerns", "deep dive", "deep-dive"
- Must include the exact scores: competitor score and Arousr score
- Must include one specific detail from the review — a price, 
  a feature, a specific observation from the reviewer
- Arousr mention must feel like a natural factual comparison, 
  not a sales pitch or advertisement
- Never use #AdultEntertainment
- No legal or compliance references
- No generic sign-offs
- BANNED WORDS that must NEVER appear anywhere in the post: 
  "birthday", "birthdays", "age", "age verification", "underage", "minor"
- If the review notes weak verification, use ONLY this exact phrase: 
  "the signup process has minimal verification"
  Do not elaborate. Do not explain what can be manipulated. 
  Stop after that phrase.

Opening: 
- Never open with a general statement about privacy, safety, 
  or the importance of choosing the right platform
- First line must reference the score, the reviewer, or a 
  specific finding — nothing generic
- Never open with "[Competitor] offers..." or "[Competitor] is 
  a platform that..."

Arousr: must appear EXACTLY ONCE in the entire post — only in 
the factual score comparison sentence. Never mention Arousr again 
after that sentence.
Example: "For context, Arousr scored ${arousrTotal}/80 in the same test — 
${gap} points higher, mostly on safety and host quality."

Closing: must be about ${competitorName} — an honest final observation 
about the platform itself. Never redirect to Arousr in the closing. 
Not a call to action, not a sales line.

Hashtags — always include exactly these, on a new line at the end:
#UserExperience #DigitalTrust #OnlineSafety #PlatformReview #DigitalWellness

Output: post text followed by hashtags on a new line. 
No explanation, no extra commentary.

REVIEW DATA:
${answers}`

    const userContent = record.generated.blogPost ? `Blog Post Content:\n${record.generated.blogPost}` : ""

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
            { role: "system", content: "You write LinkedIn posts for competitor review content." },
            { role: "user", content: prompt + (userContent ? `\n\n${userContent}` : "") },
          ],
          max_tokens: 1000,
          temperature: 0.7,
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

    // Calculate scores from form_data.scores - never let GPT-4o calculate
    const competitorTotal = record.formData.scores.reduce(
      (sum, row) => sum + (typeof row.competitorScore === "number" ? row.competitorScore : 0), 0
    )
    const arousrTotal = record.formData.scores.reduce(
      (sum, row) => sum + (typeof row.arousrScore === "number" ? row.arousrScore : 0), 0
    )
    const gap = arousrTotal - competitorTotal

    const competitorName = record.formData.competitorName || "Competitor"
    const oneLineVerdict = record.formData.q24 || ""
    const reviewerName = record.formData.reviewerName || "Reviewer"

    // Build answers with Arousr benchmark scores from settings
    const answers = buildAnswersString(record.formData, settings.arousrScores)

    const prompt = `Write a Facebook post for this competitor review.

COMPETITOR: ${competitorName}
COMPETITOR SCORE: ${competitorTotal}/80
AROUSR SCORE: ${arousrTotal}/80
SCORE GAP: ${gap} points
KEY FINDINGS: ${oneLineVerdict}
REVIEWER: ${reviewerName}

Rules:
- Length: 150-200 words
- Tone: conversational and accessible — written for a general 
  audience, not corporate professionals
- Never use exclamation marks
- Must include the exact competitor score and Arousr score
- Must include at least one specific detail from the review — 
  a price, a feature, a specific observation from the reviewer
- Arousr must appear exactly once — one factual comparison 
  sentence only, no promotion or description of Arousr's features
- Never describe Arousr as "known for", "trusted", "reliable", 
  or any other promotional language
- Never use generic engagement bait like "Drop your thoughts 
  in the comments", "We'd love to hear from you", or 
  "Have you tried this platform?"
- Never open with "Ever wondered", "Have you ever", or 
  a question opener
- Never use clickbait language
- No legal or compliance references
- No generic sign-offs
- No hashtags
- BANNED WORDS that must NEVER appear anywhere in the post: 
  "birthday", "birthdays", "age", "age verification", "underage", "minor"
- If the review notes weak verification, use ONLY this exact phrase: 
  "the signup process has minimal verification"
  Do not elaborate. Do not explain what can be manipulated. 
  Stop after that phrase.

Opening: must lead with a specific finding, the score, or 
the reviewer's name and what they tested — never a question 
or a vague teaser

Structure:
- Body paragraphs with findings about ${competitorName}
- Second-to-last paragraph: the Arousr comparison sentence (exactly once)
- Final paragraph: closing observation about ${competitorName}

Arousr comparison: one sentence maximum, factual only, must appear 
in the second-to-last paragraph — not in the middle of the post.
Example: "For context, Arousr scored ${arousrTotal}/80 in the same 
test — ${gap} points higher on safety and host quality."

Closing: a genuine observation about ${competitorName} — not a 
redirect to Arousr, not engagement bait.

Output: post text only. No explanation, no extra commentary.

REVIEW DATA:
${answers}`

    const userContent = record.generated.blogPost ? `Blog Post Content:\n${record.generated.blogPost}` : ""

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
            { role: "system", content: "You write Facebook posts for competitor review content." },
            { role: "user", content: prompt + (userContent ? `\n\n${userContent}` : "") },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message ?? "Facebook post generation failed")
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content?.trim() || ""

      const updated = await updateGeneratedContent(record.id, {
        facebookPost: content,
      })
      if (updated) setRecord(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(null)
    }
  }

  // Video generation functions
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
    captionGroups: Array<{ text: string; start: number; end: number }>,
    audioBlobParam: Blob
  ): Promise<Blob> {
    const settings = await getSettings()
    const isVertical = height > width // Derive from dimensions
    const CROSSFADE_DURATION = 0.5
    const IMAGE_CYCLE_INTERVAL = 6
    const LOGO_DURATION = 3

    const images: HTMLImageElement[] = []
    const reviewScreenshots = record.formData.reviewScreenshots || []

    if (reviewScreenshots.length === 0) {
      throw new Error("No review screenshots available. Please add screenshots in the review form first.")
    }

    for (const dataUrl of reviewScreenshots) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Failed to load review screenshot"))
        img.src = dataUrl
      })
      images.push(img)
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
    const arrayBuffer = await audioBlobParam.arrayBuffer()
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
      const words = await fetchWhisperCaptions(audioBlob!)
      const captionGroups = buildCaptionGroups(words)

      setVideoProgress("Generating video...")
      const horizontalBlob = await generateVideoWithFormat(1920, 1080, "Horizontal", captionGroups, audioBlob!)
      const horizontalUrl = URL.createObjectURL(horizontalBlob)
      setVideoUrl(horizontalUrl)

      const updated = await updateGeneratedContent(record.id, {
        videoDataUrl: horizontalUrl,
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
    console.log("[v0] generateFullVideo called")
    const currentScript = videoScriptRef.current
    console.log("[v0] currentScript length:", currentScript?.length)
    
    if (!currentScript) {
      console.log("[v0] No script, returning early")
      setError("Generate a video script first.")
      return
    }

    setError(null)
    setLoading("fullVideo")
    console.log("[v0] Set loading to fullVideo")
    
    try {
      // Check if voiceover needs to be regenerated (script changed since last voiceover)
      const voiceoverScript = record.generated.voiceoverScriptHash || ""
      const scriptChanged = currentScript !== voiceoverScript
      console.log("[v0] Current script (first 100 chars):", currentScript.substring(0, 100))
      console.log("[v0] Voiceover script hash (first 100 chars):", voiceoverScript.substring(0, 100))
      console.log("[v0] scriptChanged:", scriptChanged, "audioBlob exists:", !!audioBlob)
      
      let currentAudioBlob = audioBlob
      
      if (!currentAudioBlob || scriptChanged) {
        // Generate/regenerate voiceover with current script
        console.log("[v0] Need to generate voiceover")
        setVideoProgress("Step 1/4: Generating voiceover...")
        const settings = await getSettings()
        console.log("[v0] Got settings, heygenApiKey exists:", !!settings.heygenApiKey, "heygenVoiceId:", settings.heygenVoiceId)
        
        if (!settings.heygenApiKey || !settings.heygenVoiceId) {
          setError("HeyGen API key or Voice ID missing. Add them in Admin Settings.")
          setLoading(null)
          return
        }
        
        console.log("[v0] Calling generateHeyGenTTS server action...")
        const ttsResult = await generateHeyGenTTS(
          currentScript,
          settings.heygenVoiceId,
          settings.heygenApiKey
        )
        console.log("[v0] TTS result:", JSON.stringify(ttsResult))
        
        if (!ttsResult.success) {
          console.log("[v0] TTS failed:", ttsResult.error)
          throw new Error(ttsResult.error || "TTS generation failed")
        }
        
        const audioUrl = ttsResult.audioUrl
        console.log("[v0] Audio URL:", audioUrl)
        
        console.log("[v0] Fetching audio from URL...")
        const audioRes = await fetch(audioUrl)
        console.log("[v0] Audio fetch status:", audioRes.status)
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
      const horizontalBlob = await generateVideoWithFormat(1920, 1080, "Horizontal", captionGroups, currentAudioBlob!)
      const horizontalUrl = URL.createObjectURL(horizontalBlob)
      setVideoUrl(horizontalUrl)
      
      // Save horizontal video to storage
      setVideoProgress("Saving video...")
      const horizontalArrayBuffer = await horizontalBlob.arrayBuffer()
      const horizontalBytes = new Uint8Array(horizontalArrayBuffer)
      let horizontalBinary = ""
      for (let i = 0; i < horizontalBytes.length; i++) {
        horizontalBinary += String.fromCharCode(horizontalBytes[i])
      }
      const horizontalBase64 = btoa(horizontalBinary)
      const horizontalKey = `video-horizontal-${record.id}`
      await saveVideoAsset(horizontalKey, horizontalBase64)
      
      // Save key to record (not blob URL)
      const updatedRecord = await updateGeneratedContent(record.id, {
        videoDataUrl: horizontalKey,
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

      {/* 1. Blog Post */}
      <div className="rounded-lg border border-border bg-card">
        <button
          type="button"
          onClick={() => setCollapsed(c => ({ ...c, blogPost: !c.blogPost }))}
          className="flex w-full items-center justify-between p-5"
        >
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText size={16} />
            1. Blog Post
          </h2>
          <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", collapsed.blogPost && "-rotate-90")} />
        </button>
        {!collapsed.blogPost && (
        <div className="px-5 pb-5">
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

        {/* Blog Post Title */}
        <div className="mt-6">
          <EditableBlock
            label="Blog Post Title"
            content={record.generated.blogPostTitle || ""}
            onGenerate={generateBlogTitle}
            isGenerating={loading === "blogTitle"}
            generateLabel="Generate"
            rows={1}
            onSave={async (v) => {
              const updated = await updateGeneratedContent(record.id, { blogPostTitle: v })
              if (updated) setRecord(updated)
            }}
          />
        </div>
        
        {/* Meta Description */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Meta Description</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={generateMetaDescription}
                disabled={loading === "meta"}
                className={btnClass}
              >
                {loading === "meta" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Generate
              </button>
              <button
                type="button"
                onClick={saveMetaDescription}
                disabled={metaSaving || !localMetaDescription}
                className={btnClass}
              >
                {metaSaved ? <Check size={12} className="text-green-400" /> : <Save size={12} />}
                {metaSaved ? "Saved" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(localMetaDescription, "meta")}
                disabled={!localMetaDescription}
                className={btnClass}
              >
                {copiedItem === "meta" ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                {copiedItem === "meta" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <textarea
            value={localMetaDescription}
            onChange={(e) => { setLocalMetaDescription(e.target.value); setMetaSaved(false) }}
            rows={3}
            placeholder="Generate or type a meta description..."
            className="w-full resize-y rounded-md border border-border bg-input px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={pushToWordPress} disabled={loading !== null} className={btnClass}>
            {loading === "wp" ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
            Push to WordPress
          </button>
        </div>
        </div>
        )}
      </div>

      {/* 2. Video */}
      <div className="rounded-lg border border-border bg-card">
        <button
          type="button"
          onClick={() => setCollapsed(c => ({ ...c, video: !c.video }))}
          className="flex w-full items-center justify-between p-5"
        >
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Video size={16} />
            2. Video
          </h2>
          <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", collapsed.video && "-rotate-90")} />
        </button>
        {!collapsed.video && (
        <div className="px-5 pb-5">
        
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

        {/* Slideshow Video */}
        {videoUrl && (
          <div className="mt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Slideshow Video</h3>
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
          </div>
        )}
        </div>
        )}
      </div>

      {/* 3. Images */}
      <div className="rounded-lg border border-border bg-card">
        <button
          type="button"
          onClick={() => setCollapsed(c => ({ ...c, thumbnails: !c.thumbnails }))}
          className="flex w-full items-center justify-between p-5"
        >
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ImageIcon size={16} />
            3. Images
          </h2>
          <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", collapsed.thumbnails && "-rotate-90")} />
        </button>
        {!collapsed.thumbnails && (
        <div className="px-5 pb-5">
          {record.formData.reviewScreenshots && record.formData.reviewScreenshots.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {record.formData.reviewScreenshots.map((dataUrl, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    // Create a canvas to resize to WordPress featured image size (1200x628)
                    const img = new window.Image()
                    img.crossOrigin = "anonymous"
                    img.onload = () => {
                      const canvas = document.createElement("canvas")
                      canvas.width = 1200
                      canvas.height = 628
                      const ctx = canvas.getContext("2d")
                      if (!ctx) return
                      
                      // Calculate crop to fit 1200x628 aspect ratio
                      const targetAspect = 1200 / 628
                      const imgAspect = img.width / img.height
                      let sx = 0, sy = 0, sw = img.width, sh = img.height
                      
                      if (imgAspect > targetAspect) {
                        // Image is wider - crop sides
                        sw = img.height * targetAspect
                        sx = (img.width - sw) / 2
                      } else {
                        // Image is taller - crop top/bottom
                        sh = img.width / targetAspect
                        sy = (img.height - sh) / 2
                      }
                      
                      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1200, 628)
                      
                      // Download as PNG
                      const link = document.createElement("a")
                      link.download = `${record.formData.competitorName?.toLowerCase().replace(/\s+/g, "-") || "competitor"}-image-${index + 1}.png`
                      link.href = canvas.toDataURL("image/png")
                      link.click()
                    }
                    img.src = dataUrl
                  }}
                  className="group relative overflow-hidden rounded-md border border-border hover:border-primary transition-colors cursor-pointer"
                >
                  <img 
                    src={dataUrl} 
                    alt={`Review screenshot ${index + 1}`} 
                    className="aspect-video w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1 text-xs text-white font-medium">
                      <Download size={14} />
                      Download PNG
                    </div>
                  </div>
                  <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white font-medium">
                    #{index + 1}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No images uploaded. Add screenshots in the review form to see them here.
            </div>
          )}
        </div>
        )}
      </div>

      {/* 4. Voiceover */}
      <div className="rounded-lg border border-border bg-card">
        <button
          type="button"
          onClick={() => setCollapsed(c => ({ ...c, voiceover: !c.voiceover }))}
          className="flex w-full items-center justify-between p-5"
        >
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Video size={16} />
            4. Voiceover
          </h2>
          <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", collapsed.voiceover && "-rotate-90")} />
        </button>
        {!collapsed.voiceover && (
        <div className="px-5 pb-5">
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
        )}
      </div>

      {/* 5. Social Posts */}
      <div className="rounded-lg border border-border bg-card">
        <button
          type="button"
          onClick={() => setCollapsed(c => ({ ...c, social: !c.social }))}
          className="flex w-full items-center justify-between p-5"
        >
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Share2 size={16} />
            5. Social Posts
          </h2>
          <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", collapsed.social && "-rotate-90")} />
        </button>
        {!collapsed.social && (
        <div className="px-5 pb-5 space-y-6">
        
        {/* LinkedIn Post */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Linkedin size={14} />
            LinkedIn Post
          </h3>
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

        {/* Facebook Post */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Facebook size={14} />
            Facebook Post
          </h3>
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

        {/* Tweet */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Twitter size={14} />
            Tweet
          </h3>
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

        {/* Reddit Comment */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <MessageSquare size={14} />
            Reddit Comment
          </h3>
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
        )}

        {/* Distribution Tasks */}
        <TasksSection record={record} setRecord={setRecord} />
      </div>
    </div>
  )
}
