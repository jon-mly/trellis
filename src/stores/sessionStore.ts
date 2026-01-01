import { create } from 'zustand';
import type { Message, Session, Topic, PromptContext } from '../types';
import { db, generateId } from '../services/storage/db';
import { streamChat, type ChatOptions } from '../services/claude/cli-provider';
import { useKnowledgeStore } from './knowledgeStore';

interface SessionState {
  currentSession: Session | null;
  isSessionDraft: boolean; // True if session hasn't been persisted yet
  messages: Message[];
  topics: Topic[];
  sessionsForTopic: Session[];
  sessionsLoaded: boolean; // True after loadSessionsForTopic completes
  isLoading: boolean;
  streamingContent: string;
  error: string | null;
  cliNotFound: boolean;

  loadTopics: () => Promise<void>;
  createTopic: (name: string, category?: string) => Promise<Topic>;
  deleteTopic: (topicId: string) => Promise<void>;
  startSession: (topicId?: string) => void; // Now synchronous, creates draft
  sendMessage: (content: string, options?: ChatOptions) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  loadSessionsForTopic: (topicId: string) => Promise<void>;
  loadSessionMessages: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  endSession: () => Promise<Topic | null>;
  resetCliNotFound: () => void;
  clearCurrentSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSession: null,
  isSessionDraft: false,
  messages: [],
  topics: [],
  sessionsForTopic: [],
  sessionsLoaded: false,
  isLoading: false,
  streamingContent: '',
  error: null,
  cliNotFound: false,

  loadTopics: async (): Promise<void> => {
    const topics: Topic[] = await db.topics.orderBy('lastExploredAt').reverse().toArray();
    set({ topics });
  },

  createTopic: async (name: string, category?: string): Promise<Topic> => {
    const now: Date = new Date();
    const topic: Topic = {
      id: generateId(),
      name,
      category,
      conceptIds: [],
      sessionIds: [],
      createdAt: now,
      lastExploredAt: now,
    };

    await db.topics.add(topic);

    // Update the topics list in state
    const { topics } = get();
    set({ topics: [topic, ...topics] });

    return topic;
  },

  deleteTopic: async (topicId: string): Promise<void> => {
    try {
      // Get all sessions for this topic
      const sessions: Session[] = await db.sessions
        .where('topicId')
        .equals(topicId)
        .toArray();

      // Delete all messages for all sessions
      for (const session of sessions) {
        await db.messages.where('sessionId').equals(session.id).delete();
      }

      // Delete all sessions for this topic
      await db.sessions.where('topicId').equals(topicId).delete();

      // Delete all concepts for this topic
      await db.concepts.where('topicId').equals(topicId).delete();

      // Delete the topic itself
      await db.topics.delete(topicId);

      // Update the topics list in state
      const { topics } = get();
      const updatedTopics: Topic[] = topics.filter((t: Topic): boolean => t.id !== topicId);
      set({
        topics: updatedTopics,
        currentSession: null,
        isSessionDraft: false,
        messages: [],
        sessionsForTopic: [],
        sessionsLoaded: false,
      });

      // Reload knowledge store
      const knowledgeStore = useKnowledgeStore.getState();
      await knowledgeStore.loadKnowledge();
    } catch (error) {
      console.error('Failed to delete topic:', error);
      throw error;
    }
  },

  startSession: (topicId?: string): void => {
    const now: Date = new Date();
    const session: Session = {
      id: generateId(),
      topicId,
      extractedConceptIds: [],
      startedAt: now,
      lastMessageAt: now,
    };

    // Create draft session in memory only - will be persisted on first message
    set({ currentSession: session, isSessionDraft: true, messages: [], error: null });
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

  loadSessionsForTopic: async (topicId: string): Promise<void> => {
    // Reset sessionsLoaded before fetching
    set({ sessionsLoaded: false });

    const sessions: Session[] = await db.sessions
      .where('topicId')
      .equals(topicId)
      .reverse()
      .sortBy('lastMessageAt');

    // Sort in descending order (most recent first)
    sessions.sort((a: Session, b: Session) =>
      b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    );

    set({ sessionsForTopic: sessions, sessionsLoaded: true });
  },

  loadSessionMessages: async (sessionId: string): Promise<void> => {
    const session: Session | undefined = await db.sessions.get(sessionId);
    if (!session) {
      set({ error: 'Session not found' });
      return;
    }

    const messages: Message[] = await db.messages
      .where('sessionId')
      .equals(sessionId)
      .sortBy('timestamp');

    set({ currentSession: session, isSessionDraft: false, messages, error: null });
  },

  clearCurrentSession: (): void => {
    set({ currentSession: null, isSessionDraft: false, messages: [], sessionsForTopic: [], sessionsLoaded: false });
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    const { currentSession, sessionsForTopic } = get();

    // Delete all messages for this session
    await db.messages.where('sessionId').equals(sessionId).delete();

    // Delete the session itself
    await db.sessions.delete(sessionId);

    // Update the sessions list
    const updatedSessions: Session[] = sessionsForTopic.filter(
      (s: Session) => s.id !== sessionId
    );

    // If we deleted the current session, clear it and select another if available
    if (currentSession?.id === sessionId) {
      if (updatedSessions.length > 0) {
        const nextSession: Session = updatedSessions[0];
        const messages: Message[] = await db.messages
          .where('sessionId')
          .equals(nextSession.id)
          .sortBy('timestamp');
        set({
          currentSession: nextSession,
          messages,
          sessionsForTopic: updatedSessions,
        });
      } else {
        set({
          currentSession: null,
          messages: [],
          sessionsForTopic: updatedSessions,
        });
      }
    } else {
      set({ sessionsForTopic: updatedSessions });
    }
  },

  sendMessage: async (content: string, options?: ChatOptions): Promise<void> => {
    const { currentSession, isSessionDraft, messages, sessionsForTopic } = get();

    if (!currentSession) {
      set({ error: 'No active session' });
      return;
    }

    // If this is a draft session, persist it now (first message)
    if (isSessionDraft) {
      await db.sessions.add(currentSession);
      // Add the new session to the sessions list
      const updatedSessions: Session[] = [currentSession, ...sessionsForTopic];
      set({ isSessionDraft: false, sessionsForTopic: updatedSessions });
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

    // If this is the first message and session has no topic, identify/create the topic
    const isFirstMessage: boolean = messages.length === 0;
    const hasNoTopic: boolean = !currentSession.topicId;

    if (isFirstMessage && hasNoTopic) {
      const knowledgeStore = useKnowledgeStore.getState();
      const identifiedTopic: Topic | null = await knowledgeStore.identifyOrCreateTopic(
        content,
        currentSession.id
      );

      if (identifiedTopic) {
        // Update the current session in state with the topic ID
        const updatedSession: Session = { ...currentSession, topicId: identifiedTopic.id };
        set({ currentSession: updatedSession });

        // Refresh topics list
        const topics: Topic[] = await db.topics.orderBy('lastExploredAt').reverse().toArray();
        set({ topics });
      }
    }

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
    const { currentSession, isSessionDraft, messages } = get();

    // If it's a draft session with no messages, just discard it
    if (!currentSession || isSessionDraft || messages.length < 2) {
      set({ currentSession: null, isSessionDraft: false, messages: [] });
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
    set({ currentSession: null, isSessionDraft: false, messages: [], topics });

    return topic;
  },

  resetCliNotFound: () => {
    set({ cliNotFound: false });
  },
}));
