import { ReviewFormData, ScoreRow } from "./types"
import {
  SECTION_1_QUESTIONS,
  SECTION_2_QUESTIONS,
  SECTION_3_QUESTIONS,
  SECTION_4_QUESTIONS,
  SECTION_5_QUESTIONS,
  SECTION_6_QUESTIONS,
} from "./questions"

export function buildAnswersString(formData: ReviewFormData): string {
  const lines: string[] = []

  lines.push(`Reviewer: ${formData.reviewerName}`)
  lines.push(`Competitor: ${formData.competitorName} (${formData.competitorUrl})`)
  lines.push(`Date: ${formData.date}`)
  lines.push(`Device Used: ${formData.deviceUsed}`)
  lines.push("")

  lines.push("=== SECTION 1: Signup & Verification ===")
  SECTION_1_QUESTIONS.forEach((q) => {
    lines.push(`Q: ${q.label}`)
    lines.push(`A: ${formData[q.key as keyof ReviewFormData] || "(no answer)"}`)
    lines.push("")
  })

  lines.push("=== SECTION 2: Interface & Navigation ===")
  SECTION_2_QUESTIONS.forEach((q) => {
    lines.push(`Q: ${q.label}`)
    lines.push(`A: ${formData[q.key as keyof ReviewFormData] || "(no answer)"}`)
    lines.push("")
  })

  lines.push("=== SECTION 3: Pricing & Value ===")
  SECTION_3_QUESTIONS.forEach((q) => {
    const val = formData[q.key as keyof ReviewFormData]
    const suffix = q.key === "q11" ? " USD" : q.key === "q14" ? " minutes" : ""
    lines.push(`Q: ${q.label}`)
    lines.push(`A: ${val || "(no answer)"}${suffix}`)
    lines.push("")
  })

  lines.push("=== SECTION 4: Chat Quality & Interaction ===")
  SECTION_4_QUESTIONS.forEach((q) => {
    const val = formData[q.key as keyof ReviewFormData]
    const suffix = q.key === "q14" ? " minutes" : ""
    lines.push(`Q: ${q.label}`)
    lines.push(`A: ${val || "(no answer)"}${suffix}`)
    lines.push("")
  })

  lines.push("=== SECTION 5: Privacy & Safety ===")
  SECTION_5_QUESTIONS.forEach((q) => {
    lines.push(`Q: ${q.label}`)
    lines.push(`A: ${formData[q.key as keyof ReviewFormData] || "(no answer)"}`)
    lines.push("")
  })

  lines.push("=== SECTION 6: Overall Impression ===")
  SECTION_6_QUESTIONS.forEach((q) => {
    lines.push(`Q: ${q.label}`)
    lines.push(`A: ${formData[q.key as keyof ReviewFormData] || "(no answer)"}`)
    lines.push("")
  })

  lines.push("=== SECTION 7: Scores (out of 10) ===")
  formData.scores.forEach((row: ScoreRow) => {
    lines.push(`${row.feature}: Competitor ${row.competitorScore ?? "N/A"} | Arousr ${row.arousrScore ?? "N/A"} | Notes: ${row.notes || "—"}`)
  })
  lines.push("")

  lines.push("=== SECTION 8: Meta ===")
  lines.push(`Discovery method: ${formData.q29 || "(not specified)"}`)

  return lines.join("\n")
}

export function calcTotalScore(scores: ScoreRow[]): { competitor: number; arousr: number } {
  let competitor = 0
  let arousr = 0
  scores.forEach((row) => {
    competitor += typeof row.competitorScore === "number" ? row.competitorScore : 0
    arousr += typeof row.arousrScore === "number" ? row.arousrScore : 0
  })
  return { competitor, arousr }
}

export function defaultScores() {
  const features = [
    "Ease of Signup",
    "Interface / UX",
    "Mobile Experience",
    "Host Variety",
    "Response Time",
    "Chat Quality",
    "Pricing Transparency",
    "Privacy & Safety",
  ]
  return features.map((feature) => ({ feature, competitorScore: "" as const, arousrScore: "" as const, notes: "" }))
}
