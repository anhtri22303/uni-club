import { NextRequest, NextResponse } from 'next/server'
import { chatOperations, isRedisConfigured } from '@/lib/upstash'

// GET - Poll for new messages (for realtime updates)
export async function GET(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Chat service is not configured. Please contact your administrator.' },
        { status: 503 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const clubId = searchParams.get('clubId')
    const after = searchParams.get('after') || '0'

    if (!clubId) {
      return NextResponse.json(
        { error: 'Club ID is required' },
        { status: 400 }
      )
    }

    // Get all messages and filter for ones after the timestamp
    const allMessages = await chatOperations.getMessages(parseInt(clubId), 100)
    const newMessages = allMessages.filter(
      (msg) => msg.timestamp > parseInt(after)
    )

    return NextResponse.json({ 
      messages: newMessages,
      latestTimestamp: allMessages.length > 0 ? allMessages[0].timestamp : 0
    })
  } catch (error) {
    console.error('Error polling messages:', error)
    return NextResponse.json(
      { error: 'Failed to poll messages' },
      { status: 500 }
    )
  }
}

