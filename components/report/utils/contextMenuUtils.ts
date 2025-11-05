export type ContextType = 'text' | 'link' | 'image' | 'table'

export function getContextMenuPosition(clientX: number, clientY: number) {
  const menuWidth = 224 // w-56 = 224px
  const menuHeight = 400 // approximate max height
  const offset = 5 // small offset from cursor
  
  let x = clientX
  let y = clientY
  
  // Check if cursor is in bottom half of viewport
  const isBottomHalf = clientY > window.innerHeight / 2
  
  if (isBottomHalf) {
    // Position menu above cursor
    y = clientY - menuHeight - offset
    // Ensure menu doesn't go off top edge
    if (y < 10) {
      y = 10
    }
  } else {
    // Position menu below cursor (default behavior)
    y = clientY + offset
    // Adjust if menu would go off bottom edge
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10
    }
  }
  
  // Adjust if menu would go off right edge
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 10
  }
  
  // Ensure menu doesn't go off left edge
  if (x < 10) {
    x = 10
  }
  
  return { x, y }
}

export function detectElementType(element: HTMLElement): ContextType {
  // Check if it's a table cell or inside one
  if (element.tagName === 'TD' || element.tagName === 'TH' || element.closest('td, th')) {
    return 'table'
  }
  
  // Check if it's an image or inside one
  if (element.tagName === 'IMG' || element.closest('img')) {
    return 'image'
  }
  
  // Check if it's a link or inside one
  if (element.tagName === 'A' || element.closest('a')) {
    return 'link'
  }
  
  return 'text'
}

export function getTableCell(element: HTMLElement | null): HTMLTableCellElement | null {
  if (!element) return null
  if (element.tagName === 'TD' || element.tagName === 'TH') {
    return element as HTMLTableCellElement
  }
  return element.closest('td, th') as HTMLTableCellElement | null
}

export function getImageElement(element: HTMLElement | null): HTMLImageElement | null {
  if (!element) return null
  if (element.tagName === 'IMG') {
    return element as HTMLImageElement
  }
  return element.closest('img') as HTMLImageElement | null
}

export function getLinkElement(element: HTMLElement | null): HTMLAnchorElement | null {
  if (!element) return null
  if (element.tagName === 'A') {
    return element as HTMLAnchorElement
  }
  return element.closest('a') as HTMLAnchorElement | null
}
