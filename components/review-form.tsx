"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FormSection, FormField } from "./form-section"
import { ReviewFormData } from "@/lib/types"
import { saveReview, saveDraft, getDraft, clearDraft } from "@/lib/store"
import { defaultScores, calcTotalScore } from "@/lib/review-utils"
import {
  SECTION_1_QUESTIONS,
  SECTION_2_QUESTIONS,
  SECTION_3_QUESTIONS,
  SECTION_4_QUESTIONS,
  SECTION_5_QUESTIONS,
  SECTION_6_QUESTIONS,
  DISCOVERY_OPTIONS,
} from "@/lib/questions"
import { cn } from "@/lib/utils"
import { Save, RotateCcw, Check } from "lucide-react"

const inputClass =
  "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
const textareaClass = cn(inputClass, "resize-y min-h-[80px] leading-relaxed")

function emptyForm(): ReviewFormData {
  return {
    reviewerName: "",
    competitorName: "",
    competitorUrl: "",
    date: new Date().toISOString().slice(0, 10),
    deviceUsed: "Desktop",
    q1: "", q2: "", q3: "", q4: "", q5: "",
    q6: "", q7: "", q8: "", q9: "",
    q10: "", q11: "", q12: "", q13: "",
    q14: "", q15: "", q16: "", q17: "", q18: "", q19: "",
    q20: "", q21: "", q22: "", q23: "",
    q24: "", q25: "", q26: "", q27: "", q28: "",
    scores: defaultScores(),
    q29: "",
    q30: "Do NOT include screenshots of the competitor's interface or logos. Describe what you saw in writing only.",
  }
}

interface Props {
  initialData?: ReviewFormData
  reviewId?: string
}

export function ReviewForm({ initialData, reviewId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState<ReviewFormData>(initialData ?? emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [savedDraft, setSavedDraft] = useState<{ formData: ReviewFormData; savedAt: string } | null>(null)
  const [saveConfirmed, setSaveConfirmed] = useState(false)

  // Detect saved draft on mount (only for new forms, not edits)
  useEffect(() => {
    if (!initialData) {
      const draft = getDraft()
      if (draft) setSavedDraft(draft)
    }
  }, [initialData])

  // Pre-fill URL and competitor name from queue or query params
  useEffect(() => {
    const queueUrl = sessionStorage.getItem("queueUrl")
    const queueName = sessionStorage.getItem("queueName")
    const paramUrl = searchParams.get("url")
    const urlToUse = queueUrl || paramUrl

    if (urlToUse || queueName) {
      setForm((prev) => ({
        ...prev,
        competitorUrl: urlToUse || prev.competitorUrl,
        competitorName: queueName || prev.competitorName,
      }))
      // Clear the session storage so it doesn't auto-fill on other visits
      if (queueUrl) {
        sessionStorage.removeItem("queueUrl")
      }
      if (queueName) {
        sessionStorage.removeItem("queueName")
      }
    }
  }, [searchParams])

  function handleSaveProgress() {
    saveDraft(form)
    setSaveConfirmed(true)
    setTimeout(() => setSaveConfirmed(false), 2000)
  }

  function handleRestoreDraft() {
    if (savedDraft) {
      setForm(savedDraft.formData)
      setSavedDraft(null)
    }
  }

  function handleDismissDraft() {
    clearDraft()
    setSavedDraft(null)
  }

  function set(key: keyof ReviewFormData, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function setScore(index: number, field: "competitorScore" | "arousrScore" | "notes", value: string) {
    setForm((prev) => {
      const scores = [...prev.scores]
      if (field === "notes") {
        scores[index] = { ...scores[index], notes: value }
      } else {
        const num = value === "" ? "" : Math.min(10, Math.max(0, Number(value)))
        scores[index] = { ...scores[index], [field]: num }
      }
      return { ...prev, scores }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const id = reviewId ?? crypto.randomUUID()
    saveReview({ id, submittedAt: new Date().toISOString(), formData: form, generated: {} })
    clearDraft()
    router.push(`/generate/${id}`)
  }

  const { competitor: compTotal, arousr: arousrTotal } = calcTotalScore(form.scores)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Draft restore banner */}
      {savedDraft && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-400">You have a saved draft</p>
            <p className="text-xs text-muted-foreground">
              Last saved {new Date(savedDraft.savedAt).toLocaleString()} —{" "}
              {savedDraft.formData.competitorName
                ? `${savedDraft.formData.competitorName} review`
                : "unnamed review"}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-400"
            >
              <RotateCcw size={12} />
              Restore
            </button>
            <button
              type="button"
              onClick={handleDismissDraft}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header fields */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Review Details
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Reviewer Name" required>
            <input
              className={inputClass}
              value={form.reviewerName}
              onChange={(e) => set("reviewerName", e.target.value)}
              placeholder="Your name"
              required
            />
          </FormField>
          <FormField label="Competitor Name" required>
            <input
              className={inputClass}
              value={form.competitorName}
              onChange={(e) => set("competitorName", e.target.value)}
              placeholder="e.g. ChatSomething"
              required
            />
          </FormField>
          <FormField label="Competitor URL">
            <input
              className={inputClass}
              value={form.competitorUrl}
              onChange={(e) => set("competitorUrl", e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </FormField>
          <FormField label="Date" required>
            <input
              className={inputClass}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              type="date"
              required
            />
          </FormField>
          <FormField label="Device Used">
            <div className="flex gap-2">
              {(["Mobile", "Desktop", "Both"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("deviceUsed", d)}
                  className={cn(
                    "flex-1 rounded-md border py-2 text-sm font-medium transition-colors",
                    form.deviceUsed === d
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </FormField>
        </div>
      </div>

      {/* Section 1 */}
      <FormSection title="Signup &amp; Verification" sectionNumber={1} defaultOpen>
        {SECTION_1_QUESTIONS.map((q) => (
          <FormField key={q.key} label={q.label}>
            <textarea
              className={textareaClass}
              value={form[q.key as keyof ReviewFormData] as string}
              onChange={(e) => set(q.key as keyof ReviewFormData, e.target.value)}
              placeholder="Your observations..."
            />
          </FormField>
        ))}
      </FormSection>

      {/* Section 2 */}
      <FormSection title="Interface &amp; Navigation" sectionNumber={2}>
        {SECTION_2_QUESTIONS.map((q) => (
          <FormField key={q.key} label={q.label}>
            <textarea
              className={textareaClass}
              value={form[q.key as keyof ReviewFormData] as string}
              onChange={(e) => set(q.key as keyof ReviewFormData, e.target.value)}
              placeholder="Your observations..."
            />
          </FormField>
        ))}
      </FormSection>

      {/* Section 3 */}
      <FormSection title="Pricing &amp; Value" sectionNumber={3}>
        {SECTION_3_QUESTIONS.map((q) => (
          <FormField key={q.key} label={q.label}>
            {q.type === "number" ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  className={cn(inputClass, "w-32")}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form[q.key as keyof ReviewFormData] as string}
                  onChange={(e) => set(q.key as keyof ReviewFormData, e.target.value)}
                  placeholder="0.00"
                />
              </div>
            ) : (
              <textarea
                className={textareaClass}
                value={form[q.key as keyof ReviewFormData] as string}
                onChange={(e) => set(q.key as keyof ReviewFormData, e.target.value)}
                placeholder="Your observations..."
              />
            )}
          </FormField>
        ))}
      </FormSection>

      {/* Section 4 */}
      <FormSection title="Chat Quality &amp; Interaction" sectionNumber={4}>
        {SECTION_4_QUESTIONS.map((q) => (
          <FormField key={q.key} label={q.label}>
            {q.type === "number" ? (
              <div className="flex items-center gap-2">
                <input
                  className={cn(inputClass, "w-32")}
                  type="number"
                  min="0"
                  step="0.5"
                  value={form[q.key as keyof ReviewFormData] as string}
                  onChange={(e) => set(q.key as keyof ReviewFormData, e.target.value)}
                  placeholder="0"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            ) : (
              <textarea
                className={textareaClass}
                value={form[q.key as keyof ReviewFormData] as string}
                onChange={(e) => set(q.key as keyof ReviewFormData, e.target.value)}
                placeholder="Your observations..."
              />
            )}
          </FormField>
        ))}
      </FormSection>

      {/* Section 5 */}
      <FormSection title="Privacy &amp; Safety" sectionNumber={5}>
        {SECTION_5_QUESTIONS.map((q) => (
          <FormField key={q.key} label={q.label}>
            <textarea
              className={textareaClass}
              value={form[q.key as keyof ReviewFormData] as string}
              onChange={(e) => set(q.key as keyof ReviewFormData, e.target.value)}
              placeholder="Your observations..."
            />
          </FormField>
        ))}
      </FormSection>

      {/* Section 6 */}
      <FormSection title="Overall Impression" sectionNumber={6}>
        {SECTION_6_QUESTIONS.map((q) => (
          <FormField key={q.key} label={q.label}>
            <textarea
              className={textareaClass}
              value={form[q.key as keyof ReviewFormData] as string}
              onChange={(e) => set(q.key as keyof ReviewFormData, e.target.value)}
              placeholder="Your observations..."
            />
          </FormField>
        ))}
      </FormSection>

      {/* Section 7 — Scores */}
      <FormSection title="Scores" sectionNumber={7}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Feature</th>
                <th className="pb-2 text-center text-xs font-medium text-muted-foreground">
                  {form.competitorName || "Competitor"} /10
                </th>
                <th className="pb-2 text-center text-xs font-medium text-muted-foreground">Arousr /10</th>
                <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Notes</th>
              </tr>
            </thead>
            <tbody>
              {form.scores.map((row, i) => (
                <tr key={row.feature} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-4 font-medium text-foreground">{row.feature}</td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      className={cn(inputClass, "w-16 text-center")}
                      value={row.competitorScore}
                      onChange={(e) => setScore(i, "competitorScore", e.target.value)}
                      placeholder="—"
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      className={cn(inputClass, "w-16 text-center")}
                      value={row.arousrScore}
                      onChange={(e) => setScore(i, "arousrScore", e.target.value)}
                      placeholder="—"
                    />
                  </td>
                  <td className="py-2 pl-2">
                    <input
                      type="text"
                      className={inputClass}
                      value={row.notes}
                      onChange={(e) => setScore(i, "notes", e.target.value)}
                      placeholder="Optional notes"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td className="pt-3 font-semibold text-foreground">Total</td>
                <td className="pt-3 text-center font-semibold text-primary">{compTotal} / 80</td>
                <td className="pt-3 text-center font-semibold text-primary">{arousrTotal} / 80</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </FormSection>

      {/* Section 8 — Meta */}
      <FormSection title="Meta" sectionNumber={8}>
        <FormField label="How did you discover this competitor?">
          <select
            className={inputClass}
            value={form.q29}
            onChange={(e) => set("q29", e.target.value)}
          >
            <option value="">Select...</option>
            {DISCOVERY_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </FormField>
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-sm font-medium text-amber-400">{form.q30}</p>
        </div>
      </FormSection>

      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={handleSaveProgress}
          className="flex items-center justify-center gap-2 rounded-md border border-border bg-secondary px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
        >
          {saveConfirmed ? (
            <>
              <Check size={15} className="text-green-400" />
              <span className="text-green-400">Saved</span>
            </>
          ) : (
            <>
              <Save size={15} />
              Save Progress
            </>
          )}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Submit Review"}
        </button>
      </div>
    </form>
  )
}
