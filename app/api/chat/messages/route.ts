import { NextRequest, NextResponse } from 'next/server'
import { chatOperations, ChatMessage, isRedisConfigured } from '@/lib/upstash'

// GET - Fetch messages for a club
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
    const limit = searchParams.get('limit') || '50'

    if (!clubId) {
      return NextResponse.json(
        { error: 'Club ID is required' },
        { status: 400 }
      )
    }

    const messages = await chatOperations.getMessages(
      parseInt(clubId),
      parseInt(limit)
    )

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Chat service is not configured. Please contact your administrator.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { clubId, message, userId, userName, userAvatar } = body

    // Validate required fields
    if (!clubId || !message || !userId || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create message object
    const chatMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      clubId: parseInt(clubId),
      userId: parseInt(userId),
      userName,
      userAvatar: userAvatar || '/placeholder-user.jpg',
      message: message.trim(),
      timestamp: Date.now(),
    }

    // Save message to Redis
    await chatOperations.addMessage(chatMessage)

    return NextResponse.json({ success: true, message: chatMessage })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

