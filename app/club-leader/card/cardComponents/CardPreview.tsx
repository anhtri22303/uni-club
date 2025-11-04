"use client"

import React, { forwardRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PatternRenderer } from "./PatternRenderer"
import { getQrStyleClasses } from "./utils"
import type { CardData } from "./types"

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

    const cardElement = (
      <div className="flex justify-center">
        <div
          ref={ref}
          data-card-element="true"
          className={`${cardColorClass} ${gradient} ${borderRadius} shadow-2xl p-3 sm:p-6 md:p-8 w-full ${showFrame ? 'max-w-2xl' : 'max-w-4xl'} text-white relative overflow-hidden min-h-[280px] sm:min-h-[320px]`}
          style={{ opacity: cardOpacity / 100 }}
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
              <div className="relative z-10 overflow-hidden">
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
                  <div className="flex-shrink-0">
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
                      <div className="flex items-center gap-1 sm:gap-2 min-w-0 overflow-hidden">
                        <span className="text-[10px] sm:text-xs bg-white/20 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-white/80 flex-shrink-0">
                          ID
                        </span>
                        <span className="font-mono text-xs sm:text-base md:text-lg font-semibold truncate">
                          {cardData.studentCode}
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-sm truncate">{cardData.major}</div>
                      <div className="text-[10px] sm:text-sm text-white/80 truncate break-all">
                        {cardData.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info Grid */}
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
                      Member ID
                    </div>
                    <div className="text-[11px] sm:text-sm font-medium font-mono truncate">
                      #{cardData.memberId}
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

    // If showFrame is false, return just the card element
    if (!showFrame) {
      return cardElement
    }

    // Otherwise, wrap in Card component with header
    return (
      <Card>
        <CardHeader>
          <CardTitle>Card Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 md:p-6">
          {cardElement}
        </CardContent>
      </Card>
    )
  }
)

CardPreview.displayName = "CardPreview"

