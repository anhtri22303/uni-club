/**
 * Session Storage utility for Report Page
 * Manages temporary storage of report edits that persist across page reloads
 * but are cleared on logout or manual clear action
 */

import { PageSettings } from '@/components/report/types'

const REPORT_STORAGE_KEY = 'clubly-report-editor-content'
const REPORT_SETTINGS_KEY = 'clubly-report-page-settings'

interface ReportStorageData {
  content: string
  clubId: number
  lastModified: string
}

/**
 * Save report content to session storage
 */
export function saveReportToSession(content: string, clubId: number): void {
  try {
    const data: ReportStorageData = {
      content,
      clubId,
      lastModified: new Date().toISOString()
    }
    sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save report to session storage:', error)
  }
}

/**
 * Load report content from session storage
 * Returns null if no saved data or if data is for a different club
 */
export function loadReportFromSession(clubId: number): string | null {
  try {
    const savedData = sessionStorage.getItem(REPORT_STORAGE_KEY)
    if (!savedData) return null

    const data: ReportStorageData = JSON.parse(savedData)
    
    // Only return content if it's for the same club
    if (data.clubId !== clubId) {
      // Clear old data for different club
      clearReportFromSession()
      return null
    }

    return data.content
  } catch (error) {
    console.error('Failed to load report from session storage:', error)
    return null
  }
}

/**
 * Save page settings to session storage
 */
export function savePageSettingsToSession(settings: PageSettings, clubId: number): void {
  try {
    const data = {
      settings,
      clubId,
      lastModified: new Date().toISOString()
    }
    sessionStorage.setItem(REPORT_SETTINGS_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save page settings to session storage:', error)
  }
}

/**
 * Load page settings from session storage
 */
export function loadPageSettingsFromSession(clubId: number): PageSettings | null {
  try {
    const savedData = sessionStorage.getItem(REPORT_SETTINGS_KEY)
    if (!savedData) return null

    const data = JSON.parse(savedData)
    
    // Only return settings if it's for the same club
    if (data.clubId !== clubId) {
      return null
    }

    return data.settings
  } catch (error) {
    console.error('Failed to load page settings from session storage:', error)
    return null
  }
}

/**
 * Clear report content from session storage
 */
export function clearReportFromSession(): void {
  try {
    sessionStorage.removeItem(REPORT_STORAGE_KEY)
    sessionStorage.removeItem(REPORT_SETTINGS_KEY)
    console.log('Report session storage cleared')
  } catch (error) {
    console.error('Failed to clear report from session storage:', error)
  }
}

/**
 * Check if there is saved report data in session storage
 */
export function hasReportInSession(clubId: number): boolean {
  try {
    const savedData = sessionStorage.getItem(REPORT_STORAGE_KEY)
    if (!savedData) return false

    const data: ReportStorageData = JSON.parse(savedData)
    return data.clubId === clubId
  } catch (error) {
    return false
  }
}

/**
 * Get last modified timestamp of saved report
 */
export function getReportLastModified(clubId: number): Date | null {
  try {
    const savedData = sessionStorage.getItem(REPORT_STORAGE_KEY)
    if (!savedData) return null

    const data: ReportStorageData = JSON.parse(savedData)
    if (data.clubId !== clubId) return null

    return new Date(data.lastModified)
  } catch (error) {
    return null
  }
}

