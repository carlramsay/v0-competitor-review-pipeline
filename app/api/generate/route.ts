import { NextRequest, NextResponse } from "next/server"

const BLOG_SYSTEM_PROMPT = `You are a content writer for Arousr.com, a human-only adult chat platform. Using the reviewer's answers below, write a competitor review blog post in Markdown format.

Follow this exact structure:

Opening line (reviewer credit):
Reviewed by **[Reviewer Name]** for Arousr.com. Test Date: [Date]. Platform Tested: [Competitor Name].

## Introduction
Brief hook about the platform being reviewed, followed by 2–3 paragraphs setting context. No table.

Then one section per review category in this order: 
## Signup and Verification
## Interface and Navigation
## Pricing and Payment
## Chat Quality and Interaction
## Privacy and Safety
## Performance and Reliability
## Overall Experience and Final Rating

Each section follows this exact pattern:
- H2 for the section title
- H3 with an emoji and a punchy subheading
- A blockquote pulling a direct quote from the reviewer's answers
- 2 paragraphs of analysis
- A comparison table with 4 columns: Category, [Competitor Name], Arousr, Notes

Use these emojis for H3 subheadings: 🔹 for neutral observations, 💳 for pricing, 💬 for chat and interaction, 🔐 for privacy and safety, ⚙️ for performance, 🎭 for overall impression.

The Overall Experience section must include this line: **Overall Rating: [total score]/80 ([percentage]/100)** — _[One-line Verdict]_ where percentage is Math.round((total score / 80) * 100).

End with an H2 labeled Conclusion: [Competitor Name] vs Arousr, followed by 2 paragraphs. The first paragraph acknowledges what the competitor does well. The second naturally positions Arousr as the stronger choice for users who want verified human hosts, without being salesy.

Use the reviewer's actual answers and direct quotes throughout. Do not invent any detail not present in the form answers. Output length: 900–1200 words.

Output Markdown only — use ## for headings, | for tables, ** for bold, > for blockquotes. Your response will be automatically converted to styled HTML. Do not output HTML, code fences, or any content before/after the Markdown.

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
