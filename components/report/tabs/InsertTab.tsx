"use client"

import { 
  Table2,
  Image as ImageIcon,
  Link2,
  Calendar,
  Clock,
  FileImage,
  Shapes,
  Sparkles,
  Box,
  Type,
  Minus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState, useRef } from 'react'
import * as EditorUtils from '../utils/editorUtils'

interface InsertTabProps {
  onSync?: () => void
}

export function InsertTab({ onSync }: InsertTabProps) {
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [showTablePopover, setShowTablePopover] = useState(false)
  const [showLinkPopover, setShowLinkPopover] = useState(false)
  const [showImagePopover, setShowImagePopover] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAction = (action: () => void) => {
    action()
    onSync?.()
  }

  const insertTable = () => {
    // Focus the editor before inserting
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (editor) {
      editor.focus()
      
      // Small delay to ensure focus is set
      setTimeout(() => {
        EditorUtils.insertTable(tableRows, tableCols)
        // Don't close popover - let user click outside to close
        onSync?.()
      }, 50)
    } else {
      // Fallback: insert without focus (might not work)
      EditorUtils.insertTable(tableRows, tableCols)
      // Don't close popover - let user click outside to close
      onSync?.()
    }
  }

  const insertLink = () => {
    if (linkUrl) {
      EditorUtils.insertLink(linkUrl, linkText || undefined)
      // Don't close popover - let user click outside to close
      setLinkUrl('')
      setLinkText('')
      onSync?.()
    }
  }

  const insertImageFromUrl = () => {
    if (imageUrl) {
      EditorUtils.insertImage(imageUrl, imageAlt || undefined)
      // Don't close popover - let user click outside to close
      setImageUrl('')
      setImageAlt('')
      onSync?.()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        EditorUtils.insertImage(dataUrl, file.name)
        // Don't close popover - let user click outside to close
        onSync?.()
      }
      reader.readAsDataURL(file)
    }
  }

  const insertDateTime = (format: 'date' | 'time' | 'datetime') => {
    EditorUtils.insertDateTime(format)
    onSync?.()
  }

  // Table preview grid
  const TablePreview = () => {
    const [hoverRow, setHoverRow] = useState(0)
    const [hoverCol, setHoverCol] = useState(0)

    const handleGridClick = (row: number, col: number) => {
      const rows = row + 1
      const cols = col + 1
      setTableRows(rows)
      setTableCols(cols)
      
      // Focus the editor before inserting
      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
      if (editor) {
        editor.focus()
        
        // Small delay to ensure focus is set
        setTimeout(() => {
          EditorUtils.insertTable(rows, cols)
          // Don't close popover - let user click outside to close
          onSync?.()
        }, 50)
      } else {
        // Fallback: insert without focus
        EditorUtils.insertTable(rows, cols)
        // Don't close popover - let user click outside to close
        onSync?.()
      }
    }

    return (
      <div className="space-y-2">
        <div className="grid gap-0.5" 
          style={{ 
            gridTemplateColumns: `repeat(8, 1fr)`,
            width: 'fit-content'
          }}
        >
          {Array.from({ length: 64 }).map((_, index) => {
            const row = Math.floor(index / 8)
            const col = index % 8
            const isHovered = row <= hoverRow && col <= hoverCol
            
            return (
              <div
                key={index}
                className={`w-5 h-5 border cursor-pointer transition-colors ${
                  isHovered ? 'bg-blue-200 border-blue-400' : 'bg-white border-gray-300'
                }`}
                onMouseEnter={() => {
                  setHoverRow(row)
                  setHoverCol(col)
                  setTableRows(row + 1)
                  setTableCols(col + 1)
                }}
                onClick={() => handleGridClick(row, col)}
              />
            )
          })}
        </div>
        <div className="text-xs text-center text-muted-foreground">
          {tableRows} x {tableCols}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
        <div className="flex items-center gap-1 p-1.5 sm:p-2 bg-gray-50 border-b min-w-max">
        {/* Insert Table */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Popover open={showTablePopover} onOpenChange={setShowTablePopover}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Insert Table">
                <Table2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Insert Table</h4>
                <TablePreview />
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div>
                    <Label className="text-xs">Rows</Label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={tableRows}
                      onChange={(e) => setTableRows(Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          insertTable()
                        }
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Columns</Label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={tableCols}
                      onChange={(e) => setTableCols(Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          insertTable()
                        }
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <Button type="button" onClick={insertTable} className="w-full h-8" size="sm">
                  Insert {tableRows} x {tableCols} Table
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Insert Image */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Popover open={showImagePopover} onOpenChange={setShowImagePopover}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Insert Image">
                <ImageIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Insert Image</h4>
                
                <div>
                  <Label className="text-xs">Image URL</Label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Alt Text (Optional)</Label>
                  <Input
                    placeholder="Description..."
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <Button type="button" onClick={insertImageFromUrl} className="w-full h-8" size="sm">
                  Insert from URL
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  title="Upload image file"
                  aria-label="Upload image file"
                />
                <Button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()} 
                  variant="outline"
                  className="w-full h-8" 
                  size="sm"
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  Upload from Computer
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(() => {})}
                className="h-8 w-8 p-0"
              >
                <Shapes className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Shapes</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(() => {})}
                className="h-8 w-8 p-0"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>SmartArt</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(() => {})}
                className="h-8 w-8 p-0"
              >
                <Box className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>3D Models</TooltipContent>
          </Tooltip>
        </div>

        {/* Insert Link */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Insert Hyperlink">
                <Link2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Insert Hyperlink</h4>
                
                <div>
                  <Label className="text-xs">Display Text</Label>
                  <Input
                    placeholder="Click here"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">URL</Label>
                  <Input
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <Button 
                  type="button"
                  onClick={insertLink} 
                  className="w-full h-8" 
                  size="sm"
                  disabled={!linkUrl}
                >
                  Insert Link
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Insert Text Box / WordArt */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(() => {
                  EditorUtils.execCommand('insertHTML', 
                    '<div style="border: 2px solid #000; padding: 10px; display: inline-block; margin: 10px;">Text Box</div>'
                  )
                })}
                className="h-8 w-8 p-0"
              >
                <Type className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Text Box</TooltipContent>
          </Tooltip>
        </div>

        {/* Insert Date/Time */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertDateTime('date')}
                className="h-8 w-8 p-0"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert Date</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertDateTime('time')}
                className="h-8 w-8 p-0"
              >
                <Clock className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert Time</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertDateTime('datetime')}
                className="h-8 px-2 text-xs"
              >
                Date & Time
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert Date & Time</TooltipContent>
          </Tooltip>
        </div>

        {/* Horizontal Line */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(EditorUtils.insertHorizontalLine)}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Horizontal Line</TooltipContent>
          </Tooltip>
        </div>
      </div>
      </div>
    </TooltipProvider>
  )
}

