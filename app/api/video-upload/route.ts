import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ['video/webm', 'video/mp4'],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB max
        }
      },
      onUploadCompleted: async () => {
        // Optional: do something after upload completes
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
