# UniClub Architecture Documentation

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture Patterns](#architecture-patterns)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [Authentication & Authorization](#authentication--authorization)
- [API Layer](#api-layer)
- [State Management](#state-management)
- [Routing Strategy](#routing-strategy)
- [Testing Architecture](#testing-architecture)

## Overview

UniClub is built using modern web technologies with a focus on:
- **Type Safety**: TypeScript throughout
- **Component Modularity**: Reusable UI and business components
- **Separation of Concerns**: Clear boundaries between layers
- **Testability**: Comprehensive test coverage
- **Performance**: Optimized rendering and data fetching

## Technology Stack

### Frontend Framework
- **Next.js 14**: React framework with App Router
- **React 18**: UI library with Hooks and Context API
- **TypeScript**: Static type checking

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI**: Accessible component library
- **CSS Modules**: Scoped styling when needed

### Data Fetching
- **Axios**: HTTP client with interceptors
- **Custom Hooks**: Reusable data fetching logic

### Testing
- **Jest**: Test framework
- **React Testing Library**: Component testing
- **Mock Service Worker**: API mocking (planned)

### Build & Development
- **pnpm**: Fast, disk-efficient package manager
- **ESLint**: Code linting
- **Prettier**: Code formatting (planned)

## Architecture Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│    (Components, Pages, Hooks)       │
├─────────────────────────────────────┤
│        Business Logic Layer         │
│    (Contexts, Custom Hooks)         │
├─────────────────────────────────────┤
│          Service Layer              │
│         (API Services)              │
├─────────────────────────────────────┤
│         Infrastructure Layer        │
│    (Axios, Utils, Constants)       │
└─────────────────────────────────────┘
```

### 2. Component Hierarchy

```
App Layout
├── Auth Context (Global)
├── Loading Context (Global)
├── Notification Context (Global)
└── Role-based Layouts
    ├── Admin Layout
    │   └── Admin Pages
    ├── UniStaff Layout
    │   └── UniStaff Pages
    ├── ClubLeader Layout
    │   └── ClubLeader Pages
    └── Student Layout
        └── Student Pages
```

### 3. Design Patterns Used

- **Provider Pattern**: Context API for global state
- **Custom Hooks Pattern**: Reusable stateful logic
- **Composition Pattern**: Building complex UIs from simple components
- **Container/Presentational Pattern**: Separating logic from UI
- **Repository Pattern**: API service layer abstraction

## Project Structure

```
uni-club/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin role routes
│   ├── club-leader/              # Club leader routes
│   ├── uni-staff/                # University staff routes
│   ├── student/                  # Student routes
│   ├── api/                      # API routes (if any)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                   # React components
│   ├── ui/                       # Reusable UI components (buttons, inputs, etc.)
│   ├── report/                   # Rich text editor components
│   └── [feature]-component.tsx  # Business logic components
│
├── contexts/                     # React Context providers
│   ├── auth-context.tsx          # Authentication state
│   ├── loading-context.tsx       # Loading state
│   └── notification-context.tsx  # Notifications
│
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts               # Authentication hook
│   ├── use-loading.ts            # Loading state hook
│   └── use-data-loader.ts        # Data fetching hook
│
├── service/                      # API service layer (29 files)
│   ├── authApi.ts                # Authentication APIs
│   ├── userApi.ts                # User management
│   ├── clubApi.ts                # Club operations
│   └── [feature]Api.ts           # Feature-specific APIs
│
├── lib/                          # Utilities and helpers
│   ├── axiosInstance.ts          # Configured Axios instance
│   ├── browser-utils.ts          # Browser utilities
│   └── utils.ts                  # General utilities
│
├── types/                        # TypeScript type definitions
│   └── [feature].types.ts        # Feature-specific types
│
├── __tests__/                    # Test files (mirrors src structure)
│   ├── service/                  # API service tests (32 files)
│   ├── components/               # Component tests
│   └── hooks/                    # Hook tests
│
└── public/                       # Static assets
    ├── images/
    └── icons/
```

## Data Flow

### 1. User Interaction Flow

```
User Action
    ↓
Component Event Handler
    ↓
Custom Hook (optional)
    ↓
API Service Call
    ↓
Axios Interceptor (add auth token)
    ↓
Backend API
    ↓
Response Processing
    ↓
State Update (Context/useState)
    ↓
Component Re-render
```

### 2. Authentication Flow

```
Login Page
    ↓
authApi.login(credentials)
    ↓
Backend validates credentials
    ↓
JWT tokens returned (access + refresh)
    ↓
Tokens stored in memory + httpOnly cookie
    ↓
AuthContext updates user state
    ↓
Redirect to role-based dashboard
    ↓
All subsequent requests include JWT in headers (via interceptor)
```

### 3. Protected Route Flow

```
User navigates to /admin/dashboard
    ↓
Layout component loads
    ↓
ProtectedRoute checks AuthContext
    ↓
If not authenticated → redirect to /login
If wrong role → redirect to appropriate dashboard
If authorized → render page
```

## Authentication & Authorization

### JWT Token Management

```typescript
// Token storage strategy
- Access Token: Memory (React Context)
- Refresh Token: HttpOnly Cookie (automatic)

// Token refresh flow
1. Access token expires
2. Axios interceptor catches 401
3. Calls refresh endpoint with cookie
4. Gets new access token
5. Retries original request
6. Updates context with new token
```

### Role-Based Access Control (RBAC)

```typescript
Roles:
- ADMIN: Full system access
- UNIVERSITY_STAFF: University management
- CLUB_LEADER: Club management
- STUDENT: Club member access

Role Hierarchy:
ADMIN > UNIVERSITY_STAFF > CLUB_LEADER > STUDENT

Implementation:
- Route-level protection via layouts
- Component-level via conditional rendering
- API-level via backend validation
```

## API Layer

### Service Architecture

```typescript
// Each API service follows this pattern:

// 1. Type definitions
export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
}

// 2. API functions
export const getUserById = async (id: number): Promise<User> => {
  try {
    const response = await axiosInstance.get(`/api/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// 3. Export all functions
export default {
  getUserById,
  updateUser,
  deleteUser,
  // ...
};
```

### Axios Configuration

```typescript
// Base configuration
- Base URL from environment variable
- Timeout: 30 seconds
- Headers: 'Content-Type': 'application/json'

// Request Interceptor
- Adds Authorization header with JWT token
- Adds custom headers if needed

// Response Interceptor
- Handles token refresh on 401
- Transforms response data
- Catches and logs errors
```

## State Management

### Global State (React Context)

```typescript
1. AuthContext
   - User data
   - Authentication status
   - Login/logout functions

2. LoadingContext
   - Loading states
   - Progress tracking

3. NotificationContext
   - Notification list
   - Add/remove notifications
```

### Local State (useState/useReducer)

- Form inputs
- UI toggle states
- Component-specific data

### Server State (Future: React Query)

- API response caching
- Automatic refetching
- Optimistic updates

## Routing Strategy

### Next.js App Router

```
app/
├── (auth)/              # Authentication pages (no layout)
│   ├── login/
│   └── register/
│
├── admin/              # Admin dashboard
│   ├── layout.tsx      # Admin layout + protection
│   ├── page.tsx        # Admin home
│   └── [feature]/      # Admin features
│
├── club-leader/        # Club leader dashboard
│   ├── layout.tsx
│   └── [feature]/
│
├── uni-staff/          # University staff
│   ├── layout.tsx
│   └── [feature]/
│
└── student/            # Student area
    ├── layout.tsx
    └── [feature]/
```

### Route Protection

```typescript
// Implemented in layout.tsx for each role
1. Check if user is authenticated
2. Verify user has correct role
3. Redirect if unauthorized
4. Render children if authorized
```

## Testing Architecture

### Test Organization

```
__tests__/
├── service/              # API service tests
│   ├── authApi.test.ts
│   ├── userApi.test.ts
│   └── ...              # 32 test files
│
├── components/          # Component tests
│   ├── ui/
│   └── [feature].test.tsx
│
├── hooks/               # Custom hook tests
│   ├── use-auth.test.ts
│   └── use-loading.test.ts
│
└── lib/                 # Utility tests
    └── utils.test.ts
```

### Testing Strategy

```typescript
// API Service Tests (100% coverage achieved)
- Mock axiosInstance
- Test success cases
- Test error cases (404, 401, 500)
- Test edge cases (empty data, invalid input)

// Component Tests
- Render tests
- User interaction tests
- Props validation
- Conditional rendering

// Hook Tests
- State changes
- Side effects
- Return values
- Error handling
```

### Test Utilities

```typescript
// Mocking Strategy
- axios: jest.mock('@/lib/axiosInstance')
- Router: jest.mock('next/navigation')
- Context: Custom test providers

// Test Data Factories
- createMockUser()
- createMockEvent()
- createMockClub()
```

## Performance Optimizations

### Current Optimizations

1. **Next.js Optimizations**
   - Automatic code splitting
   - Image optimization with next/image
   - Font optimization

2. **Component Optimizations**
   - Lazy loading for heavy components
   - Memoization where appropriate

### Planned Optimizations

1. **Data Fetching**
   - Implement React Query for caching
   - Server-side rendering for public pages
   - Prefetching for predictable navigation

2. **Bundle Size**
   - Tree shaking unused code
   - Dynamic imports for large dependencies
   - Analyze bundle with @next/bundle-analyzer

3. **Runtime Performance**
   - Virtual scrolling for long lists
   - Debouncing search inputs
   - Throttling scroll events

## Security Considerations

### Implemented

- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Protected routes
- ✅ HTTPS in production
- ✅ Environment variables for secrets

### To Implement

- ⚠️ CSRF protection
- ⚠️ Rate limiting
- ⚠️ Input sanitization
- ⚠️ SQL injection prevention (backend)
- ⚠️ XSS prevention

## Deployment Architecture

```
Development → Staging → Production

Build Process:
1. pnpm install
2. pnpm build (Next.js build)
3. pnpm start

Production Setup:
- Vercel/AWS/Similar hosting
- Environment variables configured
- Database connection pooling
- CDN for static assets
- Monitoring and logging
```

## Future Architectural Improvements

1. **State Management**: Migrate to Zustand or React Query
2. **API Layer**: Implement API client generator (OpenAPI)
3. **Testing**: Add E2E tests with Playwright
4. **CI/CD**: Automate testing and deployment
5. **Monitoring**: Add error tracking (Sentry) and analytics
6. **Documentation**: Auto-generate API docs from TypeScript types

---

**Last Updated:** December 14, 2025  
**Version:** 1.0.0  
**Maintained By:** UniClub Development Team
