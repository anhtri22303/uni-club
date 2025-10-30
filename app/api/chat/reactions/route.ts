import { NextRequest, NextResponse } from "next/server"
import { chatOperations, isRedisConfigured } from "@/lib/upstash"

export async function POST(request: NextRequest) {
  try {
    // Check if Redis is configured
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: "Chat service is not configured" },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { clubId, messageId, userId, emoji } = body

    // Validate required fields
    if (!clubId || !messageId || !userId || !emoji) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate emoji is a single character or valid emoji
    if (typeof emoji !== 'string' || emoji.length === 0) {
      return NextResponse.json(
        { error: "Invalid emoji" },
        { status: 400 }
      )
    }

    // Toggle the reaction
    const result = await chatOperations.toggleReaction(
      clubId,
      messageId,
      userId,
      emoji
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to toggle reaction" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error: any) {
    console.error("Error in reaction endpoint:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

