"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { QueueItem, QueueStatus, TaskStatus } from "@/lib/types"
import { updateQueueItemStatus, getSortedQueue, getReviewByCompetitorName, addToQueue, removeFromQueue } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Play, Eye, Loader2, Plus, Trash2 } from "lucide-react"

// Check if all distribution tasks are completed
function areAllTasksCompleted(tasks: TaskStatus | undefined): boolean {
  if (!tasks) return false
  return (
    tasks.blogPublishedArousr &&
    tasks.videoPostedYouTube &&
    tasks.videoPostedXBIZ &&
    tasks.videoEmbeddedBlog &&
    tasks.blogPostedMedium &&
    tasks.linkedInArticle &&
    tasks.xPost &&
    tasks.facebookPost
  )
}

interface QueueItemWithCompletion extends QueueItem {
  allTasksCompleted: boolean
}


export function ReviewQueue() {
  const router = useRouter()
  const [queue, setQueue] = useState<QueueItemWithCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [newName, setNewName] = useState("")
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this competitor from the queue?")) return
    
    setDeletingId(id)
    try {
      await removeFromQueue(id)
      setQueue((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      console.error("Failed to delete queue item:", err)
    } finally {
      setDeletingId(null)
    }
  }

  // Fetch queue and check task completion status for each item
  async function fetchQueueWithCompletion() {
    setLoading(true)
    const items = await getSortedQueue()
    
    // Fetch review records to check task completion
    const itemsWithCompletion = await Promise.all(
      items.map(async (item) => {
        const review = await getReviewByCompetitorName(item.name, item.url)
        const allTasksCompleted = areAllTasksCompleted(review?.tasks)
        return { ...item, allTasksCompleted }
      })
    )
    
    // Sort: In Progress first, then Not Started, then Completed (all tasks done) at bottom
    const sorted = itemsWithCompletion.sort((a, b) => {
      // Items with all tasks completed go to bottom
      if (a.allTasksCompleted && !b.allTasksCompleted) return 1
      if (!a.allTasksCompleted && b.allTasksCompleted) return -1
      
      // Otherwise sort by status
      const statusOrder = { "In Progress": 0, "Not Started": 1, "Completed": 2 }
      return statusOrder[a.status] - statusOrder[b.status]
    })
    
    setQueue(sorted)
    setLoading(false)
  }

  useEffect(() => {
    fetchQueueWithCompletion()
  }, [])

  async function handleViewReview(item: QueueItemWithCompletion) {
    // Mark as in progress if not already completed
    if (!item.allTasksCompleted && item.status !== "In Progress") {
      try {
        await updateQueueItemStatus(item.id, "In Progress")
      } catch (err) {
        console.error("Failed to update queue status:", err)
        // Continue with navigation even if status update fails
      }
    }
    sessionStorage.setItem("queueUrl", item.url)
    if (item.name) sessionStorage.setItem("queueName", item.name)
    router.push("/form")
  }

  async function handleAddCompetitor(e: React.FormEvent) {
    e.preventDefault()
    if (!newUrl.trim()) return
    
    setAdding(true)
    try {
      await addToQueue(newUrl.trim(), newName.trim())
      setNewUrl("")
      setNewName("")
      setShowAddForm(false)
      await fetchQueueWithCompletion()
    } catch (err) {
      console.error("Failed to add competitor:", err)
    } finally {
      setAdding(false)
    }
  }

  const statusColors: Record<QueueStatus, string> = {
    "Not Started": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
    "In Progress": "bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-100",
    "Completed": "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100",
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add Competitor Section */}
      <div className="flex flex-col gap-3">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/50 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-card hover:text-foreground"
          >
            <Plus size={16} />
            Add Competitor
          </button>
        ) : (
          <form onSubmit={handleAddCompetitor} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="competitor-url" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Competitor URL *
                </label>
                <input
                  id="competitor-url"
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://competitor.com"
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="competitor-name" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Competitor Name (optional)
                </label>
                <input
                  id="competitor-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Competitor Name"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={adding || !newUrl.trim()}
                  className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {adding ? "Adding..." : "Add to Queue"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewUrl("")
                    setNewName("")
                  }}
                  className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Queue List */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Review Queue {!loading && `(${queue.length})`}
        </h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading queue...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
            No items in queue
          </div>
        ) : (
          queue.map((item) => {
            const lastUpdated = new Date(item.statusUpdatedAt)
            const dateStr = lastUpdated.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })

            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {item.name || item.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </p>
                  {item.name && (
                    <p className="truncate text-xs text-muted-foreground">{item.url}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Updated: {dateStr}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Show "Completed" if all tasks are done, otherwise show queue status */}
                  <span
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-medium",
                      item.allTasksCompleted
                        ? statusColors["Completed"]
                        : statusColors[item.status]
                    )}
                  >
                    {item.allTasksCompleted ? "Completed" : item.status}
                  </span>

                  {/* Always show Review button so users can edit any review */}
                  <button
                    onClick={() => handleViewReview(item)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      item.allTasksCompleted
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {item.allTasksCompleted ? <Eye size={12} /> : <Play size={12} />}
                    Review
                  </button>

                  {/* Delete button for Not Started items */}
                  {item.status === "Not Started" && !item.allTasksCompleted && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="flex items-center gap-1.5 rounded-md border border-destructive/30 px-2 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                      title="Remove from queue"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
