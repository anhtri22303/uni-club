"use client"

import { 
  Table2,
  Plus,
  Minus,
  MergeIcon as Merge,
  Split,
  Trash2,
  AlignCenter as AlignCenterIcon
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
import { useState, useRef } from 'react'

interface TableToolsTabProps {
  onSync?: () => void
  compact?: boolean
}

export function TableToolsTab({ onSync, compact = false }: TableToolsTabProps) {
  const [showInsertPopover, setShowInsertPopover] = useState(false)
  const [showDeletePopover, setShowDeletePopover] = useState(false)

  const handleAction = (action: () => void) => {
    action()
    onSync?.()
  }

  // Get the currently selected table cell
  const getSelectedCell = (): HTMLTableCellElement | null => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return null
    
    let node = selection.anchorNode
    while (node && node !== document.body) {
      if (node.nodeName === 'TD' || node.nodeName === 'TH') {
        return node as HTMLTableCellElement
      }
      node = node.parentNode
    }
    return null
  }

  // Get the table containing the selected cell
  const getSelectedTable = (): HTMLTableElement | null => {
    const cell = getSelectedCell()
    if (!cell) return null
    
    let node: Node | null = cell
    while (node && node !== document.body) {
      if (node.nodeName === 'TABLE') {
        return node as HTMLTableElement
      }
      node = node.parentNode
    }
    return null
  }

  const insertRowAbove = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    const cell = getSelectedCell()
    if (!cell) return

    // Save scroll position
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    const scrollTop = editor?.scrollTop || window.scrollY

    const row = cell.parentElement as HTMLTableRowElement
    const table = row.parentElement as HTMLTableSectionElement
    const newRow = row.cloneNode(true) as HTMLTableRowElement
    
    // Clear content of new cells
    newRow.querySelectorAll('td, th').forEach(cell => {
      cell.innerHTML = '&nbsp;'
    })
    
    table.insertBefore(newRow, row)
    
    // Close popover
    setShowInsertPopover(false)
    
    // Restore scroll position
    setTimeout(() => {
      if (editor) {
        editor.scrollTop = scrollTop
      } else {
        window.scrollTo(window.scrollX, scrollTop)
      }
    }, 0)
    
    onSync?.()
  }

  const insertRowBelow = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    const cell = getSelectedCell()
    if (!cell) return

    // Save scroll position
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    const scrollTop = editor?.scrollTop || window.scrollY

    const row = cell.parentElement as HTMLTableRowElement
    const table = row.parentElement as HTMLTableSectionElement
    const newRow = row.cloneNode(true) as HTMLTableRowElement
    
    // Clear content of new cells
    newRow.querySelectorAll('td, th').forEach(cell => {
      cell.innerHTML = '&nbsp;'
    })
    
    if (row.nextSibling) {
      table.insertBefore(newRow, row.nextSibling)
    } else {
      table.appendChild(newRow)
    }
    
    // Close popover
    setShowInsertPopover(false)
    
    // Restore scroll position
    setTimeout(() => {
      if (editor) {
        editor.scrollTop = scrollTop
      } else {
        window.scrollTo(window.scrollX, scrollTop)
      }
    }, 0)
    
    onSync?.()
  }

  const insertColumnLeft = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    const cell = getSelectedCell()
    if (!cell) return

    const table = getSelectedTable()
    if (!table) return

    // Save scroll position
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    const scrollTop = editor?.scrollTop || window.scrollY

    const cellIndex = cell.cellIndex
    const rows = table.querySelectorAll('tr')
    
    rows.forEach(row => {
      const targetCell = row.cells[cellIndex]
      if (targetCell) {
        // Clone the cell to preserve styles
        const newCell = targetCell.cloneNode(false) as HTMLTableCellElement
        newCell.innerHTML = '&nbsp;'
        row.insertBefore(newCell, targetCell)
      }
    })
    
    // Close popover
    setShowInsertPopover(false)
    
    // Restore scroll position
    setTimeout(() => {
      if (editor) {
        editor.scrollTop = scrollTop
      } else {
        window.scrollTo(window.scrollX, scrollTop)
      }
    }, 0)
    
    onSync?.()
  }

  const insertColumnRight = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    const cell = getSelectedCell()
    if (!cell) return

    const table = getSelectedTable()
    if (!table) return

    // Save scroll position
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    const scrollTop = editor?.scrollTop || window.scrollY

    const cellIndex = cell.cellIndex
    const rows = table.querySelectorAll('tr')
    
    rows.forEach(row => {
      const targetCell = row.cells[cellIndex]
      if (targetCell) {
        // Clone the cell to preserve styles
        const newCell = targetCell.cloneNode(false) as HTMLTableCellElement
        newCell.innerHTML = '&nbsp;'
        if (targetCell.nextSibling) {
          row.insertBefore(newCell, targetCell.nextSibling)
        } else {
          row.appendChild(newCell)
        }
      }
    })
    
    // Close popover
    setShowInsertPopover(false)
    
    // Restore scroll position
    setTimeout(() => {
      if (editor) {
        editor.scrollTop = scrollTop
      } else {
        window.scrollTo(window.scrollX, scrollTop)
      }
    }, 0)
    
    onSync?.()
  }

  const deleteRow = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    const cell = getSelectedCell()
    if (!cell) return

    // Save scroll position
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    const scrollTop = editor?.scrollTop || window.scrollY

    const row = cell.parentElement as HTMLTableRowElement
    row.remove()
    
    // Close popover
    setShowDeletePopover(false)
    
    // Restore scroll position
    setTimeout(() => {
      if (editor) {
        editor.scrollTop = scrollTop
      } else {
        window.scrollTo(window.scrollX, scrollTop)
      }
    }, 0)
    
    onSync?.()
  }

  const deleteColumn = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    const cell = getSelectedCell()
    if (!cell) return

    const table = getSelectedTable()
    if (!table) return

    // Save scroll position
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    const scrollTop = editor?.scrollTop || window.scrollY

    const cellIndex = cell.cellIndex
    const rows = table.querySelectorAll('tr')
    
    rows.forEach(row => {
      const targetCell = row.cells[cellIndex]
      if (targetCell) {
        targetCell.remove()
      }
    })
    
    // Close popover
    setShowDeletePopover(false)
    
    // Restore scroll position
    setTimeout(() => {
      if (editor) {
        editor.scrollTop = scrollTop
      } else {
        window.scrollTo(window.scrollX, scrollTop)
      }
    }, 0)
    
    onSync?.()
  }

  const deleteTable = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    const table = getSelectedTable()
    if (table) {
      // Save scroll position
      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
      const scrollTop = editor?.scrollTop || window.scrollY

      table.remove()
      
      // Close popover
      setShowDeletePopover(false)
      
      // Restore scroll position
      setTimeout(() => {
        if (editor) {
          editor.scrollTop = scrollTop
        } else {
          window.scrollTo(window.scrollX, scrollTop)
        }
      }, 0)
      
      onSync?.()
    }
  }

  const mergeCells = () => {
    // This would require more complex logic to merge selected cells
    alert('Select multiple cells and use this feature to merge them. (Advanced feature - requires selection API)')
  }

  const splitCell = () => {
    const cell = getSelectedCell()
    if (!cell) return

    // Save scroll position
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    const scrollTop = editor?.scrollTop || window.scrollY

    const colspan = cell.colSpan
    const rowspan = cell.rowSpan
    
    if (colspan > 1) {
      cell.colSpan = 1
      // Add new cells with same styling
      const row = cell.parentElement as HTMLTableRowElement
      for (let i = 1; i < colspan; i++) {
        // Clone the cell to preserve styles
        const newCell = cell.cloneNode(false) as HTMLTableCellElement
        newCell.innerHTML = '&nbsp;'
        if (cell.nextSibling) {
          row.insertBefore(newCell, cell.nextSibling)
        } else {
          row.appendChild(newCell)
        }
      }
    }
    
    if (rowspan > 1) {
      cell.rowSpan = 1
      // Would need to add cells to rows below
    }
    
    // Restore scroll position
    setTimeout(() => {
      if (editor) {
        editor.scrollTop = scrollTop
      } else {
        window.scrollTo(window.scrollX, scrollTop)
      }
    }, 0)
    
    onSync?.()
  }

  const alignCellContent = (alignment: 'left' | 'center' | 'right') => {
    const cell = getSelectedCell()
    if (cell) {
      // Save scroll position
      const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
      const scrollTop = editor?.scrollTop || window.scrollY

      cell.style.textAlign = alignment
      
      // Restore scroll position
      setTimeout(() => {
        if (editor) {
          editor.scrollTop = scrollTop
        } else {
          window.scrollTo(window.scrollX, scrollTop)
        }
      }, 0)
      
      onSync?.()
    }
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
        <div className={`flex items-center gap-1 ${compact ? 'p-1' : 'p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800/50 border-b'} min-w-max`}>
        {/* Insert Row/Column */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Popover open={showInsertPopover} onOpenChange={setShowInsertPopover}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" title="Insert Row/Column">
                <Plus className="h-4 w-4 mr-1" />
                Insert
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={insertRowAbove}
                  className="w-full justify-start h-8 text-xs"
                >
                  Insert Row Above
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={insertRowBelow}
                  className="w-full justify-start h-8 text-xs"
                >
                  Insert Row Below
                </Button>
                <Separator className="my-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={insertColumnLeft}
                  className="w-full justify-start h-8 text-xs"
                >
                  Insert Column Left
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={insertColumnRight}
                  className="w-full justify-start h-8 text-xs"
                >
                  Insert Column Right
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover open={showDeletePopover} onOpenChange={setShowDeletePopover}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" title="Delete Row/Column/Table">
                <Minus className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deleteRow}
                  className="w-full justify-start h-8 text-xs"
                >
                  Delete Row
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deleteColumn}
                  className="w-full justify-start h-8 text-xs"
                >
                  Delete Column
                </Button>
                <Separator className="my-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deleteTable}
                  className="w-full justify-start h-8 text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Table
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Merge/Split */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={mergeCells}
                className="h-8 w-8 p-0"
              >
                <Merge className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Merge Cells</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={splitCell}
                className="h-8 w-8 p-0"
              >
                <Split className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Split Cell</TooltipContent>
          </Tooltip>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 pr-2 border-r">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => alignCellContent('left')}
                className="h-8 px-2 text-xs"
              >
                Left
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
                onClick={() => alignCellContent('center')}
                className="h-8 px-2 text-xs"
              >
                Center
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
                onClick={() => alignCellContent('right')}
                className="h-8 px-2 text-xs"
              >
                Right
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Right</TooltipContent>
          </Tooltip>
        </div>

      </div>
      </div>
    </TooltipProvider>
  )
}

