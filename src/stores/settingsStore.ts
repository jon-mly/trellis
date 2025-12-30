import { create } from 'zustand';
import type { Settings, TeachingStyle } from '../types';
import { db } from '../services/storage/db';

const DEFAULT_TEACHING_STYLE: TeachingStyle = {
  parameters: {
    depth: 'moderate',
    pace: 'measured',
    exampleFrequency: 'moderate',
    useAnalogies: true,
    formality: 'balanced',
  },
};

const SETTINGS_ID = 'user-settings';

interface SettingsState {
  settings: Settings | null;
  isLoaded: boolean;

  loadSettings: () => Promise<void>;
  updateApiKey: (apiKey: string) => Promise<void>;
  updateTeachingStyle: (style: Partial<TeachingStyle>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoaded: false,

  loadSettings: async () => {
    let settings = await db.settings.get(SETTINGS_ID);

    if (!settings) {
      settings = {
        id: SETTINGS_ID,
        teachingStyle: DEFAULT_TEACHING_STYLE,
      };
      await db.settings.add(settings);
    }

    set({ settings, isLoaded: true });
  },

  updateApiKey: async (apiKey: string) => {
    const { settings } = get();
    if (!settings) return;

    const updated = { ...settings, apiKey };
    await db.settings.put(updated);
    set({ settings: updated });
  },

  updateTeachingStyle: async (style: Partial<TeachingStyle>) => {
    const { settings } = get();
    if (!settings) return;

    const updated: Settings = {
      ...settings,
      teachingStyle: {
        ...settings.teachingStyle,
        ...style,
        parameters: {
          ...settings.teachingStyle.parameters,
          ...style.parameters,
        },
      },
    };

    await db.settings.put(updated);
    set({ settings: updated });
  },
}));
