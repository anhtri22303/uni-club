/**
 * History Manager for Undo/Redo with Circular Buffer (25 slots)
 * 
 * This system uses Local Storage to maintain a circular buffer of 25 history states.
 * When saving state 26, it overwrites state 1, creating a rolling history window.
 * 
 * Features:
 * - Circular buffer with 25 slots
 * - Local storage persistence (survives browser restarts)
 * - Undo/Redo navigation
 * - Boundary detection (can't undo/redo beyond limits)
 */

export interface HistoryState {
  content: string
  timestamp: number
  index: number
}

export interface HistoryStatus {
  canUndo: boolean
  canRedo: boolean
  currentIndex: number
  totalStates: number
  isAtOldest: boolean
  isAtNewest: boolean
}

const HISTORY_KEY_PREFIX = 'editor_history_'
const HISTORY_META_KEY = 'editor_history_meta'
const MAX_HISTORY_SIZE = 25

interface HistoryMeta {
  currentIndex: number // Current position in history (0-24)
  headIndex: number // The newest state index (0-24)
  tailIndex: number // The oldest state index (0-24)
  size: number // Number of states currently stored (0-25)
}

/**
 * Save current editor content to history
 */
export function saveToHistory(content: string): void {
  const meta = getHistoryMeta()
  
  // Calculate next index (circular buffer)
  const nextIndex = (meta.headIndex + 1) % MAX_HISTORY_SIZE
  
  // Update size (max 25)
  const newSize = Math.min(meta.size + 1, MAX_HISTORY_SIZE)
  
  // If buffer is full, move tail forward (we're overwriting the oldest)
  const newTailIndex = newSize === MAX_HISTORY_SIZE 
    ? (meta.tailIndex + 1) % MAX_HISTORY_SIZE 
    : meta.tailIndex
  
  // Save the new state
  const state: HistoryState = {
    content,
    timestamp: Date.now(),
    index: nextIndex
  }
  
  localStorage.setItem(
    `${HISTORY_KEY_PREFIX}${nextIndex}`,
    JSON.stringify(state)
  )
  
  // Update metadata
  const newMeta: HistoryMeta = {
    currentIndex: nextIndex,
    headIndex: nextIndex,
    tailIndex: newTailIndex,
    size: newSize
  }
  
  localStorage.setItem(HISTORY_META_KEY, JSON.stringify(newMeta))
}

/**
 * Undo - Move back one state
 */
export function undo(): { content: string | null; status: HistoryStatus; message?: string } {
  const meta = getHistoryMeta()
  const status = getHistoryStatus()
  
  // Check if we can undo
  if (!status.canUndo) {
    return {
      content: null,
      status,
      message: meta.size === 0 ? 'No history available' : 'Already at oldest state'
    }
  }
  
  // Calculate previous index (circular buffer, going backwards)
  let prevIndex = (meta.currentIndex - 1 + MAX_HISTORY_SIZE) % MAX_HISTORY_SIZE
  
  // Make sure we don't go before the tail
  if (meta.size < MAX_HISTORY_SIZE) {
    // Not full yet, check bounds differently
    if (meta.currentIndex === meta.tailIndex) {
      return {
        content: null,
        status,
        message: 'Already at oldest state'
      }
    }
  } else {
    // Full buffer, check if we're trying to go to tail
    if (prevIndex === meta.tailIndex) {
      // This is the oldest state, allow but warn
      const state = getStateAtIndex(prevIndex)
      
      // Update current index
      const newMeta: HistoryMeta = { ...meta, currentIndex: prevIndex }
      localStorage.setItem(HISTORY_META_KEY, JSON.stringify(newMeta))
      
      return {
        content: state?.content || null,
        status: getHistoryStatus(),
        message: 'This is the oldest saved state (25 steps back)'
      }
    }
  }
  
  // Get the previous state
  const state = getStateAtIndex(prevIndex)
  
  if (!state) {
    return {
      content: null,
      status,
      message: 'Failed to retrieve history state'
    }
  }
  
  // Update current index
  const newMeta: HistoryMeta = { ...meta, currentIndex: prevIndex }
  localStorage.setItem(HISTORY_META_KEY, JSON.stringify(newMeta))
  
  const newStatus = getHistoryStatus()
  const message = newStatus.isAtOldest 
    ? 'This is the oldest saved state (25 steps back)' 
    : undefined
  
  return {
    content: state.content,
    status: newStatus,
    message
  }
}

/**
 * Redo - Move forward one state
 */
export function redo(): { content: string | null; status: HistoryStatus; message?: string } {
  const meta = getHistoryMeta()
  const status = getHistoryStatus()
  
  // Check if we can redo
  if (!status.canRedo) {
    return {
      content: null,
      status,
      message: 'Already at newest state'
    }
  }
  
  // Calculate next index (circular buffer, going forward)
  const nextIndex = (meta.currentIndex + 1) % MAX_HISTORY_SIZE
  
  // Make sure we don't go past the head
  if (nextIndex === (meta.headIndex + 1) % MAX_HISTORY_SIZE) {
    return {
      content: null,
      status,
      message: 'Already at newest state'
    }
  }
  
  // Get the next state
  const state = getStateAtIndex(nextIndex)
  
  if (!state) {
    return {
      content: null,
      status,
      message: 'Failed to retrieve history state'
    }
  }
  
  // Update current index
  const newMeta: HistoryMeta = { ...meta, currentIndex: nextIndex }
  localStorage.setItem(HISTORY_META_KEY, JSON.stringify(newMeta))
  
  return {
    content: state.content,
    status: getHistoryStatus(),
    message: undefined
  }
}

/**
 * Get history status (for UI state management)
 */
export function getHistoryStatus(): HistoryStatus {
  const meta = getHistoryMeta()
  
  if (meta.size === 0) {
    return {
      canUndo: false,
      canRedo: false,
      currentIndex: -1,
      totalStates: 0,
      isAtOldest: true,
      isAtNewest: true
    }
  }
  
  // Can undo if we're not at the tail
  const canUndo = meta.currentIndex !== meta.tailIndex
  
  // Can redo if we're not at the head
  const canRedo = meta.currentIndex !== meta.headIndex
  
  // Check if at oldest (at tail)
  const isAtOldest = meta.currentIndex === meta.tailIndex
  
  // Check if at newest (at head)
  const isAtNewest = meta.currentIndex === meta.headIndex
  
  return {
    canUndo,
    canRedo,
    currentIndex: meta.currentIndex,
    totalStates: meta.size,
    isAtOldest,
    isAtNewest
  }
}

/**
 * Clear all history
 */
export function clearHistory(): void {
  // Remove all history states
  for (let i = 0; i < MAX_HISTORY_SIZE; i++) {
    localStorage.removeItem(`${HISTORY_KEY_PREFIX}${i}`)
  }
  
  // Reset metadata
  const initialMeta: HistoryMeta = {
    currentIndex: -1,
    headIndex: -1,
    tailIndex: 0,
    size: 0
  }
  
  localStorage.setItem(HISTORY_META_KEY, JSON.stringify(initialMeta))
}

/**
 * Get current state content
 */
export function getCurrentState(): string | null {
  const meta = getHistoryMeta()
  
  if (meta.size === 0) {
    return null
  }
  
  const state = getStateAtIndex(meta.currentIndex)
  return state?.content || null
}

/**
 * Initialize history with initial content
 */
export function initializeHistory(initialContent: string): void {
  clearHistory()
  saveToHistory(initialContent)
}

// ========== PRIVATE HELPERS ==========

/**
 * Get history metadata from local storage
 */
function getHistoryMeta(): HistoryMeta {
  const metaStr = localStorage.getItem(HISTORY_META_KEY)
  
  if (!metaStr) {
    // Initialize with default values
    const initialMeta: HistoryMeta = {
      currentIndex: -1,
      headIndex: -1,
      tailIndex: 0,
      size: 0
    }
    return initialMeta
  }
  
  try {
    return JSON.parse(metaStr) as HistoryMeta
  } catch (error) {
    console.error('Failed to parse history metadata:', error)
    return {
      currentIndex: -1,
      headIndex: -1,
      tailIndex: 0,
      size: 0
    }
  }
}

/**
 * Get state at specific index
 */
function getStateAtIndex(index: number): HistoryState | null {
  const stateStr = localStorage.getItem(`${HISTORY_KEY_PREFIX}${index}`)
  
  if (!stateStr) {
    return null
  }
  
  try {
    return JSON.parse(stateStr) as HistoryState
  } catch (error) {
    console.error(`Failed to parse history state at index ${index}:`, error)
    return null
  }
}

/**
 * Debug helper - Get all history states (for development)
 */
export function debugHistory(): void {
  const meta = getHistoryMeta()

  
  for (let i = 0; i < MAX_HISTORY_SIZE; i++) {
    const state = getStateAtIndex(i)
    if (state) {
      console.log(`  [${i}]${i === meta.currentIndex ? ' (CURRENT)' : ''}${i === meta.headIndex ? ' (HEAD)' : ''}${i === meta.tailIndex ? ' (TAIL)' : ''}:`, {
        timestamp: new Date(state.timestamp).toLocaleTimeString(),
        contentLength: state.content.length
      })
    } else {
      console.log(`  [${i}]: empty`)
    }
  }

}

