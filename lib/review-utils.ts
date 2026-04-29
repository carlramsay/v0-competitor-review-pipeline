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
  
  // Always calculate arousrTotal from the review's scores array
  const arousrTotal = formData.scores.reduce((sum, row) => 
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

export function buildScoresTableHTML(competitorName: string, scores: ScoreRow[]): string {
  // Calculate totals from raw scores - never hardcoded
  const competitorTotal = scores.reduce((sum, row) => 
    sum + (typeof row.competitorScore === "number" ? row.competitorScore : 0), 0
  )
  const arousrTotal = scores.reduce((sum, row) => 
    sum + (typeof row.arousrScore === "number" ? row.arousrScore : 0), 0
  )

  // Build rows from raw data
  const rows = scores.map((row, index) => {
    const bgStyle = index % 2 === 1 ? ' style="background: #2a2a2a;"' : ''
    const compScore = typeof row.competitorScore === "number" ? row.competitorScore : "N/A"
    const arousrScore = typeof row.arousrScore === "number" ? row.arousrScore : "N/A"
    return `<tr${bgStyle}><td style="border: 1px solid #555; padding: 10px;">${row.feature}</td><td style="border: 1px solid #555; padding: 10px;">${compScore}/10</td><td style="border: 1px solid #555; padding: 10px;">${arousrScore}/10</td></tr>`
  }).join("\n")

  return `
<h2 style="margin: 1.2em 0 .4em; line-height: 1.25; font-size: 1.4rem;">Final Scores Comparison</h2>
<table style="border-collapse: collapse; width: 100%; background: #222; color: #fff; margin: 1em 0;">
<tr style="background: #333;"><th style="border: 1px solid #555; padding: 10px;">Category</th><th style="border: 1px solid #555; padding: 10px;">${competitorName}</th><th style="border: 1px solid #555; padding: 10px;">Arousr</th></tr>
${rows}
<tr style="background: #444; font-weight: bold;"><td style="border: 1px solid #555; padding: 10px;">Total</td><td style="border: 1px solid #555; padding: 10px;">${competitorTotal}/80</td><td style="border: 1px solid #555; padding: 10px;">${arousrTotal}/80</td></tr>
</table>
`.trim()
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
