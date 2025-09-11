# Loading System Documentation

## Overview

This document explains the loading system implementation across the agency-client-portal application. The system provides consistent loading states for both admin and client sides with global and component-specific loading indicators.

## Components

### 1. Global Loading (`GlobalLoading`)

- **Purpose**: Shows a loading indicator when navigating between routes
- **Implementation**: Uses Next.js router events to detect navigation changes
- **Usage**: Automatically included in `AppLayout`

### 2. Page Loading (`PageLoading`)

- **Location**: `src/components/shared/page-loading.tsx`
- **Purpose**: Generic loading component for full-page loading states
- **Usage**: Can be used in any page or component that needs a simple loading indicator

### 3. Skeleton Loading (`SkeletonLoading`)

- **Location**: `src/components/shared/skeleton-loading.tsx`
- **Purpose**: Provides skeleton loading states for different content types
- **Types**:
  - `card`: For card-based layouts
  - `list`: For list-based layouts
  - `table`: For table-based layouts

### 4. Chat Loading (`ChatLoading`)

- **Location**: `src/components/shared/chat-loading.tsx`
- **Purpose**: Specific loading component for chat interfaces
- **Usage**: Used in `ChatRoom` component

## Implementation Details

### Global Loading

The global loading indicator is implemented using Next.js router events and shows a spinner overlay when navigating between pages.

### Component Loading

Each data-fetching component should implement its own loading state using the following pattern:

```tsx
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch data
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []);

return (
  <div>
    {isLoading ? (
      <SkeletonLoading type="card" />
    ) : (
      // Render actual content
    )}
  </div>
);
```

### Page Loading

Pages with data fetching should show appropriate loading states using either:

1. The global loading indicator (for route changes)
2. Component-specific loading indicators (for data fetching within a page)

## Best Practices

1. **Consistency**: Use the same loading components throughout the application
2. **User Feedback**: Always provide clear loading indicators for long-running operations
3. **Skeleton Loading**: Prefer skeleton loading over simple spinners for better UX
4. **Error Handling**: Always handle loading errors gracefully with retry options

## Customization

To customize the loading components:

1. Modify the components in `src/components/shared/`
2. Adjust colors to match the application theme
3. Add new loading types as needed

## Testing

To test the loading system:

1. Navigate between pages to see the global loading indicator
2. Trigger data fetching operations to see component loading states
3. Simulate slow network conditions to verify loading behavior
