# Trellis

> **Note:** This project is currently under active development.

A Claude Code based learning companion for curious autodidacts. Trellis helps you explore topics through AI-powered conversations while tracking your knowledge growth over time.

## Features

- **Conversational Learning** - Chat with Claude to explore any topic in depth
- **Knowledge Tracking** - Automatically extracts and maps concepts as you learn
- **Personalized Teaching Styles** - Choose between Socratic, hands-on, theoretical, or storyteller approaches
- **Smart Dashboard** - Get suggestions for what to learn next based on your history
- **Topic Organization** - Sessions are grouped by topic with summaries and knowledge graphs
- **Local-First** - All data stored locally using IndexedDB, no API key storage

## Requirements

- [Claude CLI](https://github.com/anthropics/claude-code) installed and configured
- Node.js 18+
- Rust (for Tauri)

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/trellis.git
cd trellis

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Zustand
- **Desktop**: Tauri v2
- **Storage**: Dexie (IndexedDB)
- **AI**: Claude CLI

## Roadmap

We're just getting started. Here's what's coming next:

- **Multi-Provider Support** - Bring your own AI with Gemini CLI integration and OpenRouter API keys
- **Web App** - Access Trellis from anywhere with a hosted web version
- **Desktop Installers** - One-click installers for macOS, Windows, and Linux — no dev setup required

Have ideas? Open an issue or start a discussion!

## License

MIT
