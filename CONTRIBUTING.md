# Contributing to UniClub

Thank you for your interest in contributing to UniClub! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Git
- Code editor (VS Code recommended)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/anhtri22303/uni-club.git
cd uni-club
```

2. Install dependencies:
```bash
pnpm install
```

3. Create `.env.local` file (contact team for credentials)

4. Run development server:
```bash
pnpm dev
```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

## Code Standards

### TypeScript

- Use TypeScript strict mode
- Avoid `any` types - use proper typing
- Export interfaces for all API responses and props
- Use explicit return types for functions

### React Components

```typescript
// ✅ Good
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick} className={variant}>{children}</button>;
}

// ❌ Bad
export function Button(props: any) {
  return <button {...props} />;
}
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces**: PascalCase with descriptive names (`User`, `EventDetails`)

### File Organization

```
app/
  role/
    feature/
      page.tsx           # Route page
      components/        # Feature-specific components
service/
  featureApi.ts         # API calls for feature
components/
  ui/                   # Reusable UI components
  feature-component.tsx # Business components
hooks/
  use-feature.ts        # Custom hooks
types/
  feature.types.ts      # TypeScript types
```

### Styling

- Use Tailwind CSS utility classes
- Use Shadcn UI components when available
- Avoid inline styles
- Keep className strings organized

```tsx
// ✅ Good
<div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-md">

// ❌ Bad
<div style={{ display: 'flex', padding: '16px' }}>
```

## Testing Requirements

### Test Coverage Requirements

All new code must include tests:

- **API Services**: 100% coverage required
- **Hooks**: 80%+ coverage
- **Components**: 60%+ coverage for business logic components
- **Utilities**: 90%+ coverage

### Writing Tests

```typescript
// API Service Test Example
describe('getUserById', () => {
  it('should fetch user by id', async () => {
    const mockResponse = { data: { id: 1, name: 'John' } };
    (axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse);

    const result = await getUserById(1);

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/users/1');
    expect(result.name).toBe('John');
  });

  it('should handle user not found', async () => {
    (axiosInstance.get as jest.Mock).mockRejectedValue({
      response: { status: 404 }
    });

    await expect(getUserById(999)).rejects.toBeTruthy();
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test path/to/test.test.ts
```

### Test Checklist

Before submitting PR:
- [ ] All tests pass
- [ ] New code has tests
- [ ] Coverage requirements met
- [ ] No console.log or debug code
- [ ] No TODO comments without issue links

## Pull Request Process

### Before Creating PR

1. **Sync with latest develop**:
```bash
git checkout develop
git pull origin develop
git checkout your-feature-branch
git rebase develop
```

2. **Run checks**:
```bash
pnpm test
pnpm build
```

3. **Clean up code**:
   - Remove debug code
   - Remove unused imports
   - Fix ESLint warnings
   - Update documentation

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] All tests passing

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### PR Review Process

1. Submit PR to `develop` branch
2. Ensure CI passes (when configured)
3. Request review from 1+ team members
4. Address review comments
5. Squash merge after approval

## Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(auth): add Google OAuth login

- Implement Google OAuth flow
- Add OAuth button to login page
- Store OAuth tokens in session

Closes #123

fix(wallet): handle insufficient balance error

test(api): add tests for clubApi service

docs: update README with test instructions
```

## Code Review Guidelines

### As a Reviewer

- Be respectful and constructive
- Ask questions, don't demand changes
- Approve if no blocking issues
- Explain reasoning for requested changes

### As an Author

- Respond to all comments
- Don't take feedback personally
- Ask for clarification if needed
- Update code based on valid feedback

## Need Help?

- Check existing issues and PRs
- Ask in team chat
- Contact maintainers: anhtri22303@gmail.com

## License

By contributing, you agree that your contributions will be licensed under the project's license.
