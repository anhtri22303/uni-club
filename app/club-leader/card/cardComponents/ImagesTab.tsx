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
  onShowLogoChange: (value: boolean) => void
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const ImagesTab: React.FC<ImagesTabProps> = ({
  showLogo,
  logoUrl,
  logoSize,
  onShowLogoChange,
  onLogoUpload,
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
    </div>
  )
}

