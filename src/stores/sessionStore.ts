import { create } from 'zustand';
import type { Message, Session, Topic } from '../types';
import { db, generateId } from '../services/storage/db';
import { streamChat, type ChatOptions } from '../services/claude/client';

interface SessionState {
  currentSession: Session | null;
  messages: Message[];
  topics: Topic[];
  isLoading: boolean;
  streamingContent: string;
  error: string | null;

  loadTopics: () => Promise<void>;
  startSession: (topicId?: string) => Promise<void>;
  sendMessage: (content: string, apiKey: string, options?: ChatOptions) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSession: null,
  messages: [],
  topics: [],
  isLoading: false,
  streamingContent: '',
  error: null,

  loadTopics: async () => {
    const topics = await db.topics.orderBy('lastExploredAt').reverse().toArray();
    set({ topics });
  },

  startSession: async (topicId?: string) => {
    const now = new Date();
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

  loadSession: async (sessionId: string) => {
    const session = await db.sessions.get(sessionId);
    if (!session) {
      set({ error: 'Session not found' });
      return;
    }

    const messages = await db.messages
      .where('sessionId')
      .equals(sessionId)
      .sortBy('timestamp');

    set({ currentSession: session, messages, error: null });
  },

  sendMessage: async (content: string, apiKey: string, options?: ChatOptions) => {
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

    const chatHistory = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let assistantContent = '';

    try {
      for await (const chunk of streamChat(chatHistory, apiKey, options)) {
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

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
        streamingContent: '',
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Unknown error',
        isLoading: false,
        streamingContent: '',
      });
    }
  },
}));
