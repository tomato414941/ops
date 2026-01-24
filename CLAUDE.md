# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start development server (port 3000)
npm run dev -- --hostname 0.0.0.0  # Listen on all interfaces (for remote access)
npm run build            # Production build
npm run lint             # Run ESLint
```

## Architecture

This is a Next.js dashboard for managing Claude Code CLI sessions via web UI.

### Core Flow
1. User selects a Project → Connection → creates a Session
2. Session spawns `claude` CLI process with `--output-format stream-json`
3. CLI output is streamed to browser via Server-Sent Events (SSE)

### Key Files
- `src/lib/claude-cli.ts` - Spawns Claude CLI process and parses stream output
- `src/app/api/sessions/[id]/route.ts` - SSE endpoint that runs Claude CLI and streams responses
- `src/components/SessionView.tsx` - Chat UI with real-time streaming display
- `src/data/dummy.ts` - In-memory data store (projects, sessions, messages)
- `src/types/project.ts` - Type definitions for Project, Connection, Session, Message

### Data Model
- **Project** has many **Connections** (claude_code_cli or agent_sdk type)
- **Connection** has a working directory for CLI execution
- **Session** belongs to a Connection, stores chat history
