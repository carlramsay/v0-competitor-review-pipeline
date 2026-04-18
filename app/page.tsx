import { Suspense } from "react"
import { TopNav } from "@/components/top-nav"
import { ReviewForm } from "@/components/review-form"
import { DownloadQuestionnaireButton } from "@/components/download-questionnaire-button"

export default function FormPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground text-balance">New Competitor Review</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete the form below to document your review and generate content.
            </p>
          </div>
          <DownloadQuestionnaireButton />
        </div>
        <Suspense fallback={<div className="animate-pulse h-96 bg-muted/20 rounded-lg" />}>
          <ReviewForm />
        </Suspense>
      </main>
    </div>
  )
}
