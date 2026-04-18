import { NextRequest, NextResponse } from "next/server"

interface ScoreRow {
  feature: string
  competitorScore: number | ""
  arousrScore: number | ""
}

interface FormData {
  reviewerName?: string
  competitorName?: string
  competitorUrl?: string
  oneLineVerdict?: string
  scores?: ScoreRow[]
}

function buildSchemaMarkup(formData: FormData): string {
  const totalScore = (formData.scores ?? []).reduce((sum, row) => {
    const val = typeof row.competitorScore === "number" ? row.competitorScore : 0
    return sum + val
  }, 0)

  const schema = {
    "@context": "https://schema.org",
    "@type": "Review",
    "name": `Review: ${formData.competitorName || "Competitor"} — Is It Worth It? (2026)`,
    "reviewBody": formData.oneLineVerdict || "",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": String(totalScore),
      "bestRating": "80",
      "worstRating": "0",
    },
    "author": {
      "@type": "Person",
      "name": formData.reviewerName || "Anonymous",
    },
    "itemReviewed": {
      "@type": "Product",
      "name": formData.competitorName || "Competitor",
      "url": formData.competitorUrl || "",
    },
  }
  return `\n\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`
}

export async function POST(req: NextRequest) {
  const { siteUrl, username, appPassword, title, content, formData } = await req.json()

  if (!siteUrl || !username || !appPassword) {
    return NextResponse.json({ error: "WordPress credentials are required" }, { status: 400 })
  }

  const base = siteUrl.replace(/\/$/, "")
  const endpoint = `${base}/wp-json/wp/v2/posts`
  const credentials = Buffer.from(`${username}:${appPassword}`).toString("base64")

  // Append schema markup to content
  const contentWithSchema = content + buildSchemaMarkup(formData || {})

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      title,
      content: contentWithSchema,
      status: "draft",
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: err.message ?? "WordPress API error" }, { status: res.status })
  }

  const post = await res.json()
  const editUrl = `${base}/wp-admin/post.php?post=${post.id}&action=edit`
  return NextResponse.json({ id: post.id, link: post.link, editUrl })
}
