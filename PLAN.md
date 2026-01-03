# Trellis - Learning App Specification

> **Project Name**: Trellis (supporting structure for growth, interconnected framework)

---

## Vision Statement

A learning companion for curious autodidacts who iteratively build knowledge through AI-guided exploration until ready to tackle primary sources. Unlike chat-centric AI interfaces, this app prioritizes **discovery, continuity, and visual demonstration**.

---

## Target User Persona

- Self-directed adult learners
- Comfortable with API keys and technical tools
- Explores diverse subjects (science, philosophy, programming, history...)
- Learns iteratively: LLM → foundational understanding → research papers
- Values building connected knowledge over isolated conversations
- Frustrated by "starting over" in typical chat interfaces

---

## Core Features (MVP)

### 1. Dashboard Home (Primary View)
**Purpose**: Entry point that triggers curiosity, surfaces resume/expand opportunities

**Layout**: Main content area + sidebar for explored themes

- **Main Area - AI-Generated Feed**:
  - On startup, a prompt is sent with the user's current learning state
  - Claude returns structured JSON to populate dashboard cards
  - Card types:
    - "Continue where you left off" - recent topics with clear entry points
    - "Expand your knowledge" - suggestions based on knowledge graph gaps
    - "You might be curious about..." - new discoveries based on interests
    - Connection prompts: "X relates to Y you learned earlier"
  - Cards show: topic name, brief context, last explored timestamp, suggested entry point
  - Quick-start: "Learn something new" prompt input

- **Sidebar - Explored Themes**:
  - List of previously explored topics (NOT generic conversation titles)
  - Each theme has a **clear, recognizable label** (e.g., "Trigonometry", "French Revolution", "Rust Ownership")
  - Grouped by domain/category when applicable
  - Quick visual indicator of exploration depth
  - Click to resume that theme's learning session
  - **Key differentiator**: Themes are semantically meaningful, not AI-generated conversation titles that are hard to decipher

- **Feed Generation Technical Flow**:
  ```
  On app startup:
  1. Load user's knowledge state from IndexedDB
  2. Send prompt to Claude with compacted learning context
  3. Claude returns JSON: { cards: [...], suggestions: [...] }
  4. Render dashboard from structured response
  ```

### 2. Learning Session (Conversation View)
**Purpose**: Natural, styled conversations with Claude for deep exploration

- Clean chat interface accessed from dashboard cards or quick-start
- **Natural flow**: No explicit start/end, system auto-detects topic boundaries
- Messages support rich content: markdown, code blocks, math (KaTeX)
- **AI-determined concept extraction**: Claude identifies and tags concepts during conversation
- Concepts automatically feed into knowledge graph
- Session summaries generated on return to dashboard

### 3. Teaching Style Configuration
**Purpose**: Customize Claude's pedagogical approach

- **Agentic instruction file** prefixed to all prompts
- UI controls that generate/modify the instruction file:
  - Persona presets (Socratic, hands-on, theoretical, storyteller, etc.)
  - Parameters: depth level, pace, example frequency, analogy usage, formality
  - Domain-specific modes (technical, conceptual, historical, etc.)
- **Advanced mode**: Direct editing of the instruction file
- Style persists across sessions, can be overridden per-session

### 4. Visual Sandbox (Side Panel)
**Purpose**: Interactive demonstrations that make abstract concepts tangible

- **Side panel** that updates when Claude generates demos
- Claude can insert/replace/update HTML/CSS/JS in sandboxed iframe
- Examples:
  - Trigonometry: interactive unit circle showing sin/cos
  - Sorting algorithms: animated visualization
  - Physics: force diagram simulator
- User can:
  - Resize panel
  - Pop out to separate window
  - Request modifications ("make it show radians too")
- Code viewable but read-only in MVP (live editing in future iteration)

### 5. Knowledge Persistence
**Purpose**: Build cumulative knowledge, provide context for new sessions

- **Local-first storage** (IndexedDB)
- **AI-determined granularity**: Claude extracts topics and concepts from conversations
- **Hierarchical structure**: Topics contain concepts, relationships between both
- **Compacted context**: When starting new session, relevant prior knowledge injected as context
- Export/import as JSON for backup
- Visual representation on dashboard (simplified knowledge map widget)

---

## Technical Architecture

### Stack
- **Framework**: React 18+ with TypeScript
- **Build**: Vite
- **Styling**: CSS Modules or Tailwind (configured for Swiss design system)
- **State**: Zustand (lightweight, fits local-first approach)
- **Storage**: Dexie.js (IndexedDB wrapper)
- **Markdown**: react-markdown + remark-gfm + rehype-katex
- **Sandbox**: Sandboxed iframe with postMessage API

### Claude Integration
- **Approach**: Tauri desktop app wrapping Claude Code CLI (similar to Cline)
- **Authentication**: User's existing `claude login` credentials
- **CLI Invocation**: Spawns `claude -p` processes via Tauri Rust backend
- **Error Handling**: Detects CLI not found and prompts user to install

```rust
// Rust backend (src-tauri/src/lib.rs)
#[tauri::command]
async fn send_to_claude(prompt: String, system_prompt: Option<String>) -> Result<ClaudeResponse, String> {
    Command::new("claude")
        .arg("-p")
        .arg(&full_prompt)
        .arg("--output-format")
        .arg("text")
        .spawn()
}
```

**Future Development**:
- Web deployment with API key support
- Streaming support (currently returns full response)
- Session management via Claude CLI resume flags

### Data Models (Draft)

```typescript
interface Topic {
  id: string;
  name: string;
  concepts: Concept[];
  sessions: string[]; // session IDs
  createdAt: Date;
  lastExploredAt: Date;
  summary?: string;
}

interface Concept {
  id: string;
  name: string;
  topicId: string;
  relatedConcepts: string[]; // concept IDs
  familiarityLevel: 'introduced' | 'explored' | 'understood';
  extractedFrom: string; // session ID
}

interface Session {
  id: string;
  topicId?: string;
  messages: Message[];
  extractedConcepts: string[];
  startedAt: Date;
  lastMessageAt: Date;
}

interface TeachingStyle {
  preset?: string;
  parameters: {
    depth: 'shallow' | 'moderate' | 'deep';
    pace: 'quick' | 'measured' | 'thorough';
    exampleFrequency: 'minimal' | 'moderate' | 'frequent';
    useAnalogies: boolean;
    formality: 'casual' | 'balanced' | 'formal';
  };
  customInstructions?: string;
}
```

---

## Design System: Swiss-Inspired Functionalism

### Principles
1. **Clarity over decoration** - Every element serves a purpose
2. **Typography as structure** - Hierarchy through type, not ornament
3. **Generous whitespace** - Let content breathe
4. **Geometric precision** - Clean alignments, consistent spacing
5. **Reduced color palette** - Monochromatic base, minimal accent

### Theme
- **Default**: System preference (follows OS light/dark setting)
- Toggle available for manual override

### Visual Language
- **Colors**:
  - Background: `#FAFAFA` (light) / `#0A0A0A` (dark)
  - Foreground: `#171717` (light) / `#EDEDED` (dark)
  - Accent: Single color (suggest `#0066FF` or user-configurable)
  - Borders: `#E5E5E5` (light) / `#262626` (dark)
- **Typography**:
  - Primary: Geist Sans (or Inter as fallback)
  - Monospace: Geist Mono (or JetBrains Mono)
  - Scale: 12/14/16/20/24/32/48px
- **Spacing**: 4px base unit (4/8/12/16/24/32/48/64)
- **Borders**: 1px solid, radius 6px (subtle)
- **Shadows**: Minimal, only for elevation (modals, dropdowns)

### Component Style
- Buttons: Solid fills, no gradients, subtle hover states
- Cards: Light border, no shadow, generous padding
- Inputs: Clean borders, clear focus states
- Icons: Lucide (geometric, consistent stroke)

---

## Project Structure (Proposed)

```
src/
├── components/
│   ├── dashboard/
│   │   ├── FeedCard.tsx
│   │   ├── KnowledgeWidget.tsx
│   │   └── QuickStart.tsx
│   ├── chat/
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── Message.tsx
│   ├── sandbox/
│   │   └── SandboxPanel.tsx
│   ├── settings/
│   │   └── TeachingStyleEditor.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── ...
├── hooks/
│   ├── useClaude.ts
│   ├── useKnowledge.ts
│   └── useTeachingStyle.ts
├── stores/
│   ├── sessionStore.ts
│   ├── knowledgeStore.ts
│   └── settingsStore.ts
├── services/
│   ├── claude/
│   │   ├── client.ts
│   │   ├── prompts.ts
│   │   └── conceptExtraction.ts
│   └── storage/
│       └── db.ts
├── types/
│   └── index.ts
├── styles/
│   ├── globals.css
│   └── tokens.css
├── App.tsx
└── main.tsx
```

---

## Implementation Phases

### Phase 0: Claude Code CLI Research ✅ COMPLETE
- [x] Investigate Claude Code CLI invocation from Node.js/Electron
- [x] Test authentication/session reuse
- [x] Document findings and decide primary integration path

**Finding**: Use Tauri + Claude CLI wrapper (like Cline) for desktop MVP. Web/API key support deferred.

### Phase 1: Foundation ✅ COMPLETE
- [x] Project setup (Vite + React + TypeScript)
- [x] Design system tokens (Tactical/Geist-inspired) - `src/index.css`
- [x] Basic layout (dashboard shell, sidebar) - `src/components/layout/`
- [x] Dashboard view with mock cards - `src/components/dashboard/`
- [x] Type definitions - `src/types/index.ts`
- [ ] System preference theme detection + toggle (deferred)

### Phase 2: Core Chat ✅ COMPLETE
- [x] Tauri desktop app setup - `src-tauri/`
- [x] Claude CLI integration via Rust backend - `src-tauri/src/lib.rs`
- [x] CLI not found detection + onboarding flow - `src/components/onboarding/`
- [x] Chat UI with markdown rendering - `src/components/chat/`
- [x] IndexedDB setup with Dexie - `src/services/storage/db.ts`
- [x] Session persistence via Zustand - `src/stores/sessionStore.ts`
- [x] Teaching style configuration - `src/stores/settingsStore.ts`
- [x] i18n system (English) - `src/i18n/`

### Phase 3: Sandbox ✅ COMPLETE
- [x] Sandboxed iframe implementation - `src/components/sandbox/SandboxPanel.tsx`
- [x] Claude prompt engineering for demo generation - `src/services/claude/demo-generation.ts`
- [x] On-demand demo generation via button in chat - `src/components/topic/ChatPane.tsx`
- [x] Demo history per session with selector - stored in `sessionStore.ts`
- [ ] Panel resizing and pop-out (deferred)

### Phase 4: Knowledge System ✅ COMPLETE
- [x] Concept extraction prompts - `src/services/claude/concept-extraction.ts`
- [x] Knowledge store for managing concepts - `src/stores/knowledgeStore.ts`
- [x] Context injection for new sessions - `src/services/claude/cli-provider.ts`
- [x] Dashboard feed generation - `src/services/claude/feed-generation.ts`, `src/stores/dashboardStore.ts`

### Phase 5: Polish ✅ COMPLETE
- [x] Dashboard refinement - skeleton loading, refresh button, improved UX
- [x] Knowledge visualization widget - `src/components/dashboard/KnowledgeWidget.tsx`
- [x] Export/import functionality - `src/components/settings/DataManagement.tsx`, `src/services/storage/data-export.ts`

---

## Development Guidelines

### KISS Principles (Strictly Enforced)

1. **Minimal Code First**
   - Write the shortest possible code that works
   - No abstractions until proven necessary
   - No "just in case" code or premature optimization
   - Add complexity only after a feature is validated in its minimal state

2. **Strong Explicit Typing**
   - All TypeScript types must be explicit (no `any`, no implicit types)
   - Prefer interfaces over type aliases for objects
   - Export types from dedicated `types/` files
   - Use strict TypeScript config (`strict: true`, `noImplicitAny: true`)

3. **Standard Tools Only**
   - Use commonly adopted frameworks and plugins
   - Prefer battle-tested libraries over novel solutions
   - Avoid niche dependencies that add learning curve
   - When in doubt, use the most popular option

4. **MVP Mindset**
   - Each feature starts at its most basic form
   - Ship, validate, then iterate
   - No gold-plating - if it's not in the spec, don't build it
   - Delete code before adding abstraction layers

5. **Code Readability for Human Review**
   - Code should be scannable by the project owner
   - Prefer verbose clarity over clever brevity
   - One responsibility per file when possible
   - Flat file structure over deep nesting

### Anti-Patterns to Avoid

- Creating utility files "for later"
- Adding configuration options before they're needed
- Building generic components when specific ones suffice
- Error handling for impossible states
- Comments explaining what code does (code should be self-evident)
- Multiple levels of abstraction
- Prop drilling prevention before it's a problem

### When to Add Complexity

Only add complexity when:
1. The minimal version is working and tested
2. A clear, specific need is identified
3. The user explicitly requests it
4. The simple approach has proven insufficient

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-12-30 | Project name: Trellis | Technical feel, implies interconnected growth structure |
| 2025-12-30 | Swiss Functionalism design | Clean, typography-driven, Geist/Vercel inspired |
| 2025-12-30 | System theme preference default | Respects user OS setting |
| 2025-12-30 | Research CLI first | Prefer leveraging existing Claude Code subscription |
| 2025-12-30 | Local-first storage | Privacy, no backend needed for MVP |
| 2025-12-31 | Tauri over Electron | Smaller bundle, Rust backend, native performance |
| 2025-12-31 | Claude CLI wrapper approach | Leverage Claude Max subscription without API key |
| 2025-12-31 | Lazy CLI validation | No upfront auth check; detect CLI issues on first use |

---

## Current Status

**Phase**: All core phases complete ✅
**Next Action**: Panel resizing/pop-out for sandbox, or deployment preparation

---

## Future Development Notes

### Chat UX Improvements (Post-MVP)
Once all phases are implemented, revisit the LLM response UX:
- Streaming text display (currently shows full response at once)
- Typing indicators during CLI execution
- Better error state visualization
- Response formatting options (compact vs expanded)
- Code block syntax highlighting improvements

### Web Deployment (Deferred)
- Add API key authentication option for web users
- Abstract CLI provider to support both CLI and API backends
- Consider Claude Agent SDK when web version is prioritized
