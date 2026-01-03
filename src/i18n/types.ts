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
    dashboard: string;
    newTopic: string;
    noTopics: string;
    exploredThemes: string;
    settings: string;
  };

  // Settings
  settings: {
    title: string;
    description: string;
    tabs: {
      teachingStyle: string;
      knowledgeData: string;
    };
    knowledgeData: {
      title: string;
      description: string;
      dangerZone: string;
      clearAll: {
        button: string;
        description: string;
        empty: string;
        success: string;
        confirmTitle: string;
        confirmMessage: string;
        finalTitle: string;
        finalMessage: string;
        cancel: string;
        proceed: string;
        deleteAll: string;
      };
    };
  };

  // Topic View
  topicView: {
    newSession: string;
    sessions: string;
    noSessions: string;
    sessionDate: string;
    summary: string;
    noSummary: string;
    deleteSession: string;
    deleteTopic: string;
    deleteTopicTitle: string;
    deleteTopicConfirm: string;
    confirm: string;
    cancel: string;
  };

  // Exit Guard
  exitGuard: {
    title: string;
    message: string;
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

  // Teaching Style Settings
  teachingStyle: {
    title: string;
    description: string;
    preset: {
      label: string;
      options: {
        socratic: string;
        handsOn: string;
        theoretical: string;
        storyteller: string;
      };
    };
    depth: {
      label: string;
      options: {
        shallow: string;
        moderate: string;
        deep: string;
      };
    };
    pace: {
      label: string;
      options: {
        quick: string;
        measured: string;
        thorough: string;
      };
    };
    exampleFrequency: {
      label: string;
      options: {
        minimal: string;
        moderate: string;
        frequent: string;
      };
    };
    analogies: {
      label: string;
      options: {
        enabled: string;
        disabled: string;
      };
    };
    formality: {
      label: string;
      options: {
        casual: string;
        balanced: string;
        formal: string;
      };
    };
    customInstructions: {
      label: string;
      placeholder: string;
    };
    promptPreview: {
      label: string;
      description: string;
    };
    save: string;
    saved: string;
  };

  // Sandbox
  sandbox: {
    generateDemo: string;
    generating: string;
    close: string;
    noDemo: string;
  };

  // Topic Dashboard
  topicDashboard: {
    title: string;
    knowledgeGraph: string;
    knowledgeGraphEmpty: string;
    suggestions: string;
    suggestionsEmpty: string;
    startChat: string;
    suggestionTypes: {
      deepen: string;
      connect: string;
      challenge: string;
      apply: string;
    };
    familiarity: {
      understood: string;
      explored: string;
      introduced: string;
    };
    lastUpdated: string;
  };
}
