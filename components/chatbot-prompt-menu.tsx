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
          {Object.entries(prompts).map(([key, promptText]) => {
            // Format the key to a readable name
            const formatName = (k: string) => {
              const nameMap: Record<string, string> = {
                // Student prompts (original)
                clubsByMajor: "🎓 Clubs by Major",
                createClub: "🏛️ Create Club",
                eventByMyClub: "🎉 Events by My Club",
                myClubGift: "🎁 My Club Gifts",
                // Student prompts (NEW - Guide & Info)
                websiteGuide: "🌟 Website Guide",
                myClubDetails: "👥 My Club Details",
                myPoints: "💰 My Points",
                upcomingEvents: "📅 Upcoming Events",
                howToJoinClub: "🚀 How to Join",
                myActivity: "📊 My Activity",
                // Club Leader prompts (original)
                newEventContent: "📋 New Event Content",
                budgetForEvents: "💰 Budget for Events",
                // Club Leader prompts (NEW)
                clubOverview: "📊 Club Overview",
                memberManagement: "👥 Member Management",
                walletAnalysis: "💳 Wallet Analysis",
                eventPerformance: "🎯 Event Performance",
                leadershipGuide: "👑 Leadership Guide",
                monthlyReport: "📈 Monthly Report",
                // University Staff prompts (original)
                numberOfMembers: "🏆 Top Members",
                clubApplication: "📝 Club Applications",
                // University Staff prompts (NEW)
                systemOverview: "🎯 System Overview",
                eventApprovals: "✅ Event Approvals",
                fundingAnalysis: "💰 Funding Analysis",
                clubPerformance: "🏆 Club Performance",
                platformInsights: "📊 Platform Insights",
                monthlyOverview: "📈 Monthly Overview",
              }
              return nameMap[k] || k
            }

            return (
              <DropdownMenuItem
                key={key}
                onSelect={(e) => {
                  e.preventDefault()
                  onSelectPrompt(promptText)
                  onOpenChange(false)
                }}
              >
                {formatName(key)}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}