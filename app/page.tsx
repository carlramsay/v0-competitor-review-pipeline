import { ReviewForm } from "@/components/review-form"
import { TopNav } from "@/components/top-nav"

export const dynamic = "force-dynamic"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <ReviewForm />
      </div>
    </main>
  )
}
