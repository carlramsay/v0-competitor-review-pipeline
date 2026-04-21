import { NextRequest, NextResponse } from "next/server"

const BLOG_SYSTEM_PROMPT = `You are a content writer for Arousr.com, a human-only adult chat platform. Using the reviewer's answers below, write a competitor review blog post in HTML format using inline styles only — no CSS classes, no external stylesheets.

CRITICAL RULES — read these before writing a single word:

1. PRESERVE SPECIFIC DETAILS. Every number, price, named feature, and specific observation from the reviewer must appear in the post. Do not paraphrase or generalize. If the reviewer said "10 people messaged me and 3 stayed", write exactly that. If they named a price, include it. If they described something in a specific way, use their words.

2. ONLY COMPARE TO AROUSR WHEN THE REVIEWER EXPLICITLY DID SO. Do not invent Arousr comparisons. Do not add Arousr to table columns in sections where the reviewer made no comparison. If the reviewer did not mention Arousr in a section, that section's table should only cover the competitor being reviewed.

3. HIGHLIGHT SAFETY AND LEGAL RED FLAGS. If the reviewer found anything legally questionable, unsafe, or ethically concerning — age policy violations, missing company information, lack of moderation, data security issues — dedicate a prominent callout or paragraph to it. Do not bury these findings.

4. KEEP THE REVIEWER'S VOICE. The reviewer writes conversationally. Preserve phrases and observations that feel human and specific. Do not replace them with corporate or generic AI language. Phrases like "mIRC vibe", "come and go", "gives an off feeling" should survive into the post.

5. DO NOT INVENT CONTENT. If the reviewer did not test something, do not write about it. If they did not compare something to Arousr, do not create that comparison. Every claim in the post must be traceable to a specific answer in the form.

6. AROUSR MENTION: Only mention Arousr as an alternative in the conclusion paragraph. One natural mention. Not in every section. Not in every table.

7. SCORE: The SCORES section at the end of the input contains the exact scores entered by the reviewer. Use these numbers as-is in the final scores table. Do not add them up yourself. Do not change any value. The total shown is the correct total.

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

Table style: style="border-collapse: collapse; width: 100%; background: #222; color: #fff; margin: 1em 0;"
Header row style: style="background: #333;"
Alternating row style: style="background: #2a2a2a;" on every other row, none on the others.
Cell style: style="border: 1px solid #555; padding: 10px;"

The Overall Experience section must include: <p style="margin: .6em 0; color: #ddd;"><b>Overall Rating: [exact score from form]/80 ([percentage]/100)</b> — <i>[One-line Verdict]</i></p> where percentage is score divided by 80 multiplied by 100 rounded to nearest whole number.

End with an H2 labeled Conclusion: [Competitor Name] vs Arousr. Two paragraphs. First paragraph: what the competitor genuinely does well based on the reviewer's answers — be honest, do not minimize real positives. Second paragraph: one natural mention of Arousr as the stronger choice for users who want verified human hosts, without being salesy.

Do not add a Performance section unless the reviewer specifically commented on performance or reliability. Do not add any section the reviewer's answers do not support.

Output raw HTML only — no markdown, no code fences, no explanation before or after the HTML.

The post title sent to WordPress should be: [Competitor Name] Review — Is It Worth It? (2026)`

const VIDEO_SYSTEM_PROMPT = `Write a 1-minute spoken word script based on this competitor review, in a casual podcast monologue style — as if one person is talking directly to a friend who's curious whether this platform is worth trying. No visual cues, no 'as you can see', no references to anything on screen. No formatting labels, no time codes, no brackets or stage directions. The voice should feel honest and conversational, like a friend who actually tested it giving their real take. Cover: the signup ease, what chatting was actually like (response times, script detection, conversation quality), the pricing model and whether it felt fair, and your overall take on whether this is worth someone's time and money. End with a natural mention of Arouser as an alternative if they value transparency and real humans. Length: 150–170 words for natural 1-minute delivery.`

const SOCIAL_SYSTEM_PROMPT = `Based on this competitor review, produce exactly three outputs separated by the exact delimiters shown below. Follow length and tone rules strictly.

---TWEET---
A single tweet under 280 characters. Honest, punchy take.

---INSTAGRAM---
An Instagram caption of 150 words max. No hashtags. Conversational.

---REDDIT---
A Reddit-style comment in a neutral tone. No overt promotion. Reads like a genuine recommendation if someone asks about the platform. Under 200 words.`

export async function POST(req: NextRequest) {
  const { type, answers, apiKey } = await req.json()

  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key is required" }, { status: 400 })
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
