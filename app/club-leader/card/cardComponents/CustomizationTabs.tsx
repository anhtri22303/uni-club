"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ColorsTab } from "./ColorsTab"
import { StyleTab } from "./StyleTab"
import { QRTab } from "./QRTab"
import { ImagesTab } from "./ImagesTab"

interface CustomizationTabsProps {
  colorType: string
  gradient: string
  cardOpacity: number[]
  pattern: string
  borderRadius: string
  patternOpacity: number[]
  qrSize: number[]
  qrStyle: string
  showLogo: boolean
  logoUrl: string
  logoSize: number
  onColorTypeChange: (type: string) => void
  onColorSelect: (value: string, type: string) => void
  onCardOpacityChange: (value: number[]) => void
  onPatternChange: (value: string) => void
  onBorderRadiusChange: (value: string) => void
  onPatternOpacityChange: (value: number[]) => void
  onQRSizeChange: (value: number[]) => void
  onQRStyleChange: (value: string) => void
  onShowLogoChange: (value: boolean) => void
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const CustomizationTabs: React.FC<CustomizationTabsProps> = (props) => {
  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg dark:text-white">Customization Options</CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="colors" className="text-xs sm:text-sm py-1.5 sm:py-2">
              Colors
            </TabsTrigger>
            <TabsTrigger value="style" className="text-xs sm:text-sm py-1.5 sm:py-2">
              Style
            </TabsTrigger>
            <TabsTrigger value="qr" className="text-xs sm:text-sm py-1.5 sm:py-2">
              QR
            </TabsTrigger>
            <TabsTrigger value="images" className="text-xs sm:text-sm py-1.5 sm:py-2">
              Images
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors">
            <ColorsTab
              colorType={props.colorType}
              gradient={props.gradient}
              cardOpacity={props.cardOpacity}
              onColorTypeChange={props.onColorTypeChange}
              onColorSelect={props.onColorSelect}
              onCardOpacityChange={props.onCardOpacityChange}
            />
          </TabsContent>

          <TabsContent value="style">
            <StyleTab
              pattern={props.pattern}
              borderRadius={props.borderRadius}
              patternOpacity={props.patternOpacity}
              onPatternChange={props.onPatternChange}
              onBorderRadiusChange={props.onBorderRadiusChange}
              onPatternOpacityChange={props.onPatternOpacityChange}
            />
          </TabsContent>

          <TabsContent value="qr">
            <QRTab
              qrSize={props.qrSize}
              qrStyle={props.qrStyle}
              onQRSizeChange={props.onQRSizeChange}
              onQRStyleChange={props.onQRStyleChange}
            />
          </TabsContent>

          <TabsContent value="images">
            <ImagesTab
              showLogo={props.showLogo}
              logoUrl={props.logoUrl}
              logoSize={props.logoSize}
              onShowLogoChange={props.onShowLogoChange}
              onLogoUpload={props.onLogoUpload}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

