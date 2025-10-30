"use client"

import React, { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, Send, Maximize2, Minimize2 } from "lucide-react"
import { ChatbotPromptMenu } from "@/components/chatbot-prompt-menu"
import axios from "axios"
import { fetchEvent, type Event } from "@/service/eventApi"
import { fetchClub } from "@/service/clubApi"

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

const PROMPTS = {
  clubByMajor:
    "Clubs by major: Show me all clubs organized by major, sorted by member count.",
  eventsByMajor:
    "Major events: List upcoming/ongoing events of clubs in the major [enter major], including time, location, and accumulated points.",
  newEventContent:
    "New event content: I want to create a new event. Please analyze the existing events and suggest unique event content that does NOT overlap with them.",
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I am UniBot AI assistant. How can I help you?",
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPromptOpen, setIsPromptOpen] = useState(false) // state điều khiển dropdown
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Scroll to bottom when messages change
  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const chatbotUrl = process.env.NEXT_PUBLIC_AI_CHATBOT_URL
      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY
      if (!chatbotUrl) throw new Error("NEXT_PUBLIC_AI_CHATBOT_URL is not set.")
      if (!apiKey) throw new Error("NEXT_PUBLIC_GROQ_API_KEY is not set.")

      type ChatbotResponse = {
        choices?: Array<{
          message?: { content?: string }
        }>
      }

      // Check if this is a "New event content" request
      const isNewEventRequest = inputValue.toLowerCase().includes("new event") || 
                                inputValue.toLowerCase().includes("create a new event")
      
      // Check if this is a "Clubs by major" request
      const isClubsByMajorRequest = inputValue.toLowerCase().includes("clubs by major") ||
                                     inputValue.toLowerCase().includes("club") && inputValue.toLowerCase().includes("major")

      let systemContent = "You are an AI assistant for a university club and event management system. Please respond concisely, friendly, and helpful. Format your responses clearly:\n- Use line breaks to separate different points\n- Use numbered lists (1., 2., 3.) for sequential items\n- Use bullet points (•) for related items\n- Keep paragraphs short and easy to read\n- Put important information on separate lines"
      
      let userContent = userMessage.text

      // If it's a clubs by major request, fetch and organize clubs
      if (isClubsByMajorRequest) {
        try {
          const clubsResponse = await fetchClub({ page: 0, size: 500, sort: ["name"] })
          const clubs = clubsResponse.content || []
          
          // Group clubs by majorName
          const clubsByMajor: Record<string, any[]> = {}
          clubs.forEach(club => {
            const majorName = club.majorName || "Unknown Major"
            if (!clubsByMajor[majorName]) {
              clubsByMajor[majorName] = []
            }
            clubsByMajor[majorName].push(club)
          })
          
          // Sort clubs within each major by memberCount (descending)
          Object.keys(clubsByMajor).forEach(majorName => {
            clubsByMajor[majorName].sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
          })

          systemContent = `You are an AI assistant for a university club and event management system.
Present the clubs organized by major in this BEAUTIFUL format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎓 CLUBS BY MAJOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each major, format like this:

📚 [MAJOR NAME]
━━━━━━━━━━━━━━━━━━━━━━━━

1. 🏆 [Club Name] (👥 [X] members)
   • Leader: [Leader Name]
   • Description: [Brief description]

2. 🏆 [Club Name] (👥 [X] members)
   • Leader: [Leader Name]
   • Description: [Brief description]

[Continue for all clubs in that major, sorted by member count from highest to lowest]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Make the presentation clean, easy to read, and well-organized.`

          userContent = `${userMessage.text}

CLUBS DATA (already grouped by major and sorted by member count):
${JSON.stringify(clubsByMajor, null, 2)}

Please present all clubs organized by their major, with each major's clubs sorted by member count from highest to lowest.`
        } catch (error) {
          console.error("Error fetching clubs for context:", error)
          // Continue with regular prompt if fetch fails
        }
      }
      // If it's a new event request, fetch existing events and add context
      else if (isNewEventRequest) {
        try {
          const events: Event[] = await fetchEvent({ size: 100 })
          const eventSummary = events.map(e => ({
            name: e.name,
            description: e.description,
            type: e.type,
            date: e.date,
            hostClub: e.hostClub?.name || e.clubName
          }))

          systemContent = `You are an AI assistant for a university club and event management system. 
When suggesting new event content, provide ONE suggestion in this EXACT format for easy copying:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 EVENT SUGGESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Event Name:
[Write a unique, catchy event name]

📝 Description:
[Write a detailed 2-3 sentence description that explains the event purpose, activities, and benefits for participants]

🔓 Type:
[PUBLIC or PRIVATE]

📅 Date:
[YYYY-MM-DD format - suggest a future date]

⏰ Start Time:
[HH:MM format, e.g., 09:00]

⏰ End Time:
[HH:MM format, e.g., 15:00]

👥 Max Check-in Count:
[Number of participants, e.g., 100]

💎 Commit Point Cost:
[Points required to register, e.g., 50]

💰 Budget Points:
[Total points allocated for event, e.g., 500]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Make sure the suggested event is UNIQUE and does NOT overlap with existing events. Provide ONLY ONE suggestion.`

          userContent = `${userMessage.text}

EXISTING EVENTS:
${JSON.stringify(eventSummary, null, 2)}

Please analyze these existing events and suggest NEW, UNIQUE event ideas with complete details that can be directly copied into the event creation form.`
        } catch (error) {
          console.error("Error fetching events for context:", error)
          // Continue with regular prompt if fetch fails
        }
      }

      // Call Groq API
      const response = await axios.post<ChatbotResponse>(
        chatbotUrl,
        {
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: systemContent,
            },
            { role: "user", content: userContent },
          ],
          temperature: 1,
          top_p: 1,
          stream: false,
          max_tokens: 2048, // Increased for event suggestions
          stop: null,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      )

      const botText =
        response.data?.choices?.[0]?.message?.content?.trim() ||
        "Sorry, I cannot answer your question right now."

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I cannot answer your question right now.",
          isUser: false,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const applyPrompt = (text: string) => {
    setInputValue(text)
    // Focus on the input field for the user to edit and send
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  // Format message text with proper line breaks and structure
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ))
  }

  return (
    <>
      {/* Chatbot Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 bg-green-200 shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close chat" : "Open chat"}
          title={isOpen ? "Close chat" : "Open chat"}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* Chatbot Interface */}
      {isOpen && (
        <div className={`fixed bottom-20 right-6 z-[1000] ${isExpanded ? 'inset-4 w-auto max-w-[calc(100vw-2rem)]' : 'w-80 max-w-[calc(100vw-2rem)]'}`}>
          {/* Dropdown menu has been moved to the Input + Actions section */}
          <Card className="shadow-xl border-2 overflow-visible">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Uniclub Bot</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsExpanded((v) => !v)}
                      aria-label={isExpanded ? 'Minimize' : 'Expand'}
                      title={isExpanded ? 'Minimize' : 'Expand'}
                    >
                      {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsOpen(false)}
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

            <CardContent className="space-y-4">
              {/* Messages */}
              <ScrollArea className={`${isExpanded ? 'h-[70vh]' : 'h-64'} w-full pr-4`}>
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                          message.isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {message.isUser ? message.text : formatMessageText(message.text)}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground animate-pulse">
                        Replying...
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input + Actions */}
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Enter message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                  ref={inputRef}
                  disabled={isLoading}
                />
                
                <ChatbotPromptMenu
                  isOpen={isPromptOpen}
                  onOpenChange={setIsPromptOpen}
                  onSelectPrompt={applyPrompt}
                  prompts={PROMPTS}
                  disabled={isLoading}
                />

                <Button
                  type="button"
                  size="icon"
                  onClick={handleSendMessage}
                  aria-label="Send"
                  disabled={isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}