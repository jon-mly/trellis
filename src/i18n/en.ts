import type { TranslationStrings } from './types';

export const en: TranslationStrings = {
  app: {
    name: 'Trellis',
    tagline: 'Your personal learning companion powered by Claude',
  },

  onboarding: {
    welcome: {
      title: 'Welcome to Trellis',
      subtitle: 'Your personal learning companion powered by Claude',
    },
    checking: {
      title: 'Checking Claude CLI Setup',
      description: 'Verifying that Claude Code is installed and authenticated...',
    },
    notInstalled: {
      title: 'Claude CLI Not Found',
      description: 'Trellis uses Claude Code CLI to connect to your Claude subscription.',
      instructionsTitle: 'Install Claude Code CLI',
      instructionsRun: 'Open your terminal and run:',
      documentationLink: 'Claude Code Documentation',
    },
    notAuthenticated: {
      title: 'Authentication Required',
      description: 'Claude CLI is installed, but you need to log in with your Claude account.',
      instructionsTitle: 'Log in to Claude',
      instructionsRun: 'Open your terminal and run:',
      note: 'This will open a browser window to authenticate with your Claude Max subscription.',
    },
    ready: {
      title: 'All Set!',
      description: "Claude CLI is installed and authenticated. You're ready to start learning.",
      connectedAs: 'Connected as:',
      startButton: 'Start Learning',
    },
    actions: {
      copy: 'Copy',
      checkAgain: 'Check Again',
    },
    steps: {
      cliInstalled: 'CLI Installed',
      authenticated: 'Authenticated',
      ready: 'Ready',
    },
  },

  dashboard: {
    heading: 'What would you like to learn?',
    inputPlaceholder: 'Explore a new topic...',
    loading: 'Generating suggestions...',
    empty: 'Start exploring to see personalized suggestions here.',
    suggestions: 'Suggestions',
    refreshSuggestions: 'Refresh suggestions',
    cardTypes: {
      resume: 'Resume',
      expand: 'Expand',
      discover: 'Discover',
      connection: 'Connection',
    },
  },

  knowledge: {
    title: 'Knowledge Map',
    empty: 'Your knowledge map will appear here as you learn.',
    stats: {
      topics: 'topics',
      concepts: 'concepts',
    },
    familiarity: {
      understood: 'Understood',
      explored: 'Explored',
      introduced: 'Introduced',
    },
    moreTopics: 'more topics',
  },

  chat: {
    inputPlaceholder: 'Type your message...',
    sending: 'Sending...',
  },

  sidebar: {
    newTopic: 'New Topic',
    noTopics: 'No topics yet. Start a conversation!',
  },

  errors: {
    noActiveSession: 'No active session',
    sessionNotFound: 'Session not found',
    unknownError: 'An unknown error occurred',
  },

  dataManagement: {
    title: 'Data Management',
    export: {
      button: 'Export Data',
      description: 'Download your learning data as JSON',
      success: 'Data exported successfully',
    },
    import: {
      button: 'Import Data',
      description: 'Restore from a backup file',
      success: 'Data imported successfully',
      error: 'Failed to import data. Invalid file format.',
    },
  },
};
