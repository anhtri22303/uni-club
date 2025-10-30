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
  replyTo?: {
    id: string
    userName: string
    message: string
  }
}

// Helper functions for chat operations
export const chatOperations = {
  // Get chat key for a specific club
  getChatKey: (clubId: number) => `chat:club:${clubId}`,
  
  // Get messages for a club (latest first)
  // If beforeTimestamp is provided, get messages older than that timestamp
  getMessages: async (clubId: number, limit: number = 50, beforeTimestamp?: number): Promise<ChatMessage[]> => {
    if (!redis) {
      throw new Error('Redis is not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.')
    }
    const key = chatOperations.getChatKey(clubId)
    
    if (beforeTimestamp) {
      // Fetch more messages to filter by timestamp
      // We fetch up to 200 messages to ensure we get enough older ones
      const allMessages = await redis.lrange<ChatMessage>(key, 0, 199)
      const filteredMessages = allMessages
        .filter(msg => msg.timestamp < beforeTimestamp)
        .slice(0, limit)
      return filteredMessages
    } else {
      // Regular fetch - get latest messages
      const messages = await redis.lrange<ChatMessage>(key, 0, limit - 1)
      return messages
    }
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

  // Delete a message from a club's chat
  deleteMessage: async (clubId: number, messageId: string, userId: number): Promise<{ success: boolean; error?: string }> => {
    if (!redis) {
      throw new Error('Redis is not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.')
    }
    try {
      const key = chatOperations.getChatKey(clubId)
      
      // Get all messages to find the one to delete
      const messages = await redis.lrange<ChatMessage>(key, 0, -1)
      const messageToDelete = messages.find(msg => msg.id === messageId)
      
      if (!messageToDelete) {
        return { success: false, error: 'Message not found' }
      }
      
      // Verify the user owns this message
      if (messageToDelete.userId !== userId) {
        return { success: false, error: 'Unauthorized: You can only delete your own messages' }
      }
      
      // Remove the message from the list
      // Redis lrem: remove count occurrences of value from list
      // We use 1 to remove only the first occurrence (should be unique anyway)
      await redis.lrem(key, 1, messageToDelete)
      
      return { success: true }
    } catch (error) {
      console.error('Error deleting message:', error)
      return { success: false, error: 'Failed to delete message' }
    }
  },
}

