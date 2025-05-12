# IntentKit Sandbox UI

A Next.js application for testing and interacting with [IntentKit](https://github.com/crestalnetwork/intentkit) agents - a powerful autonomous agent framework.

## Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Running IntentKit server (see [Setup IntentKit Server](#setup-intentkit-server) below)

## Step-by-Step Getting Started

### 1. Clone and Set Up This UI

```bash
# Clone this repository
git clone https://github.com/bluntbrain/intentkit-sandbox-ui.git
cd intentkit-sandbox-ui

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 2. Access the UI

Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Features

- 🤖 Chat with IntentKit agents
- 📋 View and manage agent configurations
- 💼 Test agent skills (token, portfolio, etc.)
- 🔍 View JSON responses with syntax highlighting
- ⚙️ Configure server connection settings

## Usage Guide

1. **Connect to IntentKit Server**: By default, the UI connects to an IntentKit server running on http://127.0.0.1:8000
2. **Configure Server Settings**: Click the gear icon (⚙️) to change the server URL if needed
3. **Select an Agent**: Choose an agent from the sidebar list to start working with it
4. **Interact with the Agent**: Send messages and view responses in the chat interface
5. **View Agent Details**: Toggle between chat and configuration view with the "View Details" button

## Setup IntentKit Server

This UI requires a running IntentKit server to function. Follow these steps to set up IntentKit:

### Local Development (Recommended)

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
sh create.sh my-first-agent
```

Test your agent:
```bash
curl "http://127.0.0.1:8000/debug/my-first-agent/chat?q=Hello"
```

## Key IntentKit Documentation

To get the most out of this UI, familiarize yourself with these IntentKit documents:

- [IntentKit Overview](https://github.com/crestalnetwork/intentkit/blob/main/README.md) - Main project README
- [Development Guide](https://github.com/crestalnetwork/intentkit/blob/main/DEVELOPMENT.md) - Setup and configuration
- [Agent Management Documentation](https://github.com/crestalnetwork/intentkit/blob/main/docs/agent.md) - How to manage agents
- [Skills Development Guide](https://github.com/crestalnetwork/intentkit/blob/main/docs/contributing/skills.md) - How to create custom skills
- [Contributing Guidelines](https://github.com/crestalnetwork/intentkit/blob/main/CONTRIBUTING.md) - How to contribute to IntentKit

## Configuration

- Server URL is stored in localStorage for persistence
- Authentication credentials (if required) are also stored in localStorage

## Troubleshooting

- **Can't connect to the server?** Make sure the IntentKit server is running at the configured URL
- **No agents showing up?** You need to create at least one agent using the IntentKit CLI
- **Authentication errors?** Click the gear icon to enter your credentials

## Contributing

Contributions to this UI project are welcome. Please feel free to submit a PR or create an issue.

## License

This project is licensed under the MIT License.

## Development

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial. 