"use client"

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  Type, 
  FileText, 
  Plus, 
  Table2,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { TextEditingTab } from './tabs/TextEditingTab'
import { PageLayoutTab } from './tabs/PageLayoutTab'
import { InsertTab } from './tabs/InsertTab'
import { TableToolsTab } from './tabs/TableToolsTab'
import { PageSettings } from './types'

interface RichTextEditorToolbarProps {
  pageSettings: PageSettings
  onPageSettingsChange: (settings: Partial<PageSettings>) => void
  onSync?: () => void
}

export function RichTextEditorToolbar({ 
  pageSettings, 
  onPageSettingsChange, 
  onSync 
}: RichTextEditorToolbarProps) {
  const [activeTab, setActiveTab] = useState('editing')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isInTable, setIsInTable] = useState(false)

  // Check if cursor is inside a table or table is selected
  const checkIfInTable = () => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      setIsInTable(false)
      return
    }
    
    // Check if cursor/selection is inside a table
    let node: Node | null = selection.anchorNode
    while (node && node !== document.body) {
      if (node.nodeName === 'TABLE') {
        setIsInTable(true)
        return
      }
      node = node.parentNode
    }
    
    // Also check if a table element is within the selection range
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      
      // If container is a table or contains a table
      if (container.nodeType === Node.ELEMENT_NODE) {
        const element = container as Element
        if (element.nodeName === 'TABLE' || element.querySelector('table')) {
          setIsInTable(true)
          return
        }
      }
      
      // Check parent of container
      let parent: Node | null = container
      while (parent && parent !== document.body) {
        if (parent.nodeName === 'TABLE') {
          setIsInTable(true)
          return
        }
        parent = parent.parentNode
      }
    }
    
    setIsInTable(false)
  }

  // Listen for selection changes and clicks
  useEffect(() => {
    const handleSelectionChange = () => {
      checkIfInTable()
    }

    const handleClick = () => {
      // Small delay to ensure selection has updated
      setTimeout(checkIfInTable, 10)
    }

    const handleKeyUp = () => {
      checkIfInTable()
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('click', handleClick)
    document.addEventListener('keyup', handleKeyUp)

    // Initial check
    checkIfInTable()

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Switch away from table tab if cursor leaves table
  useEffect(() => {
    if (!isInTable && activeTab === 'table') {
      setActiveTab('editing')
    }
  }, [isInTable, activeTab])

  return (
    <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative">
          <TabsList className="w-full justify-start rounded-none border-b bg-gray-100 h-auto sm:h-10 p-0 flex overflow-x-auto scrollbar-hide">
            <TabsTrigger 
              value="editing" 
              className="gap-1.5 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              <Type className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden md:inline">Editing & Formatting</span>
              <span className="md:hidden">Edit</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="layout" 
              className="gap-1.5 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden md:inline">Page Layout</span>
              <span className="md:hidden">Layout</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="insert" 
              className="gap-1.5 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Insert</span>
            </TabsTrigger>
            
            {/* Table Tools Tab - Only visible when cursor is in a table */}
            {isInTable && (
              <TabsTrigger 
                value="table" 
                className="gap-1.5 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap shrink-0 animate-in fade-in slide-in-from-left-2 duration-200"
              >
                <Table2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline">Table Tools</span>
                <span className="md:hidden">Table</span>
              </TabsTrigger>
            )}

            {/* Spacer to push toggle button to right */}
            <div className="grow"></div>

            {/* Toggle Button */}
            <div className="pr-1.5 sm:pr-2 flex items-center shrink-0 sticky right-0 bg-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-200"
                title={isCollapsed ? "Expand toolbar" : "Collapse toolbar"}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </TabsList>
        </div>

        {!isCollapsed && (
          <>
            <TabsContent value="editing" className="m-0 p-0">
              <TextEditingTab onSync={onSync} />
            </TabsContent>

            <TabsContent value="layout" className="m-0 p-0">
              <PageLayoutTab 
                pageSettings={pageSettings}
                onPageSettingsChange={onPageSettingsChange}
                onSync={onSync}
              />
            </TabsContent>

            <TabsContent value="insert" className="m-0 p-0">
              <InsertTab onSync={onSync} />
            </TabsContent>

            {/* Table Tools Content - Only render when cursor is in a table */}
            {isInTable && (
              <TabsContent value="table" className="m-0 p-0">
                <TableToolsTab onSync={onSync} />
              </TabsContent>
            )}
          </>
        )}
      </Tabs>
    </div>
  )
}

