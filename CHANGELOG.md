# Changelog

## v1.3.1

### Bug Fixes
- **Twitter API Keys**: Fixed Twitter skill to show 4 separate API key input fields instead of 1
  - X API consumer key
  - X API consumer secret  
  - X API access token
  - X API access token secret
- **Backward Compatible**: Other skills with single API keys still work normally

## v1.3.0

### New Features
- **Markdown Support**: Added full markdown rendering in chat
  - Text formatting (bold, italic)
  - Clickable links that open in new tabs
  - Code blocks with syntax highlighting
  - Tables, lists, and blockquotes
  - Neon-themed styling

[PR #28](https://github.com/crestalnetwork/intentkit-ai-ide/pull/28)

## v1.2.0

### New Features
- **Better Chat Input**: Replaced single-line input with auto-expanding textarea
- **API Skills**: Removed local skills.json, now fetches from API

### Bug Fixes
- Logged out users redirect to home instead of showing error dialogs

[PR #26](https://github.com/crestalnetwork/intentkit-ai-ide/pull/26)

## v1.1.0

### New Features
- **Branding Change**: Updated visual identity
- **Autonomous Logs**: Added logs in agent details to create, edit, and monitor autonomous tasks
- **Advanced Config**: JSON editing in agent details
- **LLM Models**: Model change dropdown in agent details

[PR #24](https://github.com/crestalnetwork/intentkit-ai-ide/pull/24)

## v1.0.0

### Initial Release
- **IntentKit AI**: Web interface for creating and managing AI agents
- **Agent Creation**: Build agents with custom configurations and templates
- **Real-time Chat**: Chat with your agents using conversation threads
- **Skill System**: Agents can use 30+ built-in skills for blockchain, social media, and data
- **Authentication**: Secure login with Supabase
- **Nation API**: Full integration with IntentKit backend services

IntentKit AI is an autonomous agent framework that lets you create AI agents with blockchain and cryptocurrency capabilities. Agents can interact with DeFi protocols, manage social media, and execute complex tasks across multiple platforms.
