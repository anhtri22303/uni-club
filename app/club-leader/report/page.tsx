"use client"

import { useState, useRef, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/contexts/protected-route"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Download,
  Trash2,
  Users,
  Calendar,
  Gift,
  Check,
  Save,
} from "lucide-react"
import { getClubIdFromToken, getClubById } from "@/service/clubApi"
import { getMembersByClubId } from "@/service/membershipApi"
import { getEventByClubId } from "@/service/eventApi"
import { getProducts } from "@/service/productApi"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { toast } from "sonner"
import { RichTextEditorToolbar } from "@/components/report/RichTextEditorToolbar"
import { PageSettings } from "@/components/report/types"
import { 
  saveReportToSession, 
  loadReportFromSession, 
  savePageSettingsToSession,
  loadPageSettingsFromSession,
  clearReportFromSession,
  hasReportInSession,
  getReportLastModified
} from "@/lib/reportSessionStorage"

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
  const editorRef = useRef<HTMLDivElement>(null)
  const pagesContainerRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState(1)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  const [, setTick] = useState(0) // Force re-render every second to update time display
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

  // Update time display every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1)
    }, 1000)

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
          
          // Restore page settings from session storage if available
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

  // Auto-save to session storage every 30 seconds
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
    }, 30000) // 30 seconds = 30,000 milliseconds

    return () => {
      clearInterval(autoSaveInterval)
    }
  }, [clubData, pageSettings])

  // Helper: Save cursor position
  const saveCursorPosition = () => {
    try {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return null

      const range = selection.getRangeAt(0)
      const preSelectionRange = range.cloneRange()
      
      // Find the contentEditable ancestor
      let container = range.startContainer
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
        
        // Focus the content div
        ;(contentDiv as HTMLElement).focus()
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
    
    // Save to session storage after syncing
    if (clubData) {
      saveReportToSession(combinedContent, clubData.id)
      setLastAutoSave(new Date())
    }
  }

  // Create a single A4 page with page number
  const createPage = (pageNumber: number) => {
    const pageDiv = document.createElement("div")
    pageDiv.className = "a4-page"
    
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

    const pageNumberDiv = document.createElement("div")
    pageNumberDiv.className = "page-number"
    pageNumberDiv.contentEditable = "false"
    pageNumberDiv.style.cssText = `
      position: absolute;
      bottom: 15mm;
      right: 20mm;
      font-size: 12pt;
      color: #666;
      font-family: Times New Roman, serif;
      user-select: none;
      pointer-events: none;
    `
    pageNumberDiv.textContent = `${pageNumber}`

    pageDiv.appendChild(contentDiv)
    pageDiv.appendChild(pageNumberDiv)

    return pageDiv
  }

  // Initialize default template
  const initializeDefaultTemplate = (club: ClubData, forceDefault: boolean = false) => {
    if (editorRef.current) {
      // Check if there's saved content in session storage
      const savedContent = !forceDefault ? loadReportFromSession(club.id) : null
      
      if (savedContent) {
        // Restore saved content
        editorRef.current.innerHTML = savedContent
        
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
      }
      
      // Trigger pagination after content is set
      setTimeout(() => paginateContent(), 100)
    }
  }

  // Handle page settings change
  const handlePageSettingsChange = (settings: Partial<PageSettings>) => {
    const newSettings = { ...pageSettings, ...settings }
    setPageSettings(newSettings)
    
    // Save to session storage
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
    }, 100)
  }

  // Insert Members data
  const insertMembersData = async () => {
    try {
      if (!clubData) return
      
      const members = await getMembersByClubId(clubData.id)
      
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

      members.forEach((member, index) => {
        const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
        membersHTML += `
          <tr style="background-color: ${bgColor};">
            <td style="border: 1px solid #d1d5db; padding: 8px;">${index + 1}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${member.fullName}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${member.studentCode}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${member.clubRole}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${member.state}</td>
          </tr>
        `
      })

      membersHTML += `
            </tbody>
          </table>
          <p style="font-style: italic; color: #666; font-size: 14px;">Total Members: ${members.length}</p>
        </div>
      `

      if (editorRef.current) {
        editorRef.current.innerHTML += membersHTML
        setTimeout(() => paginateContent(), 100)
      }

      toast.success(`${members.length} members inserted`)
    } catch (error) {
      console.error("Error inserting members:", error)
      toast.error("Failed to insert members data")
    }
  }

  // Insert Events data
  const insertEventsData = async () => {
    try {
      if (!clubData) return
      
      const events = await getEventByClubId(clubData.id)
      
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

      events.forEach((event, index) => {
        const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb"
        eventsHTML += `
          <tr style="background-color: ${bgColor};">
            <td style="border: 1px solid #d1d5db; padding: 8px;">${index + 1}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${event.name}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${event.date}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${event.type}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${event.status}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${event.locationName}</td>
          </tr>
        `
      })

      eventsHTML += `
            </tbody>
          </table>
          <p style="font-style: italic; color: #666; font-size: 14px;">Total Events: ${events.length}</p>
        </div>
      `

      if (editorRef.current) {
        editorRef.current.innerHTML += eventsHTML
        setTimeout(() => paginateContent(), 100)
      }

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
            <td style="border: 1px solid #d1d5db; padding: 8px;">${index + 1}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${product.name}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${product.type}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${product.pointCost}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${product.stockQuantity}</td>
            <td style="border: 1px solid #d1d5db; padding: 8px;">${product.status}</td>
          </tr>
        `
      })

      giftsHTML += `
            </tbody>
          </table>
          <p style="font-style: italic; color: #666; font-size: 14px;">Total Products: ${products.length}</p>
        </div>
      `

      if (editorRef.current) {
        editorRef.current.innerHTML += giftsHTML
        setTimeout(() => paginateContent(), 100)
      }

      toast.success(`${products.length} products inserted`)
    } catch (error) {
      console.error("Error inserting gifts:", error)
      toast.error("Failed to insert gifts data")
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
      // Clear session storage
      clearReportFromSession()
      
      // Reset to default template (force default, don't restore from session)
      initializeDefaultTemplate(clubData, true)
      
      // Reset last save indicator
      setLastAutoSave(null)
      
      toast.success("Report reset to default template")
    }
  }

  // Download as PDF
  const handleDownloadPDF = async () => {
    if (!pagesContainerRef.current) return

    try {
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
      toast.error("Failed to generate PDF")
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Header */}
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
              <Button onClick={handleManualSave} variant="default" size="sm" className="flex-1 sm:flex-none">
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              <Button onClick={handleClear} variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
              <Button onClick={handleDownloadPDF} size="sm" className="flex-1 sm:flex-none">
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden md:inline">Download PDF</span>
                <span className="md:hidden">PDF</span>
              </Button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Create and customize your club activity report
          </p>
        </div>

        {/* Mobile Data Insertion Buttons - Show at top on mobile */}
        <div className="lg:hidden mb-3">
          <Card className="p-3 shadow-sm">
            <h3 className="font-semibold mb-2 text-sm">Quick Insert</h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={insertMembersData}
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Members
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={insertEventsData}
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Events
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={insertGiftsData}
              >
                <Gift className="h-3.5 w-3.5 mr-1.5" />
                Gifts
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Main Editor Area */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            {/* Rich Text Editor Toolbar */}
            <RichTextEditorToolbar
              pageSettings={pageSettings}
              onPageSettingsChange={handlePageSettingsChange}
              onSync={handleToolbarSync}
            />

            {/* Page Counter */}
            <div className="flex justify-end">
              <Card className="px-3 sm:px-4 py-1.5 sm:py-2">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                </div>
              </Card>
            </div>

            {/* Hidden Editor for Content Editing */}
            <div style={{ display: 'none' }}>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
              />
            </div>

            {/* Paginated Pages Container */}
            <div className="bg-gray-100 dark:bg-gray-900 p-2 sm:p-4 rounded-lg max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-auto">
              <div ref={pagesContainerRef} className="space-y-3 sm:space-y-4 min-w-fit sm:min-w-0">
                {/* Pages will be dynamically inserted here */}
              </div>
            </div>
          </div>

          {/* Sticky Sidebar with Data Insertion Buttons - Desktop only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 z-10">
              <Card className="p-4 shadow-lg">
                <h3 className="font-semibold mb-4 text-sm">Insert Data</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={insertMembersData}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Members
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={insertEventsData}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Events
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={insertGiftsData}
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Gifts
                  </Button>
                </div>

                <Separator className="my-4" />

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
      </AppShell>
    </ProtectedRoute>
  )
}

