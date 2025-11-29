import { NextRequest, NextResponse } from 'next/server'
import { redis, isRedisConfigured } from '@/lib/upstash'

// Maximum conversation history per user
const MAX_MESSAGES = 10

export interface ChatbotMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// Helper function to get conversation key
const getConversationKey = (userId: string | number) => `chatbot:conversation:${userId}`

// GET - Fetch conversation history for a user
export async function GET(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Chat service is not configured.' },
        { status: 503 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const key = getConversationKey(userId)
    const messages = await redis!.lrange<ChatbotMessage>(key, 0, MAX_MESSAGES - 1)

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Error fetching chatbot history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation history' },
      { status: 500 }
    )
  }
}

// POST - Add messages to conversation history
export async function POST(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Chat service is not configured.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { userId, messages } = body

    if (!userId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'User ID and messages array are required' },
        { status: 400 }
      )
    }

    const key = getConversationKey(userId)

    // Add messages to the beginning of the list (newest first)
    for (const message of messages.reverse()) {
      const chatbotMessage: ChatbotMessage = {
        role: message.role,
        content: message.content,
        timestamp: Date.now(),
      }
      await redis!.lpush(key, chatbotMessage)
    }

    // Keep only the last MAX_MESSAGES messages
    await redis!.ltrim(key, 0, MAX_MESSAGES - 1)

    // Set expiration to 7 days (conversation should persist across sessions but not forever)
    await redis!.expire(key, 60 * 60 * 24 * 7)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving chatbot history:', error)
    return NextResponse.json(
      { error: 'Failed to save conversation history' },
      { status: 500 }
    )
  }
}

// DELETE - Clear conversation history for a user
export async function DELETE(request: NextRequest) {
  try {
    if (!isRedisConfigured()) {
      return NextResponse.json(
        { error: 'Chat service is not configured.' },
        { status: 503 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const key = getConversationKey(userId)
    await redis!.del(key)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing chatbot history:', error)
    return NextResponse.json(
      { error: 'Failed to clear conversation history' },
      { status: 500 }
    )
  }
}
