"use client"

import { 
  FileText,
  Maximize2,
  Minimize2,
  AlignVerticalSpaceAround,
  SplitSquareVertical,
  Hash,
  Droplet,
  Columns as ColumnsIcon,
  Printer,
  Settings2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'
import * as EditorUtils from '../utils/editorUtils'
import { PageSettings } from '../types'

interface PageLayoutTabProps {
  pageSettings: PageSettings
  onPageSettingsChange: (settings: Partial<PageSettings>) => void
  onSync?: () => void
  compact?: boolean
}

const PAPER_SIZES = [
  { label: 'A4 (210 x 297 mm)', value: 'A4' },
  { label: 'A5 (148 x 210 mm)', value: 'A5' },
  { label: 'Letter (8.5 x 11 in)', value: 'Letter' },
  { label: 'Legal (8.5 x 14 in)', value: 'Legal' }
]

const WATERMARK_PRESETS = [
  'DRAFT',
  'CONFIDENTIAL',
  'COPY',
  'SAMPLE',
  'DO NOT COPY',
  'ORIGINAL'
]

export function PageLayoutTab({ pageSettings, onPageSettingsChange, onSync, compact = false }: PageLayoutTabProps) {
  const [showMarginsPopover, setShowMarginsPopover] = useState(false)
  const [showWatermarkPopover, setShowWatermarkPopover] = useState(false)
  const [customWatermark, setCustomWatermark] = useState('')

  const handleAction = (action: () => void) => {
    action()
    onSync?.()
  }

  const updateSetting = <K extends keyof PageSettings>(key: K, value: PageSettings[K]) => {
    onPageSettingsChange({ [key]: value })
    onSync?.()
  }

  const insertPageBreak = () => {
    EditorUtils.insertPageBreak()
    onSync?.()
  }

  const applyWatermark = (text: string) => {
    updateSetting('watermark', text)
    // Don't close popover - let user click outside to close
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
        <div className={`flex items-center gap-1 ${compact ? 'p-1' : 'p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800/50 border-b'} min-w-max`}>
        {/* Paper Size */}
        <div className="flex items-center gap-1 pr-1.5 sm:pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Select 
                  value={pageSettings.paperSize} 
                  onValueChange={(value: any) => updateSetting('paperSize', value)}
                >
                  <SelectTrigger className="h-8 w-[160px] text-xs">
                    <FileText className="h-4 w-4 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAPER_SIZES.map(size => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent>Paper Size</TooltipContent>
          </Tooltip>
        </div>

        {/* Orientation */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={pageSettings.orientation === 'portrait' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => updateSetting('orientation', 'portrait')}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Portrait</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={pageSettings.orientation === 'landscape' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => updateSetting('orientation', 'landscape')}
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="h-4 w-4 rotate-90" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Landscape</TooltipContent>
          </Tooltip>
        </div>

        {/* Margins */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Popover open={showMarginsPopover} onOpenChange={setShowMarginsPopover}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Page Margins">
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Page Margins (mm)</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Top</Label>
                    <Input
                      type="number"
                      value={pageSettings.marginTop}
                      onChange={(e) => updateSetting('marginTop', Number(e.target.value))}
                      className="h-8 text-xs"
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Bottom</Label>
                    <Input
                      type="number"
                      value={pageSettings.marginBottom}
                      onChange={(e) => updateSetting('marginBottom', Number(e.target.value))}
                      className="h-8 text-xs"
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Left</Label>
                    <Input
                      type="number"
                      value={pageSettings.marginLeft}
                      onChange={(e) => updateSetting('marginLeft', Number(e.target.value))}
                      className="h-8 text-xs"
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Right</Label>
                    <Input
                      type="number"
                      value={pageSettings.marginRight}
                      onChange={(e) => updateSetting('marginRight', Number(e.target.value))}
                      className="h-8 text-xs"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-xs mb-2 block">Quick Presets</Label>
                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onPageSettingsChange({
                          marginTop: 25.4,
                          marginBottom: 25.4,
                          marginLeft: 25.4,
                          marginRight: 25.4
                        })
                        onSync?.()
                      }}
                      className="h-8 text-xs"
                    >
                      Normal
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onPageSettingsChange({
                          marginTop: 12.7,
                          marginBottom: 12.7,
                          marginLeft: 12.7,
                          marginRight: 12.7
                        })
                        onSync?.()
                      }}
                      className="h-8 text-xs"
                    >
                      Narrow
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onPageSettingsChange({
                          marginTop: 25.4,
                          marginBottom: 25.4,
                          marginLeft: 50.8,
                          marginRight: 25.4
                        })
                        onSync?.()
                      }}
                      className="h-8 text-xs"
                    >
                      Wide
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Line Spacing */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-2">
                <AlignVerticalSpaceAround className="h-4 w-4" />
                <Select 
                  value={pageSettings.lineSpacing.toString()} 
                  onValueChange={(value) => updateSetting('lineSpacing', Number(value))}
                >
                  <SelectTrigger className="h-8 w-[80px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Single</SelectItem>
                    <SelectItem value="1.15">1.15</SelectItem>
                    <SelectItem value="1.5">1.5</SelectItem>
                    <SelectItem value="2">Double</SelectItem>
                    <SelectItem value="2.5">2.5</SelectItem>
                    <SelectItem value="3">3.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent>Line Spacing</TooltipContent>
          </Tooltip>
        </div>

        {/* Page Break */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={insertPageBreak}
                className="h-8 w-8 p-0"
              >
                <SplitSquareVertical className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert Page Break</TooltipContent>
          </Tooltip>
        </div>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-2">
                <Hash className="h-4 w-4" />
                <Switch
                  checked={pageSettings.showPageNumbers}
                  onCheckedChange={(checked) => updateSetting('showPageNumbers', checked)}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>Show Page Numbers</TooltipContent>
          </Tooltip>

          {pageSettings.showPageNumbers && (
            <>
              <Select 
                value={pageSettings.pageNumberPosition} 
                onValueChange={(value: any) => updateSetting('pageNumberPosition', value)}
              >
                <SelectTrigger className="h-8 w-[90px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={pageSettings.pageNumberAlignment} 
                onValueChange={(value: any) => updateSetting('pageNumberAlignment', value)}
              >
                <SelectTrigger className="h-8 w-[90px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {/* Watermark */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Popover open={showWatermarkPopover} onOpenChange={setShowWatermarkPopover}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Watermark">
                <Droplet className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Page Watermark</h4>
                
                <div>
                  <Label className="text-xs mb-2 block">Presets</Label>
                  <div className="grid grid-cols-2 gap-1">
                    {WATERMARK_PRESETS.map(preset => (
                      <Button
                        key={preset}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyWatermark(preset)}
                        className="h-8 text-xs"
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-xs">Custom Watermark</Label>
                  <div className="flex gap-1 mt-1">
                    <Input
                      placeholder="Enter text..."
                      value={customWatermark}
                      onChange={(e) => setCustomWatermark(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Button 
                      type="button"
                      size="sm" 
                      onClick={() => applyWatermark(customWatermark)}
                      className="h-8"
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                {pageSettings.watermark && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Current: {pageSettings.watermark}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          updateSetting('watermark', undefined)
                          setCustomWatermark('')
                          // Don't close popover - let user click outside to close
                        }}
                        className="h-6 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Columns */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-2">
                <ColumnsIcon className="h-4 w-4" />
                <Select 
                  value={pageSettings.columns.toString()} 
                  onValueChange={(value) => updateSetting('columns', Number(value))}
                >
                  <SelectTrigger className="h-8 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent>Number of Columns</TooltipContent>
          </Tooltip>
        </div>

        {/* Print */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(EditorUtils.printDocument)}
                className="h-8 w-8 p-0"
              >
                <Printer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Print (Ctrl+P)</TooltipContent>
          </Tooltip>
        </div>
      </div>
      </div>
    </TooltipProvider>
  )
}

