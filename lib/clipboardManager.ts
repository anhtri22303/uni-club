/**
 * Clipboard Manager using sessionStorage
 * Stores copied/cut content in session and clears on logout
 */

const CLIPBOARD_KEY = 'report_clipboard'
const CLIPBOARD_TYPE_KEY = 'report_clipboard_type'

export type ClipboardOperation = 'copy' | 'cut'

interface ClipboardData {
  html: string
  text: string
  operation: ClipboardOperation
  timestamp: number
}

/**
 * Store content in clipboard
 */
export const setClipboard = (
  html: string,
  text: string,
  operation: ClipboardOperation
): void => {
  try {
    const data: ClipboardData = {
      html,
      text,
      operation,
      timestamp: Date.now()
    }
    sessionStorage.setItem(CLIPBOARD_KEY, JSON.stringify(data))
    sessionStorage.setItem(CLIPBOARD_TYPE_KEY, operation)
  } catch (error) {
    console.error('Error saving to clipboard:', error)
  }
}

/**
 * Get content from clipboard
 */
export const getClipboard = (): ClipboardData | null => {
  try {
    const data = sessionStorage.getItem(CLIPBOARD_KEY)
    if (!data) return null
    return JSON.parse(data) as ClipboardData
  } catch (error) {
    console.error('Error reading clipboard:', error)
    return null
  }
}

/**
 * Clear clipboard
 */
export const clearClipboard = (): void => {
  try {
    sessionStorage.removeItem(CLIPBOARD_KEY)
    sessionStorage.removeItem(CLIPBOARD_TYPE_KEY)
  } catch (error) {
    console.error('Error clearing clipboard:', error)
  }
}

/**
 * Check if clipboard has content
 */
export const hasClipboardContent = (): boolean => {
  return sessionStorage.getItem(CLIPBOARD_KEY) !== null
}

/**
 * Get clipboard operation type
 */
export const getClipboardType = (): ClipboardOperation | null => {
  const type = sessionStorage.getItem(CLIPBOARD_TYPE_KEY)
  return type as ClipboardOperation | null
}

/**
 * Clear all clipboard data (call on logout)
 */
export const clearAllClipboardData = (): void => {
  clearClipboard()
}
