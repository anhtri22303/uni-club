# Loading Component

A reusable loading indicator component with customizable size and text.

## Features

- **Multiple Sizes**: `sm`, `md`, `lg`, `xl`
- **Optional Text**: Display loading message
- **Full Screen Mode**: Cover entire screen with backdrop
- **Accessible**: Proper ARIA attributes
- **Animated**: Smooth spinning animation

## Usage

### Basic Usage

```tsx
import { Loading } from "@/components/ui/loading"

export default function MyComponent() {
  return <Loading />
}
```

### With Custom Size

```tsx
<Loading size="sm" />   // Small (16px)
<Loading size="md" />   // Medium (24px) - default
<Loading size="lg" />   // Large (32px)
<Loading size="xl" />   // Extra Large (48px)
```

### With Loading Text

```tsx
<Loading text="Loading clubs..." />
<Loading size="lg" text="Submitting your application..." />
```

### Full Screen Loading

```tsx
<Loading fullScreen text="Processing..." />
```

### In Modal or Card

```tsx
<Modal open={isOpen}>
  {isLoading ? (
    <div className="py-8">
      <Loading size="lg" text="Submitting your application..." />
    </div>
  ) : (
    <YourContent />
  )}
</Modal>
```

### Custom Styling

```tsx
<Loading 
  className="my-8" 
  size="lg" 
  text="Please wait..."
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `"sm" \| "md" \| "lg" \| "xl"` | `"md"` | Size of the spinner |
| `text` | `string` | `undefined` | Optional loading message |
| `fullScreen` | `boolean` | `false` | Whether to cover entire screen |
| `className` | `string` | `undefined` | Additional CSS classes |

## Examples in Project

### 1. Student Clubs Page
- Loading state when fetching clubs
- Loading state in application modal

### 2. Club Leader Applications Page
- Can be used for processing applications

### 3. Any Async Operation
```tsx
const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async () => {
  setIsLoading(true)
  try {
    await submitData()
  } finally {
    setIsLoading(false)
  }
}

return (
  <div>
    {isLoading ? (
      <Loading text="Submitting..." />
    ) : (
      <YourForm onSubmit={handleSubmit} />
    )}
  </div>
)
```

## Accessibility

The component uses Lucide's `Loader2` icon which includes proper animation and visual feedback for users.

