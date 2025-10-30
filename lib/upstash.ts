import { Redis } from '@upstash/redis'

// Only initialize Redis if credentials are available (allows build to succeed without credentials)
const hasCredentials = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

export const redis = hasCredentials
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// Helper to check if Redis is configured
export const isRedisConfigured = () => redis !== null

// Chat message type
export interface ChatMessage {
  id: string
  clubId: number
  userId: number
  userName: string
  userAvatar?: string
  message: string
  timestamp: number
}

// Helper functions for chat operations
export const chatOperations = {
  // Get chat key for a specific club
  getChatKey: (clubId: number) => `chat:club:${clubId}`,
  
  // Get messages for a club (latest first)
  getMessages: async (clubId: number, limit: number = 50): Promise<ChatMessage[]> => {
    if (!redis) {
      throw new Error('Redis is not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.')
    }
    const key = chatOperations.getChatKey(clubId)
    const messages = await redis.lrange<ChatMessage>(key, 0, limit - 1)
    return messages
  },
  
  // Add a new message to a club's chat
  addMessage: async (message: ChatMessage): Promise<void> => {
    if (!redis) {
      throw new Error('Redis is not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.')
    }
    const key = chatOperations.getChatKey(message.clubId)
    // Add to the beginning of the list (newest first)
    await redis.lpush(key, message)
    // Keep only the last 1000 messages
    await redis.ltrim(key, 0, 999)
    // Set expiration to 30 days
    await redis.expire(key, 60 * 60 * 24 * 30)
  },
  
  // Get the latest message timestamp for polling
  getLatestTimestamp: async (clubId: number): Promise<number> => {
    if (!redis) {
      throw new Error('Redis is not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.')
    }
    const messages = await chatOperations.getMessages(clubId, 1)
    return messages.length > 0 ? messages[0].timestamp : 0
  },
}

