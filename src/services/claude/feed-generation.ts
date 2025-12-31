import { invoke } from '@tauri-apps/api/core';
import type { ClaudeResponse } from './cli-provider';
import type { DashboardCard, Topic, Concept } from '../../types';
import { db, generateId } from '../storage/db';

export interface FeedGenerationResult {
  cards: DashboardCard[];
  error: string | null;
}

const FEED_GENERATION_PROMPT = `Based on the student's learning history, generate dashboard cards to encourage continued learning.

Return a JSON object with this exact structure:
{
  "cards": [
    {
      "type": "resume|expand|discover|connection",
      "title": "short title",
      "description": "1-2 sentence description",
      "topicId": "ID if resuming existing topic, null otherwise",
      "suggestedPrompt": "optional prompt to start the session"
    }
  ]
}

Card types:
- "resume": Continue where they left off on a specific topic
- "expand": Deepen knowledge on an explored topic
- "discover": Suggest new related topics based on interests
- "connection": Show how different topics they've learned connect

Generate 3-5 cards that are engaging and personalized.
Only return valid JSON, no markdown or explanation.

Student's learning history:
`;

export async function generateFeed(
  topics: Topic[],
  concepts: Concept[]
): Promise<FeedGenerationResult> {
  if (topics.length === 0) {
    return {
      cards: getDefaultCards(),
      error: null,
    };
  }

  const learningHistory: string = buildLearningHistory(topics, concepts);
  const prompt: string = FEED_GENERATION_PROMPT + learningHistory;

  try {
    const response: ClaudeResponse = await invoke<ClaudeResponse>('send_to_claude', {
      prompt,
      systemPrompt: 'You are a learning dashboard assistant. Return only valid JSON.',
    });

    if (response.cli_not_found) {
      return { cards: getDefaultCards(), error: 'CLI not found' };
    }

    if (response.error && !response.content) {
      return { cards: getDefaultCards(), error: response.error };
    }

    const content: string = response.content.trim();
    const jsonMatch: RegExpMatchArray | null = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { cards: getDefaultCards(), error: 'Invalid response format' };
    }

    interface ParsedFeed {
      cards: Array<{
        type: 'resume' | 'expand' | 'discover' | 'connection';
        title: string;
        description: string;
        topicId?: string | null;
        suggestedPrompt?: string;
      }>;
    }

    const parsed: ParsedFeed = JSON.parse(jsonMatch[0]) as ParsedFeed;

    const cards: DashboardCard[] = parsed.cards.map((card): DashboardCard => ({
      id: generateId(),
      type: card.type,
      title: card.title,
      description: card.description,
      topicId: card.topicId ?? undefined,
      suggestedPrompt: card.suggestedPrompt,
    }));

    return { cards, error: null };
  } catch {
    return { cards: getDefaultCards(), error: 'Failed to generate feed' };
  }
}

function buildLearningHistory(topics: Topic[], concepts: Concept[]): string {
  const topicDetails: string[] = topics.slice(0, 10).map((topic: Topic): string => {
    const topicConcepts: Concept[] = concepts.filter(
      (c: Concept): boolean => c.topicId === topic.id
    );

    const conceptList: string = topicConcepts
      .map((c: Concept): string => `${c.name} (${c.familiarityLevel})`)
      .join(', ');

    const lastExplored: string = topic.lastExploredAt.toLocaleDateString();

    return `Topic: ${topic.name}${topic.category ? ` [${topic.category}]` : ''}
  Last explored: ${lastExplored}
  Summary: ${topic.summary ?? 'No summary'}
  Concepts: ${conceptList || 'None extracted'}
  Topic ID: ${topic.id}`;
  });

  return topicDetails.join('\n\n');
}

function getDefaultCards(): DashboardCard[] {
  return [
    {
      id: generateId(),
      type: 'discover',
      title: 'Start Learning',
      description: 'Begin your learning journey by exploring any topic that interests you.',
      suggestedPrompt: 'I want to learn something new. Can you suggest some interesting topics?',
    },
    {
      id: generateId(),
      type: 'discover',
      title: 'Explore Programming',
      description: 'Learn about programming concepts, languages, and best practices.',
      suggestedPrompt: 'I want to learn programming. Where should I start?',
    },
    {
      id: generateId(),
      type: 'discover',
      title: 'Discover Science',
      description: 'Explore fascinating scientific concepts from physics to biology.',
      suggestedPrompt: 'Teach me about an interesting scientific concept.',
    },
  ];
}

export async function generateFeedFromDb(): Promise<FeedGenerationResult> {
  const topics: Topic[] = await db.topics.orderBy('lastExploredAt').reverse().limit(10).toArray();
  const concepts: Concept[] = await db.concepts.toArray();
  return generateFeed(topics, concepts);
}
