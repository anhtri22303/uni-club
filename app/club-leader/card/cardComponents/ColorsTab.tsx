"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { GradientPreview } from "./GradientPreview"
import { colorTypes } from "./constants"
import { getColorPresets } from "./utils"

interface ColorsTabProps {
  colorType: string
  gradient: string
  cardOpacity: number[]
  onColorTypeChange: (type: string) => void
  onColorSelect: (value: string, type: string) => void
  onCardOpacityChange: (value: number[]) => void
}

export const ColorsTab: React.FC<ColorsTabProps> = ({
  colorType,
  gradient,
  cardOpacity,
  onColorTypeChange,
  onColorSelect,
  onCardOpacityChange,
}) => {
  const colorPresets = getColorPresets(colorType)

  return (
    <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
      {/* Color Type Selector */}
      <div className="space-y-3">
        <Label className="text-sm sm:text-base font-semibold">🎨 Color Style</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Choose a color type for your card
        </p>

        {/* Ensure grid items can shrink and truncate */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 min-w-0">
          {colorTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onColorTypeChange(type.value)}
              className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-xs sm:text-sm font-medium overflow-hidden ${
                colorType === type.value
                  ? "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-200 dark:ring-blue-800"
                  : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 dark:text-slate-300"
              }`}
              title={type.name}
            >
              {/* Ellipsis on overflow */}
              <span className="block truncate text-ellipsis whitespace-nowrap min-w-0">
                {type.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-200 dark:bg-slate-700" />

      {/* Color Presets */}
      <div className="space-y-3">
        <Label className="text-sm sm:text-base font-semibold">
          {colorType === "gradient" && "🌈 Gradient Colors"}
          {colorType === "solid" && "🎨 Solid Colors"}
          {colorType === "pastel" && "🌸 Pastel Colors"}
          {colorType === "neon" && "⚡ Neon Colors"}
          {colorType === "monochrome" && "⚫ Monochrome Colors"}
        </Label>
        <p className="text-xs text-muted-foreground mb-2">
          Choose a color that matches your club brand
        </p>

        {/* Allow children to shrink so ellipsis can apply */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 max-h-[400px] overflow-y-auto pr-2 min-w-0">
          {colorPresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onColorSelect(preset.value, preset.type)}
              className={`p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all hover:scale-105 overflow-hidden ${
                gradient === preset.value
                  ? "border-blue-600 dark:border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800 shadow-lg"
                  : "border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500"
              }`}
              title={preset.name}
            >
              <GradientPreview gradientClass={preset.value} />

              {/* Single-line name with hard ellipsis */}
              <p className="mt-1 text-xs sm:text-sm font-medium text-center line-clamp-1 truncate text-ellipsis whitespace-nowrap min-w-0">
                {preset.name}
              </p>

              {gradient === preset.value && (
                <div className="mt-1 text-center">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">✓ Selected</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
        <div className="flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <Label className="font-semibold dark:text-slate-200">Card Opacity</Label>
            <p className="text-xs text-muted-foreground dark:text-slate-400 mt-1 truncate text-ellipsis whitespace-nowrap">
              Adjust the opacity of the background color
            </p>
          </div>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{cardOpacity[0]}%</span>
        </div>

        <Slider
          value={cardOpacity}
          onValueChange={onCardOpacityChange}
          min={50}
          max={100}
          step={5}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Light (50%)</span>
          <span>Bold (100%)</span>
        </div>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>💡 Tip:</strong> Choose contrasting colors for better text readability!
        </p>
      </div>
    </div>
  )
}
