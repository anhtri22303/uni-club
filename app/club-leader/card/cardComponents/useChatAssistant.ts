import { useState } from "react"
import axios from "axios"
import type { ChatMessage } from "./types"
import { gradientPresets, solidColors, pastelColors, neonColors, monochromeColors, cardPatterns, borderRadiusOptions, qrStyles } from "./constants"
import { getAllColors } from "./utils"

interface UseChatAssistantProps {
  colorType: string
  gradient: string
  pattern: string
  borderRadius: string
  qrSize: number[]
  qrStyle: string
  showLogo: boolean
  patternOpacity: number[]
  cardOpacity: number[]
  onColorTypeChange: (value: string) => void
  onGradientChange: (value: string) => void
  onCardColorClassChange: (value: string) => void
  onPatternChange: (value: string) => void
  onBorderRadiusChange: (value: string) => void
  onQRSizeChange: (value: number[]) => void
  onQRStyleChange: (value: string) => void
  onShowLogoChange: (value: boolean) => void
  onPatternOpacityChange: (value: number[]) => void
  onCardOpacityChange: (value: number[]) => void
  toast: (options: { title: string; description: string }) => void
}

export const useChatAssistant = (props: UseChatAssistantProps) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Hi! I'm your card design assistant. Tell me how you'd like to customize your card!\n\n🎨 Try: 'Make it neon pink', 'Use pastel colors', 'Change to stars pattern', 'Make it monochrome', 'Add hexagon pattern', etc.\n\nI can help with colors, patterns, borders, QR codes, and more!",
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)

  const handleChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      isUser: true,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsChatLoading(true)

    try {
      const chatbotUrl = process.env.NEXT_PUBLIC_AI_CHATBOT_URL
      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY
      
      if (!chatbotUrl || !apiKey) {
        throw new Error("AI configuration missing")
      }

      type ChatbotResponse = {
        choices?: Array<{
          message?: { content?: string }
        }>
      }

      const allColors = getAllColors()
      const systemContent = `You are a helpful card design assistant. The user is customizing a club member card.

AVAILABLE CUSTOMIZATIONS:
1. Color Types: Gradient, Solid, Pastel, Neon, Monochrome
2. Colors (${allColors.length} total):
   - Gradients: ${gradientPresets.map(g => g.name).join(", ")}
   - Solid: ${solidColors.map(g => g.name).join(", ")}
   - Pastel: ${pastelColors.map(g => g.name).join(", ")}
   - Neon: ${neonColors.map(g => g.name).join(", ")}
   - Monochrome: ${monochromeColors.map(g => g.name).join(", ")}
3. Patterns: ${cardPatterns.map(p => p.name).join(", ")}
4. Border Radius: ${borderRadiusOptions.map(b => b.name).join(", ")}
5. QR Code Styles: ${qrStyles.map(q => q.name).join(", ")}
6. QR Size: 60-150px
7. Pattern Opacity: 0-50%
8. Card Opacity: 50-100%
9. Show/Hide Logo

CURRENT STATE:
- Color Type: ${props.colorType}
- Current Color: ${allColors.find(c => c.value === props.gradient)?.name || "Custom"}
- Pattern: ${cardPatterns.find(p => p.value === props.pattern)?.name || "Unknown"}
- Border Radius: ${borderRadiusOptions.find(b => b.value === props.borderRadius)?.name || "Unknown"}
- QR Size: ${props.qrSize[0]}px
- QR Style: ${qrStyles.find(q => q.value === props.qrStyle)?.name || "Unknown"}
- Logo Visible: ${props.showLogo}
- Pattern Opacity: ${props.patternOpacity[0]}%
- Card Opacity: ${props.cardOpacity[0]}%

Analyze the user's request and respond with a JSON object containing the changes to apply. Use this EXACT format:
{
  "changes": {
    "colorType": "gradient/solid/pastel/neon/monochrome or null",
    "gradient": "color_value or null",
    "cardColorClass": "bg-gradient-to-r or empty string for solid colors",
    "pattern": "pattern_value or null",
    "borderRadius": "border_value or null",
    "qrSize": number or null,
    "qrStyle": "style_value or null",
    "showLogo": true/false or null,
    "patternOpacity": number or null,
    "cardOpacity": number or null
  },
  "message": "Friendly confirmation message about what was changed"
}

Only include properties that should change. Use null for properties that shouldn't change.
ALL Color values: ${allColors.map(c => `"${c.value}" (${c.name})`).join(", ")}
Pattern values: ${cardPatterns.map(p => `"${p.value}" (${p.name})`).join(", ")}
Border values: ${borderRadiusOptions.map(b => `"${b.value}" (${b.name})`).join(", ")}
QR Style values: ${qrStyles.map(q => `"${q.value}" (${q.name})`).join(", ")}

When setting colors:
- If gradient/pastel/neon/monochrome with "from-": set cardColorClass to "bg-gradient-to-r"
- If solid color (starts with "bg-"): set cardColorClass to ""
- Also update colorType to match the color category

Respond ONLY with valid JSON, no other text.`

      const response = await axios.post<ChatbotResponse>(
        chatbotUrl,
        {
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: chatInput },
          ],
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      )

      const aiResponse = response.data?.choices?.[0]?.message?.content?.trim()
      
      if (!aiResponse) {
        throw new Error("No response from AI")
      }

      // Parse the JSON response
      let parsedResponse
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse
        parsedResponse = JSON.parse(jsonStr)
      } catch (parseError) {
        console.error("Failed to parse AI response:", aiResponse)
        throw new Error("Invalid AI response format")
      }

      // Apply changes to card
      const changes = parsedResponse.changes || {}
      let appliedChanges: string[] = []

      if (changes.colorType !== undefined && changes.colorType !== null) {
        props.onColorTypeChange(changes.colorType)
        appliedChanges.push("color type")
      }
      if (changes.gradient !== undefined && changes.gradient !== null) {
        props.onGradientChange(changes.gradient)
        appliedChanges.push("color")
      }
      if (changes.cardColorClass !== undefined && changes.cardColorClass !== null) {
        props.onCardColorClassChange(changes.cardColorClass)
      }
      if (changes.pattern !== undefined && changes.pattern !== null) {
        props.onPatternChange(changes.pattern)
        appliedChanges.push("pattern")
      }
      if (changes.borderRadius !== undefined && changes.borderRadius !== null) {
        props.onBorderRadiusChange(changes.borderRadius)
        appliedChanges.push("border radius")
      }
      if (changes.qrSize !== undefined && changes.qrSize !== null) {
        props.onQRSizeChange([changes.qrSize])
        appliedChanges.push("QR size")
      }
      if (changes.qrStyle !== undefined && changes.qrStyle !== null) {
        props.onQRStyleChange(changes.qrStyle)
        appliedChanges.push("QR style")
      }
      if (changes.showLogo !== undefined && changes.showLogo !== null) {
        props.onShowLogoChange(changes.showLogo)
        appliedChanges.push("logo visibility")
      }
      if (changes.patternOpacity !== undefined && changes.patternOpacity !== null) {
        props.onPatternOpacityChange([changes.patternOpacity])
        appliedChanges.push("pattern opacity")
      }
      if (changes.cardOpacity !== undefined && changes.cardOpacity !== null) {
        props.onCardOpacityChange([changes.cardOpacity])
        appliedChanges.push("card opacity")
      }

      // Show toast for applied changes
      if (appliedChanges.length > 0) {
        props.toast({
          title: "Card Updated!",
          description: `Changed: ${appliedChanges.join(", ")}`,
        })
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: parsedResponse.message || "I've updated your card design!",
        isUser: false,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't process that request. Could you try rephrasing it? For example: 'Make it pink', 'Hide QR code', or 'Change to waves pattern'.",
        isUser: false,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsChatLoading(false)
    }
  }

  return {
    chatMessages,
    chatInput,
    isChatLoading,
    setChatInput,
    handleChatMessage,
  }
}

