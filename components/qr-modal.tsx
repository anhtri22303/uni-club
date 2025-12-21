import { useState, useEffect } from "react"
import { Modal } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { QrCode, Maximize2, Minimize2, RotateCcw, Copy, Download } from "lucide-react"

interface QRModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventName: string
  checkInCode: string
  qrRotations: string[]
  qrLink: string
  countdown: number
  isFullscreen: boolean
  setIsFullscreen: (v: boolean) => void
  displayedIndex: number
  isFading: boolean
  handleCopyLink: () => void
  handleDownloadQR?: () => void
}

export function QRModal({
  open,
  onOpenChange,
  eventName,
  checkInCode,
  qrRotations,
  qrLink,
  countdown,
  isFullscreen,
  setIsFullscreen,
  displayedIndex,
  isFading,
  handleCopyLink,
  handleDownloadQR,
}: QRModalProps) {
  // Modal UI for QR code, shared between event list and event detail
  return (
    <>
      {/* Professional QR Modal */}
      {!isFullscreen && (
        <Modal open={open} onOpenChange={onOpenChange} title="Event QR Code">
          <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                  <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-blue-900 dark:text-blue-300">{eventName}</div>
                  
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-2"
              >
                <Maximize2 className="h-4 w-4" />
                Fullscreen
              </Button>
            </div>

            {/* QR Code Display */}
            <div className="flex flex-col items-center space-y-4">
              {/* Countdown Timer */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm text-muted-foreground">
                <RotateCcw className="h-4 w-4" />
                Next rotation in {countdown}s
              </div>

              {/* QR Code */}
              <div className="relative p-8 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-muted-foreground/20 shadow-lg">
                {qrRotations?.length > 0 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={qrRotations[displayedIndex % qrRotations.length]} 
                      alt="QR Code" 
                      className={`w-64 h-64 transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`} 
                    />
                    {/* Live Badge */}
                    <div className="absolute -top-2 -right-2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                      LIVE
                    </div>
                  </>
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <div className="text-sm text-muted-foreground">Generating QR Code...</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Link
                </Button>
                {handleDownloadQR && (
                  <Button
                    variant="outline"
                    onClick={handleDownloadQR}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download QR
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Fullscreen QR Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-white">
            {/* Fullscreen Header */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xl font-bold">{eventName}</div>
                  <div className="text-white/70">Code: {checkInCode}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="text-white hover:bg-white/10"
              >
                <Minimize2 className="h-5 w-5 mr-2" />
                Exit Fullscreen
              </Button>
            </div>

            {/* Fullscreen QR Code */}
            <div className="flex flex-col items-center space-y-8">
              {/* Timer */}
              <div className="flex items-center gap-3 px-6 py-3 bg-white/10 rounded-full backdrop-blur-sm">
                <RotateCcw className="h-5 w-5" />
                <span className="text-lg font-medium">Auto-refresh in {countdown} seconds</span>
              </div>

              {/* Large QR Code */}
              <div className="relative">
                {qrRotations?.length > 0 ? (
                  <>
                    <div className="p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrRotations[displayedIndex % qrRotations.length]}
                        alt="QR Code"
                        className={`w-96 h-96 transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}
                      />
                    </div>
                    {/* Large Environment Badge */}
                    <div className="absolute -top-4 -right-4 px-6 py-3 bg-blue-600 text-white font-bold rounded-full text-lg shadow-lg">
                      PRODUCTION
                    </div>
                  </>
                ) : (
                  <div className="w-96 h-96 flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl">
                    <div className="text-center text-black dark:text-gray-200">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                      <div className="text-lg font-medium">Generating QR Code...</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen Actions */}
              <div className="flex items-center gap-6">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleCopyLink}
                  className="flex items-center gap-3 text-lg px-8 py-4"
                >
                  <Copy className="h-6 w-6" />
                  Copy Link
                </Button>
                {handleDownloadQR && (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={handleDownloadQR}
                    className="flex items-center gap-3 text-lg px-8 py-4"
                  >
                    <Download className="h-6 w-6" />
                    Download QR
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
