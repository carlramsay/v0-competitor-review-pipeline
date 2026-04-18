"use client"

import { Download } from "lucide-react"
import {
  SECTION_1_QUESTIONS,
  SECTION_2_QUESTIONS,
  SECTION_3_QUESTIONS,
  SECTION_4_QUESTIONS,
  SECTION_5_QUESTIONS,
  SECTION_6_QUESTIONS,
  SCORE_FEATURES,
} from "@/lib/questions"

const SECTIONS = [
  { title: "Section 1: Signup & Verification", questions: SECTION_1_QUESTIONS },
  { title: "Section 2: Interface & Navigation", questions: SECTION_2_QUESTIONS },
  { title: "Section 3: Pricing & Value", questions: SECTION_3_QUESTIONS },
  { title: "Section 4: Chat Quality", questions: SECTION_4_QUESTIONS },
  { title: "Section 5: Privacy & Safety", questions: SECTION_5_QUESTIONS },
  { title: "Section 6: Overall Impression", questions: SECTION_6_QUESTIONS },
]

// Arousr benchmark scores for comparison
const AROUSR_SCORES: Record<string, number> = {
  "Ease of Signup": 9,
  "Interface / UX": 8,
  "Mobile Experience": 9,
  "Host Variety": 9,
  "Response Time": 8,
  "Chat Quality": 8,
  "Pricing Transparency": 9,
  "Privacy & Safety": 8,
}

function escapeRtf(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\n/g, "\\line ")
}

function buildRtfQuestionnaire(): string {
  const rtf: string[] = []
  
  // RTF header with font table
  rtf.push("{\\rtf1\\ansi\\deff0")
  rtf.push("{\\fonttbl{\\f0\\fswiss\\fcharset0 Arial;}{\\f1\\fmodern\\fcharset0 Courier New;}}")
  rtf.push("{\\colortbl;\\red0\\green0\\blue0;\\red100\\green100\\blue100;\\red51\\green51\\blue51;}")
  rtf.push("\\viewkind4\\uc1\\pard\\f0\\fs24")
  rtf.push("\\par")

  // Title - centered, bold, large
  rtf.push("\\pard\\qc\\b\\fs36 COMPETITOR REVIEW QUESTIONNAIRE\\b0\\par")
  rtf.push("\\fs24 Arousr.com \\emdash  Competitor Research Program\\par")
  rtf.push("\\pard\\par")

  // Reviewer Details section
  rtf.push("\\b\\fs28 REVIEWER DETAILS\\b0\\fs24\\par")
  rtf.push("\\pard\\li360")
  rtf.push("\\par")
  rtf.push("\\b Reviewer Name:\\b0\\tab _____________________________________\\par")
  rtf.push("\\b Competitor Name:\\b0\\tab _____________________________________\\par")
  rtf.push("\\b Competitor URL:\\b0\\tab _____________________________________\\par")
  rtf.push("\\b Date:\\b0\\tab\\tab\\tab _____________________________________\\par")
  rtf.push("\\par")
  rtf.push("\\b Device Used:\\b0\\tab\\tab \\u9744  Mobile\\tab \\u9744  Desktop\\tab \\u9744  Both\\par")
  rtf.push("\\b How Discovered:\\b0\\tab \\u9744  Google\\tab \\u9744  ChatGPT/Perplexity\\tab \\u9744  Word of mouth\\tab \\u9744  Other\\par")
  rtf.push("\\pard\\par\\par")

  // Questions sections
  let questionNumber = 1

  for (const section of SECTIONS) {
    rtf.push(`\\b\\fs28 ${escapeRtf(section.title.toUpperCase())}\\b0\\fs24\\par`)
    rtf.push("\\pard\\li360")
    rtf.push("\\par")

    // Add Overall Rating and One-line Verdict at the top of Section 6
    if (section.title.includes("Overall Impression")) {
      rtf.push(`\\b ${questionNumber}.\\b0  Overall Rating (out of 10) \\b [REQUIRED]\\b0\\par`)
      rtf.push("\\par\\tab Answer: ______ / 10\\par")
      rtf.push("\\par")
      questionNumber++

      rtf.push(`\\b ${questionNumber}.\\b0  One-line Verdict \\b [REQUIRED]\\b0\\par`)
      rtf.push("\\par\\tab (Example: Good for casual users but pricing is misleading and mobile experience needs work.)\\par")
      rtf.push("\\tab Answer:\\par")
      rtf.push("\\tab _________________________________________________________________\\par")
      rtf.push("\\par")
      questionNumber++
    }

    for (const q of section.questions) {
      rtf.push(`\\b ${questionNumber}.\\b0  ${escapeRtf(q.label)}\\par`)
      if (q.type === "number") {
        rtf.push("\\par\\tab Answer: ____________________\\par")
      } else {
        rtf.push("\\par\\tab Answer:\\par")
        rtf.push("\\tab _________________________________________________________________\\par")
        rtf.push("\\tab _________________________________________________________________\\par")
        rtf.push("\\tab _________________________________________________________________\\par")
      }
      rtf.push("\\par")
      questionNumber++
    }

    rtf.push("\\pard\\par")
  }

  // Scores section with comparison table
  rtf.push("\\b\\fs28 SCORES\\b0\\fs24\\par")
  rtf.push("\\pard\\par")
  rtf.push("\\i Rate each feature out of 10. Arousr benchmark scores are provided for comparison.\\i0\\par")
  rtf.push("\\par")

  // Create RTF table for scores
  rtf.push("\\trowd\\trgaph108\\trleft-108")
  rtf.push("\\cellx4000\\cellx6000\\cellx8000") // Column widths
  
  // Header row
  rtf.push("\\pard\\intbl\\b Feature\\cell Competitor\\cell Arousr\\cell\\b0\\row")

  // Score rows
  for (const feature of SCORE_FEATURES) {
    const arousrScore = AROUSR_SCORES[feature] ?? "-"
    rtf.push("\\trowd\\trgaph108\\trleft-108")
    rtf.push("\\cellx4000\\cellx6000\\cellx8000")
    rtf.push(`\\pard\\intbl ${escapeRtf(feature)}\\cell ____ / 10\\cell ${arousrScore} / 10\\cell\\row`)
  }

  // Total row
  const arousrTotal = SCORE_FEATURES.reduce((sum, f) => sum + (AROUSR_SCORES[f] ?? 0), 0)
  rtf.push("\\trowd\\trgaph108\\trleft-108")
  rtf.push("\\cellx4000\\cellx6000\\cellx8000")
  rtf.push(`\\pard\\intbl\\b Overall / Total\\cell ____ / ${SCORE_FEATURES.length * 10}\\cell ${arousrTotal} / ${SCORE_FEATURES.length * 10}\\cell\\b0\\row`)

  rtf.push("\\pard\\par\\par")

  // Footer
  rtf.push("\\pard\\qc\\i Please return completed questionnaire to your team lead.\\i0\\par")

  // Close RTF
  rtf.push("}")

  return rtf.join("\n")
}

export function DownloadQuestionnaireButton() {
  function handleDownload() {
    try {
      const content = buildRtfQuestionnaire()
      const blob = new Blob([content], { type: "application/rtf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "arousr-competitor-review-questionnaire.rtf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] Download failed:", error)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
    >
      <Download size={14} />
      Download Questionnaire
    </button>
  )
}
