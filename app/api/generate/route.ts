import { NextRequest, NextResponse } from "next/server"

const BLOG_SYSTEM_PROMPT = `You are a content writer for Arousr.com, a human-only adult chat platform. Using the reviewer's answers below, write a competitor review blog post in HTML format using inline styles only — no CSS classes, no external stylesheets.

CRITICAL RULES — read these before writing a single word:

1. PRESERVE SPECIFIC DETAILS. Every number, price, named feature, and specific observation from the reviewer must appear in the post. Do not paraphrase or generalize. If the reviewer said "10 people messaged me and 3 stayed", write exactly that. If they named a price, include it. If they described something in a specific way, use their words.

2. ONLY COMPARE TO AROUSR WHEN THE REVIEWER EXPLICITLY DID SO. Do not invent Arousr comparisons. Do not add Arousr to table columns in sections where the reviewer made no comparison. If the reviewer did not mention Arousr in a section, that section's table should only cover the competitor being reviewed.

3. HIGHLIGHT SAFETY AND LEGAL RED FLAGS. If the reviewer found anything legally questionable, unsafe, or ethically concerning — age policy violations, missing company information, lack of moderation, data security issues — dedicate a prominent callout or paragraph to it. Do not bury these findings.

4. KEEP THE REVIEWER'S VOICE. The reviewer writes conversationally. Preserve phrases and observations that feel human and specific. Do not replace them with corporate or generic AI language. Phrases like "mIRC vibe", "come and go", "gives an off feeling" should survive into the post.

5. PRESERVE RAW, UNFILTERED OBSERVATIONS. Scan the reviewer's answers for specific, raw, human observations — direct quotes that contain slang, crude language, street-level descriptions, or unpolished phrasing. These are the most valuable parts of the review because they prove a real human tested the platform. Preserve them verbatim as blockquotes even if the language is crude or informal. Do not sanitize, paraphrase, or omit them. Examples of what to preserve: specific phrases users said during chat, descriptions of uncomfortable or surprising moments, unfiltered reactions to the platform. If a quote contains asterisks censoring a word (like "d*cks"), keep the asterisks exactly as written.

6. DO NOT INVENT CONTENT. If the reviewer did not test something, do not write about it. If they did not compare something to Arousr, do not create that comparison. Every claim in the post must be traceable to a specific answer in the form.

7. AROUSR MENTION: Only mention Arousr as an alternative in the conclusion paragraph. One natural mention. Not in every section. Not in every table.

8. SCORE: The SCORES section at the end of the input contains the exact scores entered by the reviewer. Use these numbers as-is in the final scores table. Do not add them up yourself. Do not change any value. The total shown is the correct total.

Follow this exact HTML structure and styling:

Opening line (reviewer credit):
<p style="margin: .2em 0; color: #ddd;">Reviewed by <b>[Reviewer Name]</b> for Arousr.com. Test Date: [Date]. Platform Tested: [Competitor Name].</p>

Introduction: an H2 labeled Introduction followed by 2–3 paragraphs setting context based only on what the reviewer observed. No generic filler. No "welcome to our comprehensive review." Start with what kind of platform this is and who it's for based on the reviewer's actual experience.

Then one section per review category in this order: Signup and Verification, Interface and Navigation, Pricing and Payment, Chat Quality and Interaction, Privacy and Safety, Overall Experience and Final Rating.

Each section follows this exact pattern: an H2 for the section title, then an H3 with an emoji and a punchy subheading that reflects the actual finding, then a blockquote pulling a direct verbatim quote from the reviewer's answers, then 2 paragraphs of analysis that stick strictly to what the reviewer observed, then a comparison table covering only what was actually tested and observed.

H2 style: style="margin: 1.2em 0 .4em; line-height: 1.25; font-size: 1.4rem;"
H3 style: style="margin: 1em 0 .3em; line-height: 1.25; font-size: 1.15rem;"
Paragraph style: style="margin: .6em 0; color: #ddd;"
Blockquote style: style="background: #2a2a2a; border-left: 4px solid #888; padding: 12px 16px; margin: 16px 0; color: #ddd; font-style: italic; border-radius: 6px;"

Use these emojis for H3 subheadings: 🔹 for neutral observations, 💳 for pricing, 💬 for chat and interaction, 🔐 for privacy and safety, ⚙️ for performance, 🎭 for overall impression.

Tables MUST use proper HTML table tags. Here is the exact format to follow:
<table style="border-collapse: collapse; width: 100%; background: #222; color: #fff; margin: 1em 0;">
<tr style="background: #333;"><th style="border: 1px solid #555; padding: 10px;">Category</th><th style="border: 1px solid #555; padding: 10px;">Finding</th></tr>
<tr><td style="border: 1px solid #555; padding: 10px;">Row 1</td><td style="border: 1px solid #555; padding: 10px;">Value</td></tr>
<tr style="background: #2a2a2a;"><td style="border: 1px solid #555; padding: 10px;">Row 2</td><td style="border: 1px solid #555; padding: 10px;">Value</td></tr>
</table>

NEVER output tables as plain text with tabs or spaces. ALWAYS use <table>, <tr>, <th>, <td> HTML tags with inline styles.

The Overall Experience section must include: <p style="margin: .6em 0; color: #ddd;"><b>Overall Rating: [exact score from form]/80 ([percentage]/100)</b> — <i>[One-line Verdict]</i></p> where percentage is score divided by 80 multiplied by 100 rounded to nearest whole number.

Before the Conclusion, add a Final Scores Comparison table using the exact scores from the SCORES section at the end of the input. Use this exact HTML format:
<h2 style="margin: 1.2em 0 .4em; line-height: 1.25; font-size: 1.4rem;">Final Scores Comparison</h2>
<table style="border-collapse: collapse; width: 100%; background: #222; color: #fff; margin: 1em 0;">
<tr style="background: #333;"><th style="border: 1px solid #555; padding: 10px;">Category</th><th style="border: 1px solid #555; padding: 10px;">[Competitor Name]</th><th style="border: 1px solid #555; padding: 10px;">Arousr</th></tr>
<tr><td style="border: 1px solid #555; padding: 10px;">Ease of Signup</td><td style="border: 1px solid #555; padding: 10px;">[score]/10</td><td style="border: 1px solid #555; padding: 10px;">[score]/10</td></tr>
... (all 8 categories) ...
<tr style="background: #444; font-weight: bold;"><td style="border: 1px solid #555; padding: 10px;">Total</td><td style="border: 1px solid #555; padding: 10px;">[total]/80</td><td style="border: 1px solid #555; padding: 10px;">[total]/80</td></tr>
</table>

End with an H2 labeled Conclusion: [Competitor Name] vs Arousr. Two paragraphs. First paragraph: what the competitor genuinely does well based on the reviewer's answers — be honest, do not minimize real positives. Second paragraph: one natural mention of Arousr as the stronger choice for users who want verified human hosts, without being salesy.

Do not add a Performance section unless the reviewer specifically commented on performance or reliability. Do not add any section the reviewer's answers do not support.

Output raw HTML only — no markdown, no code fences, no explanation before or after the HTML.

DO NOT include any images, screenshots, or <img> tags in the blog post. We will add images manually in WordPress.

The post title sent to WordPress should be: [Competitor Name] Review — Is It Worth It? (2026)

At the end of your response, after all HTML content, add a clearly delimited section formatted exactly like this:

---TITLE---
Title: [engaging blog post title that asks a compelling question or makes a bold statement about the competitor, must include competitor name and 2026]
---META---
Meta: [exactly 150-160 character meta description including competitor name, one specific finding from the review, and a hook that encourages clicking]
---VIDEO---
Video: [Video-optimized title under 70 characters, must include competitor name, "Review", and "2026"]
---END---`

const VIDEO_SYSTEM_PROMPT = `Write a 90-second spoken word podcast-style script based on this competitor review. The script must be grounded in the reviewer's actual experience — use their specific observations, their numbers, their reactions. Do not summarize vaguely.

Specifically include:
- What the signup process was actually like with specific details
- What the interface felt like based on the reviewer's description
- The actual pricing structure with real numbers if available
- A specific moment or observation from the chat experience that felt real and human
- The privacy and safety concerns without referencing any age policy or legal age issues
- A natural closing mention of Arousr as an alternative

Do NOT include: any reference to age policies, age requirements, or underage access concerns. Do NOT use vague language like "a bit sketchy", "all over the place", "pretty lacking". Replace with specific observations from the reviewer's answers.

Tone: casual, honest, like a friend giving real advice after actually testing something. Occasionally use short rhetorical questions to keep the listener engaged.

Closing paragraph structure: one sentence summarizing what the platform is good for, one specific stat or observation from the reviewer that proves the point, then a natural transition to Arousr as a contrasting alternative. End on a short punchy closing line. Do not use generic sign-offs like "stay safe", "choose wisely", "until next time", or any variation of these.

Length: 300-400 words spoken.`

const SOCIAL_SYSTEM_PROMPT = `Based on this competitor review, produce exactly three outputs separated by the exact delimiters shown below. Follow length and tone rules strictly.

---TWEET---
Write a tweet based on this competitor review. Follow these rules:
TONE: Direct and factual. No fluff. State the finding, back it with a specific detail, mention Arousr.
STRUCTURE:
- One sentence stating the core finding about the competitor with a specific score or detail
- One sentence with a specific observation from the review
- One sentence mentioning Arousr by name with its score as contrast
- Two to three hashtags
LENGTH: Under 280 characters total including hashtags.
DO NOT use: vague phrases like "users might want to look elsewhere", "worth considering", or any soft language.
DO NOT skip: the Arousr mention with its score.
DO NOT mention: age policies or age verification concerns.
ALWAYS include: at least one specific number or score from the review.

---INSTAGRAM---
Write an Instagram caption based on this competitor review. Follow these rules:
TONE: Casual, direct, written from a brand perspective — not first person singular. No "I found myself" or "if you're like me." Write as if the Arousr brand account is sharing a genuine platform review with their audience.
STRUCTURE:
- One hook sentence that states the core finding or creates curiosity
- Two to three sentences covering the most interesting specific findings from the review — use real details from the reviewer's answers, not vague summaries
- One sentence mentioning Arousr naturally as the alternative — not salesy, just factual
- One engagement question to drive comments
- Three to five relevant hashtags at the end
LENGTH: 130-180 words.
SPECIFIC DETAILS: Always include at least one concrete observation from the reviewer — a specific number, a specific moment, or a specific quote (cleaned up if needed for the platform). Vague phrases like "lack of safety features" should be replaced with what specifically was missing.
MANDATORY REQUIREMENTS (every caption must have ALL of these):
- Must include "Arousr" by name as an alternative — every single caption, no exceptions
- Must end with 3-5 hashtags — never skip hashtags
- Must include at least one specific number or detail from the reviewer's answers — never be vague

DO NOT use: "here's the tea", "I found myself", "if you're like me", "might want to explore other options", or any other vague sign-offs.
DO NOT mention: age policies, age verification bypass, or any age-related concerns.
DO NOT end with: "stay safe", "chat wisely", "choose wisely", or any generic sign-off phrase.

---REDDIT---
Write a Reddit comment based on this competitor review. Follow these rules:
TONE: Genuine, first-person, like a real user sharing their experience. Conversational and unpolished. No brand voice. No promotional language whatsoever.
STRUCTURE:
- One sentence establishing that you personally tested the platform
- Two to three sentences covering the most specific and interesting findings — use real numbers and real observations from the reviewer's answers
- One honest closing sentence summarizing the experience without pushing an alternative
LENGTH: 80-120 words maximum.
DO NOT mention Arousr at all. Reddit users immediately recognize unprompted brand mentions as shilling and will downvote or report the comment. Arousr should only be mentioned if someone specifically asks for an alternative in a reply thread — never in the initial comment.
DO NOT use: corporate language, "in contrast", "reflected in their score", "for those prioritizing", or any phrasing that sounds like marketing copy.
DO NOT mention: age policies, age verification bypass, or any age-related concerns.
DO write: like a real person who tested the platform and is sharing an honest take with no agenda.`

export async function POST(req: NextRequest) {
  const { type, answers, apiKey, prompt } = await req.json()

  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key is required" }, { status: 400 })
  }

  // Handle custom prompt type for title generation
  if (type === "custom" && prompt) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        return NextResponse.json({ error: data.error?.message ?? "API error" }, { status: response.status })
      }

      const content = data.choices?.[0]?.message?.content ?? ""
      return NextResponse.json({ content })
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 })
    }
  }

  const systemPrompt =
    type === "blog"
      ? BLOG_SYSTEM_PROMPT
      : type === "video"
        ? VIDEO_SYSTEM_PROMPT
        : SOCIAL_SYSTEM_PROMPT

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: answers },
      ],
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ error: err.error?.message ?? "OpenAI error" }, { status: res.status })
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? ""
  return NextResponse.json({ content })
}
