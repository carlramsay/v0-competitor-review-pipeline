import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "components", "content-generation.tsx")
    const content = fs.readFileSync(filePath, "utf-8")
    
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "attachment; filename=content-generation.tsx",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 })
  }
}
