"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { QueueItem, QueueStatus } from "@/lib/types"
import { updateQueueItemStatus, getSortedQueue } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Play, Eye } from "lucide-react"


export function ReviewQueue() {
  const router = useRouter()
  const [queue, setQueue] = useState<QueueItem[]>([])

  useEffect(() => {
    getSortedQueue().then(setQueue)
  }, [])

  async function handleStatusChange(id: string, newStatus: QueueStatus) {
    await updateQueueItemStatus(id, newStatus)
    const updated = await getSortedQueue()
    setQueue(updated)
  }

  async function handleStartReview(item: QueueItem) {
    await updateQueueItemStatus(item.id, "In Progress")
    sessionStorage.setItem("queueUrl", item.url)
    if (item.name) sessionStorage.setItem("queueName", item.name)
    router.push("/form")
  }

  function handleViewReview(item: QueueItem) {
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
                  <span
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-medium",
                      statusColors[item.status]
                    )}
                  >
                    {item.status}
                  </span>

                  {item.status === "Completed" ? (
                    <button
                      onClick={() => handleViewReview(item)}
                      className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
                    >
                      <Eye size={12} />
                      View
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartReview(item)}
                      className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Play size={12} />
                      Review
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
