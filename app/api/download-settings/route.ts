import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "app", "admin", "settings", "page.tsx")
    const content = fs.readFileSync(filePath, "utf-8")
    
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "attachment; filename=page.tsx",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 })
  }
}
