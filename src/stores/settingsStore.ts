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

const SETTINGS_ID: string = 'user-settings';

interface SettingsState {
  settings: Settings | null;
  isLoaded: boolean;

  loadSettings: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateTeachingStyle: (style: Partial<TeachingStyle>) => Promise<void>;
  updateCliPath: (cliPath: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoaded: false,

  loadSettings: async (): Promise<void> => {
    let settings: Settings | undefined = await db.settings.get(SETTINGS_ID);

    if (!settings) {
      settings = {
        id: SETTINGS_ID,
        teachingStyle: DEFAULT_TEACHING_STYLE,
        onboardingComplete: false,
      };
      await db.settings.add(settings);
    }

    set({ settings, isLoaded: true });
  },

  completeOnboarding: async (): Promise<void> => {
    const { settings } = get();
    if (!settings) return;

    const updated: Settings = { ...settings, onboardingComplete: true };
    await db.settings.put(updated);
    set({ settings: updated });
  },

  updateTeachingStyle: async (style: Partial<TeachingStyle>): Promise<void> => {
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

  updateCliPath: async (cliPath: string): Promise<void> => {
    const { settings } = get();
    if (!settings) return;

    const updated: Settings = { ...settings, cliPath };
    await db.settings.put(updated);
    set({ settings: updated });
  },
}));
