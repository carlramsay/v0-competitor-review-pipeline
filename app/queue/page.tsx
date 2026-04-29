import { TopNav } from "@/components/top-nav"
import { ReviewQueue } from "@/components/review-queue"

export default function QueuePage() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground text-balance">Review Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the queue of competitor sites to review. Click "Review" to begin a review session.
          </p>
        </div>
        <ReviewQueue />
      </main>
    </div>
  )
}
