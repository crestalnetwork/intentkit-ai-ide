# Installation Guide

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Supabase account for authentication

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Development Configuration (Optional)
NEXT_PUBLIC_APP_ENV=dev  # Enable development logging
NODE_ENV=development     # Automatically enables logging
```

### 3. Base URL Settings

The application is configured to use the sandbox API by default. You can modify this in `lib/utils/config.ts`:

- **Default**: `https://sandbox.service.crestal.dev` (Production sandbox)
- **Local Development**: Change to `http://127.0.0.1:8000` for local API
- **Custom**: Update the configuration as needed

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 5. Authentication Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the API settings
3. Add them to your `.env.local` file
4. The app will handle user registration and authentication automatically

## Production Deployment

For production deployment:

1. Set environment variables:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
   NEXT_PUBLIC_APP_ENV=prod  # Disable logging
   NODE_ENV=production
   ```

2. Build and deploy:
   ```bash
   npm run build
   npm start
   ```

## Troubleshooting

### Common Issues

1. **Authentication errors**: Verify your Supabase credentials
2. **API connection issues**: Check the base URL configuration
3. **Build errors**: Ensure all dependencies are installed

### Support

For technical issues, contact: [support@crestal.network](mailto:support@crestal.network) 