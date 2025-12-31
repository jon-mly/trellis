import { create } from 'zustand';
import type { Message, Session, Topic, PromptContext } from '../types';
import { db, generateId } from '../services/storage/db';
import { streamChat, type ChatOptions } from '../services/claude/cli-provider';
import { useKnowledgeStore } from './knowledgeStore';

interface SessionState {
  currentSession: Session | null;
  messages: Message[];
  topics: Topic[];
  isLoading: boolean;
  streamingContent: string;
  error: string | null;
  cliNotFound: boolean;

  loadTopics: () => Promise<void>;
  startSession: (topicId?: string) => Promise<void>;
  sendMessage: (content: string, options?: ChatOptions) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  endSession: () => Promise<Topic | null>;
  resetCliNotFound: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSession: null,
  messages: [],
  topics: [],
  isLoading: false,
  streamingContent: '',
  error: null,
  cliNotFound: false,

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
    let promptContext: PromptContext | undefined;

    try {
      for await (const chunk of streamChat(chatHistory, options)) {
        if (chunk.type === 'prompt_context') {
          promptContext = chunk.promptContext;
          // Update the user message with prompt context
          const updatedUserMessage: Message = { ...userMessage, promptContext };
          await db.messages.update(userMessage.id, { promptContext });
          set((state: SessionState) => ({
            messages: state.messages.map((m: Message): Message =>
              m.id === userMessage.id ? updatedUserMessage : m
            ),
          }));
        } else if (chunk.type === 'text') {
          assistantContent += chunk.content;
          set({ streamingContent: assistantContent });
        } else if (chunk.type === 'cli_not_found') {
          set({ cliNotFound: true, isLoading: false, streamingContent: '' });
          return;
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

  endSession: async (): Promise<Topic | null> => {
    const { currentSession, messages } = get();

    if (!currentSession || messages.length < 2) {
      set({ currentSession: null, messages: [] });
      return null;
    }

    const knowledgeStore = useKnowledgeStore.getState();

    let topic: Topic | null = null;

    if (currentSession.topicId) {
      await knowledgeStore.updateTopicFromSession(
        currentSession.topicId,
        currentSession.id,
        messages
      );
      topic = await db.topics.get(currentSession.topicId) ?? null;
    } else {
      topic = await knowledgeStore.extractAndSaveKnowledge(messages, currentSession.id);
    }

    const topics: Topic[] = await db.topics.orderBy('lastExploredAt').reverse().toArray();
    set({ currentSession: null, messages: [], topics });

    return topic;
  },

  resetCliNotFound: () => {
    set({ cliNotFound: false });
  },
}));
