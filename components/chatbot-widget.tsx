"use client"

import React, { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, Send, Maximize2, Minimize2, ShieldCheck } from "lucide-react"
import { ChatbotPromptMenu } from "@/components/chatbot-prompt-menu"
import { PolicyModal } from "@/components/policy-modal"
import axios from "axios"
import { fetchEvent, getEventByClubId, type Event } from "@/service/eventApi"
import { fetchClub, getClubMemberCount } from "@/service/clubApi"
import { postClubApplication } from "@/service/clubApplicationAPI"
import { getProducts } from "@/service/productApi"
import { fetchLocation } from "@/service/locationApi"
import { getClubWallet } from "@/service/walletApi"
import { getMembersByClubId } from "@/service/membershipApi"
import { getClubApplications } from "@/service/clubApplicationAPI"

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

// Role-based prompts
const STUDENT_PROMPTS = {
  clubsByMajor: "Clubs by Major: Show me all clubs organized by major, sorted by member count.",
  createClub: "Create Club: I want to create a new club. Suggest a unique club based on existing clubs.",
  eventByMyClub: "Events by My Club: Show me all events from clubs I'm a member of.",
  myClubGift: "My Club Gifts: Show me available products/gifts from my clubs.",
}

const CLUB_LEADER_PROMPTS = {
  newEventContent: "New Event Content: Suggest a new event with location for my club.",
  myClubGift: "My Club Gifts: Show me products/gifts available for my club members.",
  budgetForEvents: "Budget for Events: Analyze my club's budget and suggest events for this month.",
}

const UNIVERSITY_STAFF_PROMPTS = {
  numberOfMembers: "Number of Members: Show me the top 10 clubs with the most members.",
  clubApplication: "Club Applications: Show pending club applications and suggest approvals based on major diversity.",
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
  const [userRole, setUserRole] = useState<string>("")
  const [clubIds, setClubIds] = useState<number[]>([])
  const [activePrompts, setActivePrompts] = useState<Record<string, string>>(STUDENT_PROMPTS)
  const [isPolicyOpen, setIsPolicyOpen] = useState(false)

  // Load user role and clubIds from sessionStorage
  useEffect(() => {
    try {
      const authDataString = sessionStorage.getItem("uniclub-auth")
      if (authDataString) {
        const authData = JSON.parse(authDataString)
        const role = authData.role || authData.userRole || "STUDENT"
        setUserRole(role)

        // Collect clubIds from multiple possible sources
        let extractedClubIds: number[] = []

        // 1. Check for clubIds array (direct property)
        if (authData.clubIds && Array.isArray(authData.clubIds)) {
          extractedClubIds = [...authData.clubIds]
        }

        // 2. Get clubIds from memberships
        const memberships = authData.memberships || []
        const membershipClubIds = memberships.map((m: any) => m.clubId).filter(Boolean)
        membershipClubIds.forEach((id: number) => {
          if (!extractedClubIds.includes(id)) {
            extractedClubIds.push(id)
          }
        })

        // 3. Also check for single clubId (for CLUB_LEADER)
        if (authData.clubId && !extractedClubIds.includes(authData.clubId)) {
          extractedClubIds.push(authData.clubId)
        }

        setClubIds(extractedClubIds)
        console.log("Loaded clubIds:", extractedClubIds)

        // Set prompts based on role
        if (role === "CLUB_LEADER") {
          setActivePrompts(CLUB_LEADER_PROMPTS)
        } else if (role === "UNIVERSITY_STAFF") {
          setActivePrompts(UNIVERSITY_STAFF_PROMPTS)
        } else {
          setActivePrompts(STUDENT_PROMPTS)
        }
      }
    } catch (error) {
      console.error("Error loading auth data:", error)
    }
  }, [])

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

      const inputLower = inputValue.toLowerCase()

      let systemContent = `You are UniBot, an AI assistant EXCLUSIVELY for the university club and event management system. 

STRICT RULES:
1. ONLY answer questions related to clubs, events, students, memberships, budgets, applications, gifts/products, and other features within this platform.
2. If asked about topics OUTSIDE this system (weather, general knowledge, other universities, unrelated topics), respond with: "I'm sorry, I can only assist with questions related to the university club and event management system. Please ask about clubs, events, memberships, budgets, or other platform features."
3. Do NOT provide information about topics unrelated to this platform.

Response Format:
- Use line breaks to separate different points
- Use numbered lists (1., 2., 3.) for sequential items
- Use bullet points (•) for related items
- Keep paragraphs short and easy to read
- Put important information on separate lines

Please respond concisely, friendly, and helpful ONLY for platform-related questions.`
      
      let userContent = userMessage.text

      // ========== STUDENT PROMPTS ==========
      // 1. Clubs by Major
      if (inputLower.includes("clubs by major") || (inputLower.includes("club") && inputLower.includes("major"))) {
        try {
          const clubsResponse = await fetchClub({ page: 0, size: 500, sort: ["name"] })
          const clubs = Array.isArray(clubsResponse) ? clubsResponse : (clubsResponse as any).data || []
          
          // Group clubs by majorName
          const clubsByMajor: Record<string, any[]> = {}
          clubs.forEach((club: any) => {
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

📚 [MAJOR NAME] ([X] clubs)
━━━━━━━━━━━━━━━━━━━━━━━━

1. 🏆 [Club Name]
   • 👥 Members: [X] active members
   • 👨‍💼 Leader: [Leader Name]
   • 📝 Description: [Brief description]
   • 📅 Approved Events: [X] events

2. 🏆 [Club Name]
   • 👥 Members: [X] active members
   • 👨‍💼 Leader: [Leader Name]
   • 📝 Description: [Brief description]
   • 📅 Approved Events: [X] events

[Continue for all clubs in that major, sorted by member count from highest to lowest]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Summary: Total of [X] clubs across [Y] majors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Make the presentation clean, easy to read, and well-organized.`

          userContent = `${userMessage.text}

CLUBS DATA (already grouped by major and sorted by member count):
${JSON.stringify(clubsByMajor, null, 2)}

Please present all clubs organized by their major, with each major's clubs sorted by member count from highest to lowest.`
        } catch (error) {
          console.error("Error fetching clubs for context:", error)
        }
      }
      // 2. Create Club (STUDENT)
      else if (inputLower.includes("create club")) {
        try {
          const clubsResponse = await fetchClub({ page: 0, size: 500, sort: ["name"] })
          const clubs = Array.isArray(clubsResponse) ? clubsResponse : (clubsResponse as any).data || []

          systemContent = `You are an AI assistant for a university club and event management system.
When suggesting a new club, provide ONE suggestion in this EXACT format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ NEW CLUB SUGGESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Club Name:
[Write a unique, creative club name that doesn't exist yet]

📝 Description:
[Write 2-3 sentences describing the club's purpose, main activities, and target audience]

🎓 Suggested Major:
[Suggest an appropriate major/department that aligns with the club's focus]

🌟 Vision Statement:
[Write a compelling, inspiring vision statement (1-2 sentences) about what the club aims to achieve]

💡 Value Proposition:
[Explain why this club would be valuable for students - highlight unique benefits, learning opportunities, or gaps it fills]

🎨 Suggested Activities:
• [Activity 1]
• [Activity 2]
• [Activity 3]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Analysis:
• Gap Identified: [Explain what gap this club fills]
• Uniqueness: [Explain how it differs from existing clubs]
• Potential Members: [Estimate target audience size]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Make sure the club is UNIQUE and doesn't overlap with existing clubs. Base your suggestion on actual gaps in the current club offerings.`

          interface ClubSummary {
            name: string
            description: string
            majorName: string
          }

                    userContent = `${userMessage.text}

          EXISTING CLUBS:
          ${JSON.stringify(clubs.map((c: any): ClubSummary => ({ name: c.name, description: c.description, majorName: c.majorName })), null, 2)}

          Please suggest a NEW, UNIQUE club that would fill a gap in the current club offerings.`
        } catch (error) {
          console.error("Error fetching clubs:", error)
        }
      }
      // 3. Events by My Club (STUDENT)
      else if (inputLower.includes("events by my club") || (inputLower.includes("event") && inputLower.includes("my club"))) {
        if (clubIds.length === 0) {
          systemContent = "You are a helpful assistant."
          userContent = "The user has not joined any clubs yet. Please inform them politely that they need to join a club first to see club events."
        } else {
          try {
            const allEvents: any[] = []
            for (const clubId of clubIds) {
              const events = await getEventByClubId(clubId)
              allEvents.push(...events)
            }

            systemContent = `You are an AI assistant for a university club and event management system.
Present the events grouped by club in this BEAUTIFUL format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 MY CLUB EVENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Group events by club. For each club:

🏛️ [CLUB NAME] - [X] Events
━━━━━━━━━━━━━━━━━━━━━━━━

1. 📅 [Event Name]
   • 🔔 Status: [Status with appropriate emoji: ✅ APPROVED, ⏳ PENDING, ❌ CANCELLED]
   • 🔓 Type: [PUBLIC/PRIVATE]
   • 📆 Date: [Date in readable format]
   • ⏰ Time: [Start Time] - [End Time]
   • 📍 Location: [Location Name]
   • 💎 Commit Points: [X] points
   • 👥 Max Participants: [X] people
   • 📝 Description: [Brief description]

2. [Continue for all events...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
• Total Events: [X]
• Upcoming Events: [X]
• Active Registrations: [X]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sort events by date (upcoming first). Make the presentation clean and well-organized.`

            userContent = `${userMessage.text}

MY CLUB EVENTS:
${JSON.stringify(allEvents, null, 2)}

Please present all events from my clubs in a clean, organized format.`
          } catch (error) {
            console.error("Error fetching club events:", error)
          }
        }
      }
      // 4. My Club Gifts (STUDENT/CLUB_LEADER)
      else if (inputLower.includes("my club") && inputLower.includes("gift")) {
        if (clubIds.length === 0) {
          systemContent = "You are a helpful assistant."
          userContent = "The user has not joined any clubs yet. Please inform them politely that they need to join a club first to see available gifts."
        } else {
          try {
            // Fetch products from all user's clubs
            const productsByClub: Record<string, any> = {}
            
            for (const clubId of clubIds) {
              try {
                const products = await getProducts(clubId, {
                  includeInactive: false,
                  includeArchived: false
                })
                
                if (products.length > 0) {
                  // Get club name from first product or fetch it
                  const clubName = products[0]?.clubName || `Club ${clubId}`
                  productsByClub[clubName] = {
                    clubId,
                    products
                  }
                }
              } catch (error) {
                console.error(`Error fetching products for club ${clubId}:`, error)
              }
            }

            systemContent = `You are an AI assistant for a university club and event management system.
Present the products/gifts GROUPED BY CLUB in this BEAUTIFUL format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎁 MY CLUB GIFTS & REWARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each club, format like this:

🏛️ [CLUB NAME] ([X] products available)
━━━━━━━━━━━━━━━━━━━━━━━━

1. 🎁 [Product Name]
   • 💰 Price: [X] Points
   • 📦 Stock: [X] items [availability emoji: ✅ In Stock / ⚠️ Low Stock / ❌ Out of Stock]
   • 🔔 Status: [ACTIVE/INACTIVE]
   • 📝 Description: [Description]
   • 🏷️ Category: [Category if available]

2. 🎁 [Product Name]
   • 💰 Price: [X] Points
   • 📦 Stock: [X] items [availability emoji]
   • 🔔 Status: [ACTIVE/INACTIVE]
   • 📝 Description: [Description]
   • 🏷️ Category: [Category if available]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
• Total Products: [X] across [Y] clubs
• Available Now: [X] products
• Average Price: [X] points

💡 Tip: Earn points by participating in club events!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If no products are available, inform the user that their clubs don't have any gifts yet and suggest they check back later.
Sort products by availability (in stock first), then by price.
Make the presentation clean, easy to read, and well-organized by club.`

            userContent = `${userMessage.text}

PRODUCTS BY CLUB:
${JSON.stringify(productsByClub, null, 2)}

Please present all available products/gifts grouped by club in a clean, organized format.`
          } catch (error) {
            console.error("Error fetching products:", error)
          }
        }
      }
      // 5. New Event Content (CLUB_LEADER)
      else if (inputLower.includes("new event")) {
        try {
          const events: Event[] = await fetchEvent({ size: 100 })
          const locations = await fetchLocation({ page: 0, size: 100 })
          const eventSummary = events.map(e => ({
            name: e.name,
            description: e.description,
            type: e.type,
            date: e.date,
            locationName: e.locationName,
            hostClub: e.hostClub?.name || e.clubName
          }))

          systemContent = `You are an AI assistant for a university club and event management system. 
When suggesting new event content, provide ONE comprehensive suggestion in this EXACT format for easy copying:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 NEW EVENT SUGGESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 Event Name:
[Write a unique, catchy, and memorable event name]

📝 Description:
[Write a detailed 2-3 sentence description explaining:
 - Event purpose and goals
 - Main activities and schedule
 - Benefits and learning outcomes for participants]

🔓 Event Type:
[PUBLIC or PRIVATE]
[Explain why: PUBLIC - open to all students, PRIVATE - club members only]

📅 Suggested Date:
[YYYY-MM-DD format - suggest a specific future date with day of week]
[Explain why this date: e.g., weekend for better attendance, before/after exam period]

⏰ Time Schedule:
• Start Time: [HH:MM format, e.g., 09:00]
• End Time: [HH:MM format, e.g., 15:00]
• Duration: [X] hours

📍 Location:
• Venue: [Choose an appropriate location from the available locations]
• Capacity: [Venue capacity if known]
• Facilities: [Brief mention of available facilities]

👥 Participant Planning:
• Max Check-in Count: [Number, e.g., 100]
• Target Audience: [Who should attend]
• Estimated Turnout: [X]% of max capacity

💎 Point System:
• Commit Point Cost: [Points required to register, e.g., 50]
• Reward Points: [Points earned upon completion, e.g., 100]
• Penalty for No-show: [X] points

💰 Budget Breakdown:
• Total Budget: [X] points
• Venue Cost: [X] points (if applicable)
• Materials/Supplies: [X] points
• Refreshments: [X] points
• Rewards/Prizes: [X] points
• Contingency: [X] points

🎯 Event Goals:
1. [Primary goal]
2. [Secondary goal]
3. [Additional benefit]

📋 Suggested Agenda:
• [Time]: [Activity 1]
• [Time]: [Activity 2]
• [Time]: [Activity 3]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Why This Event:
• Uniqueness: [How it differs from existing events]
• Relevance: [Why it matters to students now]
• Impact: [Expected positive outcomes]

⚠️ Considerations:
• Preparation Time: [X] weeks needed
• Required Resources: [List key resources]
• Potential Challenges: [1-2 challenges to address]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Make sure the suggested event is UNIQUE, FEASIBLE, and does NOT overlap with existing events. Base suggestions on current trends and student needs. Provide ONLY ONE well-thought-out suggestion.`

          userContent = `${userMessage.text}

EXISTING EVENTS:
${JSON.stringify(eventSummary, null, 2)}

AVAILABLE LOCATIONS:
${JSON.stringify(locations, null, 2)}

Please analyze these existing events and suggest NEW, UNIQUE event ideas with complete details including an appropriate location from the available locations.`
        } catch (error) {
          console.error("Error fetching events for context:", error)
        }
      }
      // 6. Budget for Events (CLUB_LEADER)
      else if (inputLower.includes("budget") && inputLower.includes("event")) {
        if (clubIds.length === 0) {
          systemContent = "You are a helpful assistant."
          userContent = "The user is not associated with any club. Please inform them politely."
        } else {
          try {
            const clubId = clubIds[0] // Use first club for club leader
            const wallet = await getClubWallet(clubId)
            const members = await getMembersByClubId(clubId)
            const events = await getEventByClubId(clubId)

            const currentDate = new Date()
            const currentMonth = currentDate.getMonth()
            const currentYear = currentDate.getFullYear()

            systemContent = `You are an AI assistant for a university club and event management system.
Analyze the club's financial situation and suggest strategic events for the current month (${currentMonth + 1}/${currentYear}).

Present in this format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 BUDGET ANALYSIS & EVENT STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 CURRENT FINANCIAL STATUS:
• 💎 Club Wallet Balance: [X] points
• 👥 Total Active Members: [X]
• 📅 Existing Events This Month: [X]
• 💸 Average Spending per Event: [X] points
• 📈 Budget Utilization Rate: [X]%

🔍 FINANCIAL HEALTH:
• Status: [Healthy/Moderate/Critical - based on balance]
• Recommendation: [Conservative/Balanced/Aggressive spending]
• Budget Remaining: [X] points available
• Points per Member: [X] points/member

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 STRATEGIC EVENT RECOMMENDATIONS:

Based on available budget (${wallet.balancePoints} points) and member count, here are optimized events for this month:

🎯 OPTION 1: [Event Name]
   • 💰 Budget Allocation: [X] points ([X]% of total)
   • 👥 Expected Participants: [X] ([X]% of members)
   • 💎 Cost per Participant: [X] points
   • ⏰ Optimal Timing: [Date/Time suggestion]
   • 🎯 Purpose: [Detailed description and benefits]
   • 📊 ROI: [Expected engagement/satisfaction impact]
   • ✅ Priority: [High/Medium/Low]

🎯 OPTION 2: [Event Name]
   • 💰 Budget Allocation: [X] points ([X]% of total)
   • 👥 Expected Participants: [X] ([X]% of members)
   • 💎 Cost per Participant: [X] points
   • ⏰ Optimal Timing: [Date/Time suggestion]
   • 🎯 Purpose: [Detailed description and benefits]
   • 📊 ROI: [Expected engagement/satisfaction impact]
   • ✅ Priority: [High/Medium/Low]

🎯 OPTION 3: [Event Name]
   • 💰 Budget Allocation: [X] points ([X]% of total)
   • 👥 Expected Participants: [X] ([X]% of members)
   • 💎 Cost per Participant: [X] points
   • ⏰ Optimal Timing: [Date/Time suggestion]
   • 🎯 Purpose: [Detailed description and benefits]
   • 📊 ROI: [Expected engagement/satisfaction impact]
   • ✅ Priority: [High/Medium/Low]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 BUDGET DISTRIBUTION STRATEGY:
• Total Planned Spending: [X] points
• Reserve Fund: [X] points ([X]%)
• Budget After Events: [X] points
• Events Covered: [X]/3 options recommended

🎯 STRATEGIC GOALS:
1. Maximize Member Engagement: Target [X]% participation rate
2. Optimize Budget Utilization: Use [X]% efficiently
3. Maintain Financial Health: Keep [X] points reserve
4. Member Satisfaction: Focus on high-value activities

💡 ADDITIONAL RECOMMENDATIONS:
• [Tip 1 for budget optimization]
• [Tip 2 for increasing participation]
• [Tip 3 for sustainable spending]

⚠️ RISK CONSIDERATIONS:
• Low participation risk: [Mitigation strategy]
• Budget overrun risk: [Prevention measures]
• Emergency fund: Keep [X] points available

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide data-driven recommendations with clear justifications. Balance between member engagement and financial sustainability.`

            userContent = `${userMessage.text}

CLUB WALLET:
${JSON.stringify(wallet, null, 2)}

CLUB MEMBERS (${members.length} total):
${JSON.stringify(members.slice(0, 10), null, 2)}

EXISTING EVENTS:
${JSON.stringify(events, null, 2)}

Please analyze this data and suggest events for the current month (${currentMonth + 1}/${currentYear}) that will:
1. Fully utilize the available points
2. Engage as many club members as possible
3. Provide fair point distribution`
          } catch (error) {
            console.error("Error fetching budget data:", error)
          }
        }
      }
      // 7. Number of Members (UNIVERSITY_STAFF)
      else if (inputLower.includes("number of members") || (inputLower.includes("top") && inputLower.includes("members"))) {
        try {
          const clubsResponse = await fetchClub({ page: 0, size: 500, sort: ["name"] })
          const clubs = Array.isArray(clubsResponse) ? clubsResponse : (clubsResponse as any).data || []

          // Fetch member counts for each club
          interface ClubMemberCount {
            activeMemberCount: number
            approvedEvents: number
          }

          interface ClubWithCounts {
            id: number
            name: string
            description?: string
            majorName?: string
            leaderName?: string
            memberCount?: number
            activeMemberCount: number
            approvedEvents: number
            [key: string]: any
          }

          const clubsWithCounts: ClubWithCounts[] = await Promise.all(
            clubs.map(async (club: any): Promise<ClubWithCounts> => {
              const counts: ClubMemberCount = await getClubMemberCount(club.id)
              return {
                ...club,
                activeMemberCount: counts.activeMemberCount,
                approvedEvents: counts.approvedEvents
              }
            })
          )

          // Sort by member count and get top 10
          const top10 = clubsWithCounts
            .sort((a, b) => b.activeMemberCount - a.activeMemberCount)
            .slice(0, 10)

          systemContent = `You are an AI assistant for a university club and event management system.
Present the top 10 clubs by member count in this BEAUTIFUL format with detailed analysis:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 TOP 10 MOST POPULAR CLUBS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🥇 [Club Name]
   • 👥 Active Members: [X]
   • 🎓 Major/Department: [Major Name]
   • 👨‍💼 Leader: [Leader Name]
   • 📅 Approved Events: [X] events
   • 📊 Events per Member: [X]
   • ⭐ Engagement Score: [High/Medium/Low]

2. 🥈 [Club Name]
   • 👥 Active Members: [X]
   • 🎓 Major/Department: [Major Name]
   • 👨‍💼 Leader: [Leader Name]
   • 📅 Approved Events: [X] events
   • 📊 Events per Member: [X]
   • ⭐ Engagement Score: [High/Medium/Low]

3. 🥉 [Club Name]
   • 👥 Active Members: [X]
   • 🎓 Major/Department: [Major Name]
   • 👨‍💼 Leader: [Leader Name]
   • 📅 Approved Events: [X] events
   • 📊 Events per Member: [X]
   • ⭐ Engagement Score: [High/Medium/Low]

4-10. [Continue with 🏆 emoji for remaining clubs]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 STATISTICAL ANALYSIS:
• Total Members (Top 10): [X] students
• Average Members per Club: [X]
• Largest Club Size: [X] members
• Smallest (in top 10): [X] members
• Total Events Organized: [X] events
• Most Active Club: [Club Name] ([X] events)
• Average Events per Club: [X]

📈 INSIGHTS:
• Most Represented Major: [Major Name] ([X] clubs)
• Member Distribution: [Balanced/Concentrated]
• Event Activity: [High/Moderate/Low]
• Growth Potential: [Analysis of trends]

💡 OBSERVATIONS:
• [Key finding 1 about club popularity]
• [Key finding 2 about major distribution]
• [Key finding 3 about event organization]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide comprehensive analysis with actionable insights. Use emojis 🥇 🥈 🥉 for top 3, and 🏆 for ranks 4-10.`

          userContent = `${userMessage.text}

TOP 10 CLUBS:
${JSON.stringify(top10, null, 2)}

Please present the top 10 clubs with the most members in a clean, organized format with medals for top 3.`
        } catch (error) {
          console.error("Error fetching member counts:", error)
        }
      }
      // 8. Club Applications (UNIVERSITY_STAFF)
      else if (inputLower.includes("club application")) {
        try {
          const applications = await getClubApplications()
          const pendingApplications = applications.filter(app => app.status === "PENDING")
          const clubsResponse = await fetchClub({ page: 0, size: 500, sort: ["name"] })
          const clubs = Array.isArray(clubsResponse) ? clubsResponse : (clubsResponse as any).data || []

          // Group clubs by major
          const clubsByMajor: Record<string, number> = {}
            interface Club {
            majorName?: string | null
            [key: string]: any
            }

            clubs.forEach((club: Club) => {
            const majorName: string = club.majorName || "Unknown"
            clubsByMajor[majorName] = (clubsByMajor[majorName] || 0) + 1
            })

          // Analyze applications by major
          const applicationsByMajor: Record<string, any[]> = {}
          pendingApplications.forEach(app => {
            const majorName = app.majorName || "Unknown"
            if (!applicationsByMajor[majorName]) {
              applicationsByMajor[majorName] = []
            }
            applicationsByMajor[majorName].push(app)
          })

          systemContent = `You are an AI assistant for a university club and event management system.
Analyze club applications comprehensively and suggest approvals based on major diversity, quality, and strategic value.

Present in this format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CLUB APPLICATION ANALYSIS & RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 CURRENT CLUB ECOSYSTEM:

🎓 Distribution by Major:
• [Major Name]: [X] clubs ([X]% of total)
• [Major Name]: [X] clubs ([X]% of total)
[List all majors sorted by club count]

📈 Overall Statistics:
• Total Active Clubs: [X]
• Total Majors Represented: [X]
• Average Clubs per Major: [X]
• Majors with 0 clubs: [List if any]
• Majors with 1 club: [List if any]
• Most Represented Major: [Major Name] ([X] clubs)
• Least Represented Major: [Major Name] ([X] clubs)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ PENDING APPLICATIONS ([X] Total):

For each application, provide detailed analysis:

📝 APPLICATION: [Club Name]
━━━━━━━━━━━━━━━━━━━━━━━━

🏛️ Proposed Club Name: [Name]
🎓 Major/Department: [Major Name]
👤 Proposer: [Name] [Include proposer role/year if available]
📅 Submission Date: [Date if available]

📄 Application Details:
• Vision: [Full vision statement]
• Proposer Reason: [Full reason]
• Description: [Brief description if available]

📊 Context Analysis:
• Current clubs in [Major]: [X] clubs
• Major Representation: [Underrepresented/Balanced/Saturated]
• Similar Existing Clubs: [List if any]
• Uniqueness Factor: [High/Medium/Low]

⭐ Quality Assessment:
• Vision Clarity: [Strong/Moderate/Weak]
• Justification Quality: [Compelling/Adequate/Insufficient]
• Feasibility: [High/Medium/Low]
• Expected Impact: [High/Medium/Low]

🎯 RECOMMENDATION: [✅ STRONGLY APPROVE / ⚠️ APPROVE WITH CONDITIONS / 🔍 NEEDS REVIEW / ❌ DECLINE]

💡 Rationale:
• Diversity Impact: [How this affects major diversity]
• Strategic Value: [Why this matters for the university]
• Risk Assessment: [Any concerns or considerations]
• Conditions (if any): [List specific conditions for approval]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 STRATEGIC RECOMMENDATIONS:

✅ Recommended for Approval ([X] applications):
1. [Club Name] - [Major] - [Primary reason]
2. [Club Name] - [Major] - [Primary reason]

⚠️ Conditional Approval ([X] applications):
1. [Club Name] - [Major] - [Conditions required]

🔍 Requires Further Review ([X] applications):
1. [Club Name] - [Major] - [Concerns to address]

❌ Recommended for Decline ([X] applications):
1. [Club Name] - [Major] - [Reasons]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 DIVERSITY & BALANCE GOALS:

🎯 Priority Focus Areas:
• Underrepresented Majors: [List majors that need more clubs]
• Emerging Interests: [New club types that fill gaps]
• Balance Target: Aim for [X] clubs per major

💡 Long-term Strategy:
• [Recommendation 1 for improving diversity]
• [Recommendation 2 for maintaining quality]
• [Recommendation 3 for sustainable growth]

⚠️ Risk Management:
• Over-saturation Risk: [Majors with too many clubs]
• Quality Concerns: [Applications needing improvement]
• Resource Allocation: [Considerations for support]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 IMPACT PROJECTION:
If all recommended approvals are granted:
• Total Clubs: [Current] → [Projected]
• Majors with Clubs: [Current] → [Projected]
• Diversity Score: [Improvement percentage]
• New Opportunities: [Expected student engagement impact]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide comprehensive, data-driven analysis with clear justifications. Prioritize major diversity while maintaining quality standards. Focus on strategic value and long-term sustainability.`

          userContent = `${userMessage.text}

EXISTING CLUBS BY MAJOR:
${JSON.stringify(clubsByMajor, null, 2)}

PENDING APPLICATIONS:
${JSON.stringify(pendingApplications, null, 2)}

Please analyze the pending applications and recommend which ones to approve based on:
1. Major diversity (prioritize majors with few or no clubs)
2. Quality of vision and proposer reason
3. Balance across the university`
        } catch (error) {
          console.error("Error fetching applications:", error)
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
          className="h-12 w-12 bg-green-200 dark:bg-green-800 shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close chat" : "Open chat"}
          title={isOpen ? "Close chat" : "Open chat"}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* Policy Modal */}
      <PolicyModal isOpen={isPolicyOpen} onClose={() => setIsPolicyOpen(false)} />

      {/* Chatbot Interface */}
      {isOpen && (
        <div className={`fixed bottom-20 right-6 z-1000 ${isExpanded ? 'inset-4 w-auto max-w-[calc(100vw-2rem)]' : 'w-80 max-w-[calc(100vw-2rem)]'}`}>
          {/* Dropdown menu has been moved to the Input + Actions section */}
          <Card className="shadow-xl border-2 overflow-visible">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Uniclub Bot</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-accent"
                      onClick={() => setIsPolicyOpen(true)}
                      aria-label="Chính sách & Hướng dẫn"
                      title="Chính sách & Hướng dẫn"
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </Button>
                  </div>
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
                  prompts={activePrompts}
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