"use client"

import React, { forwardRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PatternRenderer } from "./PatternRenderer"
import { getQrStyleClasses } from "./utils"
import type { CardData } from "./types"
import { Maximize2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// Helper function to convert Tailwind gradient classes to inline CSS
const getGradientStyle = (gradient: string, cardColorClass: string): React.CSSProperties => {
  const style: React.CSSProperties = {}
  
  // Check if it's a solid color (bg-{color}-{shade})
  if (gradient.startsWith('bg-')) {
    // Solid colors - extract the color value
    const colorMap: Record<string, string> = {
      'bg-blue-600': '#2563eb',
      'bg-red-600': '#dc2626',
      'bg-emerald-600': '#059669',
      'bg-purple-600': '#9333ea',
      'bg-amber-600': '#d97706',
      'bg-teal-600': '#0d9488',
      'bg-indigo-600': '#4f46e5',
      'bg-rose-600': '#e11d48',
      'bg-sky-600': '#0284c7',
      'bg-violet-600': '#7c3aed',
      'bg-gray-900': '#111827',
      'bg-gray-800': '#1f2937',
      'bg-gray-700': '#374151',
      'bg-gray-600': '#4b5563',
      'bg-gray-500': '#6b7280',
      'bg-gray-400': '#9ca3af',
      'bg-slate-300': '#cbd5e1',
      'bg-gray-200': '#e5e7eb',
    }
    
    if (colorMap[gradient]) {
      style.background = colorMap[gradient]
    }
  } else if (gradient.includes('from-') && gradient.includes('to-')) {
    // It's a gradient - parse the gradient classes
    const parts = gradient.split(' ')
    const fromColor = parts.find(p => p.startsWith('from-'))
    const viaColor = parts.find(p => p.startsWith('via-'))
    const toColor = parts.find(p => p.startsWith('to-'))
    
    // Map Tailwind color classes to actual hex values
    const colorValues: Record<string, string> = {
      // Gradient colors
      'from-blue-400': '#60a5fa',
      'via-purple-500': '#a855f7',
      'to-purple-600': '#9333ea',
      'from-pink-400': '#f472b6',
      'via-rose-400': '#fb7185',
      'to-orange-400': '#fb923c',
      'from-emerald-400': '#34d399',
      'via-teal-500': '#14b8a6',
      'to-cyan-500': '#06b6d4',
      'from-amber-400': '#fbbf24',
      'via-orange-500': '#f97316',
      'to-red-500': '#ef4444',
      'from-indigo-400': '#818cf8',
      'via-blue-500': '#3b82f6',
      'to-sky-500': '#0ea5e9',
      'from-purple-400': '#c084fc',
      'via-pink-500': '#ec4899',
      'to-rose-500': '#f43f5e',
      'from-teal-400': '#2dd4bf',
      'to-blue-500': '#3b82f6',
      'from-rose-400': '#fb7185',
      'to-orange-500': '#f97316',
      'from-violet-400': '#a78bfa',
      'to-fuchsia-500': '#d946ef',
      'from-lime-400': '#a3e635',
      'via-green-500': '#22c55e',
      'to-emerald-500': '#10b981',
      // Pastel colors
      'from-pink-200': '#fbcfe8',
      'via-rose-200': '#fecdd3',
      'to-pink-300': '#f9a8d4',
      'from-blue-200': '#bfdbfe',
      'via-sky-200': '#bae6fd',
      'to-cyan-200': '#a5f3fc',
      'from-purple-200': '#e9d5ff',
      'via-violet-200': '#ddd6fe',
      'to-purple-300': '#d8b4fe',
      'from-green-200': '#bbf7d0',
      'via-emerald-200': '#a7f3d0',
      'to-teal-200': '#99f6e4',
      'from-yellow-200': '#fef08a',
      'via-amber-200': '#fde68a',
      'to-orange-200': '#fed7aa',
      'from-rose-200': '#fecdd3',
      'via-pink-200': '#fbcfe8',
      'to-fuchsia-200': '#f5d0fe',
      'from-indigo-200': '#c7d2fe',
      'via-blue-200': '#bfdbfe',
      'to-purple-200': '#e9d5ff',
      'from-teal-200': '#99f6e4',
      'via-cyan-200': '#a5f3fc',
      'to-sky-200': '#bae6fd',
      // Neon colors
      'from-blue-500': '#3b82f6',
      'to-cyan-400': '#22d3ee',
      'from-pink-500': '#ec4899',
      'to-purple-500': '#a855f7',
      'from-green-500': '#22c55e',
      'to-lime-400': '#a3e635',
      'from-orange-500': '#f97316',
      'to-yellow-400': '#facc15',
      'from-red-500': '#ef4444',
      'to-pink-400': '#f472b6',
      'from-purple-500': '#a855f7',
      'to-indigo-400': '#818cf8',
      'from-teal-500': '#14b8a6',
      'to-emerald-400': '#34d399',
      'from-fuchsia-500': '#d946ef',
      'to-rose-400': '#fb7185',
    }
    
    let direction = 'to right'
    if (cardColorClass.includes('to-br')) direction = 'to bottom right'
    else if (cardColorClass.includes('to-bl')) direction = 'to bottom left'
    else if (cardColorClass.includes('to-tr')) direction = 'to top right'
    else if (cardColorClass.includes('to-tl')) direction = 'to top left'
    else if (cardColorClass.includes('to-b')) direction = 'to bottom'
    else if (cardColorClass.includes('to-t')) direction = 'to top'
    else if (cardColorClass.includes('to-l')) direction = 'to left'
    else if (cardColorClass.includes('to-r')) direction = 'to right'
    
    const colors: string[] = []
    if (fromColor && colorValues[fromColor]) colors.push(colorValues[fromColor])
    if (viaColor && colorValues[viaColor]) colors.push(colorValues[viaColor])
    if (toColor && colorValues[toColor]) colors.push(colorValues[toColor])
    
    if (colors.length >= 2) {
      style.background = `linear-gradient(${direction}, ${colors.join(', ')})`
    }
  }
  
  return style
}

interface CardPreviewProps {
  cardData: CardData
  colorType: string
  gradient: string
  cardColorClass: string
  pattern: string
  borderRadius: string
  logoUrl: string
  qrCodeUrl: string
  qrSize: number
  qrStyle: string
  showLogo: boolean
  patternOpacity: number
  cardOpacity: number
  showFrame?: boolean // Optional prop to control frame visibility
}

export const CardPreview = forwardRef<HTMLDivElement, CardPreviewProps>(
  (props, ref) => {
    const {
      cardData,
      colorType,
      gradient,
      cardColorClass,
      pattern,
      borderRadius,
      logoUrl,
      qrCodeUrl,
      qrSize,
      qrStyle,
      showLogo,
      patternOpacity,
      cardOpacity,
      showFrame = true, // Default to true for backward compatibility
    } = props

    // State for full-screen modal
    const [isFullScreen, setIsFullScreen] = useState(false)
    const fullScreenRef = React.useRef<HTMLDivElement>(null)

    // Handle full screen with native fullscreen API + screen orientation
    const handleOpenFullScreen = async () => {
      setIsFullScreen(true)
      
      // Use a small delay to ensure the modal is rendered before requesting fullscreen
      await new Promise(resolve => setTimeout(resolve, 100))
      
      try {
        const element = fullScreenRef.current
        if (!element) return

        // Request fullscreen on the element
        if (element.requestFullscreen) {
          await element.requestFullscreen()
        } else if ((element as any).webkitRequestFullscreen) {
          // Safari
          await (element as any).webkitRequestFullscreen()
        } else if ((element as any).mozRequestFullScreen) {
          // Firefox
          await (element as any).mozRequestFullScreen()
        } else if ((element as any).msRequestFullscreen) {
          // IE/Edge
          await (element as any).msRequestFullscreen()
        }

        // After entering fullscreen, try to lock orientation
        // This only works after fullscreen is activated
        if ('screen' in window && 'orientation' in (window.screen as any)) {
          try {
            const screenOrientation = (window.screen as any).orientation
            if (screenOrientation && typeof screenOrientation.lock === 'function') {
              await screenOrientation.lock('landscape').catch((err: any) => {
              })
            }
          } catch (err) {
          }
        }
      } catch (err) {
        // If fullscreen fails, still show the modal
      }
    }

    // Handle close full screen and unlock orientation
    const handleCloseFullScreen = async () => {
      try {
        // Exit fullscreen
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        } else if ((document as any).webkitFullscreenElement) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozFullScreenElement) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msFullscreenElement) {
          await (document as any).msExitFullscreen()
        }

        // Unlock screen orientation
        if ('screen' in window && 'orientation' in (window.screen as any)) {
          try {
            const screenOrientation = (window.screen as any).orientation
            if (screenOrientation && typeof screenOrientation.unlock === 'function') {
              screenOrientation.unlock()
            }
          } catch (err) {
          }
        }
      } catch (err) {
      }

      setIsFullScreen(false)
    }

    // Listen for fullscreen change events (when user exits via ESC or native controls)
    React.useEffect(() => {
      const handleFullscreenChange = () => {
        const isCurrentlyFullscreen = !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        )
        
        if (!isCurrentlyFullscreen && isFullScreen) {
          // User exited fullscreen, close our modal too
          setIsFullScreen(false)
        }
      }

      document.addEventListener('fullscreenchange', handleFullscreenChange)
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.addEventListener('mozfullscreenchange', handleFullscreenChange)
      document.addEventListener('MSFullscreenChange', handleFullscreenChange)

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange)
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      }
    }, [isFullScreen])

    // Get inline styles for the gradient/color (for better html-to-image support)
    const gradientStyle = getGradientStyle(gradient, cardColorClass)
    
    // Debug: Log card data being rendered

    const cardElement = (
      <div className="flex justify-center w-full relative">
        {/* Floating expand button when showFrame is false */}
        {!showFrame && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenFullScreen}
            className="absolute top-2 right-2 z-30 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm"
            title="Expand to full screen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
        <div
          ref={ref}
          data-card-element="true"
          className={`${cardColorClass} ${gradient} ${borderRadius} shadow-2xl p-3 sm:p-6 md:p-8 w-full ${showFrame ? 'max-w-xl' : 'max-w-2xl lg:max-w-3xl'} text-white relative overflow-hidden min-h-[280px] sm:min-h-[320px] md:min-h-[400px]`}
          style={{ 
            opacity: cardOpacity / 100,
            ...gradientStyle  // Apply inline style as fallback for html-to-image
          }}
        >
              {/* Pattern */}
              <PatternRenderer pattern={pattern} opacity={patternOpacity} />

              {/* QR Code - Fixed at center-right, responsive size */}
              {qrCodeUrl && (
                <div className="absolute top-1/2 right-1 sm:right-2 md:right-4 -translate-y-1/2 z-20">
                  <div className={getQrStyleClasses(qrStyle)}>
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="object-contain w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
                      style={{
                        width: `${Math.min(qrSize, 80)}px`,
                        height: `${Math.min(qrSize, 80)}px`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Logo - Fixed at top-right, smaller size, responsive */}
              {showLogo && logoUrl && (
                <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 z-10">
                  <div className="bg-white/20 backdrop-blur-sm p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg">
                    <img
                      src={logoUrl}
                      alt="Club Logo"
                      className="object-contain w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
                    />
                  </div>
                </div>
              )}

              {/* Card Content */}
              <div className="relative z-10">
                {/* Card Header */}
                <div className="mb-4 sm:mb-6 md:mb-8 pr-14 sm:pr-16">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 truncate">
                    {cardData.clubName}
                  </h1>
                  <p className="text-white/80 text-xs sm:text-sm truncate">Member Card</p>
                </div>

                {/* Profile Section - Adjusted for center-right QR */}
                <div className="flex items-start gap-2 sm:gap-4 md:gap-6 mb-3 sm:mb-6 md:mb-8 pr-16 sm:pr-24 md:pr-28">
                  {/* Avatar */}
                  <div className="shrink-0">
                    <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-md sm:rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                      <div className="text-sm sm:text-xl md:text-2xl font-bold text-white">
                        {cardData.studentName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h2 className="text-sm sm:text-lg md:text-2xl font-bold mb-0.5 sm:mb-2 truncate">
                      {cardData.studentName}
                    </h2>
                    <div className="space-y-0.5 sm:space-y-1 text-white/90">
                      <div className="text-[10px] sm:text-sm truncate">{cardData.major}</div>
                      <div className="text-[10px] sm:text-sm text-white/80 truncate break-all">
                        {cardData.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info Grid - Role and Student ID */}
                <div className="pt-2 sm:pt-4 md:pt-6 border-t border-white/20 grid grid-cols-2 gap-1.5 sm:gap-3 md:gap-4">
                  <div className="min-w-0 overflow-hidden">
                    <div className="text-[10px] sm:text-xs text-white/70 mb-0.5 sm:mb-1 truncate">
                      Role
                    </div>
                    <div className="text-[11px] sm:text-sm font-medium truncate">
                      {cardData.role}
                    </div>
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <div className="text-[10px] sm:text-xs text-white/70 mb-0.5 sm:mb-1 truncate">
                      Student ID
                    </div>
                    <div className="text-[11px] sm:text-sm font-medium font-mono truncate">
                      {cardData.studentCode}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 sm:mt-6 md:mt-8 pt-2 sm:pt-4 border-t border-white/20 text-center px-1">
                  <p className="text-[10px] sm:text-xs text-white/70 leading-relaxed line-clamp-2">
                    This card is issued by {cardData.clubName} for identification purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>
    )

    // Full-screen modal component (shared for both modes)
    const fullScreenModal = isFullScreen && (
      <div
        ref={fullScreenRef}
        className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-3 md:p-4"
        onClick={handleCloseFullScreen}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCloseFullScreen}
          className="absolute top-4 right-4 z-[10000] h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
          title="Close full screen"
        >
          <X className="h-6 w-6" />
        </Button>
        <div
          className="w-full h-full flex items-center justify-center overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center w-full px-4 sm:px-8 md:px-12 lg:px-16 py-4">
            <div
              className={`${cardColorClass} ${gradient} ${borderRadius} shadow-2xl p-6 sm:p-8 md:p-12 lg:p-16 w-full max-w-6xl min-h-[50vh] sm:min-h-[60vh] text-white relative overflow-hidden flex items-center justify-center`}
              style={{ 
                opacity: cardOpacity / 100,
                ...gradientStyle
              }}
            >
              {/* Pattern */}
              <PatternRenderer pattern={pattern} opacity={patternOpacity} />

              {/* QR Code - Full screen version */}
              {qrCodeUrl && (
                <div className="absolute top-1/2 right-4 sm:right-8 md:right-12 lg:right-16 -translate-y-1/2 z-20">
                  <div className={getQrStyleClasses(qrStyle)}>
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="object-contain w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-52 lg:h-52"
                    />
                  </div>
                </div>
              )}

              {/* Logo - Full screen version */}
              {showLogo && logoUrl && (
                <div className="absolute top-4 sm:top-8 md:top-12 lg:top-16 right-4 sm:right-8 md:right-12 lg:right-16 z-10">
                  <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 md:p-4 lg:p-5 rounded-xl">
                    <img
                      src={logoUrl}
                      alt="Club Logo"
                      className="object-contain w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28"
                    />
                  </div>
                </div>
              )}

              {/* Card Content - Full screen version - Left-aligned wrapper */}
              <div className="relative z-10 w-full max-w-4xl ml-0 mr-auto pl-4 sm:pl-8 md:pl-12 lg:pl-16">
                {/* Card Header */}
                <div className="mb-6 sm:mb-10 md:mb-14 lg:mb-16 pr-20 sm:pr-24 md:pr-32">
                  <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-3 md:mb-4">
                    {cardData.clubName}
                  </h1>
                  <p className="text-white/80 text-sm sm:text-lg md:text-xl lg:text-2xl">Member Card</p>
                </div>

                {/* Profile Section */}
                <div className="flex items-start gap-4 sm:gap-8 md:gap-10 lg:gap-12 mb-6 sm:mb-10 md:mb-14 lg:mb-16 pr-28 sm:pr-40 md:pr-48 lg:pr-56">
                  {/* Avatar */}
                  <div className="shrink-0">
                    <div className="w-16 h-16 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm border-2 sm:border-4 border-white/30 flex items-center justify-center">
                      <div className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                        {cardData.studentName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-4 md:mb-5 lg:mb-6 truncate">
                      {cardData.studentName}
                    </h2>
                    <div className="space-y-1 sm:space-y-2 md:space-y-3 text-white/90">
                      <div className="text-sm sm:text-lg md:text-xl lg:text-2xl truncate">{cardData.major}</div>
                      <div className="text-sm sm:text-lg md:text-xl lg:text-2xl text-white/80 truncate break-all">
                        {cardData.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info Grid */}
                <div className="pt-4 sm:pt-8 md:pt-10 lg:pt-12 border-t sm:border-t-2 border-white/20 grid grid-cols-2 gap-4 sm:gap-8 md:gap-10 lg:gap-12">
                  <div className="min-w-0 overflow-hidden">
                    <div className="text-xs sm:text-base md:text-lg lg:text-xl text-white/70 mb-1 sm:mb-3 md:mb-4">
                      Role
                    </div>
                    <div className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-medium truncate">
                      {cardData.role}
                    </div>
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <div className="text-xs sm:text-base md:text-lg lg:text-xl text-white/70 mb-1 sm:mb-3 md:mb-4">
                      Student ID
                    </div>
                    <div className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-medium font-mono truncate">
                      {cardData.studentCode}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 sm:mt-10 md:mt-14 lg:mt-16 pt-4 sm:pt-8 md:pt-10 lg:pt-12 border-t sm:border-t-2 border-white/20 text-center">
                  <p className="text-xs sm:text-base md:text-lg lg:text-xl text-white/70 leading-relaxed">
                    This card is issued by {cardData.clubName} for identification purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )

    // If showFrame is false, return just the card element with modal
    if (!showFrame) {
      return (
        <>
          {cardElement}
          {fullScreenModal}
        </>
      )
    }

    // Otherwise, wrap in Card component with header
    return (
      <>
      <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="dark:text-white">Card Preview</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenFullScreen}
              className="h-8 w-8 p-0"
              title="Expand to full screen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 md:p-6">
          {cardElement}
        </CardContent>
      </Card>
        {fullScreenModal}
      </>
    )
  }
)

CardPreview.displayName = "CardPreview"

