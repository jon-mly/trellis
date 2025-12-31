export type Locale = 'en';

export interface TranslationStrings {
  // App-wide
  app: {
    name: string;
    tagline: string;
  };

  // Onboarding
  onboarding: {
    welcome: {
      title: string;
      subtitle: string;
    };
    checking: {
      title: string;
      description: string;
    };
    notInstalled: {
      title: string;
      description: string;
      instructionsTitle: string;
      instructionsRun: string;
      documentationLink: string;
    };
    notAuthenticated: {
      title: string;
      description: string;
      instructionsTitle: string;
      instructionsRun: string;
      note: string;
    };
    ready: {
      title: string;
      description: string;
      connectedAs: string;
      startButton: string;
    };
    actions: {
      copy: string;
      checkAgain: string;
    };
    steps: {
      cliInstalled: string;
      authenticated: string;
      ready: string;
    };
  };

  // Dashboard
  dashboard: {
    heading: string;
    inputPlaceholder: string;
    loading: string;
    empty: string;
    suggestions: string;
    refreshSuggestions: string;
    cardTypes: {
      resume: string;
      expand: string;
      discover: string;
      connection: string;
    };
  };

  // Knowledge Widget
  knowledge: {
    title: string;
    empty: string;
    stats: {
      topics: string;
      concepts: string;
    };
    familiarity: {
      understood: string;
      explored: string;
      introduced: string;
    };
    moreTopics: string;
  };

  // Chat
  chat: {
    inputPlaceholder: string;
    sending: string;
  };

  // Sidebar
  sidebar: {
    newTopic: string;
    noTopics: string;
  };

  // Errors
  errors: {
    noActiveSession: string;
    sessionNotFound: string;
    unknownError: string;
  };

  // Data Management
  dataManagement: {
    title: string;
    export: {
      button: string;
      description: string;
      success: string;
    };
    import: {
      button: string;
      description: string;
      success: string;
      error: string;
    };
  };
}
