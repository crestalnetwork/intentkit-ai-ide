# Development Guide

## Project Structure

```
/pages          - Next.js pages and routing
/components     - Reusable React components
/hooks          - Custom React hooks (auth, API)
/lib/utils      - Utility functions (logger, API client, templates)
/lib/styles     - Global CSS and styling themes
/constants      - Configuration constants
/types          - TypeScript type definitions
```

## Key Technologies

- **Next.js 13+**: React framework with App Router
- **TypeScript**: Type safety throughout the codebase
- **Tailwind CSS**: Utility-first CSS framework with custom theme
- **Supabase**: Authentication and user management
- **Nation API**: Backend agent management and chat

## Development Features

### Logging System

The application includes a comprehensive logging system controlled by the `IS_DEV` flag:

#### Development Mode (Logging Enabled)
- Set `NEXT_PUBLIC_IS_DEV=true` or `NODE_ENV=development`
- All logs displayed in browser console
- Includes API calls, authentication events, component lifecycle, and errors

#### Production Mode (Logging Disabled)
- Set `NEXT_PUBLIC_IS_DEV=false` or `NODE_ENV=production`
- All logging disabled for performance and security

#### Logger Usage
```typescript
import logger from '../utils/logger';

// Log API calls
logger.apiCall('POST', '/agents', agentData);

// Log authentication events  
logger.auth('User signed in', { userId: user.id });

// Log component events
logger.component('mounted', 'ComponentName');

// Log errors with context
logger.error('Failed to create agent', { error: error.message });
```

### API Client

The `apiClient.ts` provides a centralized HTTP client with:

- **Authentication**: Automatic bearer token handling
- **Error Handling**: Comprehensive error response processing
- **Logging**: All requests/responses logged in development
- **Type Safety**: TypeScript interfaces for all API responses

### Authentication

Uses Supabase with React hooks:

```typescript
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

const { user, signIn, signOut, loading } = useSupabaseAuth();
```

### Theme System

Centralized theme configuration in `lib/utils/theme.ts`:

- **Neon Color Palette**: Lime, cyan, pink, purple variants
- **CSS Custom Properties**: Variables for dynamic theming
- **Component Styles**: Reusable style functions
- **Dark Mode**: Built-in dark theme support

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feat/feature-name

# Make changes
npm run dev

# Test thoroughly
npm run build
```

### 2. Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Linting rules for code consistency
- **Prettier**: Code formatting (applied before commits)

### 3. Testing
- **Manual Testing**: Use development mode with logging
- **Integration Testing**: Test with sandbox API
- **Browser Testing**: Test across different browsers

## API Integration

### Endpoints Used
- `/user/agents` - Get user's agents with full data
- `/user/agents/{id}` - Get single agent with system prompts  
- `/agents/{id}/chats` - Get chat threads
- `/agents/{id}/chats/{thread_id}/messages` - Get messages
- `/agents` - Create new agents

### Error Handling
- Network errors automatically retried
- Authentication errors trigger re-login
- User-friendly error messages shown via toast
- Contact support links shown for persistent errors

## Contact

For development questions: [support@crestal.network](mailto:support@crestal.network) 