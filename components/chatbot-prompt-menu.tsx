"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"

interface ChatbotPromptMenuProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSelectPrompt: (promptText: string) => void
  prompts: Record<string, string>
  disabled?: boolean
}

export function ChatbotPromptMenu({
  isOpen,
  onOpenChange,
  onSelectPrompt,
  prompts,
  disabled = false,
}: ChatbotPromptMenuProps) {
  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Quick suggestions"
          title="Quick suggestions"
          className="h-9 w-9"
          disabled={disabled}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={5}
          className="w-56 z-[9999]"
        >
          {Object.entries(prompts).map(([key, promptText]) => (
            <DropdownMenuItem
              key={key}
              onSelect={(e) => {
                e.preventDefault()
                onSelectPrompt(promptText)
                onOpenChange(false)
              }}
            >
              {key === "clubByMajor"
                ? "Clubs by Major"
                : key === "eventsByMajor"
                ? "Major Events"
                : key === "newEventContent"
                ? "New Event Content"
                : key}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}