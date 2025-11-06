"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Download, FileImage, Sparkles } from "lucide-react"

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  onDownload: (quality: 'standard' | 'high' | 'ultra', format: 'png' | 'jpeg' | 'svg') => void
  isDownloading: boolean
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  onDownload,
  isDownloading,
}) => {
  const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('high')
  const [format, setFormat] = useState<'png' | 'jpeg' | 'svg'>('png')

  const handleDownload = () => {
    onDownload(quality, format)
  }

  const getQualityDescription = (q: string) => {
    switch (q) {
      case 'standard':
        return '2x resolution - Good for quick sharing (smaller file size)'
      case 'high':
        return '3x resolution - Best for most uses (recommended)'
      case 'ultra':
        return '4x resolution - Maximum quality for printing (larger file)'
      default:
        return ''
    }
  }

  const getFormatDescription = (f: string) => {
    switch (f) {
      case 'png':
        return 'PNG - Lossless, supports transparency, best for digital use'
      case 'jpeg':
        return 'JPEG - Compressed, smaller file size, good for photos'
      case 'svg':
        return 'SVG - Vector format, scalable, best for web use'
      default:
        return ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Download Card Image
          </DialogTitle>
          <DialogDescription>
            Choose quality and format for your card image download
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quality Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Image Quality</Label>
            <RadioGroup value={quality} onValueChange={(v) => setQuality(v as any)}>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors">
                  <RadioGroupItem value="standard" id="standard" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="standard" className="cursor-pointer font-medium">
                      Standard Quality
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getQualityDescription('standard')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors bg-accent">
                  <RadioGroupItem value="high" id="high" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="high" className="cursor-pointer font-medium flex items-center gap-1">
                      High Quality
                      <Sparkles className="h-3 w-3 text-primary" />
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getQualityDescription('high')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors">
                  <RadioGroupItem value="ultra" id="ultra" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="ultra" className="cursor-pointer font-medium">
                      Ultra Quality
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getQualityDescription('ultra')}
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">File Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as any)}>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors bg-accent">
                  <RadioGroupItem value="png" id="png" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="png" className="cursor-pointer font-medium flex items-center gap-1">
                      PNG
                      <Sparkles className="h-3 w-3 text-primary" />
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getFormatDescription('png')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors">
                  <RadioGroupItem value="jpeg" id="jpeg" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="jpeg" className="cursor-pointer font-medium">
                      JPEG
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getFormatDescription('jpeg')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors">
                  <RadioGroupItem value="svg" id="svg" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="svg" className="cursor-pointer font-medium">
                      SVG
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getFormatDescription('svg')}
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDownloading}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

