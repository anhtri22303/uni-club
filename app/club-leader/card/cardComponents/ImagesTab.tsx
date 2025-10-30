"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Upload, EyeOff } from "lucide-react"

interface ImagesTabProps {
  showLogo: boolean
  logoUrl: string
  logoSize: number
  backgroundImage: string
  onShowLogoChange: (value: boolean) => void
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBackgroundRemove: () => void
}

export const ImagesTab: React.FC<ImagesTabProps> = ({
  showLogo,
  logoUrl,
  logoSize,
  backgroundImage,
  onShowLogoChange,
  onLogoUpload,
  onBackgroundUpload,
  onBackgroundRemove,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <Label className="font-semibold">Club Logo</Label>
            <p className="text-xs text-muted-foreground mt-1">Display logo on the card</p>
          </div>
          <Switch checked={showLogo} onCheckedChange={onShowLogoChange} />
        </div>

        {showLogo && (
          <div className="space-y-4 p-4 border-2 border-dashed border-slate-300 rounded-lg">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">📤 Upload Logo</Label>
              <p className="text-xs text-muted-foreground">
                Recommended: PNG/JPG image, transparent background, minimum 200x200px
              </p>
              <div className="flex items-center gap-3">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={onLogoUpload}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => document.getElementById("logo-upload")?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {logoUrl && (
              <>
                <div className="p-4 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                  <img src={logoUrl} alt="Logo Preview" className="w-20 h-20 object-contain" />
                </div>

                <div className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold">📏 Logo Size</Label>
                    <span className="text-sm font-bold text-amber-700">{logoSize}px (Fixed)</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    Logo is fixed at a compact size (60px) and placed in the top right corner
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {!showLogo && (
          <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-slate-200 rounded-lg">
            <EyeOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Logo is hidden</p>
            <p className="text-xs mt-1">Turn on the toggle to display the logo</p>
          </div>
        )}
      </div>

      <div className="h-px bg-slate-200"></div>

      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">🖼️ Background Image (Optional)</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Add a background image to create visual interest. Image will be automatically blurred
          </p>
        </div>

        <div className="space-y-3">
          <Input
            id="background-upload"
            type="file"
            accept="image/*"
            onChange={onBackgroundUpload}
            className="flex-1"
          />
          {backgroundImage && (
            <div className="mt-2 relative">
              <img
                src={backgroundImage}
                alt="Background Preview"
                className="w-full h-32 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={onBackgroundRemove}
                className="absolute top-2 right-2"
              >
                ✕ Remove
              </Button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 text-center">
                ✓ Background image added
              </div>
            </div>
          )}

          {!backgroundImage && (
            <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
              <Upload className="h-10 w-10 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-600">No background image</p>
              <p className="text-xs text-muted-foreground mt-1">Click to select a file</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Background image shouldn't be too dark to keep text readable.
          The system will automatically blur the image by 30%.
        </p>
      </div>
    </div>
  )
}

