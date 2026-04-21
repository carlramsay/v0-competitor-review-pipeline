export function convertMarkdownToStyledHTML(md: string): string {
  // Strip code fences from GPT-4o output
  const cleaned = md
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  // If content is already HTML (starts with < tag), return it wrapped in a styled div
  if (cleaned.startsWith('<')) {
    return `<div style="color: #eee; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;">\n${cleaned}\n</div>`
  }

  const sectionEmojis: Record<string, string> = {
    introduction: "📋",
    signup: "🔹",
    verification: "🔹",
    interface: "🔹",
    navigation: "🔹",
    pricing: "💳",
    payment: "💳",
    value: "💳",
    chat: "💬",
    quality: "💬",
    interaction: "💬",
    privacy: "🔐",
    safety: "🔐",
    performance: "⚙️",
    reliability: "⚙️",
    overall: "🎭",
    impression: "🎭",
    conclusion: "📝",
  }

  function getEmoji(title: string): string {
    const lower = title.toLowerCase()
    for (const [key, emoji] of Object.entries(sectionEmojis)) {
      if (lower.includes(key)) return emoji
    }
    return "🔹"
  }

  function processInline(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
  }

  const lines = cleaned.split("\n")
  const parts: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith("## ")) {
      const title = line.slice(3).trim()
      parts.push(
        `<h2 style="margin: 1.2em 0 .4em; line-height: 1.25; font-size: 1.4rem;"><b>${getEmoji(title)} ${title}</b></h2>`
      )
      i++
      continue
    }

    if (line.startsWith("### ")) {
      const title = line.slice(4).trim()
      parts.push(
        `<h3 style="margin: 1em 0 .3em; line-height: 1.25; font-size: 1.15rem;"><b>${getEmoji(title)} ${title}</b></h3>`
      )
      i++
      continue
    }

    if (line.startsWith("> ")) {
      parts.push(
        `<blockquote style="background: #2a2a2a; border-left: 4px solid #888; padding: 12px 16px; margin: 16px 0; color: #ddd; font-style: italic; border-radius: 6px;">"${processInline(line.slice(2).trim())}"</blockquote>`
      )
      i++
      continue
    }

    if (line.startsWith("|")) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i])
        i++
      }
      const filtered = tableLines.filter((l) => !/^\|[-| :]+\|$/.test(l.trim()))
      let table =
        '<table style="border-collapse: collapse; width: 100%; background: #222; color: #fff; margin: 1em 0;"><tbody>\n'
      filtered.forEach((row, idx) => {
        const cells = row.split("|").slice(1, -1).map((c) => c.trim())
        const bg = idx === 0 ? "#333" : idx % 2 === 0 ? "#2a2a2a" : ""
        table += `<tr${bg ? ` style="background: ${bg};"` : ""}>\n`
        cells.forEach((cell) => {
          const content = idx === 0 ? `<b>${processInline(cell)}</b>` : processInline(cell)
          table += `<td style="border: 1px solid #555; padding: 10px;">${content}</td>\n`
        })
        table += "</tr>\n"
      })
      table += "</tbody></table>"
      parts.push(table)
      continue
    }

    if (line.trim() === "") {
      i++
      continue
    }

    parts.push(
      `<p style="margin: .6em 0; color: #ddd;">${processInline(line.trim())}</p>`
    )
    i++
  }

  return `<div style="color: #eee; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;">\n${parts.join(
    "\n"
  )}\n</div>`
}
