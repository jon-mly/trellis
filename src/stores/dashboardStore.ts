import { create } from 'zustand';
import type { DashboardCard } from '../types';
import { generateFeedFromDb } from '../services/claude/feed-generation';

interface DashboardState {
  cards: DashboardCard[];
  isLoading: boolean;
  error: string | null;
  lastGenerated: Date | null;

  loadFeed: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  refreshFeedInBackground: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  cards: [],
  isLoading: false,
  error: null,
  lastGenerated: null,

  loadFeed: async (): Promise<void> => {
    const { lastGenerated, cards } = get();

    // Don't reload if we have cards and they were generated recently (within 5 minutes)
    if (cards.length > 0 && lastGenerated) {
      const fiveMinutesAgo: Date = new Date(Date.now() - 5 * 60 * 1000);
      if (lastGenerated > fiveMinutesAgo) {
        return;
      }
    }

    set({ isLoading: true, error: null });

    const result = await generateFeedFromDb();

    set({
      cards: result.cards,
      isLoading: false,
      error: result.error,
      lastGenerated: new Date(),
    });
  },

  refreshFeed: async (): Promise<void> => {
    set({ isLoading: true, error: null });

    const result = await generateFeedFromDb();

    set({
      cards: result.cards,
      isLoading: false,
      error: result.error,
      lastGenerated: new Date(),
    });
  },

  refreshFeedInBackground: (): void => {
    // Fire and forget - no loading state, silent update
    void (async () => {
      const result = await generateFeedFromDb();

      set({
        cards: result.cards,
        error: result.error,
        lastGenerated: new Date(),
      });
    })();
  },
}));
