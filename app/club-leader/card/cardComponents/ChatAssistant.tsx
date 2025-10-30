"use client"

import React, { useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, X, Send } from "lucide-react"
import type { ChatMessage } from "./types"

interface ChatAssistantProps {
  messages: ChatMessage[]
  inputValue: string
  isLoading: boolean
  isOpen: boolean
  onToggleOpen: () => void
  onInputChange: (value: string) => void
  onSendMessage: () => void
  onQuickSuggestion: (suggestion: string) => void
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  messages,
  inputValue,
  isLoading,
  isOpen,
  onToggleOpen,
  onInputChange,
  onSendMessage,
  onQuickSuggestion,
}) => {
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base sm:text-lg">🤖 AI Design Assistant</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleOpen}
            className="h-8 w-8 p-0"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-3">
          {/* Chat Messages */}
          <ScrollArea className="h-64 w-full pr-3">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs sm:text-sm ${
                      message.isUser
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg px-3 py-2 text-xs sm:text-sm bg-slate-100 text-slate-600 animate-pulse">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatScrollRef} />
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="flex gap-2 items-center pt-2 border-t">
            <Input
              placeholder="e.g., 'Make it pink and orange'"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
              className="flex-1 text-sm"
              disabled={isLoading}
            />
            <Button
              type="button"
              size="icon"
              onClick={onSendMessage}
              disabled={isLoading}
              className="h-9 w-9"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => onQuickSuggestion("Make it neon pink")}
              disabled={isLoading}
            >
              Neon Pink
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => onQuickSuggestion("Use pastel colors")}
              disabled={isLoading}
            >
              Pastel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => onQuickSuggestion("Change to stars pattern")}
              disabled={isLoading}
            >
              Stars
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => onQuickSuggestion("Make it monochrome black")}
              disabled={isLoading}
            >
              Black
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => onQuickSuggestion("Hide QR and use hexagon pattern")}
              disabled={isLoading}
            >
              Hexagons
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

