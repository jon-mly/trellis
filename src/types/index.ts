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
  promptContext?: PromptContext;
}

export interface PromptContext {
  systemPrompt: string;
  fullPrompt: string;
  knowledgeContext?: string;
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
  onboardingComplete: boolean;
  cliPath?: string;
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
  type: 'resume' | 'explore' | 'related' | 'wildcard';
  title: string;
  description: string;
  topicId?: string;
  suggestedPrompt?: string;
  lastExplored?: Date;
}

export type View = 'dashboard' | 'session' | 'settings';

// Topic Dashboard types
export interface TopicSummary {
  id: string;
  topicId: string;
  knowledgeGraph: KnowledgeGraphNode[];
  followUpSuggestions: TopicSuggestion[];
  generatedAt: Date;
}

export interface KnowledgeGraphNode {
  conceptId: string;
  conceptName: string;
  familiarityLevel: 'introduced' | 'explored' | 'understood';
  children: KnowledgeGraphNode[];
  relatedConcepts: string[];
}

export interface TopicSuggestion {
  id: string;
  title: string;
  description: string;
  suggestedPrompt: string;
  type: 'deepen' | 'connect' | 'challenge' | 'apply';
}

export interface SandboxDemo {
  id: string;
  sessionId: string;
  title: string;
  html: string;
  createdAt: Date;
}
