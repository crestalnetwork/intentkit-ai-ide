# IntentKit Sandbox UI

A Next.js application for testing and interacting with [IntentKit](https://github.com/crestalnetwork/intentkit) agents.

## Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Running IntentKit server (see [Setup IntentKit Server](#setup-intentkit-server) below)

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to http://localhost:3000

## Features

- Chat with IntentKit agents
- View and manage agent configurations
- Test agent skills (token, portfolio, etc.)
- View JSON responses with syntax highlighting
- Configure server connection settings

## Usage

1. By default, the UI connects to an IntentKit server running on http://127.0.0.1:8000
2. Change the server URL in the settings panel (gear icon)
3. Select an agent from the sidebar to start chatting
4. Toggle between chat and configuration view with the "View Details" button

## Setup IntentKit Server

This UI requires a running IntentKit server to function. Follow these steps to set up IntentKit:

### Option 1: Docker (Quick Setup)

1. Create a new directory and navigate into it:
```bash
mkdir intentkit && cd intentkit
```

2. Download required files:
```bash
curl -O https://raw.githubusercontent.com/crestalnetwork/intentkit/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/crestalnetwork/intentkit/main/example.env
```

3. Configure environment:
```bash
mv example.env .env
# Edit .env file and add your OPENAI_API_KEY
```

4. Start the services:
```bash
docker compose up
```

### Option 2: Local Development

1. Clone the repository:
```bash
git clone https://github.com/crestalnetwork/intentkit.git
cd intentkit
```

2. Set up Python environment (requires Python 3.12+):
```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install poetry
poetry install --with dev
```

3. Configure environment:
```bash
cp example.env .env
# Edit .env with your OPENAI_API_KEY and DB settings
```

4. Run the application:
```bash
uvicorn app.api:app --reload
```

### Creating Your First Agent

Once IntentKit is running:
```bash
cd scripts
sh create.sh my-agent
```

Test your agent:
```bash
curl "http://127.0.0.1:8000/debug/my-agent/chat?q=Hello"
```

## Configuration

- Server URL is stored in localStorage for persistence
- Authentication credentials (if required) are also stored in localStorage

## Development

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial. 