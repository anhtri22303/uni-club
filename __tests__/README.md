# Testing Documentation

## Overview
This project uses Jest and React Testing Library for comprehensive testing coverage.

## Test Coverage Strategy

### Target: 40-50% Coverage
We aim for 40-50% test coverage across critical parts of the codebase:
- **API Services**: 80%+ coverage
- **Utilities & Hooks**: 80%+ coverage  
- **Critical Components**: 60%+ coverage
- **UI Components**: 40%+ coverage

### Testing Pyramid
1. **Unit Tests** (70%): Test individual functions, hooks, and utilities
2. **Integration Tests** (20%): Test API services and component interactions
3. **Component Tests** (10%): Test critical UI components

## Test Structure
```
__tests__/
├── components/       # Component tests
│   ├── ui/          # UI component tests (Button, Input, etc.)
│   ├── feedback-modal.test.tsx
│   ├── data-table.test.tsx
│   └── empty-state.test.tsx
├── contexts/        # Context & Provider tests
│   └── auth-context.test.tsx
├── hooks/           # Custom hooks tests
│   └── use-pagination.test.ts
├── lib/             # Utility functions tests
│   ├── utils.test.ts
│   ├── eventUtils.test.tsx
│   └── clipboardManager.test.ts
├── service/         # API service tests
│   ├── eventApi.test.ts
│   ├── clubApi.test.ts
│   └── walletApi.test.ts
└── __mocks__/       # Mock files for testing
```

## Running Tests

### Run all tests
```bash
pnpm test
```

### Run tests in watch mode
```bash
pnpm test:watch
```

### Run tests with coverage report
```bash
pnpm test:coverage
```

### Run specific test file
```bash
pnpm test use-pagination
```

## Test Files Overview

### 1. Context Tests
- **`__tests__/contexts/auth-context.test.tsx`**
  - Login/logout functionality
  - Google OAuth integration
  - Session management
  - Role-based routing

### 2. API Service Tests
- **`__tests__/service/eventApi.test.ts`**
  - Event CRUD operations
  - Event registration & check-in
  - Helper functions (time conversion, multi-day detection)
  
- **`__tests__/service/clubApi.test.ts`**
  - Club fetching and creation
  - Join/leave club operations
  - Error handling

- **`__tests__/service/walletApi.test.ts`**
  - Wallet operations
  - Points transfer & rewards
  - Transaction history

### 3. Component Tests
- **`__tests__/components/ui/button.test.tsx`** - Button variants and interactions
- **`__tests__/components/ui/input.test.tsx`** - Input field functionality
- **`__tests__/components/empty-state.test.tsx`** - Empty state rendering
- **`__tests__/components/data-table.test.tsx`** - Data table component
- **`__tests__/components/feedback-modal.test.tsx`** - Feedback modal

### 4. Hook Tests
- **`__tests__/hooks/use-pagination.test.ts`** - Pagination logic with comprehensive coverage

### 5. Utility Tests
- **`__tests__/lib/utils.test.ts`** - className utility (`cn()`)
- **`__tests__/lib/eventUtils.test.tsx`** - Event badge rendering
- **`__tests__/lib/clipboardManager.test.ts`** - Clipboard operations

## Writing New Tests

### Test Structure Template
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '@/components/my-component'

describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render correctly', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const handleClick = jest.fn()
    render(<MyComponent onClick={handleClick} />)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### API Service Test Template
```typescript
import axiosInstance from '@/lib/axiosInstance'
import { fetchData } from '@/service/dataApi'

jest.mock('@/lib/axiosInstance')

describe('DataApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' }
    ;(axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockData })

    const result = await fetchData(1)

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/data/1')
    expect(result).toEqual(mockData)
  })

  it('should handle errors', async () => {
    ;(axiosInstance.get as jest.Mock).mockRejectedValue(new Error('Network error'))

    await expect(fetchData(1)).rejects.toThrow('Network error')
  })
})
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` and `afterEach` for setup/cleanup
- Clear all mocks between tests

### 2. Clear Naming
- Use descriptive test names: `should [action] when [condition]`
- Group related tests with `describe` blocks

### 3. Arrange-Act-Assert Pattern
```typescript
it('should update counter on click', async () => {
  // Arrange
  render(<Counter initialValue={0} />)
  
  // Act
  const button = screen.getByRole('button')
  await userEvent.click(button)
  
  // Assert
  expect(screen.getByText('1')).toBeInTheDocument()
})
```

### 4. Mock External Dependencies
- Mock API calls, external services
- Use jest.mock() for module mocking
- Create __mocks__ directory for reusable mocks

### 5. Test User Behavior, Not Implementation
```typescript
// ❌ Bad - Testing implementation
expect(component.state.isOpen).toBe(true)

// ✅ Good - Testing behavior
expect(screen.getByRole('dialog')).toBeVisible()
```

### 6. Async Testing
```typescript
// Use waitFor for async updates
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})

// Use findBy queries (automatically wait)
expect(await screen.findByText('Loaded')).toBeInTheDocument()
```

## Coverage Goals by Module

| Module | Target Coverage | Current |
|--------|----------------|---------|
| API Services | 80% | ~75% |
| Utilities | 80% | 100% |
| Hooks | 80% | 100% |
| Critical Components | 60% | ~40% |
| UI Components | 40% | ~25% |
| **Overall** | **40-50%** | **~45%** |

## Continuous Improvement

### Priority Test Areas
1. ✅ Authentication flows
2. ✅ API service layer
3. ✅ Wallet & Points operations
4. 🔄 Form validations
5. 🔄 Event management flows
6. ⏳ User registration/profile

### Known Gaps
- E2E tests (consider Playwright/Cypress)
- Visual regression tests
- Performance tests
- Accessibility tests

## Configuration

### Jest Configuration (`jest.config.js`)
- Next.js integration
- jsdom environment
- Path aliasing (@/...)
- Coverage collection from app/, components/, lib/, hooks/

### Setup File (`jest.setup.js`)
- Global test utilities
- Mock configurations
- Custom matchers

## Troubleshooting

### Common Issues

1. **"Cannot find module '@/...'"**
   - Check `moduleNameMapper` in jest.config.js
   - Ensure tsconfig.json paths are correct

2. **"Element is not visible"**
   - Use `findBy` queries instead of `getBy`
   - Add `waitFor` for dynamic content

3. **"Jest did not exit"**
   - Clear timers and cleanup async operations
   - Use `jest --detectOpenHandles` to find issues

4. **Clear Jest cache**
   ```bash
   pnpm test --clearCache
   ```

5. **Reinstall dependencies**
   ```bash
   rm -rf node_modules && pnpm install
   ```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Next.js Testing](https://nextjs.org/docs/testing)

## Notes

- Tests do NOT affect production build
- All test files are excluded from Next.js build
- Coverage reports generated in `coverage/` (git-ignored)
- Run tests before committing code
- Aim to add tests for new features
