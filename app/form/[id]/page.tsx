import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ReviewForm } from "@/components/review-form"
import { getReviewById } from "@/lib/supabase-store"

interface PageProps {
  params: Promise<{ id: string }>
}

async function EditFormContent({ id }: { id: string }) {
  const record = await getReviewById(id)
  
  if (!record) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-center text-3xl font-bold text-foreground">
          {record.formData.competitorName} Review
        </h1>
        <ReviewForm reviewId={id} />
      </div>
    </div>
  )
}

export default async function EditFormPage({ params }: PageProps) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <EditFormContent id={id} />
    </Suspense>
  )
}
