"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, Send } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

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
      text: "Xin chào! Tôi là trợ lý AI của SCLMS. Hiện tại tính năng này đang được phát triển.",
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Cảm ơn bạn đã quan tâm! Tính năng chatbot AI đang được phát triển và sẽ sớm ra mắt. Vui lòng quay lại sau nhé! 🚀",
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  const applyPrompt = (text: string) => {
    setInputValue(text)
    // Đưa focus về ô nhập để người dùng sửa rồi gửi
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
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* Chatbot Interface */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 max-w-[calc(100vw-2rem)]">
          <Card className="shadow-xl border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">AI Assistant</CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <ScrollArea className="h-64 w-full pr-4">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          message.isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input + Actions */}
              <div className="flex gap-2 items-center">
                {/* Dropdown trigger ngay bên trái nút gửi */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Gợi ý nhanh"
                      title="Gợi ý nhanh"
                      className="min-w-10"
                    >
                      {/* Hiển thị đúng ký tự " \/" như yêu cầu */}
                      <span className="text-sm leading-none select-none">\/</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-56">
                    {/* Tên rút gọn cho menu */}
                    <DropdownMenuItem onSelect={() => applyPrompt(PROMPTS.clubByMajor)}>
                      CLB theo ngành
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => applyPrompt(PROMPTS.eventsByMajor)}>
                      Sự kiện ngành
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => applyPrompt(PROMPTS.newEventContent)}>
                      Nội dung event mới
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Input
                  placeholder="Nhập tin nhắn..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  ref={inputRef}
                />
                <Button size="icon" onClick={handleSendMessage} aria-label="Gửi">
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
