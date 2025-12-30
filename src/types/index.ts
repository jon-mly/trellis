export interface Topic {
  id: string;
  name: string;
  category?: string;
  conceptIds: string[];
  sessionIds: string[];
  createdAt: Date;
  lastExploredAt: Date;
  summary?: string;
}

export interface Concept {
  id: string;
  name: string;
  topicId: string;
  relatedConceptIds: string[];
  familiarityLevel: 'introduced' | 'explored' | 'understood';
  extractedFromSessionId: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Session {
  id: string;
  topicId?: string;
  extractedConceptIds: string[];
  startedAt: Date;
  lastMessageAt: Date;
}

export interface Settings {
  id: string;
  teachingStyle: TeachingStyle;
  apiKey?: string;
}

export interface TeachingStyle {
  preset?: 'socratic' | 'hands-on' | 'theoretical' | 'storyteller';
  parameters: {
    depth: 'shallow' | 'moderate' | 'deep';
    pace: 'quick' | 'measured' | 'thorough';
    exampleFrequency: 'minimal' | 'moderate' | 'frequent';
    useAnalogies: boolean;
    formality: 'casual' | 'balanced' | 'formal';
  };
  customInstructions?: string;
}

export interface DashboardCard {
  id: string;
  type: 'resume' | 'expand' | 'discover' | 'connection';
  title: string;
  description: string;
  topicId?: string;
  suggestedPrompt?: string;
  lastExplored?: Date;
}

export type View = 'dashboard' | 'session';
