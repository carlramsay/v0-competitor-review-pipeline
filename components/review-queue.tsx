"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { QueueItem, QueueStatus, TaskStatus } from "@/lib/types"
import { updateQueueItemStatus, getSortedQueue, getReviewByCompetitorName } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Play, Eye } from "lucide-react"

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

  // Fetch queue and check task completion status for each item
  async function fetchQueueWithCompletion() {
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
  }

  useEffect(() => {
    fetchQueueWithCompletion()
  }, [])

  async function handleViewReview(item: QueueItemWithCompletion) {
    // Mark as in progress if not already completed (use server action to bypass RLS)
    if (!item.allTasksCompleted && item.status !== "In Progress") {
      try {
        const { updateQueueItemStatusAction } = await import("@/app/actions/db")
        await updateQueueItemStatusAction(item.id, "In Progress")
      } catch (err) {
        console.error("Failed to update queue status:", err)
        // Continue with navigation even if status update fails
      }
    }
    sessionStorage.setItem("queueUrl", item.url)
    if (item.name) sessionStorage.setItem("queueName", item.name)
    router.push("/form")
  }

  const statusColors: Record<QueueStatus, string> = {
    "Not Started": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
    "In Progress": "bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-100",
    "Completed": "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100",
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Queue List */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Review Queue ({queue.length})</h2>
        {queue.length === 0 ? (
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
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
