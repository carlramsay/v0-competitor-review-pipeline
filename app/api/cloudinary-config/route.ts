import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  })
}
