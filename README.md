# IntentKit Sandbox UI

A Next.js application for testing and interacting with IntentKit agents.

## Features

- Chat with IntentKit agents
- View and manage agent configurations
- Test token and portfolio skills
- View JSON responses with syntax highlighting
- Configure server connection settings

## Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Running IntentKit server

## Setup

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Start the development server:

```bash
npm run dev
# or
yarn dev
```

3. Open your browser and navigate to http://localhost:3000

## Usage

1. By default, the UI will connect to an IntentKit server running on http://127.0.0.1:8000
2. You can change the server URL in the settings panel (gear icon)
3. Select an agent from the sidebar to start chatting
4. Use the "View Details" button to examine agent configuration
5. Chat interface supports both text messages and JSON responses

## Configuration

The application stores your server URL in localStorage for persistence between sessions.

## Development

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial. 