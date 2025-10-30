import { NextRequest, NextResponse } from 'next/server'
import { chatOperations, isRedisConfigured } from '@/lib/upstash'

// POST - Toggle pin status of a message
export async function POST(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Chat service is not configured. Please contact your administrator.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { clubId, messageId, userId } = body

    // Validate required fields
    if (!clubId || !messageId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Toggle pin
    const result = await chatOperations.togglePin(
      parseInt(clubId),
      messageId,
      parseInt(userId)
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to toggle pin' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    console.error('Error toggling pin:', error)
    return NextResponse.json(
      { error: 'Failed to toggle pin' },
      { status: 500 }
    )
  }
}

