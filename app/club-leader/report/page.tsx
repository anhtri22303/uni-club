"use client"

import { useState, useRef, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Download,
  Trash2,
  Users,
  Calendar,
  Gift,
  Check,
  Save,
  ClipboardList,
  Clock,
  Wallet,
  ShoppingCart,
  UserCheck,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react"
import { getClubIdFromToken, getClubById } from "@/service/clubApi"
import { getMembersByClubId } from "@/service/membershipApi"
import { getEventByClubId } from "@/service/eventApi"
import { getProducts } from "@/service/productApi"
import { fetchTodayClubAttendance, fetchClubAttendanceHistory } from "@/service/attendanceApi"
import { getClubWallet, getClubToMemberTransactions } from "@/service/walletApi"
import { getClubRedeemOrders } from "@/service/redeemApi"
import { getMemberApplyByClubId } from "@/service/memberApplicationApi"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { toast } from "sonner"
import { RichTextEditorToolbar } from "@/components/report/RichTextEditorToolbar"
import { ContextMenu } from "@/components/report/ContextMenu"
import { ImageResizer } from "@/components/report/ImageResizer"
import { PageSettings } from "@/components/report/types"
import { 
  saveReportToSession, 
  loadReportFromSession, 
  savePageSettingsToSession,
  loadPageSettingsFromSession,
  clearReportFromSession,
  hasReportInSession,
  getReportLastModified
} from "@/lib/reportLocalStorage"
import * as HistoryManager from "@/components/report/utils/historyManager"

interface ClubData {
  id: number
  name: string
  description: string
  majorName: string
  leaderName: string
  memberCount?: number
}

export default function ReportPage() {
  const [clubData, setClubData] = useState<ClubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const pagesContainerRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState(1)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  const [, setTick] = useState(0) // Force re-render every 30 seconds to update time display
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
    paperSize: 'A4',
    orientation: 'portrait',
    lineSpacing: 1.5,
    showPageNumbers: true,
    pageNumberPosition: 'bottom',
    pageNumberAlignment: 'right',
    columns: 1
  })

  // Helper function to format time since last save
  const getTimeSinceLastSave = () => {
    if (!lastAutoSave) return null
    
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - lastAutoSave.getTime()) / 1000)
    
    if (diffInSeconds < 5) return "just now"
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes === 1) return "1 minute ago"
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours === 1) return "1 hour ago"
    return `${diffInHours} hours ago`
  }

  // Update time display every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1)
    }, 30000) // 30 seconds = 30,000 milliseconds

    return () => clearInterval(timer)
  }, [])

  // Fetch club data on mount
  useEffect(() => {
    const fetchClubData = async () => {
      try {
        const clubId = getClubIdFromToken()
        if (!clubId) {
          toast.error("Unable to identify club")
          setLoading(false)
          return
        }

        const response = await getClubById(clubId)
        if (response.success && response.data) {
          setClubData(response.data)
          
          // Restore page settings from local storage if available
          const savedSettings = loadPageSettingsFromSession(clubId)
          if (savedSettings) {
            setPageSettings(savedSettings)
          }
          
          initializeDefaultTemplate(response.data)
        }
      } catch (error) {
        console.error("Error fetching club data:", error)
        toast.error("Failed to load club data")
      } finally {
        setLoading(false)
      }
    }

    fetchClubData()
  }, [])

  // Auto-save to local storage every 1 minute
  useEffect(() => {
    if (!clubData) return

    const autoSaveInterval = setInterval(() => {
      if (editorRef.current && clubData) {
        const currentContent = editorRef.current.innerHTML
        saveReportToSession(currentContent, clubData.id)
        savePageSettingsToSession(pageSettings, clubData.id)
        const saveTime = new Date()
        setLastAutoSave(saveTime)
        console.log(`[Auto-save] Report saved at ${saveTime.toLocaleTimeString()}`)
      }
    }, 60000) // 1 minute = 60,000 milliseconds

    return () => {
      clearInterval(autoSaveInterval)
    }
  }, [clubData, pageSettings])

  // Keyboard shortcuts for undo/redo (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      console.log('[Keyboard] Key pressed:', e.key, 'Ctrl:', e.ctrlKey, 'Meta:', e.metaKey)
      
      // Only handle if Ctrl (or Cmd on Mac) is pressed
      if (!e.ctrlKey && !e.metaKey) return

      // Ctrl+Z - Undo
      if (e.key === 'z' || e.key === 'Z') {
        console.log('[Keyboard] Ctrl+Z detected, preventing default and calling undo()')
        e.preventDefault() // Prevent browser's native undo
        e.stopPropagation()
        
        if (!editorRef.current) {
          console.log('[Keyboard] editorRef.current is null!')
          return
        }
        
        console.log('[Keyboard] Calling HistoryManager.undo()')
        const result = HistoryManager.undo()
        console.log('[Keyboard] Undo result:', result)
        
        if (result.content) {
          editorRef.current.innerHTML = result.content
          console.log('[Undo] Restored previous state')
          
          // Re-paginate after undo
          setTimeout(() => paginateContent(), 100)
        }
        
        // Show notification if at boundary
        if (result.message) {
          toast.info(result.message)
        }

        // Dispatch custom event to update toolbar state
        window.dispatchEvent(new CustomEvent('history-change'))
      }
      
      // Ctrl+Y - Redo
      if (e.key === 'y' || e.key === 'Y') {
        console.log('[Keyboard] Ctrl+Y detected, preventing default and calling redo()')
        e.preventDefault() // Prevent browser's native redo
        e.stopPropagation()
        
        if (!editorRef.current) {
          console.log('[Keyboard] editorRef.current is null!')
          return
        }
        
        console.log('[Keyboard] Calling HistoryManager.redo()')
        const result = HistoryManager.redo()
        console.log('[Keyboard] Redo result:', result)
        
        if (result.content) {
          editorRef.current.innerHTML = result.content
          console.log('[Redo] Restored next state')
          
          // Re-paginate after redo
          setTimeout(() => paginateContent(), 100)
        }
        
        // Show notification if at boundary
        if (result.message) {
          toast.info(result.message)
        }

        // Dispatch custom event to update toolbar state
        window.dispatchEvent(new CustomEvent('history-change'))
      }
    }

    // Attach keyboard listener
    console.log('[Keyboard] Attaching keyboard event listener')
    document.addEventListener('keydown', handleKeyboardShortcuts)

    return () => {
      console.log('[Keyboard] Removing keyboard event listener')
      document.removeEventListener('keydown', handleKeyboardShortcuts)
    }
  }, []) // Empty deps - this handler doesn't need to change

  // Helper: Save cursor position
  const saveCursorPosition = () => {
    try {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return null

      const range = selection.getRangeAt(0)
      const preSelectionRange = range.cloneRange()
      
      // Find the contentEditable ancestor
      let container: Node | null = range.startContainer
      while (container && container.nodeType !== Node.ELEMENT_NODE) {
        container = container.parentNode
      }
      
      if (!container) return null
      
      const editableElement = (container as Element).closest('[contenteditable="true"]')
      if (!editableElement || !pagesContainerRef.current?.contains(editableElement)) return null

      // Get the page number
      const page = editableElement.closest('.a4-page')
      const pages = Array.from(pagesContainerRef.current.querySelectorAll('.a4-page'))
      const pageIndex = pages.indexOf(page as Element)
      
      if (pageIndex === -1) return null

      // Calculate offset within the page content
      preSelectionRange.selectNodeContents(editableElement)
      preSelectionRange.setEnd(range.startContainer, range.startOffset)
      const offset = preSelectionRange.toString().length

      return { pageIndex, offset, collapsed: range.collapsed }
    } catch (error) {
      console.error('Error saving cursor position:', error)
      return null
    }
  }

  // Helper: Restore cursor position
  const restoreCursorPosition = (savedPosition: { pageIndex: number; offset: number; collapsed: boolean } | null) => {
    if (!savedPosition || !pagesContainerRef.current) return

    try {
      const pages = pagesContainerRef.current.querySelectorAll('.a4-page')
      if (savedPosition.pageIndex >= pages.length) return

      const page = pages[savedPosition.pageIndex]
      const contentDiv = page.querySelector('.page-content')
      if (!contentDiv) return

      // Find the text node and offset
      const walker = document.createTreeWalker(
        contentDiv,
        NodeFilter.SHOW_TEXT,
        null
      )

      let currentOffset = 0
      let targetNode: Node | null = null
      let targetOffset = 0

      while (walker.nextNode()) {
        const node = walker.currentNode
        const nodeLength = node.textContent?.length || 0
        
        if (currentOffset + nodeLength >= savedPosition.offset) {
          targetNode = node
          targetOffset = savedPosition.offset - currentOffset
          break
        }
        
        currentOffset += nodeLength
      }

      if (targetNode) {
        const range = document.createRange()
        const selection = window.getSelection()
        
        // Ensure offset doesn't exceed node length
        const maxOffset = targetNode.textContent?.length || 0
        targetOffset = Math.min(targetOffset, maxOffset)
        
        range.setStart(targetNode, targetOffset)
        if (savedPosition.collapsed) {
          range.collapse(true)
        }
        
        selection?.removeAllRanges()
        selection?.addRange(range)
        
        // Focus the content div without scrolling
        ;(contentDiv as HTMLElement).focus({ preventScroll: true })
      }
    } catch (error) {
      console.error('Error restoring cursor position:', error)
    }
  }

  // Paginate content into multiple A4 pages
  const paginateContent = () => {
    if (!editorRef.current || !pagesContainerRef.current) return

    // Save cursor position before repaginating
    const savedCursor = saveCursorPosition()
    
    // Save scroll position
    const scrollContainer = pagesContainerRef.current.parentElement
    const savedScrollTop = scrollContainer?.scrollTop || 0

    const content = editorRef.current.innerHTML
    pagesContainerRef.current.innerHTML = ""

    // Create a temporary div to measure content
    const tempDiv = document.createElement("div")
    tempDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      width: 210mm;
      padding: 20mm;
      font-size: 13pt;
      font-family: Times New Roman, serif;
      line-height: 1.5;
    `
    tempDiv.innerHTML = content
    document.body.appendChild(tempDiv)

    // A4 page height minus padding and space for page number
    const pageHeight = 297 - 40 - 10 // mm (297mm - top/bottom padding - page number space)
    const mmToPx = 3.7795275591 // conversion factor
    const maxPageHeight = pageHeight * mmToPx

    let currentPage = 1
    let currentPageDiv = createPage(currentPage)
    let currentHeight = 0

    // Process all children - get direct children only to avoid nested content
    const children = Array.from(tempDiv.children)
    
    children.forEach((child, index) => {
      const childClone = child.cloneNode(true) as HTMLElement
      const childHeight = (child as HTMLElement).offsetHeight

      // Check if adding this child would exceed page height
      if (currentHeight + childHeight > maxPageHeight && currentHeight > 0) {
        // Add current page and create new one
        pagesContainerRef.current!.appendChild(currentPageDiv)
        currentPage++
        currentPageDiv = createPage(currentPage)
        currentHeight = 0
      }

      currentPageDiv.querySelector(".page-content")!.appendChild(childClone)
      currentHeight += childHeight
    })

    // Add the last page
    if (currentPageDiv.querySelector(".page-content")!.children.length > 0) {
      pagesContainerRef.current.appendChild(currentPageDiv)
    }

    document.body.removeChild(tempDiv)
    setPageCount(currentPage)

    // Restore scroll position after repaginating
    if (scrollContainer) {
      setTimeout(() => {
        scrollContainer.scrollTop = savedScrollTop
      }, 0)
    }

    // Restore cursor position after repaginating
    if (savedCursor) {
      setTimeout(() => restoreCursorPosition(savedCursor), 0)
    }
  }

  // Sync content from pages back to editor
  const syncPagesToEditor = () => {
    if (!pagesContainerRef.current || !editorRef.current) return

    const pages = pagesContainerRef.current.querySelectorAll('.a4-page .page-content')
    let combinedContent = ''

    pages.forEach((pageContent) => {
      combinedContent += pageContent.innerHTML
    })

    editorRef.current.innerHTML = combinedContent
    
    // Save to local storage after syncing
    if (clubData) {
      saveReportToSession(combinedContent, clubData.id)
      setLastAutoSave(new Date())
    }
  }

  // Create a single A4 page with page number
  const createPage = (pageNumber: number) => {
    const pageDiv = document.createElement("div")
    pageDiv.className = "a4-page"
    pageDiv.setAttribute("data-page", String(pageNumber - 1)) // 0-indexed for matching loop
    
    // Check if mobile (screen width < 768px)
    const isMobile = window.innerWidth < 768
    
    if (isMobile) {
      // Mobile: Scale down to fit viewport with minimum padding
      const scale = Math.min((window.innerWidth - 32) / 793.7, 1) // 210mm = 793.7px, 32px for margins
      pageDiv.style.cssText = `
        width: 210mm;
        min-height: 297mm;
        padding: 20mm;
        margin: 0 auto 15px auto;
        background: white;
        box-shadow: 0 0 8px rgba(0,0,0,0.1);
        position: relative;
        page-break-after: always;
        transform: scale(${scale});
        transform-origin: top center;
      `
    } else {
      // Desktop: Full size
      pageDiv.style.cssText = `
        width: 210mm;
        min-height: 297mm;
        padding: 20mm;
        margin: 0 auto 20px auto;
        background: white;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        position: relative;
        page-break-after: always;
      `
    }

    const contentDiv = document.createElement("div")
    contentDiv.className = "page-content"
    contentDiv.contentEditable = "true"
    contentDiv.style.cssText = `
      min-height: calc(297mm - 40mm - 15mm);
      font-size: 13pt;
      font-family: Times New Roman, serif;
      line-height: 1.5;
      outline: none;
    `

    // Add input listener to sync changes and re-paginate
    let inputTimeout: NodeJS.Timeout
    contentDiv.addEventListener('input', () => {
      clearTimeout(inputTimeout)
      inputTimeout = setTimeout(() => {
        syncPagesToEditor()
        paginateContent()
        
        // Save to history after user stops typing
        if (editorRef.current) {
          HistoryManager.saveToHistory(editorRef.current.innerHTML)
          console.log('[History] Saved state after user input')
        }
      }, 1500) // Wait 1.5 seconds after user stops typing
    })

    // Handle keyboard shortcuts
    contentDiv.addEventListener('keydown', (e) => {
      // Allow Ctrl+B, Ctrl+I, Ctrl+U for formatting
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b' || e.key === 'i' || e.key === 'u') {
          e.preventDefault()
          const command = e.key === 'b' ? 'bold' : e.key === 'i' ? 'italic' : 'underline'
          document.execCommand(command, false)
        }
      }
    })

    // Add page number if enabled in settings
    if (pageSettings.showPageNumbers) {
      const pageNumberDiv = document.createElement("div")
      pageNumberDiv.className = "page-number"
      pageNumberDiv.contentEditable = "false"
      
      // Position based on settings
      const position = pageSettings.pageNumberPosition === 'top' ? 'top: 10mm;' : 'bottom: 15mm;'
      let alignment = ''
      switch (pageSettings.pageNumberAlignment) {
        case 'left':
          alignment = 'left: 20mm;'
          break
        case 'center':
          alignment = 'left: 50%; transform: translateX(-50%);'
          break
        case 'right':
        default:
          alignment = 'right: 20mm;'
          break
      }
      
      pageNumberDiv.style.cssText = `
        position: absolute;
        ${position}
        ${alignment}
        font-size: 12pt;
        color: #666;
        font-family: Times New Roman, serif;
        user-select: none;
        pointer-events: none;
      `
      pageNumberDiv.textContent = `${pageNumber}`
      
      pageDiv.appendChild(pageNumberDiv)
    }

    pageDiv.appendChild(contentDiv)

    return pageDiv
  }

  // Initialize default template
  const initializeDefaultTemplate = (club: ClubData, forceDefault: boolean = false) => {
    if (editorRef.current) {
      // Check if there's saved content in local storage
      const savedContent = !forceDefault ? loadReportFromSession(club.id) : null
      
      if (savedContent) {
        // Restore saved content
        editorRef.current.innerHTML = savedContent
        
        // Initialize history with restored content
        HistoryManager.initializeHistory(savedContent)
        
        // Show toast notification about restored content
        const lastModified = getReportLastModified(club.id)
        const timeString = lastModified 
          ? lastModified.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : 'recently'
        toast.success(`Report restored from ${timeString}`)
      } else {
        // Load default template
        const currentDate = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })

        editorRef.current.innerHTML = `
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="/application/Logo-uni.png" alt="University Logo" style="width: 150px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;" onerror="this.style.display='none'" />
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #1a1a1a;">CLUB ACTIVITY REPORT</h1>
            <p style="font-size: 14px; color: #666;">${currentDate}</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Club Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; width: 30%;"><strong>Club Name:</strong></td>
                <td style="padding: 8px 0;">${club.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Major:</strong></td>
                <td style="padding: 8px 0;">${club.majorName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Club Leader:</strong></td>
                <td style="padding: 8px 0;">${club.leaderName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Total Members:</strong></td>
                <td style="padding: 8px 0;">${club.memberCount || 0}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Report Content</h2>
            <p style="color: #888; font-style: italic;">Click the buttons on the right to insert Members, Events, or Gifts data...</p>
          </div>
        `
        
        // Initialize history with default template
        HistoryManager.initializeHistory(editorRef.current.innerHTML)
      }
      
      // Trigger pagination after content is set
      setTimeout(() => paginateContent(), 100)
    }
  }

  // Handle page settings change
  const handlePageSettingsChange = (settings: Partial<PageSettings>) => {
    const newSettings = { ...pageSettings, ...settings }
    setPageSettings(newSettings)
    
    // Save to local storage
    if (clubData) {
      savePageSettingsToSession(newSettings, clubData.id)
    }
    
    // Re-paginate when settings change
    setTimeout(() => paginateContent(), 100)
  }

  // Sync handler for toolbar actions
  const handleToolbarSync = () => {
    setTimeout(() => {
      syncPagesToEditor()
      paginateContent()
      
      // Save current state to history after toolbar action
      if (editorRef.current) {
        HistoryManager.saveToHistory(editorRef.current.innerHTML)
        console.log('[History] Saved state after toolbar action')
      }
    }, 100)
  }

  // Helper function to insert HTML content at cursor position and move cursor below
  const insertHtmlAtCursor = (html: string) => {
    if (!editorRef.current) {
      console.error('[Insert] editorRef.current is null')
      return
    }

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      // No selection, append to the end
      console.log('[Insert] No selection, appending to end')
      editorRef.current.innerHTML += html
      // Create a paragraph after and focus it
      const newP = document.createElement('p')
      newP.innerHTML = '<br>'
      editorRef.current.appendChild(newP)
      
      return
    }

    // Get the current cursor position
    const range = selection.getRangeAt(0)
    
    // Find the contentEditable container
    let container: Node | null = range.startContainer
    while (container && container.nodeType !== Node.ELEMENT_NODE) {
      container = container.parentNode
    }
    
    if (!container) {
      // Fallback: append to end
      editorRef.current.innerHTML += html
      return
    }

    const editableElement = (container as Element).closest('[contenteditable="true"]')
    if (!editableElement) {
      // Fallback: append to end
      editorRef.current.innerHTML += html
      return
    }

    // Create a temporary container to parse the HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html

    // Insert the content at cursor position
    range.deleteContents()
    
    // Insert all nodes from the temp div
    const fragment = document.createDocumentFragment()
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    range.insertNode(fragment)

    // Create a new paragraph after the inserted content
    const newP = document.createElement('p')
    newP.innerHTML = '<br>'
    
    // Move range after the inserted content
    range.collapse(false)
    range.insertNode(newP)

    // Move cursor to the new paragraph
    const newRange = document.createRange()
    newRange.setStart(newP, 0)
    newRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(newRange)
  }

  // Insert Members data
  const insertMembersData = async () => {
    try {
      console.log('[Insert] insertMembersData called, clubData:', clubData)
      if (!clubData) {
        toast.error("Club data not loaded yet. Please wait...")
        return
      }
      
      toast.loading("Loading members data...")
      const members = await getMembersByClubId(clubData.id)
      toast.dismiss()
      
      console.log('[Insert] Members fetched:', members.length)
      
      if (members.length === 0) {
        toast.info("No members found for this club")
        return
      }
      
      // Calculate metrics
      const totalMembers = members.length
      const activeMembers = members.filter((m: any) => m.state === 'ACTIVE').length
      const leaderCount = members.filter((m: any) => m.clubRole === 'LEADER' || m.clubRole === 'VICE_LEADER').length
      const staffCount = members.filter((m: any) => m.staff === true).length
      
      let membersHTML = `
        <div style="margin: 20px 0; page-break-inside: avoid;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Club Members</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">No.</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Full Name</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Student Code</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Role</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Status</th>
              </tr>
            </thead>
            <tbody>
      `

      members.forEach((member: any, index: number) => {
        const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
        membersHTML += `
          <tr style="background-color: ${bgColor};">
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${index + 1}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; word-wrap: break-word; max-width: 150px;">${member.fullName}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${member.studentCode}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${member.clubRole}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${member.state}</td>
          </tr>
        `
      })

      membersHTML += `
            </tbody>
          </table>
          <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Membership Metrics</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Total Members:</strong> ${totalMembers}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Active Members:</strong> ${activeMembers}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Leadership Team:</strong> ${leaderCount}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Staff Members:</strong> ${staffCount}</p>
          </div>
        </div>
      `

      // Insert at cursor position
      console.log('[Insert] About to insert HTML, editorRef:', !!editorRef.current)
      
      // If no cursor position, append to the hidden editor
      if (!editorRef.current) {
        console.error('[Insert] editorRef is null!')
        return
      }
      
      // Simply append to the hidden editor with an empty paragraph after
      editorRef.current.innerHTML += membersHTML + '<p><br></p>'
      console.log('[Insert] HTML inserted, content length:', editorRef.current.innerHTML.length)
      
      // Immediately paginate to show the content
      setTimeout(() => {
        console.log('[Insert] Starting pagination')
        paginateContent()
        console.log('[Insert] Pagination complete')
        // Save to history after inserting members
        if (editorRef.current) {
          HistoryManager.saveToHistory(editorRef.current.innerHTML)
          console.log('[History] Saved state after inserting members')
        }
      }, 50)

      toast.success(`${members.length} members inserted`)
    } catch (error) {
      console.error("Error inserting members:", error)
      toast.dismiss()
      toast.error("Failed to insert members data")
    }
  }

  // Insert Events data
  const insertEventsData = async () => {
    try {
      if (!clubData) return
      
      const events = await getEventByClubId(clubData.id)
      
      // Calculate metrics
      const totalEvents = events.length
      const approvedEvents = events.filter((e: any) => e.status === 'APPROVED').length
      const ongoingEvents = events.filter((e: any) => e.status === 'ONGOING').length
      const completedEvents = events.filter((e: any) => e.status === 'COMPLETED').length
      const publicEvents = events.filter((e: any) => e.type === 'PUBLIC').length
      const totalBudget = events.reduce((sum: number, e: any) => sum + (e.budgetPoints || 0), 0)
      
      let eventsHTML = `
        <div style="margin: 20px 0; page-break-inside: avoid;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Club Events</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">No.</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Event Name</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Date</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Type</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Status</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Location</th>
              </tr>
            </thead>
            <tbody>
      `

      events.forEach((event: any, index: number) => {
        const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
        eventsHTML += `
          <tr style="background-color: ${bgColor};">
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${index + 1}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; word-wrap: break-word; max-width: 150px;">${event.name}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${event.date}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${event.type}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${event.status}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; word-wrap: break-word; max-width: 120px;">${event.locationName}</td>
          </tr>
        `
      })

      eventsHTML += `
            </tbody>
          </table>
          <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Event Metrics</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Total Events:</strong> ${totalEvents}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Approved Events:</strong> ${approvedEvents}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Ongoing Events:</strong> ${ongoingEvents}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Completed Events:</strong> ${completedEvents}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Public Events:</strong> ${publicEvents}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Total Budget:</strong> ${totalBudget.toLocaleString()} points</p>
          </div>
        </div>
      `

      // Insert at cursor position
      if (!editorRef.current) {
        console.error('[Insert] editorRef is null!')
        return
      }
      
      editorRef.current.innerHTML += eventsHTML + '<p><br></p>'
      
      setTimeout(() => {
        paginateContent()
        // Save to history after inserting events
        if (editorRef.current) {
          HistoryManager.saveToHistory(editorRef.current.innerHTML)
          console.log('[History] Saved state after inserting events')
        }
      }, 50)

      toast.success(`${events.length} events inserted`)
    } catch (error) {
      console.error("Error inserting events:", error)
      toast.error("Failed to insert events data")
    }
  }

  // Insert Gifts/Products data
  const insertGiftsData = async () => {
    try {
      if (!clubData) return
      
      const products = await getProducts(clubData.id, { includeInactive: true })
      
      // Calculate metrics
      const totalProducts = products.length
      const activeProducts = products.filter(p => p.status === 'ACTIVE').length
      const totalStock = products.reduce((sum, p) => sum + p.stockQuantity, 0)
      const avgPrice = products.length > 0 ? (products.reduce((sum, p) => sum + p.pointCost, 0) / products.length).toFixed(2) : 0
      
      let giftsHTML = `
        <div style="margin: 20px 0; page-break-inside: avoid;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Club Gifts/Products</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">No.</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Product Name</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Type</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Point Cost</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Stock</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Status</th>
              </tr>
            </thead>
            <tbody>
      `

      products.forEach((product, index) => {
        const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
        giftsHTML += `
          <tr style="background-color: ${bgColor};">
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${index + 1}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; word-wrap: break-word; max-width: 150px;">${product.name}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${product.type}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${product.pointCost}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${product.stockQuantity}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; white-space: nowrap;">${product.status}</td>
          </tr>
        `
      })

      giftsHTML += `
            </tbody>
          </table>
          <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Product Metrics</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Total Products:</strong> ${totalProducts}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Active Products:</strong> ${activeProducts}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Total Stock:</strong> ${totalStock} units</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Average Price:</strong> ${avgPrice} points</p>
          </div>
        </div>
      `

      // Insert at cursor position
      if (!editorRef.current) {
        console.error('[Insert] editorRef is null!')
        return
      }
      
      editorRef.current.innerHTML += giftsHTML + '<p><br></p>'
      
      setTimeout(() => {
        paginateContent()
        // Save to history after inserting products
        if (editorRef.current) {
          HistoryManager.saveToHistory(editorRef.current.innerHTML)
          console.log('[History] Saved state after inserting products')
        }
      }, 50)

      toast.success(`${products.length} products inserted`)
    } catch (error) {
      console.error("Error inserting gifts:", error)
      toast.error("Failed to insert gifts data")
    }
  }

  // Insert Applications data
  const insertApplicationsData = async () => {
    try {
      if (!clubData) return
      
      const applications = await getMemberApplyByClubId(clubData.id)
      
      // Calculate metrics
      const totalApplications = applications.length
      const pendingCount = applications.filter((a: any) => a.status === 'PENDING').length
      const approvedCount = applications.filter((a: any) => a.status === 'APPROVED').length
      const rejectedCount = applications.filter((a: any) => a.status === 'REJECTED').length
      const approvalRate = totalApplications > 0 ? ((approvedCount / totalApplications) * 100).toFixed(1) : 0
      
      let applicationsHTML = `
        <div style="margin: 20px 0; page-break-inside: avoid;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Membership Applications</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">No.</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Applicant Name</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Student Code</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Status</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Applied Date</th>
              </tr>
            </thead>
            <tbody>
      `

      applications.forEach((app: any, index: number) => {
        const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
        applicationsHTML += `
          <tr style="background-color: ${bgColor};">
            <td style="border: 1px solid #d1d5db; padding: 8px;">${index + 1}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${app.applicantName}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${app.studentCode || 'N/A'}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${app.status}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${new Date(app.createdAt).toLocaleDateString()}</td>
          </tr>
        `
      })

      applicationsHTML += `
            </tbody>
          </table>
          <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Application Metrics</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Total Applications:</strong> ${totalApplications}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Pending:</strong> ${pendingCount}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Approved:</strong> ${approvedCount}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Rejected:</strong> ${rejectedCount}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Approval Rate:</strong> ${approvalRate}%</p>
          </div>
        </div>
      `

      // Insert at cursor position
      if (!editorRef.current) {
        console.error('[Insert] editorRef is null!')
        return
      }
      
      editorRef.current.innerHTML += applicationsHTML + '<p><br></p>'
      
      setTimeout(() => {
        paginateContent()
        // Save to history after inserting applications
        if (editorRef.current) {
          HistoryManager.saveToHistory(editorRef.current.innerHTML)
          console.log('[History] Saved state after inserting applications')
        }
      }, 50)

      toast.success(`${applications.length} applications inserted`)
    } catch (error) {
      console.error("Error inserting applications:", error)
      toast.error("Failed to insert applications data")
    }
  }

  // Insert Orders data
  const insertOrdersData = async () => {
    try {
      if (!clubData) return
      
      const orders = await getClubRedeemOrders(clubData.id)
      
      // Calculate metrics
      const totalOrders = orders.length
      const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED').length
      const pendingOrders = orders.filter((o: any) => o.status === 'PENDING').length
      const totalPointsRedeemed = orders.reduce((sum: number, o: any) => sum + o.totalPoints, 0)
      const avgOrderValue = totalOrders > 0 ? (totalPointsRedeemed / totalOrders).toFixed(2) : 0
      
      let ordersHTML = `
        <div style="margin: 20px 0; page-break-inside: avoid;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Redeem Orders</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Order Code</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Product</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Member</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Quantity</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Total Points</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Status</th>
              </tr>
            </thead>
            <tbody>
      `

      orders.forEach((order: any, index: number) => {
        const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
        ordersHTML += `
          <tr style="background-color: ${bgColor};">
            <td style="border: 1px solid #d1d5db; padding: 8px;">${order.orderCode}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${order.productName}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${order.memberName}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${order.quantity}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${order.totalPoints}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${order.status}</td>
          </tr>
        `
      })

      ordersHTML += `
            </tbody>
          </table>
          <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Order Metrics</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Total Orders:</strong> ${totalOrders}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Completed:</strong> ${completedOrders}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Pending:</strong> ${pendingOrders}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Total Points Redeemed:</strong> ${totalPointsRedeemed.toLocaleString()}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Average Order Value:</strong> ${avgOrderValue} points</p>
          </div>
        </div>
      `

      // Insert at cursor position
      if (!editorRef.current) {
        console.error('[Insert] editorRef is null!')
        return
      }
      
      editorRef.current.innerHTML += ordersHTML + '<p><br></p>'
      
      setTimeout(() => {
        paginateContent()
        // Save to history after inserting orders
        if (editorRef.current) {
          HistoryManager.saveToHistory(editorRef.current.innerHTML)
          console.log('[History] Saved state after inserting orders')
        }
      }, 50)

      toast.success(`${orders.length} orders inserted`)
    } catch (error) {
      console.error("Error inserting orders:", error)
      toast.error("Failed to insert orders data")
    }
  }

  // Insert Wallet data
  const insertWalletData = async () => {
    try {
      if (!clubData) return
      
      const wallet = await getClubWallet(clubData.id)
      const transactions = await getClubToMemberTransactions()
      
      // Calculate metrics from transactions
      const totalTransactions = transactions.length
      const totalPointsGiven = transactions.reduce((sum: number, t: any) => sum + t.amount, 0)
      const avgTransaction = totalTransactions > 0 ? (totalPointsGiven / totalTransactions).toFixed(2) : 0
      
      let walletHTML = `
        <div style="margin: 20px 0; page-break-inside: avoid;">
          <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #1a1a1a;">Club Wallet & Transactions</h2>
          
          <div style="margin-bottom: 20px; padding-left: 15px; border-left: 3px solid #000000;">
            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #000000;">Wallet Balance</h3>
            <p style="font-size: 32px; font-weight: bold; color: #000000; margin: 10px 0;">${wallet.balancePoints.toLocaleString()} points</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Wallet ID:</strong> ${wallet.walletId}</p>
          </div>

          <h3 style="font-size: 18px; font-weight: 600; margin: 20px 0 10px 0;">Recent Transactions</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Transaction ID</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Type</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Amount</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Receiver</th>
                <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">Date</th>
              </tr>
            </thead>
            <tbody>
      `

      transactions.slice(0, 10).forEach((txn: any, index: number) => {
        const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
        walletHTML += `
          <tr style="background-color: ${bgColor};">
            <td style="border: 1px solid #d1d5db; padding: 8px;">#${txn.id}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${txn.type}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">+${txn.amount}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${txn.receiverName}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${new Date(txn.createdAt).toLocaleDateString()}</td>
          </tr>
        `
      })

      walletHTML += `
            </tbody>
          </table>
          <div style="margin-top: 20px; padding-left: 15px; border-left: 3px solid #000000;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #000000;">Transaction Metrics</h3>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Total Transactions:</strong> ${totalTransactions}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Total Points Distributed:</strong> ${totalPointsGiven.toLocaleString()}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Average Transaction:</strong> ${avgTransaction} points</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Current Balance:</strong> ${wallet.balancePoints.toLocaleString()} points</p>
          </div>
        </div>
      `

      // Insert at cursor position
      if (!editorRef.current) {
        console.error('[Insert] editorRef is null!')
        return
      }
      
      editorRef.current.innerHTML += walletHTML + '<p><br></p>'
      
      setTimeout(() => {
        paginateContent()
        // Save to history after inserting wallet data
        if (editorRef.current) {
          HistoryManager.saveToHistory(editorRef.current.innerHTML)
          console.log('[History] Saved state after inserting wallet data')
        }
      }, 50)

      toast.success("Wallet data inserted")
    } catch (error) {
      console.error("Error inserting wallet data:", error)
      toast.error("Failed to insert wallet data")
    }
  }

  // ========== CHART INSERTION FUNCTIONS ==========
  
  // Helper function to generate SVG pie chart
  const generatePieChartSVG = (data: Array<{name: string, value: number, color: string}>, title: string) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    if (total === 0) return `<p style="text-align: center; color: #888;">No data available</p>`
    
    const cx = 120
    const cy = 120
    const radius = 90
    let currentAngle = -90 // Start from top
    
    const slices = data.map(item => {
      const percentage = item.value / total
      const angle = percentage * 360
      const startAngle = currentAngle * (Math.PI / 180)
      const endAngle = (currentAngle + angle) * (Math.PI / 180)
      
      const x1 = cx + radius * Math.cos(startAngle)
      const y1 = cy + radius * Math.sin(startAngle)
      const x2 = cx + radius * Math.cos(endAngle)
      const y2 = cy + radius * Math.sin(endAngle)
      
      const largeArcFlag = angle > 180 ? 1 : 0
      
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
      
      currentAngle += angle
      
      return { path, color: item.color, name: item.name, value: item.value, percentage: (percentage * 100).toFixed(1) }
    })
    
    const legend = data.map(item => 
      `<div style="display: flex; align-items: center; margin: 4px 0;">
        <div style="width: 14px; height: 14px; background: ${item.color}; margin-right: 8px; border-radius: 2px;"></div>
        <span style="font-size: 13px; color: #374151;">${item.name}: <strong>${item.value}</strong> (${((item.value/total)*100).toFixed(1)}%)</span>
      </div>`
    ).join('')
    
    return `
      <div style="display: flex; align-items: center; gap: 25px; margin: 12px 0;">
        <svg width="240" height="240" viewBox="0 0 240 240" style="flex-shrink: 0;">
          ${slices.map(slice => `<path d="${slice.path}" fill="${slice.color}" stroke="white" stroke-width="2"/>`).join('')}
        </svg>
        <div style="flex: 1;">
          ${legend}
        </div>
      </div>
    `
  }
  
  // Helper function to generate SVG bar chart
  const generateBarChartSVG = (data: Array<{name: string, value: number, color: string}>, title: string) => {
    if (data.length === 0) return `<p style="text-align: center; color: #888;">No data available</p>`
    
    const maxValue = Math.max(...data.map(d => d.value))
    const barWidth = 70
    const barSpacing = 100
    const chartHeight = 200
    const chartWidth = Math.max(data.length * barSpacing + 60, 300)
    
    const bars = data.map((item, index) => {
      const barHeight = maxValue > 0 ? (item.value / maxValue) * (chartHeight - 70) : 0
      const x = 40 + index * barSpacing
      const y = chartHeight - barHeight - 35
      
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${item.color}" rx="4"/>
        <text x="${x + barWidth/2}" y="${chartHeight - 15}" text-anchor="middle" font-size="11" fill="#6b7280" transform="rotate(-30 ${x + barWidth/2} ${chartHeight - 15})">${item.name}</text>
        <text x="${x + barWidth/2}" y="${y - 8}" text-anchor="middle" font-size="15" font-weight="bold" fill="#1f2937">${item.value.toLocaleString()}</text>
      `
    })
    
    return `
      <div style="margin: 10px 0;">
        <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}" style="display: block; max-width: 100%;">
          <line x1="30" y1="${chartHeight - 35}" x2="${chartWidth - 20}" y2="${chartHeight - 35}" stroke="#d1d5db" stroke-width="1.5"/>
          ${bars.join('')}
        </svg>
      </div>
    `
  }

  // Insert Members Chart
  const insertMembersChart = async () => {
    try {
      if (!clubData) return
      
      const members = await getMembersByClubId(clubData.id)
      
      // Count by role
      const leaderCount = members.filter((m: any) => m.clubRole === 'LEADER').length
      const viceLeaderCount = members.filter((m: any) => m.clubRole === 'VICE_LEADER').length
      const regularMembers = members.filter((m: any) => m.clubRole === 'MEMBER').length
      const staffMembers = members.filter((m: any) => m.staff === true).length
      
      const chartData = [
        { name: "Leaders", value: leaderCount + viceLeaderCount, color: "#8b5cf6" },
        { name: "Members", value: regularMembers, color: "#22c55e" },
        { name: "Staff", value: staffMembers, color: "#3b82f6" },
      ].filter(item => item.value > 0)
      
      const chartHTML = `
        <div style="margin: 25px 0; page-break-inside: avoid;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #111827;">Member Distribution by Role</h2>
          ${generatePieChartSVG(chartData, "Member Distribution")}
          <div style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 6px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Total Members:</strong> ${members.length}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Leadership:</strong> ${leaderCount + viceLeaderCount}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Regular:</strong> ${regularMembers}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Staff:</strong> ${staffMembers}</p>
            </div>
          </div>
        </div>
      `
      
      // Insert at cursor position
      if (!editorRef.current) {
        console.error('[Insert] editorRef is null!')
        return
      }
      
      editorRef.current.innerHTML += chartHTML + '<p><br></p>'
      
      setTimeout(() => {
        paginateContent()
        // Save to history after inserting members chart
        if (editorRef.current) {
          HistoryManager.saveToHistory(editorRef.current.innerHTML)
          console.log('[History] Saved state after inserting members chart')
        }
      }, 50)
      
      toast.success("Members chart inserted")
    } catch (error) {
      console.error("Error inserting members chart:", error)
      toast.error("Failed to insert members chart")
    }
  }

  // Insert Events Chart
  const insertEventsChart = async () => {
    try {
      if (!clubData) return
      
      const events = await getEventByClubId(clubData.id)
      
      const approvedCount = events.filter((e: any) => e.status === 'APPROVED').length
      const pendingCount = events.filter((e: any) => e.status === 'PENDING_UNISTAFF' || e.status === 'PENDING_COCLUB').length
      const rejectedCount = events.filter((e: any) => e.status === 'REJECTED').length
      
      const chartData = [
        { name: "Approved", value: approvedCount, color: "#22c55e" },
        { name: "Pending", value: pendingCount, color: "#eab308" },
        { name: "Rejected", value: rejectedCount, color: "#ef4444" },
      ].filter(item => item.value > 0)
      
      const chartHTML = `
        <div style="margin: 25px 0; page-break-inside: avoid;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #111827;">Events Overview</h2>
          ${generateBarChartSVG(chartData, "Events Status")}
          <div style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 6px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Total Events:</strong> ${events.length}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Approved:</strong> ${approvedCount}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Pending:</strong> ${pendingCount}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Rejected:</strong> ${rejectedCount}</p>
            </div>
          </div>
        </div>
      `
      
      // Insert at cursor position
      if (!editorRef.current) {
        console.error('[Insert] editorRef is null!')
        return
      }
      
      editorRef.current.innerHTML += chartHTML + '<p><br></p>'
      
      setTimeout(() => {
        paginateContent()
        // Save to history after inserting events chart
        if (editorRef.current) {
          HistoryManager.saveToHistory(editorRef.current.innerHTML)
          console.log('[History] Saved state after inserting events chart')
        }
      }, 50)
      
      toast.success("Events chart inserted")
    } catch (error) {
      console.error("Error inserting events chart:", error)
      toast.error("Failed to insert events chart")
    }
  }

  // Insert Applications Chart
  const insertApplicationsChart = async () => {
    try {
      if (!clubData) return
      
      const applications = await getMemberApplyByClubId(clubData.id)
      
      const approvedCount = applications.filter((a: any) => a.status === 'APPROVED').length
      const pendingCount = applications.filter((a: any) => a.status === 'PENDING').length
      const rejectedCount = applications.filter((a: any) => a.status === 'REJECTED').length
      
      const chartData = [
        { name: "Approved", value: approvedCount, color: "#22c55e" },
        { name: "Pending", value: pendingCount, color: "#eab308" },
        { name: "Rejected", value: rejectedCount, color: "#ef4444" },
      ].filter(item => item.value > 0)
      
      const approvalRate = applications.length > 0 ? ((approvedCount / applications.length) * 100).toFixed(1) : 0
      
      const chartHTML = `
        <div style="margin: 25px 0; page-break-inside: avoid;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #111827;">Application Status Distribution</h2>
          ${generatePieChartSVG(chartData, "Applications")}
          <div style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 6px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Total:</strong> ${applications.length}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Approved:</strong> ${approvedCount}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Pending:</strong> ${pendingCount}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Rejected:</strong> ${rejectedCount}</p>
              <p style="margin: 0; font-size: 13px; color: #374151; grid-column: 1 / -1;"><strong>Approval Rate:</strong> ${approvalRate}%</p>
            </div>
          </div>
        </div>
      `
      
      // Insert at cursor position
      if (!editorRef.current) {
        console.error('[Insert] editorRef is null!')
        return
      }
      
      editorRef.current.innerHTML += chartHTML + '<p><br></p>'
      
      setTimeout(() => {
        paginateContent()
        // Save to history after inserting applications chart
        if (editorRef.current) {
          HistoryManager.saveToHistory(editorRef.current.innerHTML)
          console.log('[History] Saved state after inserting applications chart')
        }
      }, 50)
      
      toast.success("Applications chart inserted")
    } catch (error) {
      console.error("Error inserting applications chart:", error)
      toast.error("Failed to insert applications chart")
    }
  }

  // Insert Gifts/Products Chart
  const insertGiftsChart = async () => {
    try {
      if (!clubData) return
      
      const products = await getProducts(clubData.id, { includeInactive: true })
      
      const activeCount = products.filter((p: any) => p.status === 'ACTIVE').length
      const inactiveCount = products.filter((p: any) => p.status === 'INACTIVE').length
      
      const chartData = [
        { name: "Active", value: activeCount, color: "#22c55e" },
        { name: "Inactive", value: inactiveCount, color: "#94a3b8" },
      ].filter(item => item.value > 0)
      
      const totalStock = products.reduce((sum: number, p: any) => sum + p.stockQuantity, 0)
      const avgPrice = products.length > 0 ? (products.reduce((sum: number, p: any) => sum + p.pointCost, 0) / products.length).toFixed(2) : 0
      
      const chartHTML = `
        <div style="margin: 25px 0; page-break-inside: avoid;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #111827;">Products Status Overview</h2>
          ${generatePieChartSVG(chartData, "Products")}
          <div style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 6px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Total Products:</strong> ${products.length}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Active:</strong> ${activeCount}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Inactive:</strong> ${inactiveCount}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Total Stock:</strong> ${totalStock}</p>
              <p style="margin: 0; font-size: 13px; color: #374151; grid-column: 1 / -1;"><strong>Avg Price:</strong> ${avgPrice} points</p>
            </div>
          </div>
        </div>
      `
      
      // Insert at cursor position
      if (!editorRef.current) {
        console.error('[Insert] editorRef is null!')
        return
      }
      
      editorRef.current.innerHTML += chartHTML + '<p><br></p>'
      
      setTimeout(() => {
        paginateContent()
        // Save to history after inserting products chart
        if (editorRef.current) {
          HistoryManager.saveToHistory(editorRef.current.innerHTML)
          console.log('[History] Saved state after inserting products chart')
        }
      }, 50)
      
      toast.success("Products chart inserted")
    } catch (error) {
      console.error("Error inserting products chart:", error)
      toast.error("Failed to insert products chart")
    }
  }

  // Insert Orders Chart
  const insertOrdersChart = async () => {
    try {
      if (!clubData) return
      
      const orders = await getClubRedeemOrders(clubData.id)
      
      const completedCount = orders.filter((o: any) => o.status === 'COMPLETED').length
      const pendingCount = orders.filter((o: any) => o.status === 'PENDING').length
      const cancelledCount = orders.filter((o: any) => o.status === 'CANCELLED').length
      
      const chartData = [
        { name: "Completed", value: completedCount, color: "#22c55e" },
        { name: "Pending", value: pendingCount, color: "#eab308" },
        { name: "Cancelled", value: cancelledCount, color: "#ef4444" },
      ].filter(item => item.value > 0)
      
      const totalPointsRedeemed = orders.reduce((sum: number, o: any) => sum + o.totalPoints, 0)
      const avgOrderValue = orders.length > 0 ? (totalPointsRedeemed / orders.length).toFixed(2) : 0
      
      const chartHTML = `
        <div style="margin: 25px 0; page-break-inside: avoid;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #111827;">Redeem Orders Status</h2>
          ${generatePieChartSVG(chartData, "Orders")}
          <div style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 6px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Total Orders:</strong> ${orders.length}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Completed:</strong> ${completedCount}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Pending:</strong> ${pendingCount}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Cancelled:</strong> ${cancelledCount}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Points Redeemed:</strong> ${totalPointsRedeemed.toLocaleString()}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Avg Value:</strong> ${avgOrderValue} pts</p>
            </div>
          </div>
        </div>
      `
      
      // Insert at cursor position
      if (!editorRef.current) {
        console.error('[Insert] editorRef is null!')
        return
      }
      
      editorRef.current.innerHTML += chartHTML + '<p><br></p>'
      
      setTimeout(() => {
        paginateContent()
        // Save to history after inserting orders chart
        if (editorRef.current) {
          HistoryManager.saveToHistory(editorRef.current.innerHTML)
          console.log('[History] Saved state after inserting orders chart')
        }
      }, 50)
      
      toast.success("Orders chart inserted")
    } catch (error) {
      console.error("Error inserting orders chart:", error)
      toast.error("Failed to insert orders chart")
    }
  }

  // Insert Wallet Chart
  const insertWalletChart = async () => {
    try {
      if (!clubData) return
      
      const wallet = await getClubWallet(clubData.id)
      const transactions = await getClubToMemberTransactions()
      
      const totalTransactions = transactions.length
      const totalPointsGiven = transactions.reduce((sum: number, t: any) => sum + t.amount, 0)
      const avgTransaction = totalTransactions > 0 ? (totalPointsGiven / totalTransactions).toFixed(2) : 0
      
      // Create a visual representation of wallet balance vs points given
      const chartData = [
        { name: "Current Balance", value: wallet.balancePoints, color: "#3b82f6" },
        { name: "Points Distributed", value: totalPointsGiven, color: "#8b5cf6" },
      ]
      
      const chartHTML = `
        <div style="margin: 25px 0; page-break-inside: avoid;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #111827;">Wallet & Points Overview</h2>
          ${generateBarChartSVG(chartData, "Wallet")}
          <div style="margin-top: 12px; padding: 12px; background: #f9fafb; border-radius: 6px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Current Balance:</strong> ${wallet.balancePoints.toLocaleString()}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Transactions:</strong> ${totalTransactions}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Distributed:</strong> ${totalPointsGiven.toLocaleString()}</p>
              <p style="margin: 0; font-size: 13px; color: #374151;"><strong>Avg Transaction:</strong> ${avgTransaction}</p>
              <p style="margin: 0; font-size: 13px; color: #374151; grid-column: 1 / -1;"><strong>Wallet ID:</strong> ${wallet.walletId}</p>
            </div>
          </div>
        </div>
      `
      
      // Insert at cursor position
      if (!editorRef.current) {
        console.error('[Insert] editorRef is null!')
        return
      }
      
      editorRef.current.innerHTML += chartHTML + '<p><br></p>'
      
      setTimeout(() => {
        paginateContent()
        // Save to history after inserting wallet chart
        if (editorRef.current) {
          HistoryManager.saveToHistory(editorRef.current.innerHTML)
          console.log('[History] Saved state after inserting wallet chart')
        }
      }, 50)
      
      toast.success("Wallet chart inserted")
    } catch (error) {
      console.error("Error inserting wallet chart:", error)
      toast.error("Failed to insert wallet chart")
    }
  }

  // Manual save
  const handleManualSave = () => {
    if (clubData && editorRef.current) {
      const currentContent = editorRef.current.innerHTML
      saveReportToSession(currentContent, clubData.id)
      savePageSettingsToSession(pageSettings, clubData.id)
      const saveTime = new Date()
      setLastAutoSave(saveTime)
      toast.success("Report saved successfully")
      console.log(`[Manual save] Report saved at ${saveTime.toLocaleTimeString()}`)
    }
  }

  // Clear and reset to default template
  const handleClear = () => {
    if (clubData) {
      // Clear local storage
      clearReportFromSession()
      
      // Reset to default template (force default, don't restore from local storage)
      initializeDefaultTemplate(clubData, true)
      
      // Reset last save indicator
      setLastAutoSave(null)
      
      toast.success("Report reset to default template")
    }
  }

  // Helper: Fix oklch colors by replacing problematic stylesheets
  const fixOklchColors = (clonedDoc: Document) => {
    try {
      // Remove only external stylesheets that might have oklch
      const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]')
      links.forEach(link => link.remove())
      
      // Remove style tags that contain oklch
      const styles = clonedDoc.querySelectorAll('style')
      styles.forEach(style => {
        if (style.textContent?.includes('oklch')) {
          style.remove()
        }
      })
      
      // Add minimal safe CSS to ensure basic styling works
      const styleEl = clonedDoc.createElement('style')
      styleEl.id = 'html2canvas-safe-colors'
      
      const safeCSS = `
        /* Ensure html2canvas can parse all colors */
        :root, html, body {
          --background: 255 255 255;
          --foreground: 0 0 0;
          color: #000000;
          background: #ffffff;
        }
        
        /* Minimal page structure */
        .a4-page {
          background: white;
          color: #000000;
        }
        
        .page-content {
          color: #000000;
        }
        
        /* Ensure all text is visible */
        * {
          color: inherit;
        }
        
        /* Make sure table borders are always visible */
        table {
          border-collapse: collapse;
        }
        
        table, th, td {
          border-color: #d1d5db;
        }
      `
      
      styleEl.textContent = safeCSS
      
      // Insert the style element
      if (!clonedDoc.head) {
        const head = clonedDoc.createElement('head')
        clonedDoc.documentElement.insertBefore(head, clonedDoc.body)
      }
      clonedDoc.head.appendChild(styleEl)
      
      console.log('oklch colors fixed successfully')
    } catch (err) {
      console.error('Error fixing oklch colors:', err)
    }
  }

  // Download as PDF
  const handleDownloadPDF = async () => {
    if (!pagesContainerRef.current) return

    try {
      setIsDownloading(true)
      toast.loading("Generating PDF...")
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pages = pagesContainerRef.current.querySelectorAll(".a4-page")
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          pdf.addPage()
        }

        const page = pages[i] as HTMLElement
        
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            // Fix oklch colors before rendering
            try {
              fixOklchColors(clonedDoc)
            } catch (err) {
              console.warn('Failed to fix oklch colors:', err)
            }
          }
        })

        const imgData = canvas.toDataURL("image/png")
        const imgWidth = 210 // A4 width in mm
        const imgHeight = 297 // A4 height in mm
        
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      }

      const fileName = `${clubData?.name || "Club"}_Report_${new Date().toISOString().split("T")[0]}.pdf`
      pdf.save(fileName)
      
      toast.dismiss()
      toast.success("PDF downloaded successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.dismiss()
      toast.error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDownloading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["club_leader"]}>
        <AppShell>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading report...</p>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["club_leader"]}>
      <AppShell>
        {/* Context Menu - attached to pages container */}
        <ContextMenu editorRef={pagesContainerRef} />
        
        {/* Image Resizer - for interactive image resizing */}
        <ImageResizer editorRef={pagesContainerRef} />
        
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Sticky Top Bar - Only visible when collapsed */}
        {isHeaderCollapsed && (
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b mb-3">
            <div className="flex items-start gap-2 py-2 px-2">
              {/* Scrollable Toolbar Section */}
              <div className="overflow-x-auto overflow-y-hidden flex-1 min-w-0" style={{ scrollbarWidth: 'thin' }}>
                <div className="shrink-0">
                  <RichTextEditorToolbar
                    pageSettings={pageSettings}
                    onPageSettingsChange={handlePageSettingsChange}
                    onSync={handleToolbarSync}
                    compact={true}
                    editorRef={editorRef}
                  />
                </div>
              </div>
              
              {/* Right Side: Action Buttons + Status */}
              <div className="flex flex-col gap-1.5 shrink-0 pl-2 border-l">
                {/* Action Buttons Row */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button type="button" onClick={handleManualSave} variant="default" size="sm">
                    <Save className="h-3.5 w-3.5 sm:mr-2" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                  <Button type="button" onClick={handleClear} variant="outline" size="sm">
                    <Trash2 className="h-3.5 w-3.5 sm:mr-2" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleDownloadPDF} 
                    size="sm"
                    disabled={isDownloading}
                  >
                    <Download className="h-3.5 w-3.5 sm:mr-2" />
                    <span className="hidden sm:inline">
                      {isDownloading ? "Downloading..." : "PDF"}
                    </span>
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                    variant="ghost" 
                    size="sm"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status Indicators Row */}
                <div className="flex justify-end gap-2">
                  {lastAutoSave && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-green-50 dark:bg-green-950 px-2 py-1 rounded border border-green-200 dark:border-green-800">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                      <span className="text-green-700 dark:text-green-300 whitespace-nowrap">
                        Saved {getTimeSinceLastSave()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded border">
                    {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Header - Only visible when expanded */}
        {!isHeaderCollapsed && (
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Club Report</h1>
                  {lastAutoSave && (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground bg-green-50 dark:bg-green-950 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-green-200 dark:border-green-800 w-fit">
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                      <span className="text-green-700 dark:text-green-300 whitespace-nowrap">
                        Saved {getTimeSinceLastSave()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                <Button type="button" onClick={handleManualSave} variant="default" size="sm" className="flex-1 sm:flex-none">
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
                <Button type="button" onClick={handleClear} variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
                <Button 
                  type="button"
                  onClick={handleDownloadPDF} 
                  size="sm" 
                  className="flex-1 sm:flex-none"
                  disabled={isDownloading}
                >
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden md:inline">
                    {isDownloading ? "Downloading..." : "PDF"}
                  </span>
                  <span className="md:hidden">
                    {isDownloading ? "..." : "PDF"}
                  </span>
                </Button>
                <Button 
                  type="button"
                  onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                  variant="ghost" 
                  size="sm"
                  className="shrink-0"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Create and customize your club activity report
            </p>
          </div>
        )}

        {/* Mobile Data Insertion Buttons - Show at top on mobile */}
        <div className="lg:hidden mb-3">
          <Card className="p-3 shadow-sm">
            <h3 className="font-semibold mb-2 text-sm">Quick Insert</h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  insertMembersData()
                }}
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Members
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  insertEventsData()
                }}
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Events
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  insertGiftsData()
                }}
              >
                <Gift className="h-3.5 w-3.5 mr-1.5" />
                Products
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  insertOrdersData()
                }}
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                Orders
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  insertApplicationsData()
                }}
              >
                <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                Applications
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  insertWalletData()
                }}
              >
                <Wallet className="h-3.5 w-3.5 mr-1.5" />
                Wallet
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Main Editor Area */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            {/* Rich Text Editor Toolbar - Only show when expanded */}
            {!isHeaderCollapsed && (
              <RichTextEditorToolbar
                pageSettings={pageSettings}
                onPageSettingsChange={handlePageSettingsChange}
                onSync={handleToolbarSync}
                editorRef={editorRef}
              />
            )}


            {/* Hidden Editor for Content Editing */}
            <div style={{ display: 'none' }}>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
              />
            </div>

            {/* Paginated Pages Container */}
            <div className="bg-gray-100 dark:bg-gray-800/50 p-2 sm:p-4 rounded-lg max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-auto">
              <div ref={pagesContainerRef} className="space-y-3 sm:space-y-4 min-w-fit sm:min-w-0">
                {/* Pages will be dynamically inserted here */}
              </div>
            </div>
          </div>

          {/* Sticky Sidebar with Data Insertion Buttons - Desktop only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 z-10">
              <Card className="p-4 shadow-lg max-h-[calc(100vh-100px)] overflow-y-auto">
                <h3 className="font-semibold mb-3 text-sm">Insert Data</h3>
                
                <Tabs defaultValue="tables" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-3">
                    <TabsTrigger value="tables" className="text-xs">
                      <ClipboardList className="h-3 w-3 mr-1" />
                      Tables
                    </TabsTrigger>
                    <TabsTrigger value="charts" className="text-xs">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Charts
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Tables Tab */}
                  <TabsContent value="tables" className="mt-0">
                    {/* Core Data Section */}
                    <div className="space-y-2 mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Core</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-sm"
                        disabled={!clubData || loading}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          insertMembersData()
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Members
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-sm"
                        disabled={!clubData || loading}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          insertEventsData()
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Events
                      </Button>
                    </div>

                    <Separator className="my-2" />

                    {/* Products & Orders Section */}
                    <div className="space-y-2 mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Products & Orders</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-sm"
                        disabled={!clubData || loading}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          insertGiftsData()
                        }}
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Gifts/Products
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-sm"
                        disabled={!clubData || loading}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          insertOrdersData()
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Redeem Orders
                      </Button>
                    </div>

                    <Separator className="my-2" />

                    {/* Applications & Recruitment Section */}
                    <div className="space-y-2 mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Recruitment</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-sm"
                        disabled={!clubData || loading}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          insertApplicationsData()
                        }}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Applications
                      </Button>
                    </div>

                    <Separator className="my-2" />

                    {/* Financial Section */}
                    <div className="space-y-2 mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Financial</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-sm"
                        disabled={!clubData || loading}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          insertWalletData()
                        }}
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Wallet & Points
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Charts Tab */}
                  <TabsContent value="charts" className="mt-0">
                    {/* Core Data Section */}
                    <div className="space-y-2 mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Core</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-sm"
                        disabled={!clubData || loading}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          insertMembersChart()
                        }}
                      >
                        <PieChartIcon className="h-4 w-4 mr-2" />
                        Members Chart
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-sm"
                        disabled={!clubData || loading}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          insertEventsChart()
                        }}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Events Chart
                      </Button>
                    </div>

                    <Separator className="my-2" />

                    {/* Products & Orders Section */}
                    <div className="space-y-2 mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Products & Orders</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-sm"
                        disabled={!clubData || loading}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          insertGiftsChart()
                        }}
                      >
                        <PieChartIcon className="h-4 w-4 mr-2" />
                        Products Chart
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-sm"
                        disabled={!clubData || loading}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          insertOrdersChart()
                        }}
                      >
                        <PieChartIcon className="h-4 w-4 mr-2" />
                        Orders Chart
                      </Button>
                    </div>

                    <Separator className="my-2" />

                    {/* Applications & Recruitment Section */}
                    <div className="space-y-2 mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Recruitment</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-sm"
                        disabled={!clubData || loading}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          insertApplicationsChart()
                        }}
                      >
                        <PieChartIcon className="h-4 w-4 mr-2" />
                        Applications Chart
                      </Button>
                    </div>

                    <Separator className="my-2" />

                    {/* Financial Section */}
                    <div className="space-y-2 mb-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Financial</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-sm"
                        disabled={!clubData || loading}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          insertWalletChart()
                        }}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Wallet Chart
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator className="my-2" />

                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Tips:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Click on pages to edit text directly</li>
                    <li>Select text & use toolbar to format</li>
                    <li>Use Ctrl+B/I/U for formatting</li>
                    <li>Auto-repaginates after editing</li>
                    <li>Download as PDF when ready</li>
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Download overlay */}
      {isDownloading && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-lg font-semibold text-foreground">Downloading PDF...</p>
            <p className="text-sm text-muted-foreground">Please wait while we generate your report</p>
          </div>
        </div>
      )}
      </AppShell>
    </ProtectedRoute>
  )
}

