"use client"

import { useState } from "react"

export default function DownloadContentGenerationPage() {
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  async function downloadFile() {
    setDownloading(true)
    try {
      const res = await fetch("/api/download-content-generation")
      const content = await res.text()
      
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "content-generation.tsx"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDownloaded(true)
    } catch (err) {
      console.error("Download failed:", err)
    }
    setDownloading(false)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Download Content Generation</h1>
        <p className="mb-8 text-muted-foreground">
          File: components/content-generation.tsx
        </p>

        <div className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            This file (2200+ lines) contains all content generation functions with arousrScores wired in:
          </p>
          <ul className="mb-4 list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>generateBlogPost() - uses settings.arousrScores</li>
            <li>generateVideoScript() - uses settings.arousrScores</li>
            <li>generateTweet() - uses settings.arousrScores</li>
            <li>generateInstagramCaption() - uses settings.arousrScores</li>
            <li>generateRedditComment() - uses settings.arousrScores</li>
          </ul>
          <button
            onClick={downloadFile}
            disabled={downloading}
            className={`w-full rounded-md px-4 py-3 text-sm font-medium transition-colors ${
              downloaded
                ? "bg-green-600 text-white"
                : downloading
                ? "bg-muted text-muted-foreground cursor-wait"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {downloaded ? "Downloaded - content-generation.tsx" : downloading ? "Downloading..." : "Download content-generation.tsx"}
          </button>
        </div>

        <div className="mt-6 text-sm text-muted-foreground">
          <p>Upload this file to GitHub at:</p>
          <code className="mt-2 block rounded bg-muted px-3 py-2 font-mono text-xs">
            components/content-generation.tsx
          </code>
        </div>

        <a href="/download-files" className="mt-6 block text-sm text-primary hover:underline">
          Back to all files
        </a>
      </div>
    </div>
  )
}
