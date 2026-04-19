"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { AdminGuard } from "@/components/admin-guard"
import { AdminNav } from "@/components/admin-nav"
import { QueueItem, QueueStatus } from "@/lib/types"
import {
  getSortedQueue,
  addToQueue,
  updateQueueItemStatus,
  updateQueueItemName,
  removeFromQueue,
  saveQueue,
  getQueue,
  getReviewByCompetitorName,
} from "@/lib/store"
import { cn } from "@/lib/utils"
import { Trash2, Plus, ClipboardList, ArrowUpDown, ExternalLink, Play } from "lucide-react"

const inputClass =
  "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"

const statusColors: Record<QueueStatus, string> = {
  "Not Started": "bg-secondary text-muted-foreground",
  "In Progress": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "Completed": "bg-green-500/15 text-green-600 dark:text-green-400",
}

const statusDot: Record<QueueStatus, string> = {
  "Not Started": "bg-muted-foreground",
  "In Progress": "bg-amber-500",
  "Completed": "bg-green-500",
}

const STATUS_OPTIONS: QueueStatus[] = ["Not Started", "In Progress", "Completed"]

type SortKey = "status" | "url" | "date"
type SortDir = "asc" | "desc"

export default function AdminQueuePage() {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <AdminNav />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <QueueManager />
        </main>
      </div>
    </AdminGuard>
  )
}

function QueueManager() {
  const router = useRouter()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [newUrl, setNewUrl] = useState("")
  const [newName, setNewName] = useState("")
  const [bulkText, setBulkText] = useState("")
  const [showBulk, setShowBulk] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("status")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [filterStatus, setFilterStatus] = useState<QueueStatus | "All">("All")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    const queue = await getSortedQueue()
    setQueue(queue)
  }

  async function handleStartReview(item: QueueItem) {
    await updateQueueItemStatus(item.id, "In Progress")
    
    // Check if a review already exists for this competitor (by name or URL)
    const existingReview = await getReviewByCompetitorName(item.name || "", item.url)
    if (existingReview) {
      // Navigate to the existing review
      router.push(`/admin/reviews/${existingReview.id}`)
      return
    }
    
    // No existing review - go to form to create one
    sessionStorage.setItem("queueUrl", item.url)
    if (item.name) sessionStorage.setItem("queueName", item.name)
    router.push("/admin/form")
  }

  function sorted(items: QueueItem[]) {
    const filtered =
      filterStatus === "All" ? items : items.filter((i) => i.status === filterStatus)

    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === "status") {
        const order = { "In Progress": 0, "Not Started": 1, "Completed": 2 }
        cmp = order[a.status] - order[b.status]
      } else if (sortKey === "url") {
        cmp = a.url.localeCompare(b.url)
      } else if (sortKey === "date") {
        cmp = new Date(a.statusUpdatedAt).getTime() - new Date(b.statusUpdatedAt).getTime()
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  function isValidUrl(raw: string) {
    try {
      new URL(raw.startsWith("http") ? raw : `https://${raw}`)
      return true
    } catch {
      return false
    }
  }

  function normalise(raw: string) {
    return raw.startsWith("http") ? raw.trim() : `https://${raw.trim()}`
  }

  async function handleAdd() {
    setError(null)
    const trimmed = newUrl.trim()
    if (!trimmed) return
    if (!isValidUrl(trimmed)) {
      setError("Please enter a valid URL.")
      return
    }
    await addToQueue(normalise(trimmed), newName.trim())
    setNewUrl("")
    setNewName("")
    await refresh()
    inputRef.current?.focus()
  }

  async function handleBulkAdd() {
    setError(null)
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)

    const invalid = lines.filter((l) => !isValidUrl(l))
    if (invalid.length > 0) {
      setError(`Invalid URLs: ${invalid.slice(0, 3).join(", ")}${invalid.length > 3 ? "…" : ""}`)
      return
    }

    for (const l of lines) {
      await addToQueue(normalise(l))
    }
    setBulkText("")
    setShowBulk(false)
    await refresh()
  }

  async function handleNameChange(id: string, name: string) {
    await updateQueueItemName(id, name)
    // Refresh only the local state without re-sorting so the row doesn't jump
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name } : item))
    )
  }

  async function handleStatusChange(id: string, status: QueueStatus) {
    await updateQueueItemStatus(id, status)
    await refresh()
  }

  async function handleRemove(id: string) {
    await removeFromQueue(id)
    await refresh()
  }

  async function handleClearCompleted() {
    const allQueue = await getQueue()
    const remaining = allQueue.filter((q) => q.status !== "Completed")
    await saveQueue(remaining)
    await refresh()
  }

  const displayed = sorted(queue)
  const counts = {
    All: queue.length,
    "Not Started": queue.filter((q) => q.status === "Not Started").length,
    "In Progress": queue.filter((q) => q.status === "In Progress").length,
    "Completed": queue.filter((q) => q.status === "Completed").length,
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ClipboardList size={18} className="text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Review Queue</h1>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {queue.length}
          </span>
        </div>
        {counts.Completed > 0 && (
          <button
            onClick={handleClearCompleted}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear completed ({counts.Completed})
          </button>
        )}
      </div>

      {/* Add URL */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Add Website
        </h2>

        {!showBulk ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="url"
                value={newUrl}
                onChange={(e) => { setNewUrl(e.target.value); setError(null) }}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="https://competitor-site.com"
                className={cn(inputClass, "flex-1")}
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Friendly name (optional)"
                className={cn(inputClass, "w-52")}
              />
              <button
                onClick={handleAdd}
                disabled={!newUrl.trim()}
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
            <button
              onClick={() => setShowBulk(true)}
              className="self-start text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Paste multiple URLs at once
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              value={bulkText}
              onChange={(e) => { setBulkText(e.target.value); setError(null) }}
              placeholder={"https://site-one.com\nhttps://site-two.com\nhttps://site-three.com"}
              rows={5}
              className={cn(inputClass, "resize-y font-mono text-xs")}
            />
            <div className="flex gap-2">
              <button
                onClick={handleBulkAdd}
                disabled={!bulkText.trim()}
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={14} />
                Add All
              </button>
              <button
                onClick={() => { setShowBulk(false); setBulkText(""); setError(null) }}
                className="rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}
      </div>

      {/* Filter tabs */}
      {queue.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {(["All", "Not Started", "In Progress", "Completed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filterStatus === s
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              {s}
              <span className="ml-1.5 rounded-full bg-border px-1.5 py-0.5 text-xs">
                {counts[s]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Queue table */}
      {queue.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 py-12 text-center">
          <ClipboardList size={28} className="mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No websites in the queue yet.</p>
          <p className="text-xs text-muted-foreground/60">Add a URL above to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_140px_100px_90px_40px] items-center gap-3 border-b border-border bg-secondary/50 px-4 py-2 text-xs font-medium text-muted-foreground">
            <button
              onClick={() => toggleSort("url")}
              className="flex items-center gap-1 text-left hover:text-foreground"
            >
              URL
              <ArrowUpDown size={10} className={sortKey === "url" ? "text-primary" : ""} />
            </button>
            <span>Friendly Name</span>
            <button
              onClick={() => toggleSort("status")}
              className="flex items-center gap-1 hover:text-foreground"
            >
              Status
              <ArrowUpDown size={10} className={sortKey === "status" ? "text-primary" : ""} />
            </button>
            <button
              onClick={() => toggleSort("date")}
              className="flex items-center gap-1 hover:text-foreground"
            >
              Updated
              <ArrowUpDown size={10} className={sortKey === "date" ? "text-primary" : ""} />
            </button>
            <span />
            <span />
          </div>

          {/* Rows */}
          {displayed.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No items match this filter.
            </div>
          ) : (
            displayed.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_1fr_140px_100px_90px_40px] items-center gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-secondary/20"
              >
                {/* URL */}
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground" title={item.url}>
                    {item.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* Friendly Name */}
                <input
                  type="text"
                  value={item.name ?? ""}
                  onChange={(e) => handleNameChange(item.id, e.target.value)}
                  placeholder="Add a name..."
                  className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground/50 hover:border-border focus:border-border focus:bg-input focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                />

                {/* Status select */}
                <div>
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value as QueueStatus)}
                    className={cn(
                      "w-full cursor-pointer rounded-md border-0 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring",
                      statusColors[item.status]
                    )}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <span className="text-xs text-muted-foreground">
                  {new Date(item.statusUpdatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>

                {/* Review */}
                <button
                  onClick={() => handleStartReview(item)}
                  disabled={item.status === "Completed"}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Play size={11} />
                  Review
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
