"use client"

import { 
  Table2,
  Image as ImageIcon,
  Link2,
  Calendar,
  Clock,
  FileImage,
  Shapes,
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
  compact?: boolean
}

export function InsertTab({ onSync, compact = false }: InsertTabProps) {
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
  const savedRangeRef = useRef<Range | null>(null)

  // Save selection when popover opens
  const saveSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0)
    }
  }

  // Restore selection before inserting
  const restoreSelection = () => {
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (editor && savedRangeRef.current) {
      editor.focus()
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(savedRangeRef.current)
      }
      return true
    }
    return false
  }

  const handleAction = (action: () => void) => {
    action()
    onSync?.()
  }

  const insertTable = () => {
    // Restore the saved selection
    if (restoreSelection()) {
      EditorUtils.insertTable(tableRows, tableCols)
      setShowTablePopover(false)
      onSync?.()
    } else {
      // Fallback: try to insert at end of editor
      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
      if (editor) {
        editor.focus()
        // Move cursor to end
        const range = document.createRange()
        const selection = window.getSelection()
        range.selectNodeContents(editor)
        range.collapse(false)
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
        EditorUtils.insertTable(tableRows, tableCols)
        setShowTablePopover(false)
        onSync?.()
      }
    }
  }

  const insertLink = () => {
    if (linkUrl) {
      // Restore the saved selection
      if (restoreSelection()) {
        EditorUtils.insertLink(linkUrl, linkText || undefined)
        setLinkUrl('')
        setLinkText('')
        setShowLinkPopover(false)
        onSync?.()
      } else {
        // Fallback: try to insert at end of editor
        const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
        if (editor) {
          editor.focus()
          // Move cursor to end
          const range = document.createRange()
          const selection = window.getSelection()
          range.selectNodeContents(editor)
          range.collapse(false)
          if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)
          }
          EditorUtils.insertLink(linkUrl, linkText || undefined)
          setLinkUrl('')
          setLinkText('')
          setShowLinkPopover(false)
          onSync?.()
        }
      }
    }
  }

  const insertImageFromUrl = () => {
    if (imageUrl) {
      // Restore the saved selection
      if (restoreSelection()) {
        EditorUtils.insertImage(imageUrl, imageAlt || undefined)
        setImageUrl('')
        setImageAlt('')
        setShowImagePopover(false)
        onSync?.()
      } else {
        // Fallback: try to insert at end of editor
        const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
        if (editor) {
          editor.focus()
          // Move cursor to end
          const range = document.createRange()
          const selection = window.getSelection()
          range.selectNodeContents(editor)
          range.collapse(false)
          if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)
          }
          EditorUtils.insertImage(imageUrl, imageAlt || undefined)
          setImageUrl('')
          setImageAlt('')
          setShowImagePopover(false)
          onSync?.()
        }
      }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        // Restore the saved selection
        if (restoreSelection()) {
          EditorUtils.insertImage(dataUrl, file.name)
          setShowImagePopover(false)
          onSync?.()
        } else {
          // Fallback: try to insert at end of editor
          const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
          if (editor) {
            editor.focus()
            // Move cursor to end
            const range = document.createRange()
            const selection = window.getSelection()
            range.selectNodeContents(editor)
            range.collapse(false)
            if (selection) {
              selection.removeAllRanges()
              selection.addRange(range)
            }
            EditorUtils.insertImage(dataUrl, file.name)
            setShowImagePopover(false)
            onSync?.()
          }
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const insertDateTime = (format: 'date' | 'time' | 'datetime') => {
    // Focus the editor before inserting
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (editor) {
      editor.focus()
      
      // Small delay to ensure focus is set
      setTimeout(() => {
        EditorUtils.insertDateTime(format)
        onSync?.()
      }, 50)
    } else {
      // Fallback: insert without focus
      EditorUtils.insertDateTime(format)
      onSync?.()
    }
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
      
      // Restore the saved selection
      if (restoreSelection()) {
        EditorUtils.insertTable(rows, cols)
        setShowTablePopover(false)
        onSync?.()
      } else {
        // Fallback: try to insert at end of editor
        const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
        if (editor) {
          editor.focus()
          // Move cursor to end
          const range = document.createRange()
          const selection = window.getSelection()
          range.selectNodeContents(editor)
          range.collapse(false)
          if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)
          }
          EditorUtils.insertTable(rows, cols)
          setShowTablePopover(false)
          onSync?.()
        }
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
        <div className={`flex items-center gap-1 ${compact ? 'p-1' : 'p-1.5 sm:p-2 bg-gray-50 border-b'} min-w-max`}>
        {/* Insert Table */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Popover open={showTablePopover} onOpenChange={(open) => {
            if (open) saveSelection()
            setShowTablePopover(open)
          }}>
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
          <Popover open={showImagePopover} onOpenChange={(open) => {
            if (open) saveSelection()
            setShowImagePopover(open)
          }}>
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

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Shapes className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Insert Shape</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
                      if (editor) {
                        editor.focus()
                        setTimeout(() => {
                          EditorUtils.execCommand('insertHTML', 
                            '<div style="width: 100px; height: 100px; background-color: #3b82f6; margin: 10px; display: inline-block;"></div>'
                          )
                          onSync?.()
                        }, 50)
                      }
                    }}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <div className="w-8 h-8 bg-blue-500 mb-1"></div>
                    <span className="text-xs">Rectangle</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
                      if (editor) {
                        editor.focus()
                        setTimeout(() => {
                          EditorUtils.execCommand('insertHTML', 
                            '<div style="width: 100px; height: 100px; background-color: #10b981; border-radius: 50%; margin: 10px; display: inline-block;"></div>'
                          )
                          onSync?.()
                        }, 50)
                      }
                    }}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <div className="w-8 h-8 bg-green-500 rounded-full mb-1"></div>
                    <span className="text-xs">Circle</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
                      if (editor) {
                        editor.focus()
                        setTimeout(() => {
                          EditorUtils.execCommand('insertHTML', 
                            '<div style="width: 0; height: 0; border-left: 50px solid transparent; border-right: 50px solid transparent; border-bottom: 100px solid #f59e0b; margin: 10px; display: inline-block;"></div>'
                          )
                          onSync?.()
                        }, 50)
                      }
                    }}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <div className="w-0 h-0 border-l-16 border-l-transparent border-r-16 border-r-transparent border-b-32 border-b-amber-500 mb-1"></div>
                    <span className="text-xs">Triangle</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
                      if (editor) {
                        editor.focus()
                        setTimeout(() => {
                          EditorUtils.execCommand('insertHTML', 
                            '<div style="width: 120px; height: 60px; background-color: #ef4444; border-radius: 50px; margin: 10px; display: inline-block;"></div>'
                          )
                          onSync?.()
                        }, 50)
                      }
                    }}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <div className="w-10 h-5 bg-red-500 rounded-full mb-1"></div>
                    <span className="text-xs">Oval</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
                      if (editor) {
                        editor.focus()
                        setTimeout(() => {
                          EditorUtils.execCommand('insertHTML', 
                            '<div style="width: 120px; height: 80px; background-color: #8b5cf6; clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); margin: 10px; display: inline-block;"></div>'
                          )
                          onSync?.()
                        }, 50)
                      }
                    }}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <div className="w-8 h-8 bg-violet-500 rotate-45 mb-1"></div>
                    <span className="text-xs">Diamond</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
                      if (editor) {
                        editor.focus()
                        setTimeout(() => {
                          EditorUtils.execCommand('insertHTML', 
                            '<div style="width: 100px; height: 60px; background-color: #ec4899; border-radius: 10px; margin: 10px; display: inline-block;"></div>'
                          )
                          onSync?.()
                        }, 50)
                      }
                    }}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <div className="w-8 h-5 bg-pink-500 rounded mb-1"></div>
                    <span className="text-xs">Rounded</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Click a shape to insert it into your document</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Insert Link */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Popover open={showLinkPopover} onOpenChange={(open) => {
            if (open) saveSelection()
            setShowLinkPopover(open)
          }}>
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
                onClick={() => {
                  // Focus the editor before inserting
                  const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
                  if (editor) {
                    editor.focus()
                    
                    // Small delay to ensure focus is set
                    setTimeout(() => {
                      EditorUtils.execCommand('insertHTML', 
                        '<div style="border: 2px solid #000; padding: 10px; display: inline-block; margin: 10px;">Text Box</div>'
                      )
                      onSync?.()
                    }, 50)
                  } else {
                    EditorUtils.execCommand('insertHTML', 
                      '<div style="border: 2px solid #000; padding: 10px; display: inline-block; margin: 10px;">Text Box</div>'
                    )
                    onSync?.()
                  }
                }}
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
                onClick={() => {
                  // Focus the editor before inserting
                  const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
                  if (editor) {
                    editor.focus()
                    
                    // Small delay to ensure focus is set
                    setTimeout(() => {
                      EditorUtils.insertHorizontalLine()
                      onSync?.()
                    }, 50)
                  } else {
                    EditorUtils.insertHorizontalLine()
                    onSync?.()
                  }
                }}
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

