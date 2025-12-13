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
  Wallet,
  ShoppingCart,
  UserCheck,
  ChevronUp,
  ChevronDown,
  BarChart3,
  PieChart as PieChartIcon,
  Building,
  MapPin,
  BookOpen,
  Shield,
  Trophy,
  Activity,
} from "lucide-react"
import { getClubIdFromToken, getClubById } from "@/service/clubApi"
import { toast } from "sonner"
import { RichTextEditorToolbar } from "@/components/report/RichTextEditorToolbar"
import { ContextMenu } from "@/components/report/ContextMenu"
import { ImageResizer } from "@/components/report/ImageResizer"
import { PageSettings } from "@/components/report/types"
import { QuickInsert } from "@/components/reportComponent/ui/QuickInsert"
import { InsertSidebar } from "@/components/reportComponent/ui/InsertSidebar"
import { downloadPagesAsPdf } from "@/components/reportComponent/utils/pdf"
import {
  insertMembersData as insertMembersTable,
  insertEventsData as insertEventsTable,
  insertGiftsData as insertGiftsTable,
  insertApplicationsData as insertApplicationsTable,
  insertOrdersData as insertOrdersTable,
  insertWalletData as insertWalletTable,
  insertFeedbackData as insertFeedbackTable,
  insertLeaveRequestsData as insertLeaveRequestsTable,
  insertActivityScoresData as insertActivityScoresTable,
  insertCoHostEventsData as insertCoHostEventsTable,
  insertAttendanceData as insertAttendanceTable,
  insertEventStaffData as insertEventStaffTable,
} from "@/components/reportComponent/services/insertTables"
import {
  insertMembersChart as insertMembersChartService,
  insertEventsChart as insertEventsChartService,
  insertGiftsChart as insertGiftsChartService,
  insertApplicationsChart as insertApplicationsChartService,
} from "@/components/reportComponent/services/insertCharts"
import {
  insertStaffClubsTable,
  insertStaffEventsTable,
  insertStaffSettledEventsTable,
  insertStaffLocationsTable,
  insertStaffClubApplicationsTable,
  insertStaffPointRequestsTable,
  insertStaffUniversityPointsSummary,
  insertStaffAttendanceSummary,
  insertStaffAttendanceRankingTable,
  insertStaffMajorsTable,
  insertStaffPoliciesTable,
  insertStaffUniToClubTransactionsTable,
  insertStaffUniToEventTransactionsTable,
  insertStaffClubsByMajorChart,
  insertStaffEventStatusChart,
  insertStaffClubApplicationChart,
  insertStaffPointRequestChart,
  insertStaffUniversityPointsChart,
  insertStaffAttendanceSummaryChart,
  insertStaffAttendanceRankingChart,
  insertStaffUniToEventTransactionsChart,
  insertStaffTagsTable,
  insertStaffMultiplierPoliciesTable,
  insertStaffPenaltyRulesTable,
  insertStaffStudentRegistryTable,
  insertStaffProductsTable,
  insertStaffFeedbacksTable,
  insertStaffClubOverviewTable,
  insertStaffClubOverviewByMonthTable,
  insertStaffClubOverviewChart,
  insertStaffClubOverviewByMonthChart,
} from "@/components/reportComponent/services/insertStaffData"
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

interface ReportPageProps {
  allowedRoles: string[]
}

export function ReportPage({ allowedRoles }: ReportPageProps) {
  const [clubData, setClubData] = useState<ClubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const pagesContainerRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState(1)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  const [, setTick] = useState(0)
  const hasInitializedRef = useRef(false)
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
  const isUniStaff = allowedRoles.includes("uni_staff")

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

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1)
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        const clubId = getClubIdFromToken()
        if (!clubId) {
          if (isUniStaff) {
            setupStaffFallback()
          } else {
            toast.error("Unable to identify club")
          }
          setLoading(false)
          return
        }
        const response = await getClubById(clubId)
        if (response.success && response.data) {
          setClubData(response.data)
          const savedSettings = loadPageSettingsFromSession(clubId)
          if (savedSettings) {
            setPageSettings(savedSettings)
          }
          initializeDefaultTemplate(response.data)
        } else if (isUniStaff) {
          setupStaffFallback()
        }
      } catch (error) {
        console.error("Error fetching club data:", error)
        if (isUniStaff) {
          setupStaffFallback()
        } else {
          toast.error("Failed to load club data")
        }
      } finally {
        setLoading(false)
      }
    }
    fetchClubData()
  }, [])

  useEffect(() => {
    hasInitializedRef.current = false
  }, [clubData?.id])

  useEffect(() => {
    if (loading) return
    if (!clubData) return
    if (!editorRef.current || !pagesContainerRef.current) return
    if (hasInitializedRef.current) {
      paginateContent()
      return
    }

    if (clubData.id <= 0 && isUniStaff) {
      const savedContent = loadReportFromSession(clubData.id)
      if (savedContent) {
        // Update old title if it exists in saved content
        let updatedContent = savedContent
        if (savedContent.includes("CLUB ACTIVITY REPORT")) {
          updatedContent = savedContent.replace(/CLUB ACTIVITY REPORT/g, "UNIVERSITY CLUB AFFAIRS REPORT")
          // Save the updated content back to session
          saveReportToSession(updatedContent, clubData.id)
        }
        editorRef.current.innerHTML = updatedContent
        HistoryManager.initializeHistory(updatedContent)
        setTimeout(() => paginateContent(), 100)
      } else {
        initializeStaffTemplate()
      }
      hasInitializedRef.current = true
      return
    }

    initializeDefaultTemplate(clubData)
    hasInitializedRef.current = true
  }, [loading, clubData, isUniStaff])

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
    }, 60000)
    return () => {
      clearInterval(autoSaveInterval)
    }
  }, [clubData, pageSettings])

  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      
      // Undo (Ctrl+Z)
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault()
        e.stopPropagation()
        if (!editorRef.current) return
        const result = HistoryManager.undo()
        if (result.content) {
          editorRef.current.innerHTML = result.content
          setTimeout(() => paginateContent(), 100)
        }
        if (result.message) {
          toast.info(result.message)
        }
        window.dispatchEvent(new CustomEvent('history-change'))
      }
      
      // Redo (Ctrl+Y)
      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault()
        e.stopPropagation()
        if (!editorRef.current) return
        const result = HistoryManager.redo()
        if (result.content) {
          editorRef.current.innerHTML = result.content
          setTimeout(() => paginateContent(), 100)
        }
        if (result.message) {
          toast.info(result.message)
        }
        window.dispatchEvent(new CustomEvent('history-change'))
      }
      
      // Copy (Ctrl+C) - handled by browser, but we'll track it
      if (e.key === 'c' || e.key === 'C') {
        // Let browser handle, our copy function will be called
        setTimeout(() => {
          const selection = window.getSelection()
          if (selection && !selection.isCollapsed) {
            const { copy } = require('@/components/report/utils/editorUtils')
            copy()
          }
        }, 10)
      }
      
      // Cut (Ctrl+X)
      if (e.key === 'x' || e.key === 'X') {
        e.preventDefault()
        e.stopPropagation()
        const { cut } = require('@/components/report/utils/editorUtils')
        const success = cut()
        if (success) {
          toast.success('Content cut to clipboard')
          setTimeout(() => paginateContent(), 100)
        }
      }
      
      // Paste (Ctrl+V)
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault()
        e.stopPropagation()
        const { paste } = require('@/components/report/utils/editorUtils')
        const success = paste()
        if (success) {
          toast.success('Content pasted')
          setTimeout(() => paginateContent(), 100)
        }
      }
    }
    document.addEventListener('keydown', handleKeyboardShortcuts)
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts)
    }
  }, [])

  const saveCursorPosition = () => {
    try {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return null
      const range = selection.getRangeAt(0)
      const preSelectionRange = range.cloneRange()
      let container: Node | null = range.startContainer
      while (container && container.nodeType !== Node.ELEMENT_NODE) {
        container = container.parentNode
      }
      if (!container) return null
      const editableElement = (container as Element).closest('[contenteditable="true"]')
      if (!editableElement || !pagesContainerRef.current?.contains(editableElement)) return null
      const page = editableElement.closest('.a4-page')
      const pages = Array.from(pagesContainerRef.current.querySelectorAll('.a4-page'))
      const pageIndex = pages.indexOf(page as Element)
      if (pageIndex === -1) return null
      preSelectionRange.selectNodeContents(editableElement)
      preSelectionRange.setEnd(range.startContainer, range.startOffset)
      const offset = preSelectionRange.toString().length
      return { pageIndex, offset, collapsed: range.collapsed }
    } catch (error) {
      console.error('Error saving cursor position:', error)
      return null
    }
  }

  const restoreCursorPosition = (savedPosition: { pageIndex: number; offset: number; collapsed: boolean } | null) => {
    if (!savedPosition || !pagesContainerRef.current) return
    try {
      const pages = pagesContainerRef.current.querySelectorAll('.a4-page')
      if (savedPosition.pageIndex >= pages.length) return
      const page = pages[savedPosition.pageIndex]
      const contentDiv = page.querySelector('.page-content')
      if (!contentDiv) return
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
        const maxOffset = targetNode.textContent?.length || 0
        targetOffset = Math.min(targetOffset, maxOffset)
        range.setStart(targetNode, targetOffset)
        if (savedPosition.collapsed) {
          range.collapse(true)
        }
        selection?.removeAllRanges()
        selection?.addRange(range)
        ;(contentDiv as HTMLElement).focus({ preventScroll: true })
      }
    } catch (error) {
      console.error('Error restoring cursor position:', error)
    }
  }

  const paginateContent = () => {
    if (!editorRef.current || !pagesContainerRef.current) return
    const savedCursor = saveCursorPosition()
    const scrollContainer = pagesContainerRef.current.parentElement
    const savedScrollTop = scrollContainer?.scrollTop || 0
    const content = editorRef.current.innerHTML
    pagesContainerRef.current.innerHTML = ""
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
    const pageHeight = 297 - 40 - 10
    const mmToPx = 3.7795275591
    const maxPageHeight = pageHeight * mmToPx
    let currentPage = 1
    let currentPageDiv = createPage(currentPage)
    let currentHeight = 0
    const children = Array.from(tempDiv.children)
    children.forEach((child) => {
      const childClone = child.cloneNode(true) as HTMLElement
      const childHeight = (child as HTMLElement).offsetHeight
      if (currentHeight + childHeight > maxPageHeight && currentHeight > 0) {
        pagesContainerRef.current!.appendChild(currentPageDiv)
        currentPage++
        currentPageDiv = createPage(currentPage)
        currentHeight = 0
      }
      currentPageDiv.querySelector(".page-content")!.appendChild(childClone)
      currentHeight += childHeight
    })
    if (currentPageDiv.querySelector(".page-content")!.children.length > 0) {
      pagesContainerRef.current.appendChild(currentPageDiv)
    }
    document.body.removeChild(tempDiv)
    setPageCount(currentPage)
    if (scrollContainer) {
      setTimeout(() => {
        scrollContainer.scrollTop = savedScrollTop
      }, 0)
    }
    if (savedCursor) {
      setTimeout(() => restoreCursorPosition(savedCursor), 0)
    }
  }

  const syncPagesToEditor = () => {
    if (!pagesContainerRef.current || !editorRef.current) return
    const pages = pagesContainerRef.current.querySelectorAll('.a4-page .page-content')
    let combinedContent = ''
    pages.forEach((pageContent) => {
      combinedContent += pageContent.innerHTML
    })
    editorRef.current.innerHTML = combinedContent
    if (clubData) {
      saveReportToSession(combinedContent, clubData.id)
      setLastAutoSave(new Date())
    }
  }

  const createPage = (pageNumber: number) => {
    const pageDiv = document.createElement("div")
    pageDiv.className = "a4-page"
    pageDiv.setAttribute("data-page", String(pageNumber - 1))
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      const scale = Math.min((window.innerWidth - 32) / 793.7, 1)
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
    let inputTimeout: NodeJS.Timeout
    contentDiv.addEventListener('input', () => {
      clearTimeout(inputTimeout)
      inputTimeout = setTimeout(() => {
        syncPagesToEditor()
        paginateContent()
        if (editorRef.current) {
          HistoryManager.saveToHistory(editorRef.current.innerHTML)
        }
      }, 1500)
    })
    contentDiv.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'b' || e.key === 'i' || e.key === 'u') {
          e.preventDefault()
          const command = e.key === 'b' ? 'bold' : e.key === 'i' ? 'italic' : 'underline'
          document.execCommand(command, false)
        }
      }
    })
    const logoDiv = document.createElement("img")
    logoDiv.src = "/images/Logo.png"
    logoDiv.alt = "Uniclub Logo"
    logoDiv.className = "page-logo"
    logoDiv.contentEditable = "false"
    logoDiv.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      height: 60px;
      width: auto;
      z-index: 10;
      user-select: none;
      pointer-events: none;
    `
    logoDiv.onerror = () => {
      logoDiv.style.display = 'none'
    }
    pageDiv.appendChild(logoDiv)
    
    if (pageSettings.showPageNumbers) {
      const pageNumberDiv = document.createElement("div")
      pageNumberDiv.className = "page-number"
      pageNumberDiv.contentEditable = "false"
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

  const initializeBlankDocument = (message?: string) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = `
        <div style="text-align: center; margin-top: 120px; color: #6b7280;">
          <p style="font-size: 16px;">${message || "Start crafting your report in the editor below."}</p>
        </div>
      `
      HistoryManager.initializeHistory(editorRef.current.innerHTML)
      setTimeout(() => paginateContent(), 100)
    }
  }

  const initializeStaffTemplate = () => {
    if (!editorRef.current) return
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    editorRef.current.innerHTML = `
      <div style="text-align: center; margin-top: 80px; margin-bottom: 40px;">
        <div style="display: flex; justify-content: center; align-items: center; gap: 32px; margin-bottom: 24px;">
          <img src="/application/Logo-uni.png" alt="FPT University" style="height: 60px; width: auto;" onerror="this.style.display='none'" />
        </div>
        <h1 style="font-size: 26px; font-weight: bold; letter-spacing: 2px; margin-bottom: 12px; color: #111827;">
          UNIVERSITY CLUB AFFAIRS REPORT
        </h1>
        <p style="font-size: 15px; color: #374151;">${currentDate}</p>
      </div>
    `
    HistoryManager.initializeHistory(editorRef.current.innerHTML)
    setTimeout(() => paginateContent(), 100)
  }

  const setupStaffFallback = () => {
    const placeholderClub: ClubData = {
      id: -1,
      name: "University Staff",
      description: "",
      majorName: "All Majors",
      leaderName: "N/A",
      memberCount: 0
    }
    setClubData(placeholderClub)
    const savedSettings = loadPageSettingsFromSession(placeholderClub.id)
    if (savedSettings) {
      setPageSettings(savedSettings)
    }
    const savedContent = loadReportFromSession(placeholderClub.id)
    if (editorRef.current && savedContent) {
      editorRef.current.innerHTML = savedContent
      HistoryManager.initializeHistory(savedContent)
      setTimeout(() => paginateContent(), 100)
    } else {
      initializeStaffTemplate()
    }
  }

  const ensureClubContext = () => {
    if (!clubData || clubData.id <= 0) {
      toast.error("Please open a specific club report to insert data.")
      return false
    }
    return true
  }

  const initializeDefaultTemplate = (club: ClubData, forceDefault: boolean = false) => {
    if (editorRef.current) {
      const savedContent = !forceDefault ? loadReportFromSession(club.id) : null
      if (savedContent) {
        // Update old title if it exists in saved content (for uni-staff)
        let updatedContent = savedContent
        if (isUniStaff && savedContent.includes("CLUB ACTIVITY REPORT")) {
          updatedContent = savedContent.replace(/CLUB ACTIVITY REPORT/g, "UNIVERSITY CLUB AFFAIRS REPORT")
          // Save the updated content back to session
          saveReportToSession(updatedContent, club.id)
        }
        editorRef.current.innerHTML = updatedContent
        HistoryManager.initializeHistory(updatedContent)
        const lastModified = getReportLastModified(club.id)
        const timeString = lastModified 
          ? lastModified.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : 'recently'
        toast.success(`Report restored from ${timeString}`)
      } else {
        const currentDate = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        const reportTitle = isUniStaff ? "UNIVERSITY CLUB AFFAIRS REPORT" : "CLUB ACTIVITY REPORT"
        editorRef.current.innerHTML = `
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="/application/Logo-uni.png" alt="University Logo" style="width: 150px; height: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;" onerror="this.style.display='none'" />
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #1a1a1a;">${reportTitle}</h1>
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
        HistoryManager.initializeHistory(editorRef.current.innerHTML)
      }
      setTimeout(() => paginateContent(), 100)
    }
  }

  const handlePageSettingsChange = (settings: Partial<PageSettings>) => {
    const newSettings = { ...pageSettings, ...settings }
    setPageSettings(newSettings)
    if (clubData) {
      savePageSettingsToSession(newSettings, clubData.id)
    }
    setTimeout(() => paginateContent(), 100)
  }

  const handleToolbarSync = () => {
    setTimeout(() => {
      syncPagesToEditor()
      paginateContent()
      if (editorRef.current) {
        HistoryManager.saveToHistory(editorRef.current.innerHTML)
      }
    }, 100)
  }

  const afterChange = () => {
    paginateContent()
    if (editorRef.current) {
      HistoryManager.saveToHistory(editorRef.current.innerHTML)
    }
  }

  const staffInsertContent = isUniStaff
    ? {
      tables: [
        {
          title: "University Analytics",
          items: [
            { label: "University Points Summary", icon: Trophy, onClick: () => insertStaffUniversityPointsSummary(editorRef, afterChange) },
            { label: "Attendance Summary", icon: BarChart3, onClick: () => insertStaffAttendanceSummary(editorRef, afterChange) },
            { label: "Attendance Ranking", icon: Activity, onClick: () => insertStaffAttendanceRankingTable(editorRef, afterChange) },
            { label: "Feedbacks (All Clubs)", icon: ClipboardList, onClick: () => insertStaffFeedbacksTable(editorRef, afterChange) },
            { label: "Club Overview (All-Time)", icon: Building, onClick: () => insertStaffClubOverviewTable(editorRef, afterChange) },
            { label: "Club Overview (This Month)", icon: Calendar, onClick: () => insertStaffClubOverviewByMonthTable(editorRef, afterChange) },
          ],
        },
        {
          title: "Clubs & Governance",
          items: [
            { label: "All Clubs", icon: Building, onClick: () => insertStaffClubsTable(editorRef, afterChange) },
            { label: "Majors Directory", icon: BookOpen, onClick: () => insertStaffMajorsTable(editorRef, afterChange) },
            { label: "Major Policies", icon: Shield, onClick: () => insertStaffPoliciesTable(editorRef, afterChange) },
            { label: "Student Registry", icon: Users, onClick: () => insertStaffStudentRegistryTable(editorRef, afterChange) },
          ],
        },
        {
          title: "Events & Locations",
          items: [
            { label: "Event Requests", icon: Calendar, onClick: () => insertStaffEventsTable(editorRef, afterChange) },
            { label: "Settled Events", icon: Check, onClick: () => insertStaffSettledEventsTable(editorRef, afterChange) },
            { label: "Locations", icon: MapPin, onClick: () => insertStaffLocationsTable(editorRef, afterChange) },
          ],
        },
        {
          title: "Requests & Finance",
          items: [
            { label: "Club Applications", icon: FileText, onClick: () => insertStaffClubApplicationsTable(editorRef, afterChange) },
            { label: "Point Requests", icon: ClipboardList, onClick: () => insertStaffPointRequestsTable(editorRef, afterChange) },
            { label: "Uni → Club Transactions", icon: Wallet, onClick: () => insertStaffUniToClubTransactionsTable(editorRef, afterChange) },
            { label: "Uni → Event Transactions", icon: Calendar, onClick: () => insertStaffUniToEventTransactionsTable(editorRef, afterChange) },
          ],
        },
        {
          title: "System Configuration",
          items: [
            { label: "Tags", icon: FileText, onClick: () => insertStaffTagsTable(editorRef, afterChange) },
            { label: "Multiplier Policies", icon: Activity, onClick: () => insertStaffMultiplierPoliciesTable(editorRef, afterChange) },
            { label: "Penalty Rules", icon: Shield, onClick: () => insertStaffPenaltyRulesTable(editorRef, afterChange) },
            { label: "Products & Gifts", icon: Gift, onClick: () => insertStaffProductsTable(editorRef, afterChange) },
          ],
        },
      ],
      charts: [
        {
          title: "Engagement",
          items: [
            { label: "University Points Chart", icon: BarChart3, onClick: () => insertStaffUniversityPointsChart(editorRef, afterChange) },
            { label: "Attendance By Month", icon: BarChart3, onClick: () => insertStaffAttendanceSummaryChart(editorRef, afterChange) },
            { label: "Attendance Ranking Chart", icon: Activity, onClick: () => insertStaffAttendanceRankingChart(editorRef, afterChange) },
            { label: "Club Overview (All-Time)", icon: BarChart3, onClick: () => insertStaffClubOverviewChart(editorRef, afterChange) },
            { label: "Club Overview (This Month)", icon: BarChart3, onClick: () => insertStaffClubOverviewByMonthChart(editorRef, afterChange) },
          ],
        },
        {
          title: "Operations",
          items: [
            { label: "Clubs By Major Chart", icon: PieChartIcon, onClick: () => insertStaffClubsByMajorChart(editorRef, afterChange) },
            { label: "Event Status Chart", icon: Activity, onClick: () => insertStaffEventStatusChart(editorRef, afterChange) },
            { label: "Event Budget Chart", icon: BarChart3, onClick: () => insertStaffUniToEventTransactionsChart(editorRef, afterChange) },
          ],
        },
        {
          title: "Requests",
          items: [
            { label: "Club Applications Chart", icon: PieChartIcon, onClick: () => insertStaffClubApplicationChart(editorRef, afterChange) },
            { label: "Point Requests Chart", icon: PieChartIcon, onClick: () => insertStaffPointRequestChart(editorRef, afterChange) },
          ],
        },
      ],
    }
    : undefined

  const insertMembersData = () => {
    if (!ensureClubContext()) return
    return insertMembersTable(clubData!.id, editorRef, afterChange)
  }

  const insertEventsData = async () => {
    if (!ensureClubContext()) return
    return insertEventsTable(clubData!.id, editorRef, afterChange)
  }

  const insertGiftsData = async () => {
    if (!ensureClubContext()) return
    return insertGiftsTable(clubData!.id, editorRef, afterChange)
  }

  const insertApplicationsData = () => {
    if (!ensureClubContext()) return
    return insertApplicationsTable(clubData!.id, editorRef, afterChange)
  }

  const insertOrdersData = () => {
    if (!ensureClubContext()) return
    return insertOrdersTable(clubData!.id, editorRef, afterChange)
  }

  const insertWalletData = () => {
    if (!ensureClubContext()) return
    return insertWalletTable(clubData!.id, editorRef, afterChange)
  }

  const insertFeedbackData = () => {
    if (!ensureClubContext()) return
    return insertFeedbackTable(clubData!.id, editorRef, afterChange)
  }

  const insertLeaveRequestsData = () => {
    if (!ensureClubContext()) return
    return insertLeaveRequestsTable(clubData!.id, editorRef, afterChange)
  }

  const insertActivityScoresData = () => {
    if (!ensureClubContext()) return
    return insertActivityScoresTable(clubData!.id, editorRef, afterChange)
  }

  const insertCoHostEventsData = () => {
    if (!ensureClubContext()) return
    return insertCoHostEventsTable(clubData!.id, editorRef, afterChange)
  }

  const insertAttendanceData = () => {
    if (!ensureClubContext()) return
    return insertAttendanceTable(clubData!.id, editorRef, afterChange)
  }

  const insertEventStaffData = () => {
    if (!ensureClubContext()) return
    return insertEventStaffTable(clubData!.id, editorRef, afterChange)
  }

  const insertMembersChart = () => {
    if (!ensureClubContext()) return
    return insertMembersChartService(clubData!.id, editorRef, afterChange)
  }

  const insertEventsChart = () => {
    if (!ensureClubContext()) return
    return insertEventsChartService(clubData!.id, editorRef, afterChange)
  }

  const insertApplicationsChart = () => {
    if (!ensureClubContext()) return
    return insertApplicationsChartService(clubData!.id, editorRef, afterChange)
  }

  const insertGiftsChart = () => {
    if (!ensureClubContext()) return
    return insertGiftsChartService(clubData!.id, editorRef, afterChange)
  }

  const insertOrdersChart = () => {
    // Fallback: use orders table insertion if chart service is unavailable
    return insertOrdersData()
  }

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

  const handleClear = () => {
    if (!clubData) return
    clearReportFromSession()
    if (isUniStaff && clubData.id <= 0) {
      initializeStaffTemplate()
    } else {
      initializeDefaultTemplate(clubData, true)
    }
    setLastAutoSave(null)
    toast.success("Report reset to default template")
  }

  const fixOklchColors = (clonedDoc: Document) => {
    try {
      const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]')
      links.forEach(link => link.remove())
      const styles = clonedDoc.querySelectorAll('style')
      styles.forEach(style => {
        if (style.textContent?.includes('oklch')) {
          style.remove()
        }
      })
      const styleEl = clonedDoc.createElement('style')
      styleEl.id = 'html2canvas-safe-colors'
      const safeCSS = `
        :root, html, body {
          --background: 255 255 255;
          --foreground: 0 0 0;
          color: #000000;
          background: #ffffff;
        }
        .a4-page {
          background: white;
          color: #000000;
        }
        .page-content {
          color: #000000;
        }
        * {
          color: inherit;
        }
        table {
          border-collapse: collapse;
        }
        table, th, td {
          border-color: #d1d5db;
        }
      `
      styleEl.textContent = safeCSS
      if (!clonedDoc.head) {
        const head = clonedDoc.createElement('head')
        clonedDoc.documentElement.insertBefore(head, clonedDoc.body)
      }
      clonedDoc.head.appendChild(styleEl)
    } catch (err) {
      console.error('Error fixing oklch colors:', err)
    }
  }

  const handleDownloadPDF = async () => {
    if (!pagesContainerRef.current) return
    try {
      setIsDownloading(true)
      setDownloadProgress(0)
      const fileName = `${clubData?.name || "Club"}_Report_${new Date().toISOString().split("T")[0]}.pdf`
      await downloadPagesAsPdf(pagesContainerRef.current, fileName, (progress) => {
        setDownloadProgress(progress)
      })
      toast.success("PDF downloaded successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
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
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppShell>
        <ContextMenu editorRef={pagesContainerRef} />
        <ImageResizer editorRef={pagesContainerRef} />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {isHeaderCollapsed && (
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b mb-3">
            <div className="flex items-start gap-2 py-2 px-2">
              <div className="overflow-x-scroll overflow-y-hidden flex-1 min-w-0 whitespace-nowrap" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
                <div className="shrink-0 inline-block">
                  <RichTextEditorToolbar
                    pageSettings={pageSettings}
                    onPageSettingsChange={handlePageSettingsChange}
                    onSync={handleToolbarSync}
                    compact={true}
                    editorRef={editorRef}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0 pl-2 border-l">
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
        {!isUniStaff && (
          <QuickInsert
            onMembers={insertMembersData}
            onEvents={insertEventsData}
            onGifts={insertGiftsData}
            onOrders={insertOrdersData}
            onApplications={insertApplicationsData}
            onWallet={insertWalletData}
            onFeedback={insertFeedbackData}
            onLeaveRequests={insertLeaveRequestsData}
            onActivityScores={insertActivityScoresData}
            onCoHostEvents={insertCoHostEventsData}
            onAttendance={insertAttendanceData}
            onEventStaff={insertEventStaffData}
          />
        )}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            {!isHeaderCollapsed && (
              <RichTextEditorToolbar
                pageSettings={pageSettings}
                onPageSettingsChange={handlePageSettingsChange}
                onSync={handleToolbarSync}
                editorRef={editorRef}
              />
            )}
            <div style={{ display: 'none' }}>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
              />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800/50 p-2 sm:p-4 rounded-lg max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-auto">
              <div ref={pagesContainerRef} className="space-y-3 sm:space-y-4 min-w-fit sm:min-w-0">
              </div>
            </div>
          </div>
          <InsertSidebar
            disabled={isUniStaff ? loading : !clubData || loading}
            customContent={staffInsertContent}
            onMembersTable={insertMembersData}
            onEventsTable={insertEventsData}
            onGiftsTable={insertGiftsData}
            onOrdersTable={insertOrdersData}
            onApplicationsTable={insertApplicationsData}
            onWalletTable={insertWalletData}
            onFeedbackTable={insertFeedbackData}
            onLeaveRequestsTable={insertLeaveRequestsData}
            onActivityScoresTable={insertActivityScoresData}
            onCoHostEventsTable={insertCoHostEventsData}
            onAttendanceTable={insertAttendanceData}
            onEventStaffTable={insertEventStaffData}
            onMembersChart={insertMembersChart}
            onEventsChart={insertEventsChart}
            onGiftsChart={insertGiftsChart}
            onOrdersChart={insertOrdersChart}
            onApplicationsChart={insertApplicationsChart}
            onWalletChart={() => insertWalletData()}
          />
        </div>
      </div>
      {isDownloading && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <div className="w-full text-center">
                <p className="text-lg font-semibold text-foreground mb-2">Generating PDF...</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Processing page {Math.ceil(downloadProgress * pageCount / 100)} of {pageCount}
                </p>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden mb-2">
                  <div 
                    className="bg-primary h-full transition-all duration-300 ease-out rounded-full flex items-center justify-center"
                    style={{ width: `${downloadProgress}%` }}
                  >
                    {downloadProgress > 15 && (
                      <span className="text-xs font-semibold text-white">
                        {downloadProgress}%
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Percentage Display */}
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="font-semibold text-foreground text-sm">{downloadProgress}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </AppShell>
    </ProtectedRoute>
  )
}


