"use client"

import React, { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, Send, Maximize2, Minimize2 } from "lucide-react"
import { ChatbotPromptMenu } from "@/components/chatbot-prompt-menu"
import axios from "axios"

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

const PROMPTS = {
  clubByMajor:
    "Gợi ý CLB theo ngành: Hãy đề xuất các câu lạc bộ phù hợp với chuyên ngành [nhập chuyên ngành], lý do phù hợp và yêu cầu tham gia.",
  eventsByMajor:
    "Sự kiện ngành: Liệt kê các sự kiện sắp/đang diễn ra của các CLB thuộc chuyên ngành [nhập chuyên ngành], kèm thời gian, địa điểm, điểm tích lũy.",
  newEventContent:
    "Nội dung event mới: Gợi ý chủ đề & mô tả sự kiện cho CLB [tên CLB]/ngành [nhập chuyên ngành] sao cho KHÔNG trùng với các sự kiện đã có; nêu khác biệt và giá trị mang lại.",
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Xin chào! Tôi là trợ lý AI của SCLMS. Bạn cần hỗ trợ gì?",
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

      // Gọi Groq theo chuẩn OpenAI-compatible (giống file JSX của bạn)
      const response = await axios.post<ChatbotResponse>(
        chatbotUrl,
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "Bạn là một trợ lý AI cho hệ thống quản lý câu lạc bộ và sự kiện trường đại học. Hãy trả lời ngắn gọn, thân thiện, hữu ích và đúng chủ đề.",
            },
            { role: "user", content: userMessage.text },
          ],
          temperature: 1,
          top_p: 1,
          stream: false,
          max_tokens: 1024, // tương thích Groq OpenAI-compatible
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
        "Xin lỗi, tôi không thể trả lời câu hỏi của bạn ngay bây giờ."

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
          text: "Xin lỗi, tôi không thể trả lời câu hỏi của bạn ngay bây giờ.",
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
    // Focus vào ô nhập để người dùng sửa và gửi
    requestAnimationFrame(() => inputRef.current?.focus())
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
          aria-label={isOpen ? "Đóng chat" : "Mở chat"}
          title={isOpen ? "Đóng chat" : "Mở chat"}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* Chatbot Interface */}
      {isOpen && (
        <div className={`fixed bottom-20 right-6 z-[1000] ${isExpanded ? 'inset-4 w-auto max-w-[calc(100vw-2rem)]' : 'w-80 max-w-[calc(100vw-2rem)]'}`}>
          {/* Dropdown menu đã được di chuyển vào phần Input + Actions */}
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
                      aria-label={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
                      title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
                    >
                      {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsOpen(false)}
                      aria-label="Đóng"
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
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          message.isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground animate-pulse">
                        Đang trả lời...
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input + Actions */}
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Nhập tin nhắn..."
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
                  aria-label="Gửi"
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