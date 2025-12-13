import React from 'react'
import { render, screen } from '@testing-library/react'
import { renderTypeBadge } from '@/lib/eventUtils'

describe('EventUtils - renderTypeBadge', () => {
  it('should render PUBLIC badge correctly', () => {
    const { container } = render(renderTypeBadge('PUBLIC'))
    expect(container.textContent).toContain('Public')
    const badge = container.querySelector('[class*="bg-green-100"]')
    expect(badge).toBeInTheDocument()
  })

  it('should render PRIVATE badge correctly', () => {
    const { container } = render(renderTypeBadge('PRIVATE'))
    expect(container.textContent).toContain('Private')
    const badge = container.querySelector('[class*="bg-red-100"]')
    expect(badge).toBeInTheDocument()
  })

  it('should render SPECIAL badge correctly', () => {
    const { container } = render(renderTypeBadge('SPECIAL'))
    expect(container.textContent).toContain('Special')
    const badge = container.querySelector('[class*="bg-indigo-100"]')
    expect(badge).toBeInTheDocument()
  })

  it('should handle lowercase type correctly', () => {
    const { container } = render(renderTypeBadge('public'))
    expect(container.textContent).toContain('Public')
  })

  it('should handle undefined type', () => {
    const { container } = render(renderTypeBadge(undefined))
    expect(container.textContent).toContain('Unknown')
  })

  it('should handle unknown type', () => {
    const { container } = render(renderTypeBadge('CUSTOM_TYPE'))
    expect(container.textContent).toContain('CUSTOM_TYPE')
  })

  it('should handle empty string', () => {
    const { container } = render(renderTypeBadge(''))
    expect(container.textContent).toContain('Unknown')
  })
})
