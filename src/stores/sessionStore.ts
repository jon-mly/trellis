import { create } from 'zustand';
import type { Message, Session, Topic } from '../types';
import { db, generateId } from '../services/storage/db';
import { streamChat, type ChatOptions } from '../services/claude/cli-provider';

interface SessionState {
  currentSession: Session | null;
  messages: Message[];
  topics: Topic[];
  isLoading: boolean;
  streamingContent: string;
  error: string | null;

  loadTopics: () => Promise<void>;
  startSession: (topicId?: string) => Promise<void>;
  sendMessage: (content: string, options?: ChatOptions) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSession: null,
  messages: [],
  topics: [],
  isLoading: false,
  streamingContent: '',
  error: null,

  loadTopics: async (): Promise<void> => {
    const topics: Topic[] = await db.topics.orderBy('lastExploredAt').reverse().toArray();
    set({ topics });
  },

  startSession: async (topicId?: string): Promise<void> => {
    const now: Date = new Date();
    const session: Session = {
      id: generateId(),
      topicId,
      extractedConceptIds: [],
      startedAt: now,
      lastMessageAt: now,
    };

    await db.sessions.add(session);
    set({ currentSession: session, messages: [], error: null });
  },

  loadSession: async (sessionId: string): Promise<void> => {
    const session: Session | undefined = await db.sessions.get(sessionId);
    if (!session) {
      set({ error: 'Session not found' });
      return;
    }

    const messages: Message[] = await db.messages
      .where('sessionId')
      .equals(sessionId)
      .sortBy('timestamp');

    set({ currentSession: session, messages, error: null });
  },

  sendMessage: async (content: string, options?: ChatOptions): Promise<void> => {
    const { currentSession, messages } = get();

    if (!currentSession) {
      set({ error: 'No active session' });
      return;
    }

    const userMessage: Message = {
      id: generateId(),
      sessionId: currentSession.id,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    await db.messages.add(userMessage);
    set({ messages: [...messages, userMessage], isLoading: true, error: null });

    const chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...messages,
      userMessage,
    ].map((m: Message): { role: 'user' | 'assistant'; content: string } => ({
      role: m.role,
      content: m.content,
    }));

    let assistantContent: string = '';

    try {
      for await (const chunk of streamChat(chatHistory, options)) {
        if (chunk.type === 'text') {
          assistantContent += chunk.content;
          set({ streamingContent: assistantContent });
        } else if (chunk.type === 'error') {
          set({ error: chunk.content, isLoading: false, streamingContent: '' });
          return;
        }
      }

      const assistantMessage: Message = {
        id: generateId(),
        sessionId: currentSession.id,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      await db.messages.add(assistantMessage);
      await db.sessions.update(currentSession.id, { lastMessageAt: new Date() });

      set((state: SessionState) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
        streamingContent: '',
      }));
    } catch (err: unknown) {
      const errorMessage: string = err instanceof Error ? err.message : 'Unknown error';
      set({
        error: errorMessage,
        isLoading: false,
        streamingContent: '',
      });
    }
  },
}));
