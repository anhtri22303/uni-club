"use client"

import React, { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, Send, Maximize2, Minimize2, ShieldCheck, Trash2 } from "lucide-react"
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
  // Existing prompts
  clubsByMajor: "Clubs by Major: Show me all clubs organized by major, sorted by member count.",
  createClub: "Create Club: I want to create a new club. Suggest a unique club based on existing clubs.",
  eventByMyClub: "Events by My Club: Show me all events from clubs I'm a member of.",
  myClubGift: "My Club Gifts: Show me available products/gifts from my clubs.",
  
  // NEW: Website guide prompts
  websiteGuide: "Website Guide: Explain how UniClub works and what features are available for students.",
  myClubDetails: "My Club Details: Show me detailed information about clubs I'm a member of.",
  myPoints: "My Points: Show me my current points, wallet balance, and how to earn more points.",
  upcomingEvents: "Upcoming Events: Show me all upcoming events I can register for.",
  howToJoinClub: "How to Join: Explain how to join a club and what benefits I get.",
  myActivity: "My Activity: Show me my recent activities, check-ins, and history.",
}

const CLUB_LEADER_PROMPTS = {
  // Existing prompts
  newEventContent: "New Event Content: Suggest a new event with location for my club.",
  myClubGift: "My Club Gifts: Show me products/gifts available for my club members.",
  budgetForEvents: "Budget for Events: Analyze my club's budget and suggest events for this month.",
  
  // NEW: Club management prompts
  clubOverview: "Club Overview: Show me a comprehensive overview of my club's performance and statistics.",
  memberManagement: "Member Management: Show me member statistics, pending applications, and engagement analysis.",
  walletAnalysis: "Wallet Analysis: Analyze my club's wallet, transactions, and point distribution strategy.",
  eventPerformance: "Event Performance: Analyze my club's events performance and attendance rates.",
  leadershipGuide: "Leadership Guide: Provide tips and best practices for effective club leadership.",
  monthlyReport: "Monthly Report: Generate a comprehensive report of my club's activities this month.",
}

const UNIVERSITY_STAFF_PROMPTS = {
  // Existing prompts
  numberOfMembers: "Number of Members: Show me the top 10 clubs with the most members.",
  clubApplication: "Club Applications: Show pending club applications and suggest approvals based on major diversity.",
  
  // NEW: System oversight prompts
  systemOverview: "System Overview: Show comprehensive statistics of all clubs, events, and platform health.",
  eventApprovals: "Event Approvals: Show pending event requests and provide approval recommendations.",
  fundingAnalysis: "Funding Analysis: Analyze point distribution across clubs and recommend funding allocation.",
  clubPerformance: "Club Performance: Compare club performance metrics and identify top performers.",
  platformInsights: "Platform Insights: Provide insights on platform usage, trends, and recommendations.",
  monthlyOverview: "System Monthly Overview: Generate a system-wide monthly report with all key metrics.",
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
  const [userId, setUserId] = useState<string | number | null>(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  // Load user role, userId and clubIds from sessionStorage
  useEffect(() => {
    try {
      const authDataString = sessionStorage.getItem("uniclub-auth")
      if (authDataString) {
        const authData = JSON.parse(authDataString)
        const role = authData.role || authData.userRole || "STUDENT"
        setUserRole(role)
        
        // Set userId for conversation history
        const userIdValue = authData.userId || authData.id
        setUserId(userIdValue)
        console.log("Loaded userId for chatbot:", userIdValue)

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

  // Load conversation history when chatbot opens
  useEffect(() => {
    const loadHistory = async () => {
      if (isOpen && userId && !historyLoaded) {
        try {
          const response = await axios.get<{ messages: any[] }>(`/api/chatbot/history?userId=${userId}`)
          const historyMessages = response.data.messages || []
          
          if (historyMessages.length > 0) {
            // Convert history to Message format and prepend to messages (exclude welcome message)
            const convertedMessages: Message[] = historyMessages.reverse().map((msg: any, index: number) => ({
              id: `history-${index}`,
              text: msg.content,
              isUser: msg.role === 'user',
              timestamp: new Date(msg.timestamp),
            }))
            
            // Add welcome message first, then history
            setMessages([
              {
                id: "1",
                text: "Hello! I am UniBot AI assistant. How can I help you?",
                isUser: false,
                timestamp: new Date(),
              },
              ...convertedMessages
            ])
            console.log(`Loaded ${historyMessages.length} messages from history`)
          }
          setHistoryLoaded(true)
        } catch (error) {
          console.error("Error loading conversation history:", error)
          setHistoryLoaded(true) // Mark as loaded even on error to prevent retry
        }
      }
    }

    loadHistory()
  }, [isOpen, userId, historyLoaded])

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

  FINANCIAL HEALTH:
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
      // 7. Club Overview (CLUB_LEADER - NEW)
      else if (inputLower.includes("club overview") || (inputLower.includes("club") && inputLower.includes("performance"))) {
        if (clubIds.length === 0) {
          systemContent = "You are a helpful assistant."
          userContent = "The user is not associated with any club. Please inform them politely."
        } else {
          try {
            const clubId = clubIds[0]
            const club = await getClubById(clubId)
            const members = await getMembersByClubId(clubId)
            const events = await getEventByClubId(clubId)
            const wallet = await getClubWallet(clubId)
            const { getProducts } = await import("@/service/productApi")
            const products = await getProducts(clubId, { includeInactive: true })

            // Calculate statistics
            const activeMembers = members.filter((m: any) => m.state === "ACTIVE").length
            const pendingMembers = members.filter((m: any) => m.state === "PENDING").length
            const staffMembers = members.filter((m: any) => m.staff === true).length
            
            const now = new Date()
            const upcomingEvents = events.filter((e: any) => new Date(e.date) > now)
            const pastEvents = events.filter((e: any) => new Date(e.date) <= now)
            const approvedEvents = events.filter((e: any) => e.status === "APPROVED")
            
            const activeProducts = products.filter((p: any) => p.status === "ACTIVE").length

            systemContent = `You are an AI assistant for a university club and event management system.
Provide a comprehensive club overview in this format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ CLUB OVERVIEW & PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 BASIC INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━

• 🏛️ Club Name: ${club.data.name}
• 🎓 Major/Department: ${club.data.majorName || "N/A"}
• 👨‍💼 Leader: ${club.data.leaderName || "N/A"}
• 📝 Description: ${club.data.description || "N/A"}
• 🆔 Club ID: ${club.data.id}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 MEMBERSHIP STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Current Status:
• ✅ Active Members: ${activeMembers} students
• ⏳ Pending Applications: ${pendingMembers} students
• 👔 Staff Members: ${staffMembers} (leadership team)
• 📈 Total Members: ${members.length} students

👥 Member Engagement:
• Staff Ratio: ${members.length > 0 ? Math.round((staffMembers / members.length) * 100) : 0}% of total
• Application Rate: ${activeMembers > 0 ? Math.round((pendingMembers / (activeMembers + pendingMembers)) * 100) : 0}% pending
• Growth Potential: ${pendingMembers > 0 ? "Growing" : "Stable"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 EVENT PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Event Overview:
• Total Events: ${events.length}
• ✅ Approved Events: ${approvedEvents.length}
• 📅 Upcoming Events: ${upcomingEvents.length}
• ✔️ Past Events: ${pastEvents.length}
• 📊 Approval Rate: ${events.length > 0 ? Math.round((approvedEvents.length / events.length) * 100) : 0}%

📈 Event Activity:
• Events per Member: ${activeMembers > 0 ? (events.length / activeMembers).toFixed(2) : 0}
• Monthly Average: ${Math.round(events.length / 12)} events/month
• Activity Level: ${events.length > 20 ? "Very High" : events.length > 10 ? "High" : events.length > 5 ? "Moderate" : "Low"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 FINANCIAL HEALTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💎 Wallet Status:
• Current Balance: ${wallet.balancePoints || 0} points
• Wallet ID: ${wallet.walletId}
• Financial Health: ${wallet.balancePoints > 5000 ? "Excellent" : wallet.balancePoints > 2000 ? "Good" : wallet.balancePoints > 500 ? "Fair" : "Needs Attention"}

📊 Budget Analysis:
• Points per Member: ${activeMembers > 0 ? Math.round((wallet.balancePoints || 0) / activeMembers) : 0} pts/member
• Recommended Reserve: ${Math.round((wallet.balancePoints || 0) * 0.2)} points (20%)
• Available for Events: ${Math.round((wallet.balancePoints || 0) * 0.8)} points (80%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎁 REWARDS & PRODUCTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Product Inventory:
• Total Products: ${products.length}
• Active Products: ${activeProducts}
• Inactive Products: ${products.length - activeProducts}
• Product Variety: ${products.length > 10 ? "Excellent" : products.length > 5 ? "Good" : "Limited"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 PERFORMANCE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⭐ Overall Health Score: ${(() => {
  let score = 0
  if (activeMembers > 20) score += 25
  else if (activeMembers > 10) score += 15
  else if (activeMembers > 5) score += 10
  
  if (events.length > 10) score += 25
  else if (events.length > 5) score += 15
  else if (events.length > 2) score += 10
  
  if ((wallet.balancePoints || 0) > 2000) score += 25
  else if ((wallet.balancePoints || 0) > 500) score += 15
  else if ((wallet.balancePoints || 0) > 100) score += 10
  
  if (activeProducts > 5) score += 25
  else if (activeProducts > 2) score += 15
  else if (activeProducts > 0) score += 10
  
  return score
})()}/100

Performance Breakdown:
• Membership: ${activeMembers > 20 ? "⭐⭐⭐⭐⭐ Excellent" : activeMembers > 10 ? "⭐⭐⭐⭐ Good" : activeMembers > 5 ? "⭐⭐⭐ Fair" : "⭐⭐ Needs Growth"}
• Events: ${events.length > 10 ? "⭐⭐⭐⭐⭐ Excellent" : events.length > 5 ? "⭐⭐⭐⭐ Good" : events.length > 2 ? "⭐⭐⭐ Fair" : "⭐⭐ Needs More Events"}
• Finance: ${(wallet.balancePoints || 0) > 2000 ? "⭐⭐⭐⭐⭐ Excellent" : (wallet.balancePoints || 0) > 500 ? "⭐⭐⭐⭐ Good" : (wallet.balancePoints || 0) > 100 ? "⭐⭐⭐ Fair" : "⭐⭐ Needs Funding"}
• Products: ${activeProducts > 5 ? "⭐⭐⭐⭐⭐ Excellent" : activeProducts > 2 ? "⭐⭐⭐⭐ Good" : activeProducts > 0 ? "⭐⭐⭐ Fair" : "⭐⭐ Needs Products"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 STRATEGIC RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on your club's current status:

✅ Strengths:
${activeMembers > 20 ? "• Strong membership base" : ""}
${events.length > 10 ? "• Active event organization" : ""}
${(wallet.balancePoints || 0) > 2000 ? "• Healthy financial status" : ""}
${activeProducts > 5 ? "• Good product variety" : ""}

📈 Areas for Improvement:
${activeMembers <= 10 ? "• Focus on member recruitment campaigns" : ""}
${events.length <= 5 ? "• Increase event frequency and variety" : ""}
${(wallet.balancePoints || 0) <= 500 ? "• Request additional funding from university" : ""}
${activeProducts <= 2 ? "• Expand reward product offerings" : ""}

🎯 Action Items:
${pendingMembers > 0 ? `• Review ${pendingMembers} pending applications` : ""}
${upcomingEvents.length > 0 ? `• Prepare for ${upcomingEvents.length} upcoming events` : "• Plan new events for next month"}
${(wallet.balancePoints || 0) > 1000 ? "• Consider member reward distribution" : "• Plan budget request"}
${activeProducts < 5 ? "• Add more reward products for members" : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 QUICK ACCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need more details? Ask me:
• "Show member management" - Detailed member analysis
• "Show wallet analysis" - Financial breakdown
• "Show event performance" - Event metrics
• "Generate monthly report" - Comprehensive report

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

            userContent = userMessage.text
          } catch (error) {
            console.error("Error fetching club overview:", error)
          }
        }
      }
      // 8. Member Management (CLUB_LEADER - NEW)
      else if (inputLower.includes("member management") || (inputLower.includes("member") && (inputLower.includes("statistic") || inputLower.includes("analysis")))) {
        if (clubIds.length === 0) {
          systemContent = "You are a helpful assistant."
          userContent = "The user is not associated with any club. Please inform them politely."
        } else {
          try {
            const clubId = clubIds[0]
            const members = await getMembersByClubId(clubId)
            const { getMemberApplyByClubId } = await import("@/service/memberApplicationApi")
            const applications = await getMemberApplyByClubId(clubId)

            // Analyze members
            const activeMembers = members.filter((m: any) => m.state === "ACTIVE")
            const pendingMembers = members.filter((m: any) => m.state === "PENDING")
            const staffMembers = activeMembers.filter((m: any) => m.staff === true)
            const regularMembers = activeMembers.filter((m: any) => !m.staff)

            // Group by major
            const membersByMajor: Record<string, number> = {}
            activeMembers.forEach((m: any) => {
              const major = m.major || "Unknown"
              membersByMajor[major] = (membersByMajor[major] || 0) + 1
            })

            // Analyze applications
            const pendingApps = applications.filter((a: any) => a.status === "PENDING")
            const approvedApps = applications.filter((a: any) => a.status === "APPROVED")
            const rejectedApps = applications.filter((a: any) => a.status === "REJECTED")

            systemContent = `You are an AI assistant for a university club and event management system.
Provide comprehensive member management analysis in this format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 MEMBER MANAGEMENT DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 MEMBERSHIP OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━

Current Status:
• Total Members: ${members.length}
• ✅ Active Members: ${activeMembers.length}
• ⏳ Pending Approval: ${pendingMembers.length}
• 👔 Staff Members: ${staffMembers.length}
• 👥 Regular Members: ${regularMembers.length}

Member Distribution:
• Staff Ratio: ${members.length > 0 ? Math.round((staffMembers.length / members.length) * 100) : 0}%
• Active Ratio: ${members.length > 0 ? Math.round((activeMembers.length / members.length) * 100) : 0}%
• Pending Ratio: ${members.length > 0 ? Math.round((pendingMembers.length / members.length) * 100) : 0}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎓 MAJOR DISTRIBUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Member Diversity:
${Object.entries(membersByMajor)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .map(([major, count], index) => `${index + 1}. ${major}: ${count} members (${Math.round(((count as number) / activeMembers.length) * 100)}%)`)
  .join("\n")}

Diversity Score: ${Object.keys(membersByMajor).length} majors represented
${Object.keys(membersByMajor).length > 5 ? "⭐⭐⭐⭐⭐ Excellent diversity" : Object.keys(membersByMajor).length > 3 ? "⭐⭐⭐⭐ Good diversity" : "⭐⭐⭐ Consider recruiting from more majors"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 APPLICATION MANAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Application Statistics:
• Total Applications: ${applications.length}
• ⏳ Pending Review: ${pendingApps.length}
• ✅ Approved: ${approvedApps.length}
• ❌ Rejected: ${rejectedApps.length}
• Approval Rate: ${applications.length > 0 ? Math.round((approvedApps.length / applications.length) * 100) : 0}%

${pendingApps.length > 0 ? `⚠️ ACTION REQUIRED: ${pendingApps.length} applications waiting for review` : "✅ No pending applications"}

Recent Pending Applications:
${pendingApps.slice(0, 5).map((app: any, index: number) => `${index + 1}. ${app.fullName || "Applicant"} - ${app.major || "Unknown Major"}
   Applied: ${new Date(app.createdAt || "").toLocaleDateString()}
   Message: "${app.applicationText || "No message"}"
`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👔 LEADERSHIP TEAM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Staff Members (${staffMembers.length}):
${staffMembers.slice(0, 10).map((staff: any, index: number) => `${index + 1}. ${staff.fullName || "Staff Member"}
   • Major: ${staff.major || "Unknown"}
   • Role: ${staff.clubRole || "STAFF"}
   • Joined: ${staff.joinedDate ? new Date(staff.joinedDate).toLocaleDateString() : "N/A"}
`).join("\n")}

Leadership Analysis:
• Staff-to-Member Ratio: 1:${regularMembers.length > 0 ? Math.round(regularMembers.length / staffMembers.length) : 0}
• Recommended Staff: ${Math.ceil(activeMembers.length / 10)} (1 staff per 10 members)
• Current Coverage: ${staffMembers.length >= Math.ceil(activeMembers.length / 10) ? "✅ Adequate" : "⚠️ Consider adding more staff"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 ENGAGEMENT METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Member Activity:
• Active Participation: ${members.length > 0 ? Math.round((activeMembers.length / members.length) * 100) : 0}%
• Staff Engagement: ${staffMembers.length > 0 ? "High" : "Needs Improvement"}
• Application Interest: ${pendingApps.length > 5 ? "Very High" : pendingApps.length > 2 ? "Moderate" : "Low"}

Growth Trends:
• Pending Applications: ${pendingApps.length > 0 ? "📈 Growing" : "📊 Stable"}
• Member Retention: ${activeMembers.length > 0 ? "Good" : "Needs Attention"}
• Leadership Development: ${staffMembers.length >= 3 ? "✅ Strong" : "⚠️ Build team"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 MANAGEMENT RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Immediate Actions:
${pendingApps.length > 0 ? `• Review and process ${pendingApps.length} pending applications` : ""}
${pendingMembers.length > 0 ? `• Approve or contact ${pendingMembers.length} pending members` : ""}
${staffMembers.length < 3 ? "• Recruit additional staff members for leadership team" : ""}
${Object.keys(membersByMajor).length < 3 ? "• Launch recruitment campaign for underrepresented majors" : ""}

Strategic Initiatives:
• ${activeMembers.length < 20 ? "Plan member recruitment drive" : "Maintain current membership level"}
• ${staffMembers.length < Math.ceil(activeMembers.length / 10) ? "Identify and promote potential staff members" : "Continue leadership development"}
• ${Object.keys(membersByMajor).length < 5 ? "Increase major diversity through targeted outreach" : "Maintain diverse membership base"}

Engagement Strategies:
• Regular communication with all members
• Recognition program for active participants
• Feedback collection from members
• Staff training and development sessions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 DETAILED VIEWS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For more specific information:
• Go to "Members" page for full member list
• Go to "Applications" page to process pending applications
• Use "Points" page to reward active members
• Check member profiles for individual details

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

            userContent = userMessage.text
          } catch (error) {
            console.error("Error fetching member management data:", error)
          }
        }
      }
      // 9. Wallet Analysis (CLUB_LEADER - NEW)
      else if (inputLower.includes("wallet analysis") || (inputLower.includes("wallet") && (inputLower.includes("transaction") || inputLower.includes("analysis")))) {
        if (clubIds.length === 0) {
          systemContent = "You are a helpful assistant."
          userContent = "The user is not associated with any club. Please inform them politely."
        } else {
          try {
            const clubId = clubIds[0]
            const wallet = await getClubWallet(clubId)
            const { getWalletTransactions } = await import("@/service/walletApi")
            const transactions = wallet.walletId ? await getWalletTransactions(wallet.walletId) : []
            const members = await getMembersByClubId(clubId)
            const activeMembers = members.filter((m: any) => m.state === "ACTIVE").length

            // Analyze transactions
            const now = new Date()
            const thisMonth = transactions.filter((t: any) => {
              const tDate = new Date(t.createdAt)
              return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
            })
            
            const pointsReceived = transactions.filter((t: any) => t.amount > 0).reduce((sum: number, t: any) => sum + t.amount, 0)
            const pointsSpent = Math.abs(transactions.filter((t: any) => t.amount < 0).reduce((sum: number, t: any) => sum + t.amount, 0))
            const rewardTransactions = transactions.filter((t: any) => t.type.includes("REWARD")).length
            const topupTransactions = transactions.filter((t: any) => t.type.includes("TOPUP") || t.type.includes("UNIVERSITY")).length

            systemContent = `You are an AI assistant for a university club and event management system.
Provide comprehensive wallet analysis in this format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 CLUB WALLET ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💎 CURRENT FINANCIAL STATUS
━━━━━━━━━━━━━━━━━━━━━━━━

Wallet Overview:
• Balance: ${wallet.balancePoints || 0} points
• Wallet ID: ${wallet.walletId}
• Club: ${wallet.clubName || "N/A"}
• Financial Health: ${(wallet.balancePoints || 0) > 5000 ? "⭐⭐⭐⭐⭐ Excellent" : (wallet.balancePoints || 0) > 2000 ? "⭐⭐⭐⭐ Good" : (wallet.balancePoints || 0) > 500 ? "⭐⭐⭐ Fair" : "⭐⭐ Needs Funding"}

Per Member Analysis:
• Active Members: ${activeMembers}
• Points per Member: ${activeMembers > 0 ? Math.round((wallet.balancePoints || 0) / activeMembers) : 0} pts
• Recommended per Member: 50-100 points
• Status: ${activeMembers > 0 && ((wallet.balancePoints || 0) / activeMembers) > 100 ? "✅ Above average" : activeMembers > 0 && ((wallet.balancePoints || 0) / activeMembers) > 50 ? "✅ Adequate" : "⚠️ Below recommended"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TRANSACTION HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Statistics:
• Total Transactions: ${transactions.length}
• Points Received: +${pointsReceived} pts
• Points Spent: -${pointsSpent} pts
• Net Flow: ${pointsReceived - pointsSpent > 0 ? "+" : ""}${pointsReceived - pointsSpent} pts
• Reward Transactions: ${rewardTransactions}
• Funding Transactions: ${topupTransactions}

This Month Activity:
• Transactions: ${thisMonth.length}
• Points Received: +${thisMonth.filter((t: any) => t.amount > 0).reduce((sum: number, t: any) => sum + t.amount, 0)} pts
• Points Spent: -${Math.abs(thisMonth.filter((t: any) => t.amount < 0).reduce((sum: number, t: any) => sum + t.amount, 0))} pts
• Activity Level: ${thisMonth.length > 10 ? "Very High" : thisMonth.length > 5 ? "High" : thisMonth.length > 2 ? "Moderate" : "Low"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 RECENT TRANSACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Last 10 Transactions:
${transactions.slice(0, 10).map((t: any, index: number) => {
  const date = new Date(t.createdAt).toLocaleString()
  const emoji = t.amount > 0 ? "📈" : "📉"
  return `${index + 1}. ${emoji} ${t.type}
   • Amount: ${t.signedAmount} points
   • ${t.amount > 0 ? "From" : "To"}: ${t.senderName || t.receiverName || "System"}
   • Description: ${t.description || "N/A"}
   • Date: ${date}`
}).join("\n\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 SPENDING PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transaction Analysis:
• Reward Frequency: ${transactions.length > 0 ? Math.round((rewardTransactions / transactions.length) * 100) : 0}%
• Average Transaction: ${transactions.length > 0 ? Math.round((pointsReceived + pointsSpent) / transactions.length) : 0} pts
• Spending Rate: ${pointsReceived > 0 ? Math.round((pointsSpent / pointsReceived) * 100) : 0}% of income

Financial Behavior:
• Spending Habit: ${pointsSpent > pointsReceived ? "⚠️ Spending more than receiving" : "✅ Balanced/Saving"}
• Transaction Frequency: ${transactions.length > 20 ? "Very Active" : transactions.length > 10 ? "Active" : "Moderate"}
• Member Rewards: ${rewardTransactions > 10 ? "Generous" : rewardTransactions > 5 ? "Regular" : "Conservative"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 BUDGET RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Budget Allocation:
• Recommended Reserve: ${Math.round((wallet.balancePoints || 0) * 0.2)} points (20%)
• Available for Events: ${Math.round((wallet.balancePoints || 0) * 0.5)} points (50%)
• Available for Rewards: ${Math.round((wallet.balancePoints || 0) * 0.3)} points (30%)

Strategic Recommendations:
${(wallet.balancePoints || 0) > 5000 ? "• ✅ Strong financial position - plan major initiatives" : ""}
${(wallet.balancePoints || 0) > 2000 && (wallet.balancePoints || 0) <= 5000 ? "• ✅ Good balance - maintain regular activities" : ""}
${(wallet.balancePoints || 0) <= 500 ? "• ⚠️ Low balance - request additional funding" : ""}
${pointsSpent > pointsReceived ? "• ⚠️ Spending exceeds income - review expenses" : ""}
${rewardTransactions < 5 ? "• Consider increasing member rewards for engagement" : ""}
${thisMonth.length < 3 ? "• Increase transaction activity for member engagement" : ""}

Point Distribution Strategy:
• Event Budget: ${ Math.round((wallet.balancePoints || 0) * 0.5 / Math.max(activeMembers, 1))} pts/member
• Reward Budget: ${Math.round((wallet.balancePoints || 0) * 0.3 / Math.max(activeMembers, 1))} pts/member
• Emergency Reserve: ${Math.round((wallet.balancePoints || 0) * 0.2)} pts total

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ACTION ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Immediate Actions:
${(wallet.balancePoints || 0) < 500 ? "• Submit funding request to university" : ""}
${rewardTransactions < 5 ? "• Plan member reward distribution" : ""}
${thisMonth.length < 3 ? "• Increase club activity and point transactions" : ""}

Long-term Planning:
• Monitor monthly spending trends
• Plan quarterly budget reviews
• Set financial goals for next semester
• Develop sustainable funding strategy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 DETAILED ACCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For more information:
• Go to "Points" page for reward distribution
• Check "Events" page for event budgets
• View "Dashboard" for financial overview
• Request funding from university staff if needed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

            userContent = userMessage.text
          } catch (error) {
            console.error("Error fetching wallet analysis:", error)
          }
        }
      }
      // 10. Event Performance (CLUB_LEADER - NEW)
      else if (inputLower.includes("event performance") || (inputLower.includes("event") && (inputLower.includes("analysis") || inputLower.includes("metric")))) {
        if (clubIds.length === 0) {
          systemContent = "You are a helpful assistant."
          userContent = "The user is not associated with any club. Please inform them politely."
        } else {
          try {
            const clubId = clubIds[0]
            const events = await getEventByClubId(clubId)
            const members = await getMembersByClubId(clubId)
            const activeMembers = members.filter((m: any) => m.state === "ACTIVE").length

            // Analyze events
            const now = new Date()
            const approvedEvents = events.filter((e: any) => e.status === "APPROVED")
            const pendingEvents = events.filter((e: any) => e.status === "PENDING")
            const upcomingEvents = events.filter((e: any) => new Date(e.date) > now && e.status === "APPROVED")
            const pastEvents = events.filter((e: any) => new Date(e.date) <= now)
            const completedEvents = pastEvents.filter((e: any) => e.status === "APPROVED")

            // Calculate metrics
            const totalBudget = events.reduce((sum: number, e: any) => sum + (e.budgetPoints || 0), 0)
            const totalCommitPoints = events.reduce((sum: number, e: any) => sum + (e.commitPointCost || 0), 0)
            const avgBudgetPerEvent = events.length > 0 ? Math.round(totalBudget / events.length) : 0
            const avgAttendeesPerEvent = events.length > 0 ? Math.round(events.reduce((sum: number, e: any) => sum + (e.maxCheckInCount || 0), 0) / events.length) : 0

            systemContent = `You are an AI assistant for a university club and event management system.
Provide comprehensive event performance analysis in this format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 EVENT PERFORMANCE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 EVENT OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━

Overall Statistics:
• Total Events: ${events.length}
• ✅ Approved Events: ${approvedEvents.length}
• ⏳ Pending Approval: ${pendingEvents.length}
• 📅 Upcoming Events: ${upcomingEvents.length}
• ✔️ Completed Events: ${completedEvents.length}
• 📊 Approval Rate: ${events.length > 0 ? Math.round((approvedEvents.length / events.length) * 100) : 0}%

Event Activity:
• Events per Month: ${Math.round(events.length / 12)}
• Events per Member: ${activeMembers > 0 ? (events.length / activeMembers).toFixed(2) : 0}
• Activity Level: ${events.length > 20 ? "⭐⭐⭐⭐⭐ Very Active" : events.length > 10 ? "⭐⭐⭐⭐ Active" : events.length > 5 ? "⭐⭐⭐ Moderate" : "⭐⭐ Needs More Events"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 FINANCIAL METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Budget Analysis:
• Total Budget Allocated: ${totalBudget} points
• Total Commit Points Required: ${totalCommitPoints} points
• Average Budget per Event: ${avgBudgetPerEvent} points
• Budget Efficiency: ${totalBudget > 0 ? "Well-planned" : "Needs funding"}

Investment per Member:
• Budget per Member: ${activeMembers > 0 ? Math.round(totalBudget / activeMembers) : 0} pts
• Events per Member: ${activeMembers > 0 ? (events.length / activeMembers).toFixed(2) : 0}
• ROI Indicator: ${avgBudgetPerEvent > 0 && avgAttendeesPerEvent > 0 ? Math.round(avgBudgetPerEvent / avgAttendeesPerEvent) : 0} pts/attendee

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 EVENT TIMELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Event Distribution:
• 📅 Upcoming: ${upcomingEvents.length} events
• ✔️ Past/Completed: ${completedEvents.length} events
• ⏳ Pending Approval: ${pendingEvents.length} events

Next Upcoming Events:
${upcomingEvents.slice(0, 5).map((event: any, index: number) => `${index + 1}. 🎉 ${event.name}
   • Date: ${new Date(event.date).toLocaleDateString()}
   • Type: ${event.type || "N/A"}
   • Max Attendees: ${event.maxCheckInCount || 0}
   • Budget: ${event.budgetPoints || 0} points
   • Commit Points: ${event.commitPointCost || 0} points
`).join("\n")}

${upcomingEvents.length === 0 ? "⚠️ No upcoming events scheduled - plan new events!" : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 PARTICIPATION METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Attendance Planning:
• Average Max Capacity: ${avgAttendeesPerEvent} attendees/event
• Total Capacity (All Events): ${events.reduce((sum: number, e: any) => sum + (e.maxCheckInCount || 0), 0)} attendees
• Capacity Utilization: ${events.length > 0 ? "Planned" : "N/A"}

Engagement Metrics:
• Expected Reach: ${Math.min(avgAttendeesPerEvent * upcomingEvents.length, activeMembers)} members
• Participation Rate: ${activeMembers > 0 ? Math.round((Math.min(avgAttendeesPerEvent * upcomingEvents.length, activeMembers) / activeMembers) * 100) : 0}%
• Member Coverage: ${activeMembers > 0 && avgAttendeesPerEvent > 0 ? `1 event per ${Math.round(activeMembers / avgAttendeesPerEvent)} members` : "N/A"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 PERFORMANCE INDICATORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Key Performance Indicators:
• Event Organization: ${events.length > 10 ? "⭐⭐⭐⭐⭐ Excellent" : events.length > 5 ? "⭐⭐⭐⭐ Good" : events.length > 2 ? "⭐⭐⭐ Fair" : "⭐⭐ Needs Improvement"}
• Approval Efficiency: ${approvedEvents.length > (events.length * 0.8) ? "⭐⭐⭐⭐⭐ Excellent" : approvedEvents.length > (events.length * 0.6) ? "⭐⭐⭐⭐ Good" : "⭐⭐⭐ Fair"}
• Budget Management: ${totalBudget > 0 ? "⭐⭐⭐⭐⭐ Active" : "⭐⭐ Needs Planning"}
• Member Engagement: ${avgAttendeesPerEvent > 30 ? "⭐⭐⭐⭐⭐ High" : avgAttendeesPerEvent > 15 ? "⭐⭐⭐⭐ Good" : "⭐⭐⭐ Moderate"}

Overall Event Score: ${(() => {
  let score = 0
  if (events.length > 10) score += 25
  else if (events.length > 5) score += 15
  else if (events.length > 2) score += 10
  
  if (approvedEvents.length > (events.length * 0.8)) score += 25
  else if (approvedEvents.length > (events.length * 0.6)) score += 15
  
  if (totalBudget > 0) score += 25
  if (avgAttendeesPerEvent > 20) score += 25
  else if (avgAttendeesPerEvent > 10) score += 15
  
  return score
})()}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 STRATEGIC RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Strengths:
${events.length > 10 ? "• ✅ High event organization rate" : ""}
${approvedEvents.length > (events.length * 0.8) ? "• ✅ Excellent approval rate" : ""}
${upcomingEvents.length > 3 ? "• ✅ Good pipeline of upcoming events" : ""}
${totalBudget > 5000 ? "• ✅ Strong budget allocation" : ""}

Areas for Improvement:
${events.length <= 5 ? "• Increase event frequency (aim for 1-2 events per month)" : ""}
${pendingEvents.length > 3 ? "• Speed up event approval process" : ""}
${upcomingEvents.length === 0 ? "• Schedule upcoming events to maintain momentum" : ""}
${avgAttendeesPerEvent < 15 ? "• Increase event capacity for better member engagement" : ""}

Action Items:
${pendingEvents.length > 0 ? `• Follow up on ${pendingEvents.length} pending event approvals` : ""}
${upcomingEvents.length < 2 ? "• Plan at least 2-3 events for next month" : ""}
${totalBudget < 1000 ? "• Request budget increase for more events" : ""}
${events.length < 12 ? "• Aim for at least 1 event per month" : ""}

Event Planning Tips:
• Diversify event types (workshops, competitions, social gatherings)
• Plan events 2-4 weeks in advance
• Balance small and large scale events
• Consider member feedback for event ideas
• Track attendance to optimize future planning

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 DETAILED INSIGHTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For more information:
• Go to "Events" page for full event management
• Check "Dashboard" for visual event analytics
• Review individual event details for performance data
• Ask "Suggest new event" for event ideas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

            userContent = userMessage.text
          } catch (error) {
            console.error("Error fetching event performance:", error)
          }
        }
      }
      // 11. Leadership Guide (CLUB_LEADER - NEW)
      else if (inputLower.includes("leadership guide") || (inputLower.includes("leadership") && inputLower.includes("tip"))) {
        systemContent = `You are UniBot, an AI assistant for the UniClub platform.
Provide comprehensive leadership guidance for club leaders:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 CLUB LEADERSHIP GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Welcome to your comprehensive guide for effective club leadership!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CORE RESPONSIBILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 👥 MEMBER MANAGEMENT
   • Review and approve/reject membership applications promptly
   • Build and maintain a strong leadership team (staff members)
   • Recognize and reward active members regularly
   • Address member concerns and feedback
   • Foster an inclusive and welcoming environment

2. 🎉 EVENT ORGANIZATION
   • Plan diverse and engaging events (1-2 per month recommended)
   • Submit event proposals with clear goals and budgets
   • Promote events effectively to maximize attendance
   • Coordinate event logistics and resources
   • Follow up with post-event evaluations

3. 💰 FINANCIAL MANAGEMENT
   • Monitor club wallet balance regularly
   • Allocate budget strategically across events and rewards
   • Maintain 20% reserve fund for emergencies
   • Track all transactions and expenditures
   • Request additional funding when needed

4. 📊 PERFORMANCE TRACKING
   • Monitor club growth and member engagement
   • Review event attendance and feedback
   • Analyze point distribution patterns
   • Set goals and track progress
   • Report to university staff as required

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 BEST PRACTICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Member Engagement:
• ✅ Respond to applications within 48 hours
• ✅ Send welcome messages to new members
• ✅ Create member recognition programs
• ✅ Collect feedback regularly
• ✅ Celebrate member achievements
• ❌ Don't ignore pending applications
• ❌ Don't play favorites among members
• ❌ Don't neglect inactive members

Event Planning:
• ✅ Plan events 2-4 weeks in advance
• ✅ Set clear objectives for each event
• ✅ Budget realistically with contingency
• ✅ Promote through multiple channels
• ✅ Have backup plans for issues
• ❌ Don't over-schedule events
• ❌ Don't underestimate costs
• ❌ Don't skip post-event follow-up

Financial Management:
• ✅ Keep detailed transaction records
• ✅ Maintain minimum reserve balance
• ✅ Distribute rewards fairly and transparently
• ✅ Plan budget for full semester
• ✅ Request funding early when needed
• ❌ Don't overspend on single events
• ❌ Don't hoard points unnecessarily
• ❌ Don't make unplanned large expenditures

Communication:
• ✅ Hold regular meetings with staff
• ✅ Keep members informed of activities
• ✅ Be transparent about decisions
• ✅ Listen actively to feedback
• ✅ Document important discussions
• ❌ Don't make unilateral major decisions
• ❌ Don't withhold important information
• ❌ Don't ignore member concerns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 LEADERSHIP STRATEGIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Building a Strong Team:
1. Identify potential leaders among active members
2. Delegate responsibilities to staff members
3. Provide training and support for new staff
4. Foster collaboration and teamwork
5. Recognize and appreciate team contributions

Growing Your Club:
1. Recruit from diverse majors and backgrounds
2. Create compelling event offerings
3. Build partnerships with other clubs
4. Leverage social media and word-of-mouth
5. Showcase member success stories

Maintaining Momentum:
1. Set short-term and long-term goals
2. Celebrate milestones and achievements
3. Introduce new activities regularly
4. Adapt to member interests and feedback
5. Stay connected with university staff

Handling Challenges:
1. Address conflicts promptly and fairly
2. Seek advice from university staff when needed
3. Learn from setbacks and mistakes
4. Stay positive and resilient
5. Focus on solutions, not problems

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 MONTHLY LEADERSHIP CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Week 1:
☐ Review and process membership applications
☐ Check wallet balance and plan budget
☐ Plan upcoming month's events
☐ Meet with staff team

Week 2:
☐ Submit event proposals for approval
☐ Review member engagement metrics
☐ Address any pending member issues
☐ Promote upcoming events

Week 3:
☐ Coordinate event logistics
☐ Distribute member rewards if applicable
☐ Collect feedback from recent activities
☐ Update club information as needed

Week 4:
☐ Review monthly performance
☐ Plan improvements for next month
☐ Recognize outstanding members
☐ Prepare reports if required

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 LEADERSHIP PRINCIPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🎯 LEAD BY EXAMPLE
   Show the dedication and enthusiasm you want from members

2. 👂 LISTEN ACTIVELY
   Value member input and feedback in decision-making

3. 🤝 COLLABORATE
   Work with your team rather than dictating alone

4. 📈 STAY ORGANIZED
   Keep track of tasks, deadlines, and responsibilities

5. 🌟 INSPIRE OTHERS
   Create a positive vision that motivates participation

6. 💪 BE RESILIENT
   Handle setbacks gracefully and keep moving forward

7. 🎓 KEEP LEARNING
   Continuously improve your leadership skills

8. ⚖️ BE FAIR
   Treat all members equitably and transparently

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 USING UNICLUB TOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dashboard:
• Monitor key metrics and statistics
• Track club performance trends
• View upcoming deadlines

Members Page:
• Review and approve applications
• Manage staff assignments
• View member profiles and activity

Events Page:
• Create and submit event proposals
• Track event status and attendance
• Manage event registrations

Points Page:
• Distribute rewards to members
• Apply penalties for violations
• View transaction history

Reports:
• Generate activity reports
• Analyze member engagement
• Track budget utilization

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ COMMON QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q: How do I handle difficult members?
A: Address issues privately, document concerns, apply penalties if needed, and consult university staff for serious cases.

Q: What if my club is running low on points?
A: Request additional funding from university staff, reduce event frequency temporarily, or focus on low-cost activities.

Q: How can I increase member engagement?
A: Offer diverse events, recognize active members, collect and act on feedback, and create more opportunities for participation.

Q: Should I accept all membership applications?
A: Evaluate each application based on the member's motivation and fit with club values. It's okay to reject if there are concerns.

Q: How do I manage conflict with staff members?
A: Communicate openly, listen to all perspectives, find common ground, and make decisions based on club's best interests.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎓 CONTINUOUS IMPROVEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Regular Self-Assessment:
• Am I communicating effectively with members?
• Are events meeting member expectations?
• Is financial management transparent?
• Am I developing future leaders?
• Is the club achieving its goals?

Seek Feedback:
• Conduct member surveys quarterly
• Hold open forums for discussion
• Review event feedback forms
• Meet one-on-one with staff
• Stay open to constructive criticism

Learn from Others:
• Connect with other club leaders
• Attend leadership workshops
• Read leadership resources
• Share best practices
• Learn from successful clubs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need specific advice? Ask me:
• "Show club overview" - Review current status
• "Show member management" - Member strategies
• "Show wallet analysis" - Financial guidance
• "Show event performance" - Event planning tips

Remember: Great leaders are made, not born. Keep learning, stay committed, and your club will thrive! 👑✨

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

        userContent = userMessage.text
      }
      // 12. Monthly Report (CLUB_LEADER - NEW)
      else if (inputLower.includes("monthly report") || (inputLower.includes("report") && inputLower.includes("month"))) {
        if (clubIds.length === 0) {
          systemContent = "You are a helpful assistant."
          userContent = "The user is not associated with any club. Please inform them politely."
        } else {
          try {
            const clubId = clubIds[0]
            const club = await getClubById(clubId)
            const members = await getMembersByClubId(clubId)
            const events = await getEventByClubId(clubId)
            const wallet = await getClubWallet(clubId)
            const { getWalletTransactions } = await import("@/service/walletApi")
            const transactions = wallet.walletId ? await getWalletTransactions(wallet.walletId) : []

            // Get current month data
            const now = new Date()
            const currentMonth = now.getMonth()
            const currentYear = now.getFullYear()
            const monthName = now.toLocaleString('default', { month: 'long' })

            // Filter this month's data
            const thisMonthEvents = events.filter((e: any) => {
              const eventDate = new Date(e.date)
              return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
            })

            const thisMonthTransactions = transactions.filter((t: any) => {
              const tDate = new Date(t.createdAt)
              return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
            })

            // Calculate metrics
            const activeMembers = members.filter((m: any) => m.state === "ACTIVE").length
            const pointsReceived = thisMonthTransactions.filter((t: any) => t.amount > 0).reduce((sum: number, t: any) => sum + t.amount, 0)
            const pointsSpent = Math.abs(thisMonthTransactions.filter((t: any) => t.amount < 0).reduce((sum: number, t: any) => sum + t.amount, 0))
            const approvedEventsThisMonth = thisMonthEvents.filter((e: any) => e.status === "APPROVED").length
            const completedEvents = thisMonthEvents.filter((e: any) => new Date(e.date) <= now && e.status === "APPROVED").length

            systemContent = `You are an AI assistant for a university club and event management system.
Generate a comprehensive monthly report in this format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 MONTHLY PERFORMANCE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Club: ${club.data.name}
Period: ${monthName} ${currentYear}
Report Date: ${now.toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Performance:
• Club Status: ${activeMembers > 20 ? "Thriving" : activeMembers > 10 ? "Healthy" : "Growing"}
• Activity Level: ${thisMonthEvents.length > 3 ? "High" : thisMonthEvents.length > 1 ? "Moderate" : "Low"}
• Financial Health: ${(wallet.balancePoints || 0) > 2000 ? "Strong" : (wallet.balancePoints || 0) > 500 ? "Good" : "Needs Attention"}
• Member Engagement: ${thisMonthTransactions.length > 10 ? "Excellent" : thisMonthTransactions.length > 5 ? "Good" : "Fair"}

Key Highlights:
• ${thisMonthEvents.length} events organized this month
• ${activeMembers} active members
• ${pointsReceived} points received
• ${thisMonthTransactions.length} transactions completed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 MEMBERSHIP REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Status:
• Total Members: ${members.length}
• Active Members: ${activeMembers}
• Staff Members: ${members.filter((m: any) => m.staff === true).length}
• Pending Applications: ${members.filter((m: any) => m.state === "PENDING").length}

Monthly Changes:
• New Members: [Data not available - estimated based on pending]
• Member Turnover: ${members.filter((m: any) => m.state === "PENDING").length > 0 ? "Growing" : "Stable"}
• Staff Changes: Stable

Member Engagement:
• Active Participation Rate: ${activeMembers > 0 ? Math.round((activeMembers / members.length) * 100) : 0}%
• Staff-to-Member Ratio: 1:${Math.round(activeMembers / Math.max(members.filter((m: any) => m.staff === true).length, 1))}
• Overall Engagement: ${thisMonthTransactions.length > 10 ? "High" : thisMonthTransactions.length > 5 ? "Moderate" : "Low"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 EVENT REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Monthly Event Summary:
• Total Events: ${thisMonthEvents.length}
• Approved Events: ${approvedEventsThisMonth}
• Completed Events: ${completedEvents}
• Pending Events: ${thisMonthEvents.filter((e: any) => e.status === "PENDING").length}

Event Performance:
• Events per Week: ${Math.round(thisMonthEvents.length / 4)}
• Average Capacity: ${thisMonthEvents.length > 0 ? Math.round(thisMonthEvents.reduce((sum: number, e: any) => sum + (e.maxCheckInCount || 0), 0) / thisMonthEvents.length) : 0} attendees
• Total Budget Allocated: ${thisMonthEvents.reduce((sum: number, e: any) => sum + (e.budgetPoints || 0), 0)} points

Events This Month:
${thisMonthEvents.slice(0, 10).map((event: any, index: number) => `${index + 1}. ${event.name}
   • Date: ${new Date(event.date).toLocaleDateString()}
   • Status: ${event.status}
   • Type: ${event.type || "N/A"}
   • Budget: ${event.budgetPoints || 0} points
   • Capacity: ${event.maxCheckInCount || 0} attendees
`).join("\n")}

${thisMonthEvents.length === 0 ? "⚠️ No events organized this month" : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 FINANCIAL REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Financial Status:
• Wallet Balance: ${wallet.balancePoints || 0} points
• Points per Member: ${activeMembers > 0 ? Math.round((wallet.balancePoints || 0) / activeMembers) : 0} pts

Monthly Transactions:
• Total Transactions: ${thisMonthTransactions.length}
• Points Received: +${pointsReceived} pts
• Points Spent: -${pointsSpent} pts
• Net Flow: ${pointsReceived - pointsSpent > 0 ? "+" : ""}${pointsReceived - pointsSpent} pts

Transaction Breakdown:
• Reward Distributions: ${thisMonthTransactions.filter((t: any) => t.type.includes("REWARD")).length}
• Event Expenses: ${thisMonthTransactions.filter((t: any) => t.type.includes("EVENT")).length}
• Other Transactions: ${thisMonthTransactions.filter((t: any) => !t.type.includes("REWARD") && !t.type.includes("EVENT")).length}

Financial Health:
• Spending Rate: ${pointsReceived > 0 ? Math.round((pointsSpent / pointsReceived) * 100) : 0}%
• Reserve Status: ${(wallet.balancePoints || 0) > 2000 ? "Strong" : (wallet.balancePoints || 0) > 500 ? "Adequate" : "Low"}
• Budget Management: ${pointsSpent <= pointsReceived ? "✅ Balanced" : "⚠️ Deficit"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 PERFORMANCE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Key Performance Indicators:
• Member Growth: ${members.filter((m: any) => m.state === "PENDING").length > 0 ? "📈 Positive" : "📊 Stable"}
• Event Frequency: ${thisMonthEvents.length > 2 ? "⭐⭐⭐⭐⭐ Excellent" : thisMonthEvents.length > 0 ? "⭐⭐⭐ Good" : "⭐⭐ Needs Improvement"}
• Financial Stability: ${(wallet.balancePoints || 0) > 2000 ? "⭐⭐⭐⭐⭐ Excellent" : (wallet.balancePoints || 0) > 500 ? "⭐⭐⭐⭐ Good" : "⭐⭐⭐ Fair"}
• Transaction Activity: ${thisMonthTransactions.length > 10 ? "⭐⭐⭐⭐⭐ Very Active" : thisMonthTransactions.length > 5 ? "⭐⭐⭐⭐ Active" : "⭐⭐⭐ Moderate"}

Overall Monthly Score: ${(() => {
  let score = 0
  if (members.filter((m: any) => m.state === "PENDING").length > 0) score += 20
  if (thisMonthEvents.length > 2) score += 30
  else if (thisMonthEvents.length > 0) score += 15
  if ((wallet.balancePoints || 0) > 2000) score += 25
  else if ((wallet.balancePoints || 0) > 500) score += 15
  if (thisMonthTransactions.length > 10) score += 25
  else if (thisMonthTransactions.length > 5) score += 15
  return score
})()}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Strengths This Month:
${thisMonthEvents.length > 2 ? "• ✅ Strong event organization" : ""}
${pointsReceived > 1000 ? "• ✅ Good funding received" : ""}
${thisMonthTransactions.length > 10 ? "• ✅ High transaction activity" : ""}
${approvedEventsThisMonth > 0 ? "• ✅ Events approved successfully" : ""}

Areas Needing Attention:
${thisMonthEvents.length === 0 ? "• ⚠️ No events organized - plan more activities" : ""}
${pointsSpent > pointsReceived ? "• ⚠️ Spending exceeded income" : ""}
${(wallet.balancePoints || 0) < 500 ? "• ⚠️ Low wallet balance - request funding" : ""}
${thisMonthTransactions.length < 5 ? "• ⚠️ Low activity - engage members more" : ""}

Action Items for Next Month:
1. ${thisMonthEvents.length < 2 ? "Plan at least 2-3 events" : "Continue regular event schedule"}
2. ${members.filter((m: any) => m.state === "PENDING").length > 0 ? `Process ${members.filter((m: any) => m.state === "PENDING").length} pending applications` : "Focus on member retention"}
3. ${(wallet.balancePoints || 0) < 1000 ? "Request additional funding" : "Allocate budget for rewards"}
4. ${thisMonthTransactions.length < 10 ? "Increase member engagement activities" : "Maintain current engagement level"}
5. Review and improve areas identified above

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 GOALS FOR NEXT MONTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recommended Goals:
• Organize ${Math.max(2, thisMonthEvents.length + 1)} events
• Reach ${Math.round(activeMembers * 1.1)} active members
• Maintain wallet balance above ${Math.max(1000, wallet.balancePoints || 0)} points
• Process all pending applications within 48 hours
• Distribute ${Math.round((wallet.balancePoints || 0) * 0.3)} points as rewards
• Achieve ${Math.min(95, 85 + Math.round(thisMonthTransactions.length / 2))}% member satisfaction

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 CONCLUSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Assessment:
${(() => {
  const score = (() => {
    let s = 0
    if (members.filter((m: any) => m.state === "PENDING").length > 0) s += 20
    if (thisMonthEvents.length > 2) s += 30
    else if (thisMonthEvents.length > 0) s += 15
    if ((wallet.balancePoints || 0) > 2000) s += 25
    else if ((wallet.balancePoints || 0) > 500) s += 15
    if (thisMonthTransactions.length > 10) s += 25
    else if (thisMonthTransactions.length > 5) s += 15
    return s
  })()
  
  if (score >= 80) return "🌟 Excellent performance this month! Your club is thriving with strong engagement and activity."
  if (score >= 60) return "👍 Good performance this month! Continue building on your strengths."
  if (score >= 40) return "📊 Fair performance. Focus on the recommended improvements for next month."
  return "⚠️ Performance needs attention. Review recommendations and take action."
})()}

Keep up the great work and continue engaging your members! 🎓✨

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report generated by UniBot AI Assistant
For questions or support, contact university staff or ask me for guidance.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

            userContent = userMessage.text
          } catch (error) {
            console.error("Error generating monthly report:", error)
          }
        }
      }
      // 13. Number of Members (UNIVERSITY_STAFF)
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

🎯 RECOMMENDATION: [✅ STRONGLY APPROVE / ⚠️ APPROVE WITH CONDITIONS /   NEEDS REVIEW / ❌ DECLINE]

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

  Requires Further Review ([X] applications):
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
      // 9. Website Guide (STUDENT - NEW)
      else if (inputLower.includes("website guide") || (inputLower.includes("how") && inputLower.includes("uniclub") && inputLower.includes("work"))) {
        systemContent = `You are UniBot, an AI assistant for the UniClub platform.
Provide a comprehensive, user-friendly guide in this format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 WELCOME TO UNICLUB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UniClub is your gateway to university club life! Here's everything you need to know:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 MAIN FEATURES FOR STUDENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🏛️ CLUBS
   • Browse clubs by major or search by name
   • Join clubs that match your interests
   • View club details, members, and activities
   • Request to leave clubs if needed

2. 🎉 EVENTS
   • Discover upcoming events from your clubs
   • Register for events and earn commitment points
   • Check-in to events using QR codes
   • View event history and attendance records

3. 🎁 GIFTS & REWARDS
   • Browse available products from your clubs
   • Redeem items using your club membership points
   • View redemption history
   • Track special event items

4. 💰 WALLET & POINTS
   • Check your UniClub points balance
   • View transaction history
   • Track points from different clubs
   • Earn points by: attending events, completing activities, participating in club activities

5. 📊 DASHBOARD
   • View your tier status (Bronze/Silver/Gold)
   • Track upcoming events
   • See quick stats on memberships and points
   • Access quick actions

6. ✅ CHECK-IN
   • Scan QR codes at events
   • Confirm attendance
   • Earn participation points
   • Track your attendance record

7. 📜 HISTORY
   • View all past activities
   • Check redemption history
   • Review event attendance
   • Track point transactions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 HOW TO GET STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Browse Clubs
Go to "Clubs" page → Find clubs by major or search → Click "View Details"

Step 2: Join a Club
Click "Apply to Join" → Explain why you want to join → Wait for approval

Step 3: Participate in Events
Go to "Events" → Select an event → Click "Register" (costs commitment points)

Step 4: Attend & Check-in
On event day → Go to "Check-in" → Scan event QR code → Earn reward points!

Step 5: Redeem Rewards
Go to "Gifts" → Browse available items → Click "Redeem" using your points

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ TIER SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥉 Bronze Tier (0-199 points)
• Starting tier for all students
• Access to basic club features
• Can join clubs and attend events

🥈 Silver Tier (200-499 points)
• Earn by active participation
• Priority event registration (future feature)
• Special rewards and perks

🥇 Gold Tier (500+ points)
• Highest achievement tier
• Exclusive rewards and benefits
• Recognition as top contributor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 PRO TIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Join clubs aligned with your major for relevant activities
• Register early for popular events
• Always check-in at events to earn full reward points
• Save commitment points for events you really want to attend
• Check your wallet regularly to track point balance
• Browse gifts frequently - new items are added regularly
• Keep an eye on upcoming events in your dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ NEED MORE HELP?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ask me specific questions like:
• "Show me my club details"
• "What are my points?"
• "Show upcoming events"
• "How do I join a club?"
• "Explain the point system"

I'm here to help you make the most of your UniClub experience! 🎓✨

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

        userContent = userMessage.text
      }
      // 10. My Club Details (STUDENT - NEW)
      else if (inputLower.includes("my club details") || (inputLower.includes("my club") && inputLower.includes("info"))) {
        if (clubIds.length === 0) {
          systemContent = "You are a helpful assistant."
          userContent = "The user hasn't joined any clubs yet. Politely inform them that they need to join a club first, and explain how to browse and join clubs."
        } else {
          try {
            const clubDetails = await Promise.all(
              clubIds.map(async (clubId) => {
                try {
                  const club = await getClubById(clubId)
                  const members = await getMembersByClubId(clubId)
                  const events = await getEventByClubId(clubId)
                  return { club: club.data, members, events }
                } catch (error) {
                  console.error(`Error fetching details for club ${clubId}:`, error)
                  return null
                }
              })
            )

            const validClubDetails = clubDetails.filter(detail => detail !== null)

            systemContent = `You are an AI assistant for a university club and event management system.
Present detailed information about the user's clubs in this format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 MY CLUBS - DETAILED INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each club, provide:

🏛️ [CLUB NAME]
━━━━━━━━━━━━━━━━━━━━━━━━

📋 Basic Information:
• 🎓 Major/Department: [Major Name]
• 👨‍💼 Leader: [Leader Name]
• 👥 Total Members: [X] active members
• 📝 Description: [Club description]

📊 My Membership:
• 📅 Joined: [Date if available, or "Member"]
• 🎭 Role: [MEMBER/STAFF/LEADER]
• ✅ Status: [ACTIVE/PENDING]

🎉 Club Activities:
• Total Events Organized: [X] events
• Upcoming Events: [X] upcoming events
• Recent Events: [List 2-3 most recent events with dates]

👥 Member Highlights:
• Active Members: [X] students
• Leadership Team: [X] staff members
• Major Distribution: [Show diversity if available]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 QUICK ACTIONS:
• View upcoming events: Ask "Show upcoming events"
• Check available gifts: Ask "Show my club gifts"
• View club members: Go to "My Club" page
• See event history: Go to "History" page

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Present all information clearly and organized. Include emojis for visual appeal.`

            userContent = `${userMessage.text}

MY CLUBS DATA:
${JSON.stringify(validClubDetails, null, 2)}

Please present detailed information about all clubs I'm a member of.`
          } catch (error) {
            console.error("Error fetching club details:", error)
            systemContent = "You are a helpful assistant."
            userContent = "Unable to fetch club details. Please try again later."
          }
        }
      }
      // 11. My Points (STUDENT - NEW)
      else if (inputLower.includes("my points") || inputLower.includes("my wallet") || (inputLower.includes("point") && inputLower.includes("balance"))) {
        try {
          const { getWallet, getWalletTransactions } = await import("@/service/walletApi")
          const walletResponse = await getWallet()
          const wallet = walletResponse.data
          const transactions = wallet.walletId ? await getWalletTransactions(wallet.walletId) : []

          // Calculate tier
          const totalPoints = wallet.balancePoints || 0
          let currentTier = "Bronze"
          let nextThreshold = 200
          if (totalPoints >= 500) {
            currentTier = "Gold"
            nextThreshold = 0
          } else if (totalPoints >= 200) {
            currentTier = "Silver"
            nextThreshold = 500
          }

          systemContent = `You are an AI assistant for a university club and event management system.
Present the user's points and wallet information in this beautiful format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 MY UNICLUB WALLET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💎 CURRENT BALANCE
━━━━━━━━━━━━━━━━━━━━━━━━

🏆 Total Points: ${totalPoints} points
💰 Wallet ID: ${wallet.walletId}
👤 Owner: ${wallet.userFullName || "Student"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ TIER STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Tier: ${currentTier} ${currentTier === "Gold" ? "🥇" : currentTier === "Silver" ? "🥈" : "🥉"}
${nextThreshold > 0 ? `Progress: ${totalPoints}/${nextThreshold} points (${Math.round((totalPoints / nextThreshold) * 100)}%)` : "Maximum tier achieved!"}
${nextThreshold > 0 ? `Status: ${nextThreshold - totalPoints <= 50 ? "Almost there!" : "Keep going!"}` : "Well done!"}

🥉 Bronze: 0-199 points
🥈 Silver: 200-499 points
🥇 Gold: 500+ points

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RECENT TRANSACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Show last 10 transactions in this format:]

${transactions.slice(0, 10).map((t: any) => {
  const date = new Date(t.createdAt).toLocaleString()
  return `📅 ${date} | ${t.type}
   • Amount: ${t.signedAmount} points
   • Description: ${t.description || "N/A"}
   • ${t.type.includes("REWARD") ? "From" : "To"}: ${t.senderName || t.receiverName || "System"}`
}).join("\n\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 HOW TO EARN MORE POINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🎉 Attend Events
   • Register for events (costs commitment points)
   • Check-in at events (earn reward points)
   • Typical reward: 50-200 points per event

2. 🎯 Complete Activities
   • Participate in club activities
   • Join club meetings and workshops
   • Contribute to club projects

3. 🏆 Achieve Milestones
   • Reach attendance milestones
   • Complete event series
   • Earn bonus rewards from club leaders

4. 🎁 Smart Point Management
   • Save commitment points for priority events
   • Use points strategically for redemptions
   • Check gift prices before spending

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 POINT SYSTEM EXPLAINED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Commitment Points:
• Required to register for events
• Prevents no-shows and encourages commitment
• Refunded when you attend (plus reward bonus)

📍 Reward Points:
• Earned by attending events and activities
• Can be used to redeem gifts and products
• Accumulate to increase your tier level

📍 Wallet Types:
• Personal Wallet: Your main point balance
• Club Wallets: Separate balance per club membership
• Use club points for club-specific rewards

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 QUICK TIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Check wallet regularly to track your progress
• Plan event registrations based on commitment point balance
• Look for high-reward events to maximize earnings
• Redeem gifts strategically - save points for valuable items
• Attend registered events to avoid point penalties

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 NEED MORE INFO?
Ask me:
• "Show my transaction history"
• "What events can I attend?"
• "Show available gifts to redeem"
• "Explain the tier system"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

          userContent = userMessage.text
        } catch (error) {
          console.error("Error fetching wallet data:", error)
          systemContent = "You are a helpful assistant."
          userContent = "Unable to fetch wallet data. Please try again later or contact support."
        }
      }
      // 12. Upcoming Events (STUDENT - NEW)
      else if (inputLower.includes("upcoming events") || (inputLower.includes("upcoming") && inputLower.includes("event"))) {
        try {
          const allEvents = await fetchEvent({ size: 200 })
          const now = new Date()
          const upcomingEvents = allEvents.filter((event: any) => {
            const eventDate = new Date(event.date)
            return eventDate > now
          }).sort((a: any, b: any) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            return dateA - dateB
          })

          systemContent = `You are an AI assistant for a university club and event management system.
Present upcoming events in this attractive format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 UPCOMING EVENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found ${upcomingEvents.length} upcoming events for you!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each event (group by week or month):

[THIS WEEK / NEXT WEEK / THIS MONTH / NEXT MONTH]

🎉 [Event Name]
━━━━━━━━━━━━━━━━━━━━━━━━

📋 Event Details:
• 🏛️ Club: [Club Name]
• 📅 Date: [Day, Month Date, Year]
• ⏰ Time: [Start Time] - [End Time]
• 📍 Location: [Location Name]
• 🎫 Type: [PUBLIC/PRIVATE]

💰 Points:
• 💎 Commit Points: [X] points to register
• 🏆 Reward Points: [X] points upon attendance

👥 Capacity:
• 🎯 Max Participants: [X] students
• ✅ Current Registrations: [Estimate if available]
• 📊 Status: [Open/Almost Full/Full]

📝 Description:
[Event description - 2-3 sentences]

🎯 Why Attend:
• [Key benefit 1]
• [Key benefit 2]
• [Key benefit 3]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 REGISTRATION TIPS:
• Register early for popular events (limited spots!)
• Make sure you have enough commitment points
• Add important events to your calendar
• Check event details before registering
• Attend registered events to earn reward points

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 EVENT STATISTICS:
• Total Upcoming: ${upcomingEvents.length} events
• This Week: [Count events this week]
• This Month: [Count events this month]
• Public Events: [Count public events]
• My Club Events: [Count events from user's clubs]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 QUICK ACTIONS:
• To register: Go to "Events" page → Select event → Click "Register"
• To see my registrations: Click "My Registrations" filter
• To check event details: Click on any event card

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Group events logically by time period. Highlight events happening soon. Use emojis for visual appeal.`

          userContent = `${userMessage.text}

UPCOMING EVENTS:
${JSON.stringify(upcomingEvents, null, 2)}

Please present all upcoming events organized by time period (this week, next week, this month, etc.).`
        } catch (error) {
          console.error("Error fetching upcoming events:", error)
        }
      }
      // 13. How to Join Club (STUDENT - NEW)
      else if (inputLower.includes("how to join") || (inputLower.includes("how") && inputLower.includes("join") && inputLower.includes("club"))) {
        systemContent = `You are UniBot, an AI assistant for the UniClub platform.
Provide a comprehensive, step-by-step guide in this format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ HOW TO JOIN A CLUB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 COMPLETE GUIDE TO CLUB MEMBERSHIP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 STEP-BY-STEP PROCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1️⃣: Browse Available Clubs
━━━━━━━━━━━━━━━━━━━━━━━━

• Go to "Clubs" page from the sidebar
• Use filters to find clubs by:
  - Major/Department
  - Name search
  - Member count
• Browse club cards to see:
  - Club name and description
  - Member count
  - Leader information
  - Major/department

Step 2️⃣: View Club Details
━━━━━━━━━━━━━━━━━━━━━━━━

• Click "View Details" on any club card
• Review important information:
  - Full description and goals
  - Current members list
  - Past and upcoming events
  - Club activity level
  - Major alignment

Step 3️⃣: Submit Application
━━━━━━━━━━━━━━━━━━━━━━━━

• Click "Apply to Join" button
• Write your application message:
  - Explain why you want to join
  - Mention relevant interests or skills
  - Show enthusiasm and commitment
  - Be honest and genuine
• Click "Submit Application"

Step 4️⃣: Wait for Approval
━━━━━━━━━━━━━━━━━━━━━━━━

• Application status: "PENDING"
• Club leader will review your application
• Typical waiting time: 1-7 days
• You'll receive notification when reviewed
• Check "My Club" or "Clubs" page for status updates

Step 5️⃣: Start Participating!
━━━━━━━━━━━━━━━━━━━━━━━━

• Once approved, status changes to "ACTIVE"
• You can now:
  - Register for club events
  - Access club resources
  - Redeem club gifts
  - View club members
  - Participate in activities

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 BENEFITS OF JOINING CLUBS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🎉 Exclusive Events
   • Access to club-organized events
   • Priority registration for popular events
   • Member-only workshops and activities

2. 🎁 Club Rewards
   • Redeem products using club membership points
   • Exclusive gifts for active members
   • Special offers and discounts

3. 💰 Earn Points
   • Participate in events to earn points
   • Complete club activities for rewards
   • Build up your point balance

4. 👥 Networking
   • Meet students with similar interests
   • Connect with your major's community
   • Build friendships and professional network

5. 🏆 Personal Growth
   • Develop new skills
   • Gain leadership experience (staff roles)
   • Enhance your university experience

6. ⭐ Tier Advancement
   • Active participation increases your tier
   • Unlock higher tier benefits
   • Recognition as engaged student

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 APPLICATION TIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ DO:
• Research the club before applying
• Write a thoughtful application message
• Mention specific reasons for joining
• Show genuine interest and enthusiasm
• Be respectful and professional
• Check club's major alignment with yours
• Apply to multiple clubs you're interested in

❌ DON'T:
• Write generic or copy-pasted messages
• Apply without reading club description
• Join too many clubs you can't commit to
• Leave application message empty
• Apply to clubs just for points

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 CHOOSING THE RIGHT CLUB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Consider these factors:

1. 🎓 Major Alignment
   • Clubs aligned with your major offer relevant activities
   • Learn industry-specific skills
   • Connect with peers in your field

2. 🎯 Personal Interest
   • Choose clubs matching your hobbies
   • Explore new interests
   • Balance academic and recreational clubs

3. ⏰ Time Commitment
   • Review club event frequency
   • Consider your schedule
   • Start with 2-3 clubs max

4. 👥 Community Size
   • Large clubs: more events, wider network
   • Small clubs: closer community, more leadership opportunities
   • Choose what fits your personality

5. 📊 Activity Level
   • Check number of past events
   • Look at upcoming event plans
   • Active clubs offer more opportunities

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❓ FREQUENTLY ASKED QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q: How many clubs can I join?
A: There's no strict limit, but we recommend 2-4 clubs to ensure active participation.

Q: Can I leave a club?
A: Yes! Go to "My Club" page → Select club → Click "Leave Club" → Provide reason.

Q: What if my application is rejected?
A: You can apply again after some time. Consider reaching out to club leaders for feedback.

Q: Do I need to be from a specific major?
A: Most clubs welcome all majors! Check club description for any specific requirements.

Q: How long does approval take?
A: Usually 1-7 days. Club leaders review applications regularly.

Q: Can I change clubs later?
A: Yes! You can leave clubs and join new ones anytime.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ready to join? Ask me:
• "Show me clubs by major" - Find clubs in your field
• "Show all clubs" - Browse all available clubs
• "Suggest clubs for me" - Get personalized recommendations
• "Show my club applications" - Check application status

Need more help? I'm here to assist you! 🎓✨

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

        userContent = userMessage.text
      }
      // 14. My Activity (STUDENT - NEW)
      else if (inputLower.includes("my activity") || inputLower.includes("my history") || (inputLower.includes("my") && inputLower.includes("recent"))) {
        if (clubIds.length === 0) {
          systemContent = "You are a helpful assistant."
          userContent = "The user hasn't joined any clubs yet, so there's no activity to show. Politely inform them and encourage them to join clubs and participate in events."
        } else {
          try {
            // Get wallet and transactions
            const { getWallet, getWalletTransactions } = await import("@/service/walletApi")
            const walletResponse = await getWallet()
            const wallet = walletResponse.data
            const transactions = wallet.walletId ? await getWalletTransactions(wallet.walletId) : []

            // Calculate activity statistics
            const now = new Date()
            const thisMonth = transactions.filter((t: any) => {
              const tDate = new Date(t.createdAt)
              return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
            })
            const thisWeek = transactions.filter((t: any) => {
              const tDate = new Date(t.createdAt)
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              return tDate >= weekAgo
            })

            systemContent = `You are an AI assistant for a university club and event management system.
Present the user's activity history in this comprehensive format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 MY ACTIVITY HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 ACTIVITY OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏛️ Club Memberships: ${clubIds.length} active clubs
🎉 Total Transactions: ${transactions.length} activities
💰 Current Balance: ${wallet.balancePoints || 0} points
📅 Clubs: ${clubIds.join(", ")}
⭐ Current Tier: ${wallet.balancePoints >= 500 ? "Gold 🥇" : wallet.balancePoints >= 200 ? "Silver 🥈" : "Bronze 🥉"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 RECENT ACTIVITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Group activities by date, show last 20 activities]

${transactions.slice(0, 20).map((t: any, index: number) => {
  const date = new Date(t.createdAt)
  const isToday = date.toDateString() === now.toDateString()
  const isYesterday = date.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString()
  const dateLabel = isToday ? "Today" : isYesterday ? "Yesterday" : date.toLocaleDateString()
  
  // Only show date header for first occurrence or when date changes
  const showDateHeader = index === 0 || new Date(transactions[index - 1].createdAt).toDateString() !== date.toDateString()
  
  return `${showDateHeader ? `\n📅 ${dateLabel}\n━━━━━━━━━━━━━━━━━━━━━━━━\n` : ""}
${t.type.includes("REWARD") ? "✅" : t.type.includes("REDEEM") ? "🎁" : "💰"} ${t.type}
   • Amount: ${t.signedAmount} points
   • Description: ${t.description || "N/A"}
   • ${t.type.includes("REWARD") ? "From" : "To"}: ${t.senderName || t.receiverName || "System"}
   • Time: ${date.toLocaleTimeString()}`
}).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ACTIVITY BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This Month:
• 📝 Total Transactions: ${thisMonth.length}
• 💰 Points Earned: +${thisMonth.filter((t: any) => t.amount > 0).reduce((sum: number, t: any) => sum + t.amount, 0)}
• 💸 Points Spent: -${Math.abs(thisMonth.filter((t: any) => t.amount < 0).reduce((sum: number, t: any) => sum + t.amount, 0))}
• 📈 Net Change: ${thisMonth.reduce((sum: number, t: any) => sum + t.amount, 0)} points

This Week:
• 📝 Total Transactions: ${thisWeek.length}
• 💰 Points Earned: +${thisWeek.filter((t: any) => t.amount > 0).reduce((sum: number, t: any) => sum + t.amount, 0)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 ACHIEVEMENTS & MILESTONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Recent Achievements:
• Joined ${clubIds.length} clubs
• Completed ${transactions.length} transactions
• Earned ${transactions.filter((t: any) => t.amount > 0).reduce((sum: number, t: any) => sum + t.amount, 0)} total points

🎯 Next Milestones:
• ${wallet.balancePoints < 200 ? `${200 - wallet.balancePoints} more points to reach Silver tier` : wallet.balancePoints < 500 ? `${500 - wallet.balancePoints} more points to reach Gold tier` : "Maximum tier achieved!"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 ACTIVITY TRENDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Participation Level: ${thisWeek.length > 5 ? "High" : thisWeek.length > 2 ? "Medium" : "Low"}
Recent Activity: ${thisWeek.length} transactions this week
Engagement Score: ${Math.min(Math.round((transactions.length / Math.max(clubIds.length, 1)) * 10), 100)}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 INSIGHTS & RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on your activity:

✅ You're doing great at:
• ${transactions.length > 10 ? "Active participation in club activities" : "Getting started with UniClub"}
• ${clubIds.length > 2 ? "Engaging with multiple clubs" : "Focused club membership"}

📈 Consider:
• ${clubIds.length < 2 ? "Joining more clubs to explore different interests" : "Continue active participation"}
• ${thisWeek.length < 3 ? "Participating in more events this week" : "Keep up the great work!"}

🎯 Opportunities:
• Ask "Show upcoming events" to see what's available
• Ask "Show my club gifts" to check redeemable items
• You're ${wallet.balancePoints < 200 ? `${200 - wallet.balancePoints} points` : wallet.balancePoints < 500 ? `${500 - wallet.balancePoints} points` : "at max tier!"}${wallet.balancePoints < 500 ? " away from next tier!" : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 DETAILED HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For complete history:
• Go to "History" page for full activity log
• Go to "Wallet" page for all transactions
• Go to "Events" → "My Registrations" for event history
• Go to "My Club" page for membership details

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Present activity chronologically with clear grouping. Use emojis for visual appeal. Provide insights and encouragement.`

            userContent = userMessage.text
          } catch (error) {
            console.error("Error fetching activity data:", error)
            systemContent = "You are a helpful assistant."
            userContent = "Unable to fetch activity data. Please try again later."
          }
        }
      }
      // 15. System Overview (UNIVERSITY_STAFF - NEW)
      else if (inputLower.includes("system overview") || (inputLower.includes("system") && inputLower.includes("statistic"))) {
        try {
          const clubsResponse = await fetchClub({ page: 0, size: 500, sort: ["name"] })
          const clubs = Array.isArray(clubsResponse) ? clubsResponse : (clubsResponse as any).data || []
          const allEvents = await fetchEvent({ size: 500 })
          const applications = await getClubApplications()
          
          // Calculate system-wide statistics
          const totalClubs = clubs.length
          const pendingApplications = applications.filter((a: any) => a.status === "PENDING").length
          const approvedApplications = applications.filter((a: any) => a.status === "APPROVED").length
          
          const now = new Date()
          const approvedEvents = allEvents.filter((e: any) => e.status === "APPROVED")
          const pendingEvents = allEvents.filter((e: any) => e.status === "PENDING" || e.status === "PENDING_UNISTAFF")
          const upcomingEvents = allEvents.filter((e: any) => new Date(e.date) > now)
          const completedEvents = allEvents.filter((e: any) => e.status === "COMPLETED")
          
          // Calculate total members across all clubs
          const clubsWithCounts = await Promise.all(
            clubs.slice(0, 50).map(async (club: any) => {
              try {
                const counts = await getClubMemberCount(club.id)
                return counts.activeMemberCount
              } catch {
                return 0
              }
            })
          )
          const totalMembers = clubsWithCounts.reduce((sum, count) => sum + count, 0)
          
          // Group clubs by major
          const clubsByMajor: Record<string, number> = {}
          clubs.forEach((club: any) => {
            const major = club.majorName || "Unknown"
            clubsByMajor[major] = (clubsByMajor[major] || 0) + 1
          })
          
          systemContent = `You are an AI assistant for a university club and event management system.
Provide comprehensive system-wide overview in this format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 UNICLUB SYSTEM OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Platform Health Dashboard
Generated: ${new Date().toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 KEY METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏛️ Club Statistics:
• Total Active Clubs: ${totalClubs}
• Pending Applications: ${pendingApplications}
• Approved Applications: ${approvedApplications}
• Approval Rate: ${applications.length > 0 ? Math.round((approvedApplications / applications.length) * 100) : 0}%
• Average Members per Club: ${totalClubs > 0 ? Math.round(totalMembers / Math.min(totalClubs, 50)) : 0}

👥 Student Engagement:
• Total Student Members: ~${totalMembers} (sampled)
• Unique Majors Represented: ${Object.keys(clubsByMajor).length}
• Clubs per Major (avg): ${Object.keys(clubsByMajor).length > 0 ? Math.round(totalClubs / Object.keys(clubsByMajor).length) : 0}
• Platform Activity: ${totalClubs > 30 ? "Very High" : totalClubs > 15 ? "High" : "Moderate"}

🎉 Event Statistics:
• Total Events: ${allEvents.length}
• Approved Events: ${approvedEvents.length}
• ⏳ Pending Approval: ${pendingEvents.length}
• Upcoming Events: ${upcomingEvents.length}
• Completed Events: ${completedEvents.length}
• Approval Rate: ${allEvents.length > 0 ? Math.round((approvedEvents.length / allEvents.length) * 100) : 0}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 MAJOR DISTRIBUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top Majors by Club Count:
${Object.entries(clubsByMajor)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .slice(0, 10)
  .map(([major, count], index) => `${index + 1}. ${major}: ${count} clubs (${Math.round(((count as number) / totalClubs) * 100)}%)`)
  .join("\n")}

Diversity Analysis:
• Total Majors: ${Object.keys(clubsByMajor).length}
• Most Represented: ${Object.entries(clubsByMajor).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || "N/A"}
• Least Represented: ${Object.entries(clubsByMajor).sort(([, a], [, b]) => (a as number) - (b as number))[0]?.[0] || "N/A"}
• Diversity Score: ${Object.keys(clubsByMajor).length > 10 ? "⭐⭐⭐⭐⭐ Excellent" : Object.keys(clubsByMajor).length > 5 ? "⭐⭐⭐⭐ Good" : "⭐⭐⭐ Fair"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 PLATFORM HEALTH INDICATORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Platform Health: ${(() => {
  let score = 0
  if (totalClubs > 30) score += 25
  else if (totalClubs > 15) score += 15
  else if (totalClubs > 5) score += 10
  
  if (allEvents.length > 100) score += 25
  else if (allEvents.length > 50) score += 15
  else if (allEvents.length > 20) score += 10
  
  if (pendingApplications < 5) score += 25
  else if (pendingApplications < 10) score += 15
  
  if (Object.keys(clubsByMajor).length > 10) score += 25
  else if (Object.keys(clubsByMajor).length > 5) score += 15
  
  return score
})()}/100

Performance Breakdown:
• Club Growth: ${totalClubs > 30 ? "⭐⭐⭐⭐⭐ Excellent" : totalClubs > 15 ? "⭐⭐⭐⭐ Good" : totalClubs > 5 ? "⭐⭐⭐ Fair" : "⭐⭐ Needs Improvement"}
• Event Activity: ${allEvents.length > 100 ? "⭐⭐⭐⭐⭐ Very High" : allEvents.length > 50 ? "⭐⭐⭐⭐ High" : allEvents.length > 20 ? "⭐⭐⭐ Moderate" : "⭐⭐ Low"}
• Application Management: ${pendingApplications < 5 ? "⭐⭐⭐⭐⭐ Excellent" : pendingApplications < 10 ? "⭐⭐⭐⭐ Good" : "⭐⭐⭐ Needs Attention"}
• Major Diversity: ${Object.keys(clubsByMajor).length > 10 ? "⭐⭐⭐⭐⭐ Excellent" : Object.keys(clubsByMajor).length > 5 ? "⭐⭐⭐⭐ Good" : "⭐⭐⭐ Fair"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ PENDING ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Action Items:
${pendingApplications > 0 ? `• ⚠️ ${pendingApplications} club applications awaiting review` : "• ✅ No pending club applications"}
${pendingEvents.length > 0 ? `• ⚠️ ${pendingEvents.length} event requests awaiting approval` : "• ✅ No pending event requests"}
${Object.keys(clubsByMajor).length < 5 ? "• 📈 Encourage club creation in underrepresented majors" : ""}
${upcomingEvents.length < 10 ? "• 📅 Low upcoming event count - encourage more planning" : ""}

Priority Level: ${pendingApplications > 5 || pendingEvents.length > 10 ? "🔴 High" : pendingApplications > 0 || pendingEvents.length > 0 ? "🟡 Medium" : "🟢 Low"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 STRATEGIC RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Strengths:
${totalClubs > 20 ? "• ✅ Strong club ecosystem with diverse offerings" : ""}
${allEvents.length > 50 ? "• ✅ High event activity across platform" : ""}
${Object.keys(clubsByMajor).length > 10 ? "• ✅ Excellent major diversity" : ""}
${pendingApplications < 5 ? "• ✅ Efficient application processing" : ""}

Areas for Improvement:
${totalClubs < 15 ? "• Expand club offerings to serve more students" : ""}
${pendingApplications > 5 ? "• Accelerate club application review process" : ""}
${pendingEvents.length > 10 ? "• Speed up event approval workflow" : ""}
${Object.keys(clubsByMajor).length < 5 ? "• Promote club creation in underrepresented majors" : ""}

Action Plan:
1. ${pendingApplications > 0 ? `Review ${pendingApplications} pending applications` : "Continue monitoring new applications"}
2. ${pendingEvents.length > 0 ? `Process ${pendingEvents.length} event approval requests` : "Monitor upcoming event requests"}
3. ${Object.keys(clubsByMajor).length < 8 ? "Launch recruitment campaign for underrepresented majors" : "Maintain current major diversity"}
4. Monitor club activity and provide support to inactive clubs
5. Generate detailed reports for leadership review

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 DETAILED VIEWS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For more specific information, ask:
• "Show event approvals" - Review pending events
• "Show club performance" - Compare club metrics
• "Show funding analysis" - Point distribution overview
• "Show platform insights" - Usage trends and patterns
• "Generate monthly overview" - Comprehensive monthly report

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

          userContent = userMessage.text
        } catch (error) {
          console.error("Error fetching system overview:", error)
        }
      }
      // 16. Event Approvals (UNIVERSITY_STAFF - NEW)
      else if (inputLower.includes("event approval") || (inputLower.includes("event") && inputLower.includes("pending"))) {
        try {
          const allEvents = await fetchEvent({ size: 500 })
          const pendingEvents = allEvents.filter((e: any) => 
            e.status === "PENDING" || e.status === "PENDING_UNISTAFF"
          )
          
          // Fetch club details for each event
          const eventsWithClubData = await Promise.all(
            pendingEvents.slice(0, 20).map(async (event: any) => {
              try {
                const club = await getClubById(event.clubId || event.hostClub?.id)
                return { ...event, clubData: club.data }
              } catch {
                return { ...event, clubData: null }
              }
            })
          )
          
          const now = new Date()
          
          systemContent = `You are an AI assistant for a university club and event management system.
Analyze pending event requests and provide approval recommendations:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ EVENT APPROVAL DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pending Requests: ${pendingEvents.length} events
Review Date: ${now.toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each pending event:

📋 EVENT REQUEST #[Index]
━━━━━━━━━━━━━━━━━━━━━━━━

🎉 Event Name: [Event Name]
🏛️ Club: [Club Name] (Major: [Major Name])
📅 Proposed Date: [Date]
⏰ Time: [Start] - [End]
📍 Location: [Location Name]
🎫 Type: [PUBLIC/PRIVATE]

💰 Budget Request:
• Total Budget: [X] points
• Expected Participants: [X] students
• Cost per Participant: [X] points
• Commit Points: [X] points required
• Reward Points: [X] points earned

📝 Event Description:
[Full description]

🎯 Event Goals:
[Purpose and objectives if available]

📊 Club Context:
• Club Size: [X] members
• Club Events (Total): [X] events
• Recent Event History: [Brief summary]
• Club Financial Status: [If available]
• Club Major: [Major Name]

⚖️ ANALYSIS & RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━

Budget Assessment:
• Budget Reasonableness: [Reasonable/High/Low]
• Cost Efficiency: [Cost per participant analysis]
• Funding Availability: [Based on typical allocation]
• Budget Justification: [Well-justified/Needs clarification]

Timing & Logistics:
• Date Appropriateness: [Good/Conflicts/Too soon]
• Preparation Time: [Adequate/Rushed]
• Location Suitability: [Appropriate/Consider alternatives]
• Capacity Planning: [Realistic/Optimistic/Conservative]

Strategic Value:
• Student Benefit: [High/Medium/Low]
• Educational Value: [Strong/Moderate/Limited]
• Inclusivity: [Public/Private - accessibility analysis]
• Uniqueness: [Novel/Standard/Repetitive]

Risk Assessment:
• Execution Risk: [Low/Medium/High]
• Financial Risk: [Low/Medium/High]
• Attendance Risk: [Likely full/Moderate/Low turnout]
• Safety Considerations: [Any concerns]

🎯 RECOMMENDATION: [✅ APPROVE / ⚠️ APPROVE WITH CONDITIONS / 🔄 REQUEST REVISIONS / ❌ DENY]

Priority: [🔴 High / 🟡 Medium / 🟢 Low]

💡 Justification:
• [Primary reason for recommendation]
• [Supporting reason 1]
• [Supporting reason 2]
• [Any concerns or conditions]

${(() => {
  // Generate recommendation based on event data
  return `Suggested Actions:
• [Specific action 1]
• [Specific action 2]
• [Follow-up required if any]`
})()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 APPROVAL SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Pending: ${pendingEvents.length} events

Recommended Actions:
✅ Approve Immediately: [Count events that are clearly good]
⚠️ Approve with Conditions: [Count events needing minor adjustments]
🔄 Request Revisions: [Count events needing changes]
❌ Recommend Denial: [Count events with major issues]

Priority Queue:
🔴 High Priority (Soon dates): [Count events within 2 weeks]
🟡 Medium Priority: [Count events 2-4 weeks out]
🟢 Low Priority: [Count events 4+ weeks out]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 APPROVAL GUIDELINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Approve When:
• Budget is reasonable and well-justified
• Event provides clear value to students
• Logistics are well-planned
• Adequate preparation time
• Club has good track record

⚠️ Conditional Approval When:
• Budget needs minor adjustment
• Location/timing could be optimized
• Additional safety measures needed
• Clarification required on details

🔄 Request Revisions When:
• Budget significantly out of line
• Poor timing or logistics
• Insufficient event details
• Unrealistic capacity planning

❌ Deny When:
• Violates university policies
• Safety concerns cannot be mitigated
• Duplicate of recent event
• Insufficient planning/justification

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 QUICK ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To process approvals:
• Go to "Event Requests" page
• Review each event in detail
• Approve, request changes, or deny
• Provide feedback to club leaders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyze each event thoroughly with data-driven recommendations. Prioritize student benefit, safety, and responsible resource allocation.`

          userContent = `${userMessage.text}

PENDING EVENTS WITH CLUB DATA:
${JSON.stringify(eventsWithClubData, null, 2)}

Please analyze each pending event and provide detailed approval recommendations based on:
1. Budget reasonableness and efficiency
2. Event timing and logistics
3. Strategic value to students
4. Club track record and capacity
5. Safety and compliance considerations`
        } catch (error) {
          console.error("Error fetching event approvals:", error)
        }
      }
      // 17. Funding Analysis (UNIVERSITY_STAFF - NEW)
      else if (inputLower.includes("funding analysis") || (inputLower.includes("funding") && inputLower.includes("distribution"))) {
        try {
          const clubsResponse = await fetchClub({ page: 0, size: 100, sort: ["name"] })
          const clubs = Array.isArray(clubsResponse) ? clubsResponse : (clubsResponse as any).data || []
          
          // Fetch wallet data for clubs (sample first 30)
          const clubsWithWallets = await Promise.all(
            clubs.slice(0, 30).map(async (club: any) => {
              try {
                const wallet = await getClubWallet(club.id)
                const members = await getMembersByClubId(club.id)
                const events = await getEventByClubId(club.id)
                return {
                  club,
                  wallet,
                  memberCount: members.filter((m: any) => m.state === "ACTIVE").length,
                  eventCount: events.length
                }
              } catch {
                return null
              }
            })
          )
          
          const validData = clubsWithWallets.filter(d => d !== null)
          
          // Calculate statistics
          const totalPoints = validData.reduce((sum, d) => sum + (d.wallet.balancePoints || 0), 0)
          const avgPoints = validData.length > 0 ? Math.round(totalPoints / validData.length) : 0
          const totalMembers = validData.reduce((sum, d) => sum + d.memberCount, 0)
          const avgPointsPerMember = totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0
          
          // Identify clubs needing funding
          const lowFundingClubs = validData.filter(d => (d.wallet.balancePoints || 0) < 500)
          const highFundingClubs = validData.filter(d => (d.wallet.balancePoints || 0) > 5000)
          
          systemContent = `You are an AI assistant for a university club and event management system.
Provide comprehensive funding analysis and allocation recommendations:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 FUNDING ANALYSIS & DISTRIBUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Financial Overview (${validData.length} clubs analyzed)
Analysis Date: ${new Date().toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 OVERALL FINANCIAL STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

System-wide Metrics:
• Total Points Allocated: ${totalPoints} points
• Average per Club: ${avgPoints} points
• Total Active Members: ${totalMembers} students
• Points per Member (avg): ${avgPointsPerMember} pts
• Clubs Analyzed: ${validData.length}

Distribution Analysis:
• Well-Funded Clubs (>5000pts): ${highFundingClubs.length} (${Math.round((highFundingClubs.length / validData.length) * 100)}%)
• Adequate Funding (500-5000pts): ${validData.length - lowFundingClubs.length - highFundingClubs.length} (${Math.round(((validData.length - lowFundingClubs.length - highFundingClubs.length) / validData.length) * 100)}%)
• Low Funding (<500pts): ${lowFundingClubs.length} (${Math.round((lowFundingClubs.length / validData.length) * 100)}%)

Financial Health: ${lowFundingClubs.length === 0 ? "⭐⭐⭐⭐⭐ Excellent" : lowFundingClubs.length < 3 ? "⭐⭐⭐⭐ Good" : lowFundingClubs.length < 6 ? "⭐⭐⭐ Fair" : "⭐⭐ Needs Attention"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 CLUB FUNDING BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top 10 Clubs by Funding:
${validData
  .sort((a, b) => (b.wallet.balancePoints || 0) - (a.wallet.balancePoints || 0))
  .slice(0, 10)
  .map((d, index) => `${index + 1}. ${d.club.name}
   • Balance: ${d.wallet.balancePoints || 0} points
   • Members: ${d.memberCount} students
   • Points/Member: ${d.memberCount > 0 ? Math.round((d.wallet.balancePoints || 0) / d.memberCount) : 0} pts
   • Events: ${d.eventCount}
   • Major: ${d.club.majorName || "N/A"}
   • Status: ${(d.wallet.balancePoints || 0) > 5000 ? "💰 Well-Funded" : (d.wallet.balancePoints || 0) > 500 ? "✅ Adequate" : "⚠️ Low"}
`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CLUBS REQUIRING ATTENTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Low Funding Clubs (<500 points):
${lowFundingClubs.length > 0 ? lowFundingClubs.map((d, index) => `${index + 1}. ${d.club.name}
   • Current Balance: ${d.wallet.balancePoints || 0} points ⚠️
   • Members: ${d.memberCount} students
   • Events Organized: ${d.eventCount}
   • Major: ${d.club.majorName || "N/A"}
   • Urgency: ${(d.wallet.balancePoints || 0) < 100 ? "🔴 Critical" : (d.wallet.balancePoints || 0) < 300 ? "🟡 High" : "🟢 Medium"}
   • Recommended Allocation: ${Math.max(1000 - (d.wallet.balancePoints || 0), 500)} points
   • Justification: ${d.memberCount > 20 ? "Large active membership needs support" : d.eventCount > 5 ? "Active event organization" : "Maintain basic operations"}
`).join("\n") : "✅ No clubs with critically low funding"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 FUNDING EFFICIENCY ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Efficiency Metrics:
${validData.slice(0, 10).map(d => {
  const efficiency = d.memberCount > 0 && d.eventCount > 0 
    ? Math.round(((d.wallet.balancePoints || 0) / d.memberCount) / Math.max(d.eventCount, 1))
    : 0
  return `• ${d.club.name}:
    Points: ${d.wallet.balancePoints || 0} | Members: ${d.memberCount} | Events: ${d.eventCount}
    Efficiency Score: ${efficiency} pts/member/event
    Rating: ${efficiency > 50 ? "⭐⭐⭐ Efficient" : efficiency > 20 ? "⭐⭐ Moderate" : "⭐ Needs Review"}`
}).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 FUNDING RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Priority Allocations:

🔴 Immediate Funding Needed (${lowFundingClubs.filter(d => (d.wallet.balancePoints || 0) < 300).length} clubs):
${lowFundingClubs.filter(d => (d.wallet.balancePoints || 0) < 300).map(d => 
  `• ${d.club.name}: Allocate ${Math.max(1000 - (d.wallet.balancePoints || 0), 500)} points`
).join("\n") || "None"}

🟡 Standard Funding Review (${lowFundingClubs.filter(d => (d.wallet.balancePoints || 0) >= 300).length} clubs):
${lowFundingClubs.filter(d => (d.wallet.balancePoints || 0) >= 300).map(d =>
  `• ${d.club.name}: Consider ${500} point allocation`
).join("\n") || "None"}

💰 Budget Distribution Strategy:
• Total Recommended Allocation: ${lowFundingClubs.reduce((sum, d) => sum + Math.max(1000 - (d.wallet.balancePoints || 0), 500), 0)} points
• Emergency Fund Reserve: ${Math.round(lowFundingClubs.reduce((sum, d) => sum + Math.max(1000 - (d.wallet.balancePoints || 0), 500), 0) * 0.2)} points (20%)
• Per Club Average: ${lowFundingClubs.length > 0 ? Math.round(lowFundingClubs.reduce((sum, d) => sum + Math.max(1000 - (d.wallet.balancePoints || 0), 500), 0) / lowFundingClubs.length) : 0} points

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ALLOCATION CRITERIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Funding Priority Factors:
1. Current Balance (Weight: 40%)
   • <100 points: Critical priority
   • 100-300 points: High priority
   • 300-500 points: Medium priority

2. Member Count (Weight: 30%)
   • Large clubs (>30): Higher allocation
   • Medium clubs (10-30): Standard allocation
   • Small clubs (<10): Proportional allocation

3. Event Activity (Weight: 20%)
   • High activity (>10 events): Reward productivity
   • Medium activity (5-10): Support growth
   • Low activity (<5): Encourage activation

4. Major Diversity (Weight: 10%)
   • Underrepresented majors: Priority support
   • Balanced representation: Standard support

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 FINANCIAL SUSTAINABILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Long-term Strategy:
• Maintain minimum 500 points per club
• Target 1000-3000 points per active club
• Reserve fund: 20% of total allocation
• Quarterly funding review cycle
• Performance-based bonus allocations

Monitoring Metrics:
• Points per member ratio: Target 50-100 pts
• Event frequency: 1-2 events per month
• Member engagement rate
• Point utilization efficiency
• Budget vs actual spending

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 QUICK ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To allocate funding:
• Go to "Points" → "Fund Clubs"
• Review individual club requests
• Approve allocations based on analysis
• Monitor post-allocation performance

For detailed club analysis:
• Ask "Show club performance"
• Check individual club wallets
• Review transaction histories

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide data-driven funding recommendations prioritizing equity, sustainability, and strategic impact.`

          userContent = userMessage.text
        } catch (error) {
          console.error("Error fetching funding analysis:", error)
        }
      }
      // 18. Club Performance (UNIVERSITY_STAFF - NEW)
      else if (inputLower.includes("club performance") || (inputLower.includes("club") && inputLower.includes("compare"))) {
        try {
          const clubsResponse = await fetchClub({ page: 0, size: 50, sort: ["name"] })
          const clubs = Array.isArray(clubsResponse) ? clubsResponse : (clubsResponse as any).data || []
          
          // Fetch comprehensive data for each club
          const clubPerformanceData = await Promise.all(
            clubs.slice(0, 30).map(async (club: any) => {
              try {
                const members = await getMembersByClubId(club.id)
                const events = await getEventByClubId(club.id)
                const wallet = await getClubWallet(club.id)
                const { getProducts } = await import("@/service/productApi")
                const products = await getProducts(club.id, { includeInactive: false })
                
                const activeMembers = members.filter((m: any) => m.state === "ACTIVE").length
                const approvedEvents = events.filter((e: any) => e.status === "APPROVED").length
                const completedEvents = events.filter((e: any) => e.status === "COMPLETED").length
                
                // Calculate performance score
                const memberScore = Math.min((activeMembers / 50) * 30, 30)
                const eventScore = Math.min((events.length / 20) * 25, 25)
                const financialScore = Math.min(((wallet.balancePoints || 0) / 5000) * 25, 25)
                const productScore = Math.min((products.length / 10) * 20, 20)
                const performanceScore = Math.round(memberScore + eventScore + financialScore + productScore)
                
                return {
                  club,
                  activeMembers,
                  totalEvents: events.length,
                  approvedEvents,
                  completedEvents,
                  walletBalance: wallet.balancePoints || 0,
                  productsAvailable: products.length,
                  performanceScore
                }
              } catch {
                return null
              }
            })
          )
          
          const validData = clubPerformanceData.filter(d => d !== null)
          
          // Sort by performance score
          const topPerformers = [...validData].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 10)
          const needsImprovement = [...validData].sort((a, b) => a.performanceScore - b.performanceScore).slice(0, 5)
          
          // Calculate averages
          const avgMembers = Math.round(validData.reduce((sum, d) => sum + d.activeMembers, 0) / validData.length)
          const avgEvents = Math.round(validData.reduce((sum, d) => sum + d.totalEvents, 0) / validData.length)
          const avgBalance = Math.round(validData.reduce((sum, d) => sum + d.walletBalance, 0) / validData.length)
          const avgScore = Math.round(validData.reduce((sum, d) => sum + d.performanceScore, 0) / validData.length)
          
          systemContent = `You are an AI assistant for a university club and event management system.
Provide comprehensive club performance comparison and analysis:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 CLUB PERFORMANCE COMPARISON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Performance Analysis: ${validData.length} Clubs
Report Date: ${new Date().toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SYSTEM-WIDE AVERAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Benchmark Metrics:
• Average Members: ${avgMembers} students
• Average Events: ${avgEvents} events
• Average Wallet Balance: ${avgBalance} points
• Average Performance Score: ${avgScore}/100

Performance Distribution:
• Excellent (80-100): ${validData.filter(d => d.performanceScore >= 80).length} clubs (${Math.round((validData.filter(d => d.performanceScore >= 80).length / validData.length) * 100)}%)
• Good (60-79): ${validData.filter(d => d.performanceScore >= 60 && d.performanceScore < 80).length} clubs (${Math.round((validData.filter(d => d.performanceScore >= 60 && d.performanceScore < 80).length / validData.length) * 100)}%)
• Fair (40-59): ${validData.filter(d => d.performanceScore >= 40 && d.performanceScore < 60).length} clubs (${Math.round((validData.filter(d => d.performanceScore >= 40 && d.performanceScore < 60).length / validData.length) * 100)}%)
• Needs Improvement (<40): ${validData.filter(d => d.performanceScore < 40).length} clubs (${Math.round((validData.filter(d => d.performanceScore < 40).length / validData.length) * 100)}%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥇 TOP 10 PERFORMING CLUBS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${topPerformers.map((d, index) => `${index + 1}. ${index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏆"} ${d.club.name}
━━━━━━━━━━━━━━━━━━━━━━━━

📊 Performance Score: ${d.performanceScore}/100
${d.performanceScore >= 80 ? "⭐⭐⭐⭐⭐ Excellent" : d.performanceScore >= 60 ? "⭐⭐⭐⭐ Good" : d.performanceScore >= 40 ? "⭐⭐⭐ Fair" : "⭐⭐ Needs Improvement"}

Key Metrics:
• 👥 Active Members: ${d.activeMembers} (${d.activeMembers > avgMembers ? "Above" : d.activeMembers === avgMembers ? "At" : "Below"} average)
• 🎉 Total Events: ${d.totalEvents} (${d.totalEvents > avgEvents ? "Above" : d.totalEvents === avgEvents ? "At" : "Below"} average)
• ✅ Approved Events: ${d.approvedEvents} (${Math.round((d.approvedEvents / Math.max(d.totalEvents, 1)) * 100)}% approval)
• ✔️ Completed Events: ${d.completedEvents}
• 💰 Wallet Balance: ${d.walletBalance} points (${d.walletBalance > avgBalance ? "Above" : d.walletBalance === avgBalance ? "At" : "Below"} average)
• 🎁 Products Available: ${d.productsAvailable}
• 🎓 Major: ${d.club.majorName || "N/A"}

Performance Breakdown:
• Member Engagement: ${Math.min(Math.round((d.activeMembers / 50) * 100), 100)}%
• Event Activity: ${Math.min(Math.round((d.totalEvents / 20) * 100), 100)}%
• Financial Health: ${Math.min(Math.round((d.walletBalance / 5000) * 100), 100)}%
• Resource Availability: ${Math.min(Math.round((d.productsAvailable / 10) * 100), 100)}%

Strengths:
${d.activeMembers > avgMembers * 1.2 ? "• ✅ Strong member base" : ""}
${d.totalEvents > avgEvents * 1.5 ? "• ✅ Highly active event organization" : ""}
${d.walletBalance > avgBalance * 1.5 ? "• ✅ Excellent financial management" : ""}
${d.productsAvailable > 5 ? "• ✅ Good reward offerings" : ""}
${d.performanceScore >= 80 ? "• ✅ Overall excellence across all areas" : ""}
`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CLUBS NEEDING SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${needsImprovement.map((d, index) => `${index + 1}. ${d.club.name}
━━━━━━━━━━━━━━━━━━━━━━━━

📊 Performance Score: ${d.performanceScore}/100 ⚠️
Status: ${d.performanceScore < 40 ? "🔴 Critical - Immediate Intervention Needed" : "🟡 Needs Improvement"}

Current Metrics:
• Members: ${d.activeMembers} (${Math.round((d.activeMembers / avgMembers) * 100)}% of average)
• Events: ${d.totalEvents} (${Math.round((d.totalEvents / avgEvents) * 100)}% of average)
• Wallet: ${d.walletBalance} points (${Math.round((d.walletBalance / avgBalance) * 100)}% of average)
• Products: ${d.productsAvailable}
• Major: ${d.club.majorName || "N/A"}

Areas Needing Attention:
${d.activeMembers < avgMembers * 0.5 ? "• ⚠️ Low member count - recruitment support needed" : ""}
${d.totalEvents < avgEvents * 0.5 ? "• ⚠️ Low event activity - planning assistance required" : ""}
${d.walletBalance < avgBalance * 0.3 ? "• ⚠️ Critical funding shortage - immediate allocation recommended" : ""}
${d.productsAvailable === 0 ? "• ⚠️ No reward products - setup guidance needed" : ""}

Recommended Actions:
1. ${d.activeMembers < avgMembers * 0.5 ? "Launch recruitment campaign and membership drive" : "Maintain member engagement programs"}
2. ${d.totalEvents < avgEvents * 0.5 ? "Provide event planning workshop and mentorship" : "Continue event activities"}
3. ${d.walletBalance < 500 ? `Allocate ${Math.max(1000 - d.walletBalance, 500)} points immediately` : "Monitor financial status"}
4. ${d.productsAvailable === 0 ? "Assist with product catalog setup" : "Expand product offerings"}
5. Assign university staff mentor for 30-day improvement plan

Priority: ${d.performanceScore < 30 ? "🔴 Critical" : d.performanceScore < 50 ? "🟡 High" : "🟢 Medium"}
`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 PERFORMANCE SCORE METHODOLOGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scoring Breakdown (Total: 100 points):

1. Member Engagement (30 points)
   • 0-10 members: 0-12 points
   • 11-25 members: 13-21 points
   • 26-50 members: 22-30 points
   • >50 members: 30 points

2. Event Activity (25 points)
   • 0-5 events: 0-6 points
   • 6-12 events: 7-15 points
   • 13-20 events: 16-24 points
   • >20 events: 25 points

3. Financial Health (25 points)
   • 0-1000 points: 0-5 points
   • 1001-2500 points: 6-12 points
   • 2501-5000 points: 13-20 points
   • >5000 points: 21-25 points

4. Resource Availability (20 points)
   • 0-2 products: 0-4 points
   • 3-5 products: 5-10 points
   • 6-10 products: 11-16 points
   • >10 products: 17-20 points

Performance Ratings:
• 80-100: ⭐⭐⭐⭐⭐ Excellent - Role model club
• 60-79: ⭐⭐⭐⭐ Good - Performing well
• 40-59: ⭐⭐⭐ Fair - Room for improvement
• 20-39: ⭐⭐ Poor - Needs support
• 0-19: ⭐ Critical - Immediate intervention

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 STRATEGIC INSIGHTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Success Factors from Top Performers:
• Consistent event organization (1-2 per month)
• Active member recruitment and retention
• Strong financial planning and management
• Diverse product offerings for members
• Engaged leadership team

Common Challenges in Low Performers:
• Insufficient funding for activities
• Low member engagement
• Irregular event scheduling
• Limited reward offerings
• Leadership capacity issues

System-wide Recommendations:
• Share best practices from top performers
• Provide targeted support to struggling clubs
• Establish peer mentorship program
• Regular performance review meetings
• Resource allocation based on performance and potential

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ACTION PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Immediate Actions (This Week):
1. Contact ${needsImprovement.length} clubs needing support
2. Allocate emergency funding to critical cases
3. Schedule leadership meetings with low performers
4. Recognize and celebrate top performers

Short-term (This Month):
1. Implement mentorship program
2. Host club leader training workshop
3. Review and approve pending requests promptly
4. Monitor improvement progress

Long-term (This Semester):
1. Establish performance incentive program
2. Create club excellence awards
3. Develop comprehensive support resources
4. Build sustainable growth strategies

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide data-driven performance insights to drive continuous improvement across all clubs.`

          userContent = userMessage.text
        } catch (error) {
          console.error("Error fetching club performance:", error)
        }
      }
      // 19. Platform Insights (UNIVERSITY_STAFF - NEW)
      else if (inputLower.includes("platform insights") || (inputLower.includes("platform") && inputLower.includes("trends"))) {
        try {
          const clubsResponse = await fetchClub({ page: 0, size: 500, sort: ["name"] })
          const clubs = Array.isArray(clubsResponse) ? clubsResponse : (clubsResponse as any).data || []
          const allEvents = await fetchEvent({ size: 500 })
          const applications = await getClubApplications()
          
          const now = new Date()
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          
          // Analyze trends
          const recentApplications = applications.filter((a: any) => new Date(a.createdAt) > lastMonth)
          const thisMonthApplications = applications.filter((a: any) => new Date(a.createdAt) > thisMonth)
          
          const recentEvents = allEvents.filter((e: any) => new Date(e.createdAt) > lastMonth)
          const upcomingEvents = allEvents.filter((e: any) => new Date(e.date) > now)
          
          // Group by major
          const clubsByMajor: Record<string, number> = {}
          clubs.forEach((club: any) => {
            const major = club.majorName || "Unknown"
            clubsByMajor[major] = (clubsByMajor[major] || 0) + 1
          })
          
          systemContent = `You are an AI assistant for a university club and event management system.
Provide comprehensive platform usage insights and trend analysis:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 UNICLUB PLATFORM INSIGHTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Platform Analytics & Trends
Analysis Period: Last 30 days
Report Date: ${now.toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 GROWTH TRENDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Club Ecosystem Growth:
• Total Active Clubs: ${clubs.length}
• New Applications (Last 30 days): ${recentApplications.length}
• New Applications (This Month): ${thisMonthApplications.length}
• Growth Rate: ${recentApplications.length > 0 ? "📈 Growing" : "📊 Stable"}
• Trend: ${thisMonthApplications.length > recentApplications.length / 2 ? "Accelerating" : thisMonthApplications.length > 0 ? "Steady" : "Slowing"}

Event Activity Trends:
• Total Events: ${allEvents.length}
• Events Created (Last 30 days): ${recentEvents.length}
• Upcoming Events: ${upcomingEvents.length}
• Event Creation Rate: ${Math.round(recentEvents.length / 30)} events/day
• Activity Level: ${recentEvents.length > 50 ? "🔥 Very High" : recentEvents.length > 20 ? "📈 High" : recentEvents.length > 10 ? "📊 Moderate" : "📉 Low"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 USAGE PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Platform Engagement:
• Clubs per Major (avg): ${Object.keys(clubsByMajor).length > 0 ? Math.round(clubs.length / Object.keys(clubsByMajor).length) : 0}
• Events per Club (avg): ${clubs.length > 0 ? Math.round(allEvents.length / clubs.length) : 0}
• Application Approval Rate: ${applications.length > 0 ? Math.round((applications.filter((a: any) => a.status === "APPROVED").length / applications.length) * 100) : 0}%
• Event Approval Rate: ${allEvents.length > 0 ? Math.round((allEvents.filter((e: any) => e.status === "APPROVED").length / allEvents.length) * 100) : 0}%

User Activity Indicators:
• Peak Application Period: ${thisMonthApplications.length > recentApplications.length * 0.6 ? "Current month shows high activity" : "Activity distributed across period"}
• Event Planning Horizon: ${upcomingEvents.length > 20 ? "Excellent advance planning" : upcomingEvents.length > 10 ? "Good planning" : "Encourage advance event planning"}
• System Utilization: ${clubs.length > 30 && allEvents.length > 100 ? "⭐⭐⭐⭐⭐ Excellent" : clubs.length > 15 && allEvents.length > 50 ? "⭐⭐⭐⭐ Good" : "⭐⭐⭐ Moderate"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ MAJOR DIVERSITY ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Representation Overview:
• Total Majors: ${Object.keys(clubsByMajor).length}
• Most Active Major: ${Object.entries(clubsByMajor).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || "N/A"} (${Object.entries(clubsByMajor).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[1] || 0} clubs)
• Least Active Major: ${Object.entries(clubsByMajor).sort(([, a], [, b]) => (a as number) - (b as number))[0]?.[0] || "N/A"} (${Object.entries(clubsByMajor).sort(([, a], [, b]) => (a as number) - (b as number))[0]?.[1] || 0} club)
• Diversity Score: ${Object.keys(clubsByMajor).length > 15 ? "⭐⭐⭐⭐⭐ Excellent" : Object.keys(clubsByMajor).length > 10 ? "⭐⭐⭐⭐ Good" : Object.keys(clubsByMajor).length > 5 ? "⭐⭐⭐ Fair" : "⭐⭐ Needs Improvement"}

Distribution Balance:
${Object.entries(clubsByMajor)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .slice(0, 10)
  .map(([major, count], index) => {
    const percentage = Math.round(((count as number) / clubs.length) * 100)
    return `${index + 1}. ${major}: ${count} clubs (${percentage}%)
   Status: ${percentage > 20 ? "⚠️ Over-represented" : percentage > 5 ? "✅ Balanced" : "📈 Growth opportunity"}`
  }).join("\n")}

Underrepresented Majors:
${Object.entries(clubsByMajor)
  .filter(([, count]) => (count as number) <= 2)
  .map(([major, count]) => `• ${major}: ${count} club(s) - Recruit new clubs`)
  .join("\n") || "✅ All majors adequately represented"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 KEY INSIGHTS & PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Positive Trends:
${recentApplications.length > 5 ? "• ✅ Strong interest in new club creation" : ""}
${upcomingEvents.length > 30 ? "• ✅ Excellent event pipeline and planning" : ""}
${Object.keys(clubsByMajor).length > 10 ? "• ✅ Good major diversity across clubs" : ""}
${allEvents.length > clubs.length * 5 ? "• ✅ High event activity per club" : ""}

Areas of Concern:
${recentApplications.length === 0 ? "• ⚠️ No new club applications - promote club creation" : ""}
${upcomingEvents.length < 10 ? "• ⚠️ Low upcoming event count - encourage planning" : ""}
${Object.keys(clubsByMajor).length < 5 ? "• ⚠️ Limited major diversity - expand reach" : ""}
${clubs.length < 15 ? "• ⚠️ Small club ecosystem - growth opportunities exist" : ""}

Opportunities:
${Object.entries(clubsByMajor).filter(([, count]) => (count as number) === 0).length > 0 ? "• 📈 Untapped majors for new club development" : ""}
${applications.filter((a: any) => a.status === "PENDING").length > 5 ? "• 📝 Multiple pending applications - accelerate review process" : ""}
${upcomingEvents.length < clubs.length ? "• 🎉 Encourage more clubs to organize events" : ""}
${clubs.length > 20 && allEvents.length < 50 ? "• 🎯 Focus on increasing event frequency" : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 STRATEGIC RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Short-term Actions (Next 30 Days):
1. ${recentApplications.length > 0 ? `Process ${applications.filter((a: any) => a.status === "PENDING").length} pending applications` : "Launch club creation awareness campaign"}
2. ${upcomingEvents.length < 20 ? "Encourage clubs to plan and submit more events" : "Continue supporting active event planning"}
3. ${Object.entries(clubsByMajor).filter(([, count]) => (count as number) <= 1).length > 0 ? "Target recruitment in underrepresented majors" : "Maintain major diversity"}
4. Recognize and reward most active clubs
5. Share best practices from top performers

Medium-term Goals (This Semester):
1. Grow club count by ${Math.max(5, Math.round(clubs.length * 0.1))} clubs (10% growth)
2. Increase event frequency to ${Math.round(clubs.length * 1.5)} total events
3. Achieve ${Math.min(20, Object.keys(clubsByMajor).length + 3)} majors represented
4. Improve application processing time to <3 days
5. Launch inter-club collaboration initiatives

Long-term Vision (This Year):
1. Establish presence in all university majors
2. Reach ${Math.max(50, clubs.length * 2)} active clubs
3. Host ${Math.max(200, allEvents.length * 2)} events annually
4. Build self-sustaining club ecosystem
5. Create platform for campus-wide engagement

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUCCESS METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Performance vs Targets:

Club Growth:
• Current: ${clubs.length} clubs
• Target: ${Math.max(50, clubs.length + 10)} clubs
• Progress: ${Math.round((clubs.length / Math.max(50, clubs.length + 10)) * 100)}%
• Status: ${clubs.length >= 40 ? "✅ On Track" : clubs.length >= 20 ? "⚠️ Moderate" : "🔴 Needs Acceleration"}

Event Activity:
• Current: ${allEvents.length} events
• Target: ${Math.max(200, allEvents.length + 50)} events
• Progress: ${Math.round((allEvents.length / Math.max(200, allEvents.length + 50)) * 100)}%
• Status: ${allEvents.length >= 150 ? "✅ Excellent" : allEvents.length >= 75 ? "⚠️ Good" : "🔴 Needs Improvement"}

Major Diversity:
• Current: ${Object.keys(clubsByMajor).length} majors
• Target: ${Math.max(20, Object.keys(clubsByMajor).length + 5)} majors
• Progress: ${Math.round((Object.keys(clubsByMajor).length / Math.max(20, Object.keys(clubsByMajor).length + 5)) * 100)}%
• Status: ${Object.keys(clubsByMajor).length >= 15 ? "✅ Excellent" : Object.keys(clubsByMajor).length >= 10 ? "⚠️ Good" : "🔴 Expand Reach"}

Application Processing:
• Pending: ${applications.filter((a: any) => a.status === "PENDING").length}
• Target: <5 pending at any time
• Status: ${applications.filter((a: any) => a.status === "PENDING").length < 5 ? "✅ Efficient" : "⚠️ Needs Attention"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DATA-DRIVEN DECISIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Investment Priorities:
1. ${Object.keys(clubsByMajor).length < 10 ? "Major Diversity Program - High Priority" : "Maintain major balance"}
2. ${upcomingEvents.length < 20 ? "Event Planning Support - High Priority" : "Continue event support"}
3. ${recentApplications.length === 0 ? "Club Creation Campaign - High Priority" : "Standard recruitment"}
4. ${clubs.length < 20 ? "Platform Growth Initiative - Medium Priority" : "Focus on quality over quantity"}

Resource Allocation:
• Marketing & Outreach: ${recentApplications.length < 3 ? "30%" : "20%"}
• Club Support & Training: ${clubs.length > 20 ? "35%" : "25%"}
• Event Facilitation: ${upcomingEvents.length > 30 ? "20%" : "30%"}
• Platform Development: 15%
• Quality Assurance: 10%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 DETAILED REPORTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For deeper analysis, request:
• "Show system overview" - Overall platform health
• "Show club performance" - Individual club metrics
• "Show funding analysis" - Financial distribution
• "Generate monthly overview" - Comprehensive monthly report

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transform insights into action. Monitor trends, respond to patterns, and guide strategic growth.`

          userContent = userMessage.text
        } catch (error) {
          console.error("Error fetching platform insights:", error)
        }
      }
      // 20. Monthly Overview (UNIVERSITY_STAFF - NEW)
      else if (inputLower.includes("monthly overview") || (inputLower.includes("system") && inputLower.includes("monthly"))) {
        try {
          const clubsResponse = await fetchClub({ page: 0, size: 500, sort: ["name"] })
          const clubs = Array.isArray(clubsResponse) ? clubsResponse : (clubsResponse as any).data || []
          const allEvents = await fetchEvent({ size: 500 })
          const applications = await getClubApplications()
          
          const now = new Date()
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()
          const monthName = now.toLocaleString('default', { month: 'long' })
          const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
          
          // Filter this month's data
          const thisMonthApplications = applications.filter((a: any) => {
            const date = new Date(a.createdAt)
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear
          })
          
          const thisMonthEvents = allEvents.filter((e: any) => {
            const date = new Date(e.date)
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear
          })
          
          const eventsCreatedThisMonth = allEvents.filter((e: any) => {
            const date = new Date(e.createdAt)
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear
          })
          
          // Calculate statistics
          const approvedApplications = thisMonthApplications.filter((a: any) => a.status === "APPROVED").length
          const approvedEvents = thisMonthEvents.filter((e: any) => e.status === "APPROVED").length
          const completedEvents = thisMonthEvents.filter((e: any) => e.status === "COMPLETED").length
          
          // Sample club data (first 20 for performance)
          const sampleClubData = await Promise.all(
            clubs.slice(0, 20).map(async (club: any) => {
              try {
                const members = await getMembersByClubId(club.id)
                return members.filter((m: any) => m.state === "ACTIVE").length
              } catch {
                return 0
              }
            })
          )
          const estimatedTotalMembers = Math.round((sampleClubData.reduce((sum, count) => sum + count, 0) / Math.min(20, clubs.length)) * clubs.length)
          
          systemContent = `You are an AI assistant for a university club and event management system.
Generate comprehensive system-wide monthly report:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 UNICLUB MONTHLY OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

System-Wide Performance Report
Period: ${monthName} ${currentYear}
Generated: ${now.toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Platform Status:
• Overall Health: ${clubs.length > 30 && allEvents.length > 100 ? "⭐⭐⭐⭐⭐ Excellent" : clubs.length > 15 && allEvents.length > 50 ? "⭐⭐⭐⭐ Good" : clubs.length > 5 ? "⭐⭐⭐ Fair" : "⭐⭐ Needs Attention"}
• Activity Level: ${eventsCreatedThisMonth.length > 20 ? "Very High" : eventsCreatedThisMonth.length > 10 ? "High" : eventsCreatedThisMonth.length > 5 ? "Moderate" : "Low"}
• Growth Trend: ${thisMonthApplications.length > 3 ? "📈 Accelerating" : thisMonthApplications.length > 0 ? "📊 Steady" : "📉 Stable"}

Key Highlights:
• ${clubs.length} active clubs on platform
• ${thisMonthEvents.length} events scheduled this month
• ${thisMonthApplications.length} new club applications received
• ~${estimatedTotalMembers} active student members (estimated)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ CLUB ECOSYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Status:
• Total Active Clubs: ${clubs.length}
• Applications This Month: ${thisMonthApplications.length}
• ✅ Approved: ${approvedApplications}
• ⏳ Pending: ${thisMonthApplications.filter((a: any) => a.status === "PENDING").length}
• ❌ Rejected: ${thisMonthApplications.filter((a: any) => a.status === "REJECTED").length}
• Approval Rate: ${thisMonthApplications.length > 0 ? Math.round((approvedApplications / thisMonthApplications.length) * 100) : 0}%

Member Engagement:
• Estimated Total Members: ~${estimatedTotalMembers}
• Average Members per Club: ${clubs.length > 0 ? Math.round(estimatedTotalMembers / clubs.length) : 0}
• Member Distribution: ${estimatedTotalMembers > 500 ? "Wide reach" : estimatedTotalMembers > 200 ? "Growing" : "Developing"}

Monthly Changes:
• New Clubs Approved: ${approvedApplications}
• Club Growth Rate: ${clubs.length > 0 ? Math.round((approvedApplications / clubs.length) * 100) : 0}%
• Status: ${approvedApplications > 2 ? "🔥 Strong Growth" : approvedApplications > 0 ? "📈 Positive Growth" : "📊 Stable"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 EVENT ACTIVITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Monthly Event Summary:
• Events This Month: ${thisMonthEvents.length}
• New Events Created: ${eventsCreatedThisMonth.length}
• ✅ Approved Events: ${approvedEvents}
• ✔️ Completed Events: ${completedEvents}
• ⏳ Pending Approval: ${eventsCreatedThisMonth.filter((e: any) => e.status === "PENDING" || e.status === "PENDING_UNISTAFF").length}
• Approval Rate: ${eventsCreatedThisMonth.length > 0 ? Math.round((eventsCreatedThisMonth.filter((e: any) => e.status === "APPROVED").length / eventsCreatedThisMonth.length) * 100) : 0}%

Event Metrics:
• Events per Day: ${Math.round(eventsCreatedThisMonth.length / new Date().getDate())}
• Events per Club: ${clubs.length > 0 ? (eventsCreatedThisMonth.length / clubs.length).toFixed(2) : 0}
• Completion Rate: ${approvedEvents > 0 ? Math.round((completedEvents / approvedEvents) * 100) : 0}%
• Activity Level: ${eventsCreatedThisMonth.length > 30 ? "⭐⭐⭐⭐⭐ Very High" : eventsCreatedThisMonth.length > 15 ? "⭐⭐⭐⭐ High" : eventsCreatedThisMonth.length > 5 ? "⭐⭐⭐ Moderate" : "⭐⭐ Low"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PLATFORM PERFORMANCE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Key Performance Indicators:

Club Ecosystem Health:
• Club Count: ${clubs.length} | Target: 50 | Progress: ${Math.min(Math.round((clubs.length / 50) * 100), 100)}%
• Growth Rate: ${thisMonthApplications.length > 2 ? "⭐⭐⭐⭐⭐ Excellent" : thisMonthApplications.length > 0 ? "⭐⭐⭐⭐ Good" : "⭐⭐⭐ Stable"}
• Application Processing: ${thisMonthApplications.filter((a: any) => a.status === "PENDING").length < 5 ? "⭐⭐⭐⭐⭐ Efficient" : "⭐⭐⭐ Needs Attention"}

Event Activity:
• Event Frequency: ${eventsCreatedThisMonth.length > 20 ? "⭐⭐⭐⭐⭐ Very High" : eventsCreatedThisMonth.length > 10 ? "⭐⭐⭐⭐ High" : eventsCreatedThisMonth.length > 5 ? "⭐⭐⭐ Moderate" : "⭐⭐ Low"}
• Approval Efficiency: ${eventsCreatedThisMonth.filter((e: any) => e.status === "PENDING" || e.status === "PENDING_UNISTAFF").length < 10 ? "⭐⭐⭐⭐⭐ Excellent" : "⭐⭐⭐ Fair"}
• Completion Rate: ${completedEvents > 0 ? "⭐⭐⭐⭐ Active" : "⭐⭐⭐ Developing"}

Overall Platform Score: ${(() => {
  let score = 0
  if (clubs.length > 30) score += 25
  else if (clubs.length > 15) score += 15
  else if (clubs.length > 5) score += 10
  
  if (eventsCreatedThisMonth.length > 20) score += 25
  else if (eventsCreatedThisMonth.length > 10) score += 15
  else if (eventsCreatedThisMonth.length > 5) score += 10
  
  if (thisMonthApplications.length > 0) score += 25
  if (completedEvents > 5) score += 25
  else if (completedEvents > 0) score += 15
  
  return score
})()}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 MONTHLY ACHIEVEMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Successes This Month:
${approvedApplications > 0 ? `• ✅ Approved ${approvedApplications} new club applications` : ""}
${completedEvents > 5 ? `• ✅ Successfully completed ${completedEvents} events` : ""}
${eventsCreatedThisMonth.length > 15 ? "• ✅ High event creation activity" : ""}
${clubs.length > 30 ? "• ✅ Maintained large, healthy club ecosystem" : ""}
${thisMonthApplications.filter((a: any) => a.status === "PENDING").length < 5 ? "• ✅ Efficient application processing" : ""}

Challenges Encountered:
${thisMonthApplications.length === 0 ? "• ⚠️ No new club applications this month" : ""}
${eventsCreatedThisMonth.length < 5 ? "• ⚠️ Low event creation activity" : ""}
${eventsCreatedThisMonth.filter((e: any) => e.status === "PENDING" || e.status === "PENDING_UNISTAFF").length > 10 ? "• ⚠️ Event approval backlog" : ""}
${completedEvents === 0 ? "• ⚠️ No events completed yet this month" : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 TRENDS & INSIGHTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Growth Patterns:
• Club Applications: ${thisMonthApplications.length > 3 ? "📈 Strong interest" : thisMonthApplications.length > 0 ? "📊 Steady growth" : "📉 Promote creation"}
• Event Planning: ${eventsCreatedThisMonth.length > 20 ? "🔥 Very active" : eventsCreatedThisMonth.length > 10 ? "📈 Active" : "📊 Moderate"}
• Platform Usage: ${clubs.length > 30 && eventsCreatedThisMonth.length > 15 ? "⭐ High engagement" : "📊 Growing engagement"}

User Engagement:
• Clubs Organizing Events: ${eventsCreatedThisMonth.length > 0 ? `${Math.min(eventsCreatedThisMonth.length, clubs.length)} clubs active` : "Encourage participation"}
• Event Diversity: ${eventsCreatedThisMonth.length > clubs.length * 0.5 ? "Excellent variety" : "Good distribution"}
• Member Reach: ~${estimatedTotalMembers} students engaged

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 RECOMMENDATIONS FOR NEXT MONTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Priority Actions:
1. ${thisMonthApplications.filter((a: any) => a.status === "PENDING").length > 0 ? `Process ${thisMonthApplications.filter((a: any) => a.status === "PENDING").length} pending applications` : "Monitor for new club applications"}
2. ${eventsCreatedThisMonth.filter((e: any) => e.status === "PENDING" || e.status === "PENDING_UNISTAFF").length > 0 ? `Approve ${eventsCreatedThisMonth.filter((e: any) => e.status === "PENDING" || e.status === "PENDING_UNISTAFF").length} pending events` : "Continue supporting event planning"}
3. ${eventsCreatedThisMonth.length < 10 ? "Encourage more clubs to organize events" : "Maintain current event activity level"}
4. ${thisMonthApplications.length === 0 ? "Launch club recruitment campaign" : "Continue growth momentum"}
5. Recognize and reward top performing clubs

Strategic Goals:
• Target ${Math.max(clubs.length + 3, 30)} clubs by end of next month
• Aim for ${Math.max(eventsCreatedThisMonth.length + 10, 25)} events next month
• Improve application processing time to <48 hours
• Increase member engagement by 15%
• Launch inter-club collaboration initiatives

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 COMPARATIVE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Month-over-Month Comparison:
• Club Applications: ${thisMonthApplications.length} this month
• Event Creation: ${eventsCreatedThisMonth.length} events created
• Event Completion: ${completedEvents} events completed
• Trend: ${thisMonthApplications.length > 0 || eventsCreatedThisMonth.length > 10 ? "📈 Positive momentum" : "📊 Steady state"}

Year-to-Date Progress:
• Total Clubs: ${clubs.length} (Growing platform)
• Total Events: ${allEvents.length} (Active community)
• Total Applications: ${applications.length} (Strong interest)
• Platform Maturity: ${clubs.length > 30 ? "Mature" : clubs.length > 15 ? "Established" : "Developing"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 RECOGNITION & AWARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Monthly Recognition Candidates:
• Most Active Club: [Based on event count this month]
• Best New Club: [From approved applications]
• Most Engaging Event: [Based on participation]
• Rising Star Club: [Fastest growing membership]

Suggested Awards:
• Club of the Month
• Event of the Month
• Best Club Leader
• Most Improved Club

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 ADMINISTRATIVE NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

System Maintenance:
• Platform Status: ✅ Operational
• User Satisfaction: ${clubs.length > 20 && eventsCreatedThisMonth.length > 10 ? "High" : "Good"}
• Support Tickets: [Monitor as needed]
• System Updates: [Check for improvements]

Action Items for Staff:
☐ Review and approve pending applications
☐ Process pending event requests
☐ Contact low-activity clubs
☐ Prepare recognition awards
☐ Plan next month's initiatives
☐ Update platform documentation
☐ Schedule leadership meetings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 DETAILED BREAKDOWNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For more specific analysis:
• "Show system overview" - Real-time platform status
• "Show club performance" - Individual club metrics
• "Show event approvals" - Pending event details
• "Show funding analysis" - Financial distribution
• "Show platform insights" - Usage trends

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 NEXT MONTH FORECAST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Projected Metrics:
• Expected Club Applications: ${Math.max(thisMonthApplications.length, 2)} - ${Math.max(thisMonthApplications.length + 3, 5)}
• Expected New Events: ${Math.max(eventsCreatedThisMonth.length, 10)} - ${Math.max(eventsCreatedThisMonth.length + 10, 25)}
• Expected Growth: ${thisMonthApplications.length > 0 ? "Continued expansion" : "Stable operations"}

Preparation Needed:
• Staff training for increased volume
• Enhanced approval workflows
• Additional support resources
• Recognition program launch

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report generated by UniBot AI Assistant
For university administration review and strategic planning

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

          userContent = userMessage.text
        } catch (error) {
          console.error("Error generating monthly overview:", error)
        }
      }

      // Build conversation context from existing messages (exclude welcome message)
      const conversationHistory = messages
        .filter(msg => msg.id !== "1") // Exclude welcome message
        .slice(-8) // Get last 8 messages (4 exchanges) for context without overwhelming the API
        .map(msg => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.text
        }))

      // Call Groq API with conversation history
      const response = await axios.post<ChatbotResponse>(
        chatbotUrl,
        {
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: systemContent,
            },
            ...conversationHistory, // Include conversation history for context
            { role: "user", content: userContent }, // Current message
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

      // Save conversation history to Redis
      if (userId) {
        try {
          await axios.post('/api/chatbot/history', {
            userId,
            messages: [
              { role: 'user', content: userMessage.text },
              { role: 'assistant', content: botText }
            ]
          })
          console.log('Conversation history saved')
        } catch (historyError) {
          console.error('Error saving conversation history:', historyError)
          // Don't throw error, just log it
        }
      }
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I cannot answer your question right now.",
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])

      // Save error response to history as well
      if (userId) {
        try {
          await axios.post('/api/chatbot/history', {
            userId,
            messages: [
              { role: 'user', content: userMessage.text },
              { role: 'assistant', content: errorMessage.text }
            ]
          })
        } catch (historyError) {
          console.error('Error saving error to history:', historyError)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = async () => {
    if (!userId) {
      console.warn('No userId available for clearing history')
      return
    }

    try {
      await axios.delete(`/api/chatbot/history?userId=${userId}`)
      // Reset messages to just the welcome message
      setMessages([
        {
          id: "1",
          text: "Hello! I am UniBot AI assistant. How can I help you?",
          isUser: false,
          timestamp: new Date(),
        },
      ])
      console.log('Conversation history cleared')
    } catch (error) {
      console.error('Error clearing conversation history:', error)
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
                      className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                      onClick={handleClearHistory}
                      aria-label="Clear conversation history"
                      title="Clear conversation history"
                      disabled={messages.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

async function getClubById(clubId: number) {
  const response = await fetchClub({ page: 0, size: 1, sort: ["name"] })
  const clubs = Array.isArray(response) ? response : (response as any).data || []
  const club = clubs.find((c: any) => c.id === clubId)
  return { data: club }
}
