"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { EyeOff } from "lucide-react"
import { qrStyles } from "./constants"

interface QRTabProps {
  showQR: boolean
  qrSize: number[]
  qrStyle: string
  onShowQRChange: (value: boolean) => void
  onQRSizeChange: (value: number[]) => void
  onQRStyleChange: (value: string) => void
}

export const QRTab: React.FC<QRTabProps> = ({
  showQR,
  qrSize,
  qrStyle,
  onShowQRChange,
  onQRSizeChange,
  onQRStyleChange,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
      <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div>
          <Label htmlFor="show-qr" className="font-semibold">
            Show QR Code
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Toggle QR code visibility on the card
          </p>
        </div>
        <Switch id="show-qr" checked={showQR} onCheckedChange={onShowQRChange} />
      </div>

      {showQR && (
        <>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Label className="text-base font-semibold">📍 QR Code Position</Label>
              <p className="text-sm text-blue-700 mt-2">
                The QR code is fixed at <strong>Center - Right</strong> position for optimal
                scanning
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">QR Code Size</Label>
                <p className="text-xs text-muted-foreground mt-1">Minimum 80px for easy scanning</p>
              </div>
              <span className="text-sm font-bold text-blue-600">{qrSize[0]}px</span>
            </div>
            <Slider
              value={qrSize}
              onValueChange={onQRSizeChange}
              min={60}
              max={150}
              step={10}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Small (60px)</span>
              <span>Large (150px)</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm sm:text-base font-semibold">QR Code Style</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Choose a style for the QR code frame
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {qrStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => onQRStyleChange(style.value)}
                  className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                    qrStyle === style.value
                      ? "border-blue-600 ring-2 ring-blue-200 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* QR Style Visual */}
                  <div className="w-full h-12 sm:h-16 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-md mb-2">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 bg-white ${
                        style.value === "rounded"
                          ? "rounded-xl"
                          : style.value === "bordered"
                          ? "rounded-lg border-2 sm:border-4 border-white/50"
                          : style.value === "shadow"
                          ? "rounded-lg shadow-2xl"
                          : "rounded-lg"
                      }`}
                    ></div>
                  </div>
                  <p className="text-xs font-medium text-center line-clamp-1">{style.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>📱 QR Contains:</strong> Student Code, Email, Member ID
            </p>
          </div>
        </>
      )}

      {!showQR && (
        <div className="p-8 text-center text-muted-foreground">
          <EyeOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">QR code is hidden</p>
          <p className="text-xs mt-1">Turn on the toggle above to display it</p>
        </div>
      )}
    </div>
  )
}

