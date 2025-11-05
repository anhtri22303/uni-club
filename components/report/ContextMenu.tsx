"use client"

import { useEffect, useState, useRef } from 'react'
// Removed DropdownMenu imports - using custom menu instead
import {
  Scissors,
  Copy,
  Clipboard,
  Link,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image,
  Table2,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Palette,
  Bold,
  Italic,
  Underline,
  Code,
  Heading1,
  Heading2,
  Heading3,
  RemoveFormatting,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import {
  cut,
  copy,
  paste,
  insertLink,
  alignText,
  formatBold,
  formatItalic,
  formatUnderline,
  removeFormatting,
  applyStyle,
} from './utils/editorUtils'
import {
  getContextMenuPosition,
  detectElementType,
  getTableCell,
  getImageElement,
  getLinkElement,
  ContextType,
} from './utils/contextMenuUtils'

interface ContextMenuProps {
  editorRef: React.RefObject<HTMLDivElement>
}

export function ContextMenu({ editorRef }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [contextType, setContextType] = useState<ContextType>('text')
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [showTableActions, setShowTableActions] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Only handle if inside the editor
      if (!editorRef.current?.contains(e.target as Node)) {
        return
      }

      e.preventDefault()
      
      const target = e.target as HTMLElement
      const type = detectElementType(target)
      const pos = getContextMenuPosition(e.clientX, e.clientY)

      setContextType(type)
      setTargetElement(target)
      setPosition(pos)
      setShowTableActions(false) // Reset table actions visibility
      setIsOpen(true)
    }

    const handleClick = (e: MouseEvent) => {
      // Only close if clicking outside the menu
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setShowTableActions(false)
      }
    }

    // Attach event listeners directly to the container if it exists,
    // otherwise attach to document (will still work due to event bubbling)
    const target = editorRef.current || document
    target.addEventListener('contextmenu', handleContextMenu as EventListener)
    document.addEventListener('click', handleClick)

    return () => {
      target.removeEventListener('contextmenu', handleContextMenu as EventListener)
      document.removeEventListener('click', handleClick)
    }
  }, [editorRef])

  const handleCut = () => {
    cut()
    setIsOpen(false)
  }

  const handleCopy = () => {
    copy()
    setIsOpen(false)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      document.execCommand('insertText', false, text)
    } catch (error) {
      console.error('Failed to paste:', error)
    }
    setIsOpen(false)
  }

  const handleInsertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      insertLink(url)
    }
    setIsOpen(false)
  }

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    alignText(alignment)
    // Keep menu open to allow trying different alignments
  }

  const handleRemoveLink = () => {
    document.execCommand('unlink')
    setIsOpen(false)
  }

  const handleEditLink = () => {
    const link = getLinkElement(targetElement)
    if (link) {
      const currentUrl = link.getAttribute('href') || ''
      const newUrl = prompt('Edit URL:', currentUrl)
      if (newUrl !== null) {
        link.setAttribute('href', newUrl)
      }
    }
    setIsOpen(false)
  }

  const handleDeleteImage = () => {
    const img = getImageElement(targetElement)
    if (img) {
      img.remove()
    }
    setIsOpen(false)
  }

  const handleImageProperties = () => {
    const img = getImageElement(targetElement) as HTMLImageElement
    if (img) {
      const width = prompt('Image width (px or %):', img.style.width || '100%')
      if (width !== null) {
        img.style.width = width
        // Maintain aspect ratio
        img.style.height = 'auto'
      }
      const alt = prompt('Alt text:', img.alt || '')
      if (alt !== null) {
        img.alt = alt
      }
    }
    setIsOpen(false)
  }

  const handleImageAlign = (alignment: 'left' | 'center' | 'right') => {
    const img = getImageElement(targetElement) as HTMLImageElement
    if (img) {
      // Clear previous alignment
      img.style.marginLeft = ''
      img.style.marginRight = ''
      img.style.display = 'block'
      
      switch (alignment) {
        case 'left':
          img.style.marginRight = 'auto'
          break
        case 'center':
          img.style.marginLeft = 'auto'
          img.style.marginRight = 'auto'
          break
        case 'right':
          img.style.marginLeft = 'auto'
          break
      }
    }
    // Keep menu open to allow trying different alignments
  }

  const handleImageResize = (size: '25%' | '50%' | '75%' | '100%') => {
    const img = getImageElement(targetElement) as HTMLImageElement
    if (img) {
      img.style.width = size
      img.style.height = 'auto'
    }
    setIsOpen(false)
  }

  const handleInsertRowAbove = () => {
    const cell = getTableCell(targetElement)
    if (cell) {
      const row = cell.parentElement as HTMLTableRowElement
      const table = row.parentElement as HTMLTableSectionElement | HTMLTableElement
      const newRow = row.cloneNode(true) as HTMLTableRowElement
      // Clear content in new row
      newRow.querySelectorAll('td, th').forEach(c => {
        c.innerHTML = '&nbsp;'
      })
      table.insertBefore(newRow, row)
    }
    // Keep menu open to allow inserting multiple rows
  }

  const handleInsertRowBelow = () => {
    const cell = getTableCell(targetElement)
    if (cell) {
      const row = cell.parentElement as HTMLTableRowElement
      const table = row.parentElement as HTMLTableSectionElement | HTMLTableElement
      const newRow = row.cloneNode(true) as HTMLTableRowElement
      // Clear content in new row
      newRow.querySelectorAll('td, th').forEach(c => {
        c.innerHTML = '&nbsp;'
      })
      if (row.nextSibling) {
        table.insertBefore(newRow, row.nextSibling)
      } else {
        table.appendChild(newRow)
      }
    }
    // Keep menu open to allow inserting multiple rows
  }

  const handleInsertColumnLeft = () => {
    const cell = getTableCell(targetElement)
    if (cell) {
      const cellIndex = Array.from(cell.parentElement!.children).indexOf(cell)
      const table = cell.closest('table')
      if (table) {
        table.querySelectorAll('tr').forEach(row => {
          const newCell = document.createElement(row.children[cellIndex].tagName.toLowerCase())
          newCell.innerHTML = '&nbsp;'
          newCell.style.border = '1px solid #d1d5db'
          newCell.style.padding = '8px'
          row.insertBefore(newCell, row.children[cellIndex])
        })
      }
    }
    // Keep menu open to allow inserting multiple columns
  }

  const handleInsertColumnRight = () => {
    const cell = getTableCell(targetElement)
    if (cell) {
      const cellIndex = Array.from(cell.parentElement!.children).indexOf(cell)
      const table = cell.closest('table')
      if (table) {
        table.querySelectorAll('tr').forEach(row => {
          const newCell = document.createElement(row.children[cellIndex].tagName.toLowerCase())
          newCell.innerHTML = '&nbsp;'
          newCell.style.border = '1px solid #d1d5db'
          newCell.style.padding = '8px'
          if (row.children[cellIndex].nextSibling) {
            row.insertBefore(newCell, row.children[cellIndex].nextSibling)
          } else {
            row.appendChild(newCell)
          }
        })
      }
    }
    // Keep menu open to allow inserting multiple columns
  }

  const handleDeleteRow = () => {
    const cell = getTableCell(targetElement)
    if (cell) {
      const row = cell.parentElement as HTMLTableRowElement
      row.remove()
    }
    setIsOpen(false)
  }

  const handleDeleteColumn = () => {
    const cell = getTableCell(targetElement)
    if (cell) {
      const cellIndex = Array.from(cell.parentElement!.children).indexOf(cell)
      const table = cell.closest('table')
      if (table) {
        table.querySelectorAll('tr').forEach(row => {
          if (row.children[cellIndex]) {
            row.children[cellIndex].remove()
          }
        })
      }
    }
    setIsOpen(false)
  }

  const handleDeleteTable = () => {
    const cell = getTableCell(targetElement)
    if (cell) {
      const table = cell.closest('table')
      if (table) {
        table.remove()
      }
    }
    setIsOpen(false)
  }

  const handleCellBackground = () => {
    const cell = getTableCell(targetElement)
    if (cell) {
      const color = prompt('Enter color (hex, rgb, or name):', cell.style.backgroundColor || '#ffffff')
      if (color) {
        cell.style.backgroundColor = color
      }
    }
    // Keep menu open to allow changing multiple cell colors
  }

  const handleApplyStyle = (style: 'heading1' | 'heading2' | 'heading3' | 'normal' | 'code' | 'quote') => {
    applyStyle(style)
    setIsOpen(false)
  }

  const handleFormat = (format: 'bold' | 'italic' | 'underline') => {
    if (format === 'bold') formatBold()
    else if (format === 'italic') formatItalic()
    else if (format === 'underline') formatUnderline()
    // Keep menu open for multiple formatting actions
  }

  if (!isOpen) return null

  // Custom menu item component
  const MenuItem = ({ onClick, children, className = "" }: { onClick: () => void; children: React.ReactNode; className?: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm flex items-center ${className}`}
    >
      {children}
    </button>
  )

  const Separator = () => <div className="h-px bg-border my-1" />
  
  // Common text actions component (reusable)
  const CommonActions = () => (
    <>
      <MenuItem onClick={handleCut}>
        <Scissors className="mr-2 h-4 w-4" />
        <span>Cut</span>
        <span className="ml-auto text-xs text-muted-foreground">Ctrl+X</span>
      </MenuItem>
      <MenuItem onClick={handleCopy}>
        <Copy className="mr-2 h-4 w-4" />
        <span>Copy</span>
        <span className="ml-auto text-xs text-muted-foreground">Ctrl+C</span>
      </MenuItem>
      <MenuItem onClick={handlePaste}>
        <Clipboard className="mr-2 h-4 w-4" />
        <span>Paste</span>
        <span className="ml-auto text-xs text-muted-foreground">Ctrl+V</span>
      </MenuItem>
      
      <Separator />
      
      <MenuItem onClick={() => handleFormat('bold')}>
        <Bold className="mr-2 h-4 w-4" />
        <span>Bold</span>
        <span className="ml-auto text-xs text-muted-foreground">Ctrl+B</span>
      </MenuItem>
      <MenuItem onClick={() => handleFormat('italic')}>
        <Italic className="mr-2 h-4 w-4" />
        <span>Italic</span>
        <span className="ml-auto text-xs text-muted-foreground">Ctrl+I</span>
      </MenuItem>
      <MenuItem onClick={() => handleFormat('underline')}>
        <Underline className="mr-2 h-4 w-4" />
        <span>Underline</span>
        <span className="ml-auto text-xs text-muted-foreground">Ctrl+U</span>
      </MenuItem>
      
      <Separator />
      
      <MenuItem onClick={() => handleAlign('left')}>
        <AlignLeft className="mr-2 h-4 w-4" />
        <span>Align Left</span>
      </MenuItem>
      <MenuItem onClick={() => handleAlign('center')}>
        <AlignCenter className="mr-2 h-4 w-4" />
        <span>Align Center</span>
      </MenuItem>
      <MenuItem onClick={() => handleAlign('right')}>
        <AlignRight className="mr-2 h-4 w-4" />
        <span>Align Right</span>
      </MenuItem>

      <Separator />

      <MenuItem onClick={handleInsertLink}>
        <Link className="mr-2 h-4 w-4" />
        <span>Insert Link</span>
      </MenuItem>
      
      <MenuItem onClick={() => removeFormatting()}>
        <RemoveFormatting className="mr-2 h-4 w-4" />
        <span>Clear Formatting</span>
      </MenuItem>
    </>
  )

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 9999,
      }}
      className="bg-popover text-popover-foreground rounded-md border shadow-md w-56 p-1"
    >
          {/* Common actions for text and table contexts */}
          {(contextType === 'text' || contextType === 'table') && (
            <CommonActions />
          )}

          {/* Link-specific actions */}
          {contextType === 'link' && (
            <>
              <MenuItem onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy Link</span>
              </MenuItem>
              <MenuItem onClick={handleEditLink}>
                <Link className="mr-2 h-4 w-4" />
                <span>Edit Link</span>
              </MenuItem>
              <MenuItem onClick={handleRemoveLink}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Remove Link</span>
              </MenuItem>
              <Separator />
              <MenuItem 
                onClick={() => {
                  const link = getLinkElement(targetElement)
                  if (link) {
                    window.open(link.getAttribute('href') || '#', '_blank')
                  }
                  setIsOpen(false)
                }}
              >
                <span>Open in New Tab</span>
              </MenuItem>
            </>
          )}

          {/* Image-specific actions */}
          {contextType === 'image' && (
            <>
              <MenuItem onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy Image</span>
              </MenuItem>
              
              <Separator />
              
              {/* Image Size Options */}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Resize
              </div>
              <MenuItem onClick={() => handleImageResize('25%')}>
                <Minimize2 className="mr-2 h-4 w-4" />
                <span>Small (25%)</span>
              </MenuItem>
              <MenuItem onClick={() => handleImageResize('50%')}>
                <Minimize2 className="mr-2 h-4 w-4" />
                <span>Medium (50%)</span>
              </MenuItem>
              <MenuItem onClick={() => handleImageResize('75%')}>
                <Maximize2 className="mr-2 h-4 w-4" />
                <span>Large (75%)</span>
              </MenuItem>
              <MenuItem onClick={() => handleImageResize('100%')}>
                <Maximize2 className="mr-2 h-4 w-4" />
                <span>Full Width (100%)</span>
              </MenuItem>
              
              <Separator />
              
              {/* Image Alignment */}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Align
              </div>
              <MenuItem onClick={() => handleImageAlign('left')}>
                <AlignLeft className="mr-2 h-4 w-4" />
                <span>Align Left</span>
              </MenuItem>
              <MenuItem onClick={() => handleImageAlign('center')}>
                <AlignCenter className="mr-2 h-4 w-4" />
                <span>Align Center</span>
              </MenuItem>
              <MenuItem onClick={() => handleImageAlign('right')}>
                <AlignRight className="mr-2 h-4 w-4" />
                <span>Align Right</span>
              </MenuItem>
              
              <Separator />
              
              <MenuItem onClick={handleImageProperties}>
                <Image className="mr-2 h-4 w-4" />
                <span>Custom Size...</span>
              </MenuItem>
              
              <Separator />
              
              <MenuItem onClick={handleDeleteImage} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Image</span>
              </MenuItem>
            </>
          )}

          {/* Table-specific actions (collapsible) */}
          {contextType === 'table' && (
            <>
              <Separator />
              
              {/* Toggle button for table actions */}
              <button
                type="button"
                onClick={() => setShowTableActions(!showTableActions)}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm flex items-center font-medium"
              >
                <Table2 className="mr-2 h-4 w-4" />
                <span>Table Actions</span>
                {showTableActions ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>
              
              {/* Collapsible table actions */}
              {showTableActions && (
                <>
                  <Separator />
                  
                  <MenuItem onClick={handleInsertRowAbove}>
                    <ArrowUp className="mr-2 h-4 w-4" />
                    <span>Insert Row Above</span>
                  </MenuItem>
                  <MenuItem onClick={handleInsertRowBelow}>
                    <ArrowDown className="mr-2 h-4 w-4" />
                    <span>Insert Row Below</span>
                  </MenuItem>
                  
                  <Separator />
                  
                  <MenuItem onClick={handleInsertColumnLeft}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    <span>Insert Column Left</span>
                  </MenuItem>
                  <MenuItem onClick={handleInsertColumnRight}>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    <span>Insert Column Right</span>
                  </MenuItem>

                  <Separator />

                  <MenuItem onClick={handleCellBackground}>
                    <Palette className="mr-2 h-4 w-4" />
                    <span>Cell Background</span>
                  </MenuItem>

                  <Separator />

                  <MenuItem onClick={handleDeleteRow} className="text-red-600">
                    <Minus className="mr-2 h-4 w-4" />
                    <span>Delete Row</span>
                  </MenuItem>
                  <MenuItem onClick={handleDeleteColumn} className="text-red-600">
                    <Minus className="mr-2 h-4 w-4" />
                    <span>Delete Column</span>
                  </MenuItem>
                  <MenuItem onClick={handleDeleteTable} className="text-red-600">
                    <Table2 className="mr-2 h-4 w-4" />
                    <span>Delete Table</span>
                  </MenuItem>
                </>
              )}
            </>
          )}
    </div>
  )
}

