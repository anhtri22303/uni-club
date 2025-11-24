"use client"

import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Undo,
  Redo,
  Copy,
  Scissors,
  Clipboard,
  Search,
  RemoveFormatting
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
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState, useEffect } from 'react'
import * as EditorUtils from '../utils/editorUtils'
import { FontFamily, FontSize, TextAlignment, StyleType } from '../types'
import * as HistoryManager from '../utils/historyManager'
import { HistoryNotification, useHistoryNotification } from '../HistoryNotification'

interface TextEditingTabProps {
  onSync?: () => void
  compact?: boolean
  editorRef?: React.RefObject<HTMLDivElement>
}

const FONT_FAMILIES: FontFamily[] = [
  'Arial',
  'Times New Roman',
  'Calibri',
  'Georgia',
  'Verdana',
  'Courier New',
  'Comic Sans MS',
  'Trebuchet MS'
]

const FONT_SIZES: FontSize[] = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72']

const PRESET_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
  '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
  '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
  '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
  '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
  '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79'
]

export function TextEditingTab({ onSync, compact = false, editorRef }: TextEditingTabProps) {
  const [selectedFont, setSelectedFont] = useState<FontFamily>('Times New Roman')
  const [selectedSize, setSelectedSize] = useState<FontSize>('12')
  const [textColor, setTextColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [showFindReplacePopover, setShowFindReplacePopover] = useState(false)
  const [historyStatus, setHistoryStatus] = useState(HistoryManager.getHistoryStatus())
  const { notification, showNotification, hideNotification } = useHistoryNotification()

  // Update history status whenever it changes
  useEffect(() => {
    const updateStatus = () => {
      setHistoryStatus(HistoryManager.getHistoryStatus())
    }
    
    // Update status on mount
    updateStatus()

    // Listen for keyboard undo/redo events to update toolbar state
    const handleHistoryChange = () => {
      updateStatus()
    }
    
    window.addEventListener('history-change', handleHistoryChange)
    
    return () => {
      window.removeEventListener('history-change', handleHistoryChange)
    }
  }, [])

  const handleAction = (action: () => void) => {
    action()
    onSync?.()
    
    // Update history status after action
    setHistoryStatus(HistoryManager.getHistoryStatus())
  }
  
  const handleUndo = () => {
    const result = HistoryManager.undo()
    
    if (result.content && editorRef?.current) {
      editorRef.current.innerHTML = result.content
      onSync?.()
    }
    
    if (result.message) {
      showNotification({
        message: result.message,
        type: result.status.canUndo ? 'warning' : 'info',
        duration: 2500
      })
    }
    
    setHistoryStatus(result.status)
  }
  
  const handleRedo = () => {
    const result = HistoryManager.redo()
    
    if (result.content && editorRef?.current) {
      editorRef.current.innerHTML = result.content
      onSync?.()
    }
    
    if (result.message) {
      showNotification({
        message: result.message,
        type: 'info',
        duration: 2500
      })
    }
    
    setHistoryStatus(result.status)
  }

  const handleFontChange = (font: FontFamily) => {
    setSelectedFont(font)
    EditorUtils.changeFontFamily(font)
    onSync?.()
  }

  const handleSizeChange = (size: FontSize) => {
    setSelectedSize(size)
    EditorUtils.changeFontSize(size)
    onSync?.()
  }

  const handleColorChange = (color: string) => {
    setTextColor(color)
    EditorUtils.changeTextColor(color)
    onSync?.()
  }

  const handleBgColorChange = (color: string) => {
    setBgColor(color)
    EditorUtils.changeBackgroundColor(color)
    onSync?.()
  }

  const handleFind = () => {
    if (searchText) {
      const count = EditorUtils.findText(searchText)
      if (count > 0) {
        showNotification({ message: `Found ${count} match${count > 1 ? 'es' : ''}`, type: 'success' })
      } else {
        showNotification({ message: 'No matches found', type: 'error' })
      }
    }
  }

  const handleReplace = () => {
    if (searchText && replaceText) {
      EditorUtils.replaceText(searchText, replaceText, false)
      onSync?.()
    }
  }

  const handleReplaceAll = () => {
    if (searchText && replaceText) {
      EditorUtils.replaceText(searchText, replaceText, true)
      onSync?.()
    }
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
        <div className={`flex items-center gap-1 ${compact ? 'p-1' : 'p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800/50 border-b'} min-w-max`}>
        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 pr-1.5 sm:pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={!historyStatus.canUndo}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Undo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {historyStatus.canUndo 
                ? `Undo (Ctrl+Z) - ${historyStatus.totalStates} state${historyStatus.totalStates !== 1 ? 's' : ''} available` 
                : 'No undo available'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={!historyStatus.canRedo}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Redo className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {historyStatus.canRedo 
                ? 'Redo (Ctrl+Y)' 
                : 'No redo available'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Clipboard */}
        <div className="flex items-center gap-0.5 pr-1.5 sm:pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const success = EditorUtils.copy()
                  if (success) {
                    showNotification({
                      message: 'Content copied to clipboard',
                      type: 'info',
                      duration: 1500
                    })
                  }
                  onSync?.()
                }}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy (Ctrl+C)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const success = EditorUtils.cut()
                  if (success) {
                    showNotification({
                      message: 'Content cut to clipboard',
                      type: 'info',
                      duration: 1500
                    })
                  }
                  onSync?.()
                }}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Scissors className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cut (Ctrl+X)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const success = EditorUtils.paste()
                  if (success) {
                    showNotification({
                      message: 'Content pasted',
                      type: 'info',
                      duration: 1500
                    })
                  }
                  onSync?.()
                }}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Clipboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Paste (Ctrl+V)</TooltipContent>
          </Tooltip>
        </div>

        {/* Font Family & Size */}
        <div className="flex items-center gap-1 pr-1.5 sm:pr-2 border-r">
          <Select value={selectedFont} onValueChange={handleFontChange}>
            <SelectTrigger className="h-7 sm:h-8 w-[100px] sm:w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map(font => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSize} onValueChange={handleSizeChange}>
            <SelectTrigger className="h-7 sm:h-8 w-[60px] sm:w-[70px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map(size => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Text Formatting */}
        <div className="flex items-center gap-0.5 pr-1.5 sm:pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(EditorUtils.formatBold)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Bold className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold (Ctrl+B)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(EditorUtils.formatItalic)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Italic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic (Ctrl+I)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(EditorUtils.formatUnderline)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Underline className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline (Ctrl+U)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(EditorUtils.formatStrikethrough)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Strikethrough className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Strikethrough</TooltipContent>
          </Tooltip>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-0.5 pr-1.5 sm:pr-2 border-r">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0" title="Text Color">
                <Type className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <div 
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded" 
                  style={{ backgroundColor: textColor }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid grid-cols-10 gap-1">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                    title={`Color ${color}`}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              <Separator className="my-2" />
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={textColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-12 h-8 p-0 border-0"
                />
                <Input
                  type="text"
                  value={textColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0" title="Highlight Color">
                <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <div 
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded" 
                  style={{ backgroundColor: bgColor }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid grid-cols-10 gap-1">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleBgColorChange(color)}
                    title={`Background ${color}`}
                    aria-label={`Select background color ${color}`}
                  />
                ))}
              </div>
              <Separator className="my-2" />
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={bgColor}
                  onChange={(e) => handleBgColorChange(e.target.value)}
                  className="w-12 h-8 p-0 border-0"
                />
                <Input
                  type="text"
                  value={bgColor}
                  onChange={(e) => handleBgColorChange(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 pr-1.5 sm:pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(() => EditorUtils.alignText('left'))}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <AlignLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Left</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(() => EditorUtils.alignText('center'))}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <AlignCenter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Center</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(() => EditorUtils.alignText('right'))}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <AlignRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Right</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(() => EditorUtils.alignText('justify'))}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <AlignJustify className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Justify</TooltipContent>
          </Tooltip>
        </div>

        {/* Lists & Indent */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(() => EditorUtils.createList('bullet'))}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(() => EditorUtils.createList('numbered'))}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <ListOrdered className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Numbered List</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(EditorUtils.outdent)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Outdent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Decrease Indent</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(EditorUtils.indent)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Indent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Increase Indent</TooltipContent>
          </Tooltip>
        </div>

        {/* Find & Replace */}
        <div className="flex items-center gap-0.5 pr-1.5 sm:pr-2 border-r">
          <Popover open={showFindReplacePopover} onOpenChange={setShowFindReplacePopover}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0" title="Find & Replace">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Find</Label>
                  <div className="flex gap-1">
                    <Input
                      placeholder="Search text..."
                      value={searchText}
                      onChange={(e) => {
                        const value = e.target.value
                        setSearchText(value)
                        // Auto-search as user types
                        if (value.trim()) {
                          setTimeout(() => {
                            const count = EditorUtils.findText(value)
                            if (count > 0) {
                              showNotification({ message: `Found ${count} match${count > 1 ? 'es' : ''}`, type: 'success' })
                            } else {
                              showNotification({ message: 'No matches found', type: 'info' })
                            }
                          }, 100)
                        } else {
                          // Clear highlights when search text is empty
                          EditorUtils.clearSearchHighlights()
                        }
                      }}
                      className="h-8 text-xs"
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={() => {
                        setSearchText('')
                        EditorUtils.clearSearchHighlights()
                        showNotification({ message: 'Search cleared', type: 'info' })
                      }} 
                      className="h-8"
                      disabled={!searchText}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Replace with</Label>
                  <div className="flex gap-1">
                    <Input
                      placeholder="Replace with..."
                      value={replaceText}
                      onChange={(e) => setReplaceText(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button type="button" size="sm" onClick={handleReplace} className="flex-1 h-8">
                    Replace
                  </Button>
                  <Button type="button" size="sm" onClick={handleReplaceAll} className="flex-1 h-8">
                    Replace All
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear Formatting */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAction(EditorUtils.removeFormatting)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <RemoveFormatting className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear Formatting</TooltipContent>
          </Tooltip>
        </div>
      </div>
      </div>
      
      {/* History Notification */}
      {notification && (
        <HistoryNotification
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={hideNotification}
        />
      )}
    </TooltipProvider>
  )
}

