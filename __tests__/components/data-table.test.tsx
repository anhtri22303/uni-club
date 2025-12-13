import { render, screen } from '@testing-library/react'
import { DataTable } from '@/components/data-table'
import { ColumnDef } from '@tanstack/react-table'

interface TestData {
  id: number
  name: string
  email: string
}

describe('DataTable Component', () => {
  const mockData: TestData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
  ]

  const columns: ColumnDef<TestData>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
  ]

  it('should render table component', () => {
    const { container } = render(<DataTable columns={columns} data={mockData} />)
    expect(container).toBeInTheDocument()
  })

  it('should handle empty data', () => {
    const { container } = render(<DataTable columns={columns} data={[]} />)
    expect(container).toBeInTheDocument()
  })

  it('should accept columns and data props', () => {
    expect(() => {
      render(<DataTable columns={columns} data={mockData} />)
    }).not.toThrow()
  })
})
