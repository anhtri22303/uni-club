import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/empty-state'
import { Package } from 'lucide-react'

describe('EmptyState Component', () => {
  it('should render with title and description', () => {
    render(
      <EmptyState
        title="No data found"
        description="There are no items to display"
      />
    )

    expect(screen.getByText(/no data found/i)).toBeInTheDocument()
    expect(screen.getByText(/there are no items/i)).toBeInTheDocument()
  })

  it('should render with custom icon', () => {
    render(
      <EmptyState
        title="No packages"
        icon={<Package data-testid="package-icon" />}
      />
    )

    expect(screen.getByTestId('package-icon')).toBeInTheDocument()
  })

  it('should render without description', () => {
    render(<EmptyState title="Empty" />)

    expect(screen.getByText(/empty/i)).toBeInTheDocument()
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
  })

  it('should render with action button', () => {
    const handleAction = jest.fn()
    render(
      <EmptyState
        title="No items"
        action={
          <button onClick={handleAction}>Add Item</button>
        }
      />
    )

    const button = screen.getByRole('button', { name: /add item/i })
    expect(button).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <EmptyState
        title="Test"
        className="custom-empty-state"
      />
    )

    expect(container.firstChild).toHaveClass('custom-empty-state')
  })
})
