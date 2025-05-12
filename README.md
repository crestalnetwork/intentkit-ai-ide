# IntentKit Sandbox UI

A Next.js application for testing and interacting with [IntentKit](https://github.com/crestalnetwork/intentkit) agents - a powerful autonomous agent framework.

<div align="center">
  <video src="https://github.com/user-attachments/assets/416f67fd-a7b6-4b1e-bac2-5c31c96efc97" width="600" autoplay loop muted playsinline></video>
</div>

## Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Python 3.12+ (for running IntentKit server)
- Running IntentKit server (see [Setup IntentKit Server](#setup-intentkit-server) below)

## Step-by-Step Getting Started

### 1. Clone IntentKit Repository (Required)

```bash
# Clone the IntentKit repository
git clone https://github.com/crestalnetwork/intentkit.git
cd intentkit

# Set up Python environment
python3.12 -m venv .venv
source .venv/bin/activate
pip install poetry
poetry install --with dev

# Configure environment
cp example.env .env
# Edit .env with your OPENAI_API_KEY and DB settings

# Run the IntentKit server
uvicorn app.api:app --reload
```

### 2. Clone and Set Up This UI (In a New Terminal)

```bash
# Clone this repository
git clone https://github.com/bluntbrain/intentkit-sandbox-ui.git
cd intentkit-sandbox-ui

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 3. Create Your First Agent

In a new terminal, navigate to the IntentKit directory:

```bash
cd path/to/intentkit/scripts
sh create.sh my-first-agent
```

### 4. Access the UI

Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

You should now see the IntentKit Sandbox UI. Use the settings icon to configure the server URL if needed (default: http://127.0.0.1:8000).

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

## Creating Additional Agents

To create more agents:
```bash
cd intentkit/scripts
sh create.sh another-agent
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

