import { create } from 'zustand';
import type { TopicSummary } from '../types';
import { generateTopicSummaryFromDb } from '../services/claude/topic-summary-generation';

interface TopicSummaryState {
  summaries: Record<string, TopicSummary>;
  isGenerating: boolean;
  currentTopicId: string | null;
  error: string | null;

  loadSummary: (topicId: string) => Promise<void>;
  regenerateSummary: (topicId: string) => Promise<void>;
  regenerateSummaryInBackground: (topicId: string) => void;
  getSummary: (topicId: string) => TopicSummary | null;
  clearSummary: (topicId: string) => void;
}

export const useTopicSummaryStore = create<TopicSummaryState>((set, get) => ({
  summaries: {},
  isGenerating: false,
  currentTopicId: null,
  error: null,

  loadSummary: async (topicId: string): Promise<void> => {
    const { summaries } = get();
    const existing = summaries[topicId];

    // Use cached summary if available
    if (existing) {
      set({ currentTopicId: topicId });
      return;
    }

    // Generate new summary with loading state
    set({ isGenerating: true, error: null, currentTopicId: topicId });

    const result = await generateTopicSummaryFromDb(topicId);

    if (result.error) {
      set({ isGenerating: false, error: result.error });
      return;
    }

    const summary: TopicSummary = {
      id: `summary-${topicId}-${Date.now()}`,
      topicId,
      knowledgeGraph: result.knowledgeGraph,
      followUpSuggestions: result.followUpSuggestions,
      generatedAt: new Date(),
    };

    set((state) => ({
      summaries: { ...state.summaries, [topicId]: summary },
      isGenerating: false,
      error: null,
    }));
  },

  regenerateSummary: async (topicId: string): Promise<void> => {
    set({ isGenerating: true, error: null, currentTopicId: topicId });

    const result = await generateTopicSummaryFromDb(topicId);

    if (result.error) {
      set({ isGenerating: false, error: result.error });
      return;
    }

    const summary: TopicSummary = {
      id: `summary-${topicId}-${Date.now()}`,
      topicId,
      knowledgeGraph: result.knowledgeGraph,
      followUpSuggestions: result.followUpSuggestions,
      generatedAt: new Date(),
    };

    set((state) => ({
      summaries: { ...state.summaries, [topicId]: summary },
      isGenerating: false,
      error: null,
    }));
  },

  regenerateSummaryInBackground: (topicId: string): void => {
    // Fire and forget - no loading state, silent update
    void (async () => {
      const result = await generateTopicSummaryFromDb(topicId);

      if (result.error) {
        return;
      }

      const summary: TopicSummary = {
        id: `summary-${topicId}-${Date.now()}`,
        topicId,
        knowledgeGraph: result.knowledgeGraph,
        followUpSuggestions: result.followUpSuggestions,
        generatedAt: new Date(),
      };

      set((state) => ({
        summaries: { ...state.summaries, [topicId]: summary },
      }));
    })();
  },

  getSummary: (topicId: string): TopicSummary | null => {
    return get().summaries[topicId] ?? null;
  },

  clearSummary: (topicId: string): void => {
    set((state) => {
      const { [topicId]: _, ...rest } = state.summaries;
      return { summaries: rest };
    });
  },
}));
