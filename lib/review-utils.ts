import { ReviewFormData, ScoreRow, ArousrScores } from "./types"
import {
  SECTION_1_QUESTIONS,
  SECTION_2_QUESTIONS,
  SECTION_3_QUESTIONS,
  SECTION_4_QUESTIONS,
  SECTION_5_QUESTIONS,
  SECTION_6_QUESTIONS,
} from "./questions"

export function buildAnswersString(formData: ReviewFormData, arousrBenchmark?: ArousrScores): string {
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
  lines.push("")

  // Calculate competitor total from review scores
  const competitorTotal = formData.scores.reduce((sum, row) => 
    sum + (typeof row.competitorScore === "number" ? row.competitorScore : 0), 0
  )
  
  // Use Arousr benchmark from settings if provided, otherwise fall back to per-review scores
  const arousrTotal = arousrBenchmark?.total ?? formData.scores.reduce((sum, row) => 
    sum + (typeof row.arousrScore === "number" ? row.arousrScore : 0), 0
  )
  
  // Calculate gap (in code, not by GPT-4o)
  const scoreGap = arousrTotal - competitorTotal
  
  // Build structured SCORES section for GPT-4o
  lines.push("=== SCORES (use these exact numbers — do not change, recalculate, or omit any of them) ===")
  
  // Map feature names to competitor scores from review
  const scoreMap: Record<string, number | ""> = {}
  formData.scores.forEach((row) => {
    scoreMap[row.feature] = row.competitorScore
  })
  
  const getCompetitorScore = (feature: string) => {
    const val = scoreMap[feature]
    return typeof val === "number" ? val : "N/A"
  }
  
  // Use Arousr benchmark scores from settings if available
  const getArousrScore = (key: keyof Omit<ArousrScores, 'total'>, fallbackFeature: string) => {
    if (arousrBenchmark && typeof arousrBenchmark[key] === "number") {
      return arousrBenchmark[key]
    }
    // Fallback to per-review score
    const row = formData.scores.find(r => r.feature === fallbackFeature)
    return typeof row?.arousrScore === "number" ? row.arousrScore : "N/A"
  }
  
  lines.push(`Ease of Signup: ${getCompetitorScore("Ease of Signup")}/10 (Arousr: ${getArousrScore("ease_of_signup", "Ease of Signup")}/10)`)
  lines.push(`Interface / UX: ${getCompetitorScore("Interface / UX")}/10 (Arousr: ${getArousrScore("interface_ux", "Interface / UX")}/10)`)
  lines.push(`Mobile Experience: ${getCompetitorScore("Mobile Experience")}/10 (Arousr: ${getArousrScore("mobile_experience", "Mobile Experience")}/10)`)
  lines.push(`Host Variety: ${getCompetitorScore("Host Variety")}/10 (Arousr: ${getArousrScore("host_variety", "Host Variety")}/10)`)
  lines.push(`Response Time: ${getCompetitorScore("Response Time")}/10 (Arousr: ${getArousrScore("response_time", "Response Time")}/10)`)
  lines.push(`Chat Quality: ${getCompetitorScore("Chat Quality")}/10 (Arousr: ${getArousrScore("chat_quality", "Chat Quality")}/10)`)
  lines.push(`Pricing Transparency: ${getCompetitorScore("Pricing Transparency")}/10 (Arousr: ${getArousrScore("pricing_transparency", "Pricing Transparency")}/10)`)
  lines.push(`Privacy & Safety: ${getCompetitorScore("Privacy & Safety")}/10 (Arousr: ${getArousrScore("privacy_safety", "Privacy & Safety")}/10)`)
  lines.push(`Total: ${competitorTotal}/80 (Arousr: ${arousrTotal}/80)`)
  lines.push(`Score Gap: Arousr leads by ${scoreGap} points`)

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
