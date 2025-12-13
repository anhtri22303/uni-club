import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'
import React from 'react'

describe('Input Component', () => {
  it('should render input field', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument()
  })

  it('should handle text input', async () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText(/enter text/i)
    
    await userEvent.type(input, 'Hello World')
    
    expect(input).toHaveValue('Hello World')
  })

  it('should handle onChange event', async () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText(/enter text/i)
    await userEvent.type(input, 'Test')
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled" />)
    expect(screen.getByPlaceholderText(/disabled/i)).toBeDisabled()
  })

  it('should render with different types', () => {
    const { rerender } = render(<Input type="text" placeholder="Text" />)
    expect(screen.getByPlaceholderText(/text/i)).toHaveAttribute('type', 'text')

    rerender(<Input type="email" placeholder="Email" />)
    expect(screen.getByPlaceholderText(/email/i)).toHaveAttribute('type', 'email')

    rerender(<Input type="password" placeholder="Password" />)
    expect(screen.getByPlaceholderText(/password/i)).toHaveAttribute('type', 'password')

    rerender(<Input type="number" placeholder="Number" />)
    expect(screen.getByPlaceholderText(/number/i)).toHaveAttribute('type', 'number')
  })

  it('should render with custom className', () => {
    render(<Input className="custom-input" placeholder="Custom" />)
    expect(screen.getByPlaceholderText(/custom/i)).toHaveClass('custom-input')
  })

  it('should support controlled input', async () => {
    const TestComponent = () => {
      const [value, setValue] = React.useState('')
      return (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Controlled"
        />
      )
    }

    render(<TestComponent />)
    const input = screen.getByPlaceholderText(/controlled/i)
    
    await userEvent.type(input, 'Test')
    expect(input).toHaveValue('Test')
  })

  it('should support maxLength attribute', async () => {
    render(<Input maxLength={5} placeholder="Max 5" />)
    const input = screen.getByPlaceholderText(/max 5/i)
    
    await userEvent.type(input, '1234567890')
    expect(input).toHaveValue('12345')
  })
})
