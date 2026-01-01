import { invoke } from '@tauri-apps/api/core';
import type { ClaudeResponse } from './cli-provider';
import type { DashboardCard, Topic, Concept } from '../../types';
import { db, generateId } from '../storage/db';

export interface FeedGenerationResult {
  cards: DashboardCard[];
  error: string | null;
}

const FEED_GENERATION_PROMPT = `You are a curiosity engine for lifelong learners. Based on the student's learning history, generate dashboard cards that spark exploration and deepen understanding.

Return a JSON object with this exact structure:
{
  "cards": [
    {
      "type": "resume|explore|related|wildcard",
      "title": "short engaging title",
      "description": "1-2 sentence hook that sparks curiosity",
      "topicId": "ID if resuming/exploring existing topic, null otherwise",
      "suggestedPrompt": "thought-provoking prompt to start the session"
    }
  ]
}

Card types and quantities:
- "resume" (2 cards): Continue unfinished sessions. Reference specific concepts or questions left hanging. Use the topic ID.
- "explore" (2 cards): Dig deeper into a topic they already know. Pose intriguing questions, paradoxes, or advanced angles they haven't considered yet. Use the topic ID.
- "related" (2 cards): Suggest new topics that connect naturally to their interests. Show the bridge between what they know and what they could discover.
- "wildcard" (2 cards): Completely different domains to expand horizons. Pick fascinating topics unrelated to their history—philosophy, art, obscure science, history, music theory, etc. The goal is serendipitous discovery.

Guidelines:
- Write titles and descriptions that provoke curiosity, not just inform
- Use questions, paradoxes, surprising facts, or "what if" scenarios
- Make each card feel like an invitation to explore, not a homework assignment
- Suggested prompts should open conversations, not close them

Generate exactly 8 cards (2 of each type).
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
        type: 'resume' | 'explore' | 'related' | 'wildcard';
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
  const allCards: DashboardCard[] = [
    {
      id: generateId(),
      type: 'wildcard',
      title: 'Why Do We Dream?',
      description: 'Every night your brain creates vivid hallucinations. Scientists still debate why—memory consolidation, emotional processing, or something stranger?',
      suggestedPrompt: 'Why do humans dream? What are the leading theories and what do we actually know?',
    },
    {
      id: generateId(),
      type: 'wildcard',
      title: 'The Math Behind Music',
      description: 'Why do some notes sound beautiful together while others clash? The answer involves ratios discovered 2,500 years ago.',
      suggestedPrompt: 'How is music connected to mathematics? Why do certain notes harmonize?',
    },
    {
      id: generateId(),
      type: 'wildcard',
      title: 'How Languages Die',
      description: 'A language disappears every two weeks. What happens to the thoughts that only existed in those words?',
      suggestedPrompt: 'How do languages go extinct? What do we lose when a language dies?',
    },
    {
      id: generateId(),
      type: 'wildcard',
      title: 'The Philosophy of Time',
      description: 'Is the past real? Does the future already exist? Physicists and philosophers have surprisingly different answers.',
      suggestedPrompt: 'What is time, really? How do philosophers and physicists think about it differently?',
    },
    {
      id: generateId(),
      type: 'wildcard',
      title: 'How Computers Think',
      description: 'From sand to silicon to software—how does electricity become thought? The journey is stranger than you might expect.',
      suggestedPrompt: 'How do computers actually work at a fundamental level? How does code become action?',
    },
    {
      id: generateId(),
      type: 'wildcard',
      title: 'The Art of Fermentation',
      description: 'Bread, beer, cheese, kimchi—humans have been collaborating with microbes for millennia. What makes fermentation work?',
      suggestedPrompt: 'How does fermentation work? Why have humans relied on it across all cultures?',
    },
    {
      id: generateId(),
      type: 'wildcard',
      title: 'Game Theory in Nature',
      description: 'Bacteria, birds, and businesses all play strategic games. The same mathematics explains why some cooperate and others cheat.',
      suggestedPrompt: 'What is game theory and how does it appear in nature? How do animals and even microbes use strategy?',
    },
    {
      id: generateId(),
      type: 'wildcard',
      title: 'The Science of Color',
      description: 'Color doesn\'t exist outside your brain—it\'s a story your mind tells about light. Some animals see colors we can\'t even imagine.',
      suggestedPrompt: 'How does color perception work? Why do some animals see colors humans can\'t?',
    },
  ];

  // Shuffle and return 6 random cards
  const shuffled = allCards.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6);
}

export async function generateFeedFromDb(): Promise<FeedGenerationResult> {
  const topics: Topic[] = await db.topics.orderBy('lastExploredAt').reverse().limit(10).toArray();
  const concepts: Concept[] = await db.concepts.toArray();
  return generateFeed(topics, concepts);
}
