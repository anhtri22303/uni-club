/**
 * Local Storage utility for Report Page
 * Manages persistent storage of report edits that survive browser restarts
 * and persist across sessions until manually cleared
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
 * Save report content to local storage
 */
export function saveReportToSession(content: string, clubId: number): void {
  try {
    const data: ReportStorageData = {
      content,
      clubId,
      lastModified: new Date().toISOString()
    }
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save report to local storage:', error)
  }
}

/**
 * Load report content from local storage
 * Returns null if no saved data or if data is for a different club
 */
export function loadReportFromSession(clubId: number): string | null {
  try {
    const savedData = localStorage.getItem(REPORT_STORAGE_KEY)
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
    console.error('Failed to load report from local storage:', error)
    return null
  }
}

/**
 * Save page settings to local storage
 */
export function savePageSettingsToSession(settings: PageSettings, clubId: number): void {
  try {
    const data = {
      settings,
      clubId,
      lastModified: new Date().toISOString()
    }
    localStorage.setItem(REPORT_SETTINGS_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save page settings to local storage:', error)
  }
}

/**
 * Load page settings from local storage
 */
export function loadPageSettingsFromSession(clubId: number): PageSettings | null {
  try {
    const savedData = localStorage.getItem(REPORT_SETTINGS_KEY)
    if (!savedData) return null

    const data = JSON.parse(savedData)
    
    // Only return settings if it's for the same club
    if (data.clubId !== clubId) {
      return null
    }

    return data.settings
  } catch (error) {
    console.error('Failed to load page settings from local storage:', error)
    return null
  }
}

/**
 * Clear report content from local storage
 */
export function clearReportFromSession(): void {
  try {
    localStorage.removeItem(REPORT_STORAGE_KEY)
    localStorage.removeItem(REPORT_SETTINGS_KEY)
  } catch (error) {
    console.error('Failed to clear report from local storage:', error)
  }
}

/**
 * Check if there is saved report data in local storage
 */
export function hasReportInSession(clubId: number): boolean {
  try {
    const savedData = localStorage.getItem(REPORT_STORAGE_KEY)
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
    const savedData = localStorage.getItem(REPORT_STORAGE_KEY)
    if (!savedData) return null

    const data: ReportStorageData = JSON.parse(savedData)
    if (data.clubId !== clubId) return null

    return new Date(data.lastModified)
  } catch (error) {
    return null
  }
}

