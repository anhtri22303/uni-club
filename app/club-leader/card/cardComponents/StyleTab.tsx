"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cardPatterns, borderRadiusOptions } from "./constants"

interface StyleTabProps {
  pattern: string
  borderRadius: string
  patternOpacity: number[]
  onPatternChange: (value: string) => void
  onBorderRadiusChange: (value: string) => void
  onPatternOpacityChange: (value: number[]) => void
}

export const StyleTab: React.FC<StyleTabProps> = ({
  pattern,
  borderRadius,
  patternOpacity,
  onPatternChange,
  onBorderRadiusChange,
  onPatternOpacityChange,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
      <div className="space-y-3">
        <Label className="text-sm sm:text-base font-semibold">Background Pattern</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Choose a background pattern for your card
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-[300px] overflow-y-auto pr-2">
          {cardPatterns.map((p) => (
            <button
              key={p.value}
              onClick={() => onPatternChange(p.value)}
              className={`p-2 sm:p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                pattern === p.value
                  ? "border-blue-600 ring-2 ring-blue-200 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Pattern Preview Mini Card */}
              <div className="w-full h-12 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md mb-2 relative overflow-hidden">
                {p.value === "circles" && (
                  <>
                    <div className="absolute top-0 left-0 w-6 h-6 bg-white rounded-full -translate-x-3 -translate-y-3 opacity-20"></div>
                    <div className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full translate-x-5 translate-y-5 opacity-20"></div>
                  </>
                )}
                {p.value === "waves" && (
                  <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 8 Q 4 4, 8 8 T 16 8" stroke="white" fill="none" strokeWidth="1" />
                    <path d="M0 12 Q 4 8, 8 12 T 16 12" stroke="white" fill="none" strokeWidth="1" />
                  </svg>
                )}
                {p.value === "grid" && (
                  <div className="w-full h-full bg-[repeating-linear-gradient(0deg,white_0px,white_1px,transparent_1px,transparent_8px),repeating-linear-gradient(90deg,white_0px,white_1px,transparent_1px,transparent_8px)] opacity-20"></div>
                )}
                {p.value === "dots" && (
                  <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern
                        id={`dots-preview-${p.value}`}
                        x="0"
                        y="0"
                        width="10"
                        height="10"
                        patternUnits="userSpaceOnUse"
                      >
                        <circle cx="5" cy="5" r="1" fill="white" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#dots-preview-${p.value})`} />
                  </svg>
                )}
                {p.value === "diagonal" && (
                  <div className="w-full h-full bg-[repeating-linear-gradient(45deg,white_0px,white_1px,transparent_1px,transparent_10px)] opacity-20"></div>
                )}
                {p.value === "hexagon" && (
                  <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern
                        id={`hex-preview-${p.value}`}
                        x="0"
                        y="0"
                        width="28"
                        height="50"
                        patternUnits="userSpaceOnUse"
                      >
                        <polygon
                          points="14,12 25,19 25,31 14,37 3,31 3,19"
                          stroke="white"
                          fill="none"
                          strokeWidth="1"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#hex-preview-${p.value})`} />
                  </svg>
                )}
                {p.value === "triangles" && (
                  <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern
                        id={`tri-preview-${p.value}`}
                        x="0"
                        y="0"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                      >
                        <polygon points="20,5 35,30 5,30" stroke="white" fill="none" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#tri-preview-${p.value})`} />
                  </svg>
                )}
                {p.value === "stars" && (
                  <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern
                        id={`star-preview-${p.value}`}
                        x="0"
                        y="0"
                        width="50"
                        height="50"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M25,8 L28,20 L41,20 L31,27 L35,40 L25,33 L15,40 L19,27 L9,20 L22,20 Z"
                          stroke="white"
                          fill="none"
                          strokeWidth="1"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#star-preview-${p.value})`} />
                  </svg>
                )}
              </div>
              <p className="text-xs font-medium text-center line-clamp-1">{p.name}</p>
            </button>
          ))}
        </div>
      </div>

      {pattern !== "none" && (
        <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-semibold">Pattern Opacity</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Adjust the visibility of the background pattern
              </p>
            </div>
            <span className="text-sm font-bold text-blue-600">{patternOpacity[0]}%</span>
          </div>
          <Slider
            value={patternOpacity}
            onValueChange={onPatternOpacityChange}
            min={0}
            max={50}
            step={5}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Hidden (0%)</span>
            <span>Very Clear (50%)</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label className="text-sm sm:text-base font-semibold">Border Radius</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Choose the roundness of the card corners
        </p>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {borderRadiusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onBorderRadiusChange(option.value)}
              className={`p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all ${
                borderRadius === option.value
                  ? "border-blue-600 ring-2 ring-blue-200 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Border Radius Visual */}
              <div
                className={`w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 ${option.value} mb-2`}
              ></div>
              <p className="text-xs sm:text-sm font-medium text-center">{option.name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          <strong>💡 Tip:</strong> Patterns at 5-15% opacity look more professional!
        </p>
      </div>
    </div>
  )
}

