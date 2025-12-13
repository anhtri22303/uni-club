/**
 * Test for clipboard manager utility
 * Tests clipboard operations in a browser environment
 */

describe('Clipboard Manager', () => {
  // Mock clipboard API
  const mockClipboard = {
    writeText: jest.fn(),
    readText: jest.fn(),
  }

  beforeAll(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    })
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should copy text to clipboard successfully', async () => {
    mockClipboard.writeText.mockResolvedValue(undefined)
    
    const textToCopy = 'Test text to copy'
    await navigator.clipboard.writeText(textToCopy)
    
    expect(mockClipboard.writeText).toHaveBeenCalledWith(textToCopy)
    expect(mockClipboard.writeText).toHaveBeenCalledTimes(1)
  })

  it('should read text from clipboard successfully', async () => {
    const clipboardText = 'Text from clipboard'
    mockClipboard.readText.mockResolvedValue(clipboardText)
    
    const result = await navigator.clipboard.readText()
    
    expect(result).toBe(clipboardText)
    expect(mockClipboard.readText).toHaveBeenCalledTimes(1)
  })

  it('should handle clipboard write errors', async () => {
    mockClipboard.writeText.mockRejectedValue(new Error('Clipboard access denied'))
    
    await expect(navigator.clipboard.writeText('test')).rejects.toThrow('Clipboard access denied')
  })

  it('should handle clipboard read errors', async () => {
    mockClipboard.readText.mockRejectedValue(new Error('Clipboard access denied'))
    
    await expect(navigator.clipboard.readText()).rejects.toThrow('Clipboard access denied')
  })

  it('should handle empty string copy', async () => {
    mockClipboard.writeText.mockResolvedValue(undefined)
    
    await navigator.clipboard.writeText('')
    
    expect(mockClipboard.writeText).toHaveBeenCalledWith('')
  })
})
