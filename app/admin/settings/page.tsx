"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { AdminNav } from "@/components/admin-nav"
import { AppSettings, ThumbnailImage, ArousrScores } from "@/lib/types"
import { getSettings, saveSettings, getThumbnailLibrary, saveThumbnailLibrary, saveVideoAsset, getVideoAsset, deleteVideoAsset } from "@/lib/store"
import { Eye, EyeOff, Check, Trash2, Video } from "lucide-react"
import { cn } from "@/lib/utils"

const inputClass =
  "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"

function PasswordField({
  label,
  id,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          className={cn(inputClass, "pr-10")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={show ? "Hide" : "Show"}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function AdminSettingsContent() {
  const [settings, setSettings] = useState<AppSettings>({
    wpSiteUrl: "",
    wpUsername: "",
    wpAppPassword: "",
    openaiApiKey: "",
    adminPassword: "",
    thumbnailSiteName: "",
    heygenApiKey: "",
    heygenAvatarId: "",
    heygenVoiceId: "",
    elevenLabsApiKey: "",
    elevenLabsVoiceId: "",
    logoVideoBase64: "",
    avatarVideoBase64: "",
    arousrScores: undefined,
  })
  const [arousrScores, setArousrScores] = useState<ArousrScores>({
    ease_of_signup: 0,
    interface_ux: 0,
    mobile_experience: 0,
    host_variety: 0,
    response_time: 0,
    chat_quality: 0,
    pricing_transparency: 0,
    privacy_safety: 0,
    total: 0,
  })
  const [saved, setSaved] = useState(false)
  const [library, setLibrary] = useState<ThumbnailImage[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [logoVideoLoaded, setLogoVideoLoaded] = useState(false)
  const [avatarVideoLoaded, setAvatarVideoLoaded] = useState(false)

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s)
      if (s.arousrScores) {
        setArousrScores(s.arousrScores)
      }
    })
    getThumbnailLibrary().then(setLibrary)
    // Load video asset states from Supabase
    getVideoAsset("logo-video").then((exists) => setLogoVideoLoaded(!!exists))
    getVideoAsset("avatar-video").then((exists) => setAvatarVideoLoaded(!!exists))
  }, [])

  function handleImageUpload(file: File) {
    setUploadingImage(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = async () => {
        const maxWidth = 1280
        const maxHeight = 720
        let { width, height } = img
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
          const newImage: ThumbnailImage = {
            id: crypto.randomUUID(),
            label: file.name.replace(/\.[^.]+$/, ""),
            dataUrl,
          }
          const updated = [newImage, ...library]
          await saveThumbnailLibrary(updated)
          setLibrary(updated)
        }
        setUploadingImage(false)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  async function handleDeleteImage(id: string) {
    const updated = library.filter((img) => img.id !== id)
    await saveThumbnailLibrary(updated)
    setLibrary(updated)
  }

  function handleLogoVideoUpload(file: File) {
    setUploadingVideo(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1]
      saveVideoAsset("logo-video", base64)
        .then(() => {
          setLogoVideoLoaded(true)
          setUploadingVideo(false)
        })
        .catch((err) => {
          console.error("[v0] Failed to save logo video to IndexedDB:", err)
          setUploadingVideo(false)
        })
    }
    reader.onerror = () => {
      setUploadingVideo(false)
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveLogoVideo() {
    deleteVideoAsset("logo-video")
      .then(() => setLogoVideoLoaded(false))
      .catch((err) => console.error("[v0] Failed to delete logo video:", err))
  }

  function handleAvatarVideoUpload(file: File) {
    setUploadingAvatar(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1]
      saveVideoAsset("avatar-video", base64)
        .then(() => {
          setAvatarVideoLoaded(true)
          setUploadingAvatar(false)
        })
        .catch((err) => {
          console.error("[v0] Failed to save avatar video to IndexedDB:", err)
          setUploadingAvatar(false)
        })
    }
    reader.onerror = () => {
      console.error("[v0] Avatar upload failed")
      setUploadingAvatar(false)
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveAvatarVideo() {
    deleteVideoAsset("avatar-video")
      .then(() => setAvatarVideoLoaded(false))
      .catch((err) => console.error("[v0] Failed to delete avatar video:", err))
  }

  function set(key: keyof AppSettings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function setArousrScore(key: keyof Omit<ArousrScores, 'total'>, value: number) {
    const clampedValue = Math.max(0, Math.min(10, value))
    setArousrScores((prev) => {
      const updated = { ...prev, [key]: clampedValue }
      updated.total = 
        updated.ease_of_signup +
        updated.interface_ux +
        updated.mobile_experience +
        updated.host_variety +
        updated.response_time +
        updated.chat_quality +
        updated.pricing_transparency +
        updated.privacy_safety
      return updated
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      // Don't save video base64s to settings table - they're stored separately
      const settingsToSave = { 
        ...settings, 
        logoVideoBase64: "", 
        avatarVideoBase64: "",
        arousrScores: arousrScores,
      }
      await saveSettings(settingsToSave)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error("[v0] Failed to save settings:", err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure API credentials and admin access. All values are stored in your browser&apos;s localStorage.
          </p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Admin */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Admin Access
            </h2>
            <PasswordField
              label="Admin Password"
              id="admin-password"
              value={settings.adminPassword}
              onChange={(v) => set("adminPassword", v)}
              placeholder="Set a password for /admin"
              hint="This password protects the admin section. Leave blank to disable admin access."
            />
          </div>

          {/* WordPress */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              WordPress
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="wp-url" className="text-xs font-medium text-muted-foreground">
                  Site URL
                </label>
                <input
                  id="wp-url"
                  className={inputClass}
                  value={settings.wpSiteUrl}
                  onChange={(e) => set("wpSiteUrl", e.target.value)}
                  placeholder="https://arousr.com"
                  type="url"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="wp-user" className="text-xs font-medium text-muted-foreground">
                  Username
                </label>
                <input
                  id="wp-user"
                  className={inputClass}
                  value={settings.wpUsername}
                  onChange={(e) => set("wpUsername", e.target.value)}
                  placeholder="admin"
                  autoComplete="off"
                />
              </div>
              <PasswordField
                label="Application Password"
                id="wp-app-pass"
                value={settings.wpAppPassword}
                onChange={(v) => set("wpAppPassword", v)}
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                hint="Generate under WordPress: Users → Profile → Application Passwords."
              />
            </div>
          </div>

          {/* OpenAI */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              OpenAI
            </h2>
            <PasswordField
              label="API Key"
              id="openai-key"
              value={settings.openaiApiKey}
              onChange={(v) => set("openaiApiKey", v)}
              placeholder="sk-..."
            />
          </div>

          {/* Arousr Benchmark Scores */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Arousr Benchmark Scores
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Set Arousr&apos;s baseline scores (0-10) used in comparison tables and content generation.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="score-signup" className="text-xs font-medium text-muted-foreground">
                  Ease of Signup
                </label>
                <input
                  id="score-signup"
                  type="number"
                  min={0}
                  max={10}
                  className={inputClass}
                  value={arousrScores.ease_of_signup}
                  onChange={(e) => setArousrScore("ease_of_signup", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="score-ux" className="text-xs font-medium text-muted-foreground">
                  Interface / UX
                </label>
                <input
                  id="score-ux"
                  type="number"
                  min={0}
                  max={10}
                  className={inputClass}
                  value={arousrScores.interface_ux}
                  onChange={(e) => setArousrScore("interface_ux", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="score-mobile" className="text-xs font-medium text-muted-foreground">
                  Mobile Experience
                </label>
                <input
                  id="score-mobile"
                  type="number"
                  min={0}
                  max={10}
                  className={inputClass}
                  value={arousrScores.mobile_experience}
                  onChange={(e) => setArousrScore("mobile_experience", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="score-variety" className="text-xs font-medium text-muted-foreground">
                  Host Variety
                </label>
                <input
                  id="score-variety"
                  type="number"
                  min={0}
                  max={10}
                  className={inputClass}
                  value={arousrScores.host_variety}
                  onChange={(e) => setArousrScore("host_variety", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="score-response" className="text-xs font-medium text-muted-foreground">
                  Response Time
                </label>
                <input
                  id="score-response"
                  type="number"
                  min={0}
                  max={10}
                  className={inputClass}
                  value={arousrScores.response_time}
                  onChange={(e) => setArousrScore("response_time", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="score-chat" className="text-xs font-medium text-muted-foreground">
                  Chat Quality
                </label>
                <input
                  id="score-chat"
                  type="number"
                  min={0}
                  max={10}
                  className={inputClass}
                  value={arousrScores.chat_quality}
                  onChange={(e) => setArousrScore("chat_quality", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="score-pricing" className="text-xs font-medium text-muted-foreground">
                  Pricing Transparency
                </label>
                <input
                  id="score-pricing"
                  type="number"
                  min={0}
                  max={10}
                  className={inputClass}
                  value={arousrScores.pricing_transparency}
                  onChange={(e) => setArousrScore("pricing_transparency", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="score-privacy" className="text-xs font-medium text-muted-foreground">
                  Privacy &amp; Safety
                </label>
                <input
                  id="score-privacy"
                  type="number"
                  min={0}
                  max={10}
                  className={inputClass}
                  value={arousrScores.privacy_safety}
                  onChange={(e) => setArousrScore("privacy_safety", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="mt-4 rounded-md bg-muted/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">{arousrScores.total}/80</span>
              </div>
            </div>
          </div>

          {/* ElevenLabs */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              ElevenLabs (Voice Generation)
            </h2>
            <div className="flex flex-col gap-4">
              <PasswordField
                label="API Key"
                id="elevenlabs-key"
                value={settings.elevenLabsApiKey}
                onChange={(v) => set("elevenLabsApiKey", v)}
                placeholder="Your ElevenLabs API key"
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="elevenlabs-voice" className="text-xs font-medium text-muted-foreground">
                  Voice ID
                </label>
                <input
                  id="elevenlabs-voice"
                  className={inputClass}
                  value={settings.elevenLabsVoiceId}
                  onChange={(e) => set("elevenLabsVoiceId", e.target.value)}
                  placeholder="Paste your ElevenLabs Voice ID"
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your ElevenLabs dashboard under Voices → Voice ID
                </p>
              </div>
            </div>
          </div>

          {/* HeyGen - Coming Soon */}
          <div className="rounded-lg border border-border bg-card p-5 opacity-60">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                HeyGen
              </h2>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                Coming Soon
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              HeyGen avatar integration is paused — will be re-enabled in a future update.
            </p>
            <div className="flex flex-col gap-4 pointer-events-none">
              <PasswordField
                label="API Key"
                id="heygen-key"
                value={settings.heygenApiKey}
                onChange={(v) => set("heygenApiKey", v)}
                placeholder="Your HeyGen API key"
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="heygen-avatar" className="text-xs font-medium text-muted-foreground">
                  Avatar ID
                </label>
                <input
                  id="heygen-avatar"
                  className={inputClass}
                  value={settings.heygenAvatarId}
                  onChange={(e) => set("heygenAvatarId", e.target.value)}
                  placeholder="Paste your HeyGen Avatar ID"
                  disabled
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="heygen-voice" className="text-xs font-medium text-muted-foreground">
                  Voice ID
                </label>
                <input
                  id="heygen-voice"
                  className={inputClass}
                  value={settings.heygenVoiceId}
                  onChange={(e) => set("heygenVoiceId", e.target.value)}
                  placeholder="Paste your HeyGen Voice ID"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Video Generator */}
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Video Generator
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="thumb-site" className="text-xs font-medium text-muted-foreground">
                  Site Name
                </label>
                <input
                  id="thumb-site"
                  className={inputClass}
                  value={settings.thumbnailSiteName}
                  onChange={(e) => set("thumbnailSiteName", e.target.value)}
                  placeholder="Arousr"
                />
                <p className="text-xs text-muted-foreground">
                  Displayed at the bottom of generated thumbnails.
                </p>
              </div>

              {/* Logo Video for Ending Screen */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    Logo Video (Ending Screen)
                  </label>
                  {!logoVideoLoaded && (
                    <label
                      htmlFor="logo-video-upload"
                      className={cn(
                        "cursor-pointer rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70",
                        uploadingVideo && "pointer-events-none opacity-50"
                      )}
                    >
                      {uploadingVideo ? "Uploading..." : "+ Upload MP4"}
                    </label>
                  )}
                  <input
                    id="logo-video-upload"
                    type="file"
                    accept="video/mp4"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleLogoVideoUpload(file)
                      e.target.value = ""
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload an MP4 logo animation for the final 3 seconds of generated videos.
                </p>

                {logoVideoLoaded ? (
                  <div className="relative rounded-md border border-border bg-black/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                        <Video size={20} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Logo video uploaded</p>
                        <p className="text-xs text-muted-foreground">Stored in browser IndexedDB</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveLogoVideo}
                        className="flex items-center gap-1 rounded bg-red-500/80 px-2 py-1 text-xs text-white hover:bg-red-500"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                    No logo video uploaded. Click &quot;+ Upload MP4&quot; to add one.
                  </p>
                )}
              </div>

              {/* Presenter Avatar MP4 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    Presenter Avatar MP4
                  </label>
                  {!avatarVideoLoaded && (
                    <label
                      htmlFor="avatar-video-upload"
                      className={cn(
                        "cursor-pointer rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70",
                        uploadingAvatar && "pointer-events-none opacity-50"
                      )}
                    >
                      {uploadingAvatar ? "Uploading..." : "+ Upload MP4"}
                    </label>
                  )}
                  <input
                    id="avatar-video-upload"
                    type="file"
                    accept="video/mp4"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleAvatarVideoUpload(file)
                      e.target.value = ""
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Looping presenter avatar shown in the bottom-right corner of generated videos.
                </p>

                {avatarVideoLoaded ? (
                  <div className="relative rounded-md border border-border bg-black/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                        <Video size={20} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Avatar video uploaded</p>
                        <p className="text-xs text-muted-foreground">Stored in browser IndexedDB</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveAvatarVideo}
                        className="flex items-center gap-1 rounded bg-red-500/80 px-2 py-1 text-xs text-white hover:bg-red-500"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                    No avatar video uploaded. Click &quot;+ Upload MP4&quot; to add one.
                  </p>
                )}
              </div>

              {/* Background Image Library */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    Background Image Library
                  </label>
                  <label
                    htmlFor="thumb-bg-upload"
                    className={cn(
                      "cursor-pointer rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70",
                      uploadingImage && "pointer-events-none opacity-50"
                    )}
                  >
                    {uploadingImage ? "Uploading..." : "+ Add Image"}
                  </label>
                  <input
                    id="thumb-bg-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                      e.target.value = ""
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload reviewer photos or styled backgrounds. Images are resized and stored locally.
                </p>

                {library.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                    No images yet. Click &quot;+ Add Image&quot; to upload.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {library.map((img) => (
                      <div key={img.id} className="group relative">
                        <img
                          src={img.dataUrl}
                          alt={img.label}
                          className="aspect-video w-full rounded-md border border-border object-cover"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-md bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="max-w-full truncate px-1 text-center text-xs text-white">
                            {img.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            className="flex items-center gap-1 rounded bg-red-500/80 px-2 py-0.5 text-xs text-white hover:bg-red-500"
                          >
                            <Trash2 size={10} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {saved ? (
              <>
                <Check size={15} />
                Saved
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </form>
      </main>
    </div>
  )
}

export default function AdminSettingsPage() {
  return <AdminSettingsContent />
}
