import { invoke } from '@tauri-apps/api/core';
import type { ClaudeResponse } from './cli-provider';
import type { Topic, Concept, Message, KnowledgeGraphNode, TopicSuggestion } from '../../types';
import { db, generateId } from '../storage/db';

export interface TopicSummaryResult {
  knowledgeGraph: KnowledgeGraphNode[];
  followUpSuggestions: TopicSuggestion[];
  error: string | null;
}

const TOPIC_SUMMARY_PROMPT = `You are analyzing a student's learning journey within a specific topic. Generate a comprehensive topic summary with a knowledge graph and follow-up suggestions.

Return a JSON object with this exact structure:
{
  "knowledgeGraph": [
    {
      "conceptName": "Main Concept Name",
      "familiarityLevel": "introduced|explored|understood",
      "children": [
        {
          "conceptName": "Sub-concept",
          "familiarityLevel": "introduced|explored|understood",
          "children": []
        }
      ],
      "relatedConcepts": ["Related concept from another branch"]
    }
  ],
  "followUpSuggestions": [
    {
      "title": "Engaging title (question or hook)",
      "description": "1-2 sentences explaining why this is valuable to explore",
      "suggestedPrompt": "The actual prompt to start the conversation",
      "type": "deepen|connect|challenge|apply"
    }
  ]
}

Knowledge Graph Guidelines:
- Organize concepts hierarchically (parent concepts contain more specific children)
- Maximum depth of 3 levels
- Root-level concepts should be the main themes/areas explored
- "relatedConcepts" shows connections to other branches (cross-references)
- Use the exact concept names provided, but organize them logically
- If no concepts exist yet, return an empty knowledgeGraph array

Suggestion Types (generate 2 of each, 8 total):
- "deepen": Explore current concepts more thoroughly, advanced angles
- "connect": Bridge to related domains or show how concepts interconnect
- "challenge": Pose problems, paradoxes, or edge cases to test understanding
- "apply": Practical applications, projects, or real-world scenarios

Guidelines:
- Make suggestions specific to what they've already learned
- Reference their actual concepts when possible
- Write titles that provoke curiosity
- Suggested prompts should open conversations, not close them

Only return valid JSON, no markdown or explanation.

`;

export async function generateTopicSummary(
  topic: Topic,
  concepts: Concept[],
  recentMessages: Message[]
): Promise<TopicSummaryResult> {
  const context = buildTopicContext(topic, concepts, recentMessages);
  const prompt = TOPIC_SUMMARY_PROMPT + context;

  try {
    const response: ClaudeResponse = await invoke<ClaudeResponse>('send_to_claude', {
      prompt,
      systemPrompt: 'You are a learning assistant analyzing a student\'s topic exploration. Return only valid JSON.',
    });

    if (response.cli_not_found) {
      return { knowledgeGraph: [], followUpSuggestions: getDefaultSuggestions(topic), error: 'CLI not found' };
    }

    if (response.error && !response.content) {
      return { knowledgeGraph: [], followUpSuggestions: getDefaultSuggestions(topic), error: response.error };
    }

    const content: string = response.content.trim();
    const jsonMatch: RegExpMatchArray | null = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { knowledgeGraph: [], followUpSuggestions: getDefaultSuggestions(topic), error: 'Invalid response format' };
    }

    interface ParsedSummary {
      knowledgeGraph: Array<{
        conceptName: string;
        familiarityLevel: 'introduced' | 'explored' | 'understood';
        children: ParsedSummary['knowledgeGraph'];
        relatedConcepts: string[];
      }>;
      followUpSuggestions: Array<{
        title: string;
        description: string;
        suggestedPrompt: string;
        type: 'deepen' | 'connect' | 'challenge' | 'apply';
      }>;
    }

    const parsed: ParsedSummary = JSON.parse(jsonMatch[0]) as ParsedSummary;

    const knowledgeGraph = mapKnowledgeGraph(parsed.knowledgeGraph, concepts);
    const followUpSuggestions: TopicSuggestion[] = parsed.followUpSuggestions.map((s) => ({
      id: generateId(),
      title: s.title,
      description: s.description,
      suggestedPrompt: s.suggestedPrompt,
      type: s.type,
    }));

    return { knowledgeGraph, followUpSuggestions, error: null };
  } catch {
    return { knowledgeGraph: [], followUpSuggestions: getDefaultSuggestions(topic), error: 'Failed to generate topic summary' };
  }
}

function mapKnowledgeGraph(
  nodes: Array<{
    conceptName: string;
    familiarityLevel: 'introduced' | 'explored' | 'understood';
    children: Array<{
      conceptName: string;
      familiarityLevel: 'introduced' | 'explored' | 'understood';
      children: unknown[];
      relatedConcepts: string[];
    }>;
    relatedConcepts: string[];
  }>,
  concepts: Concept[]
): KnowledgeGraphNode[] {
  return nodes.map((node) => {
    const concept = concepts.find((c) => c.name.toLowerCase() === node.conceptName.toLowerCase());
    return {
      conceptId: concept?.id ?? generateId(),
      conceptName: node.conceptName,
      familiarityLevel: node.familiarityLevel,
      children: mapKnowledgeGraph(node.children as typeof nodes, concepts),
      relatedConcepts: node.relatedConcepts,
    };
  });
}

function buildTopicContext(topic: Topic, concepts: Concept[], recentMessages: Message[]): string {
  const conceptList = concepts.length > 0
    ? concepts.map((c) => `- ${c.name} (${c.familiarityLevel})`).join('\n')
    : 'No concepts extracted yet';

  const messageExcerpts = recentMessages.length > 0
    ? recentMessages
        .slice(-20)
        .map((m) => `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.content.slice(0, 300)}${m.content.length > 300 ? '...' : ''}`)
        .join('\n\n')
    : 'No conversations yet';

  return `Topic: ${topic.name}
Category: ${topic.category ?? 'General'}
Current Summary: ${topic.summary ?? 'No summary available yet'}

Explored Concepts:
${conceptList}

Recent Session Excerpts:
${messageExcerpts}
`;
}

function getDefaultSuggestions(topic: Topic): TopicSuggestion[] {
  return [
    {
      id: generateId(),
      type: 'deepen',
      title: `What makes ${topic.name} fascinating?`,
      description: 'Discover the deeper aspects that make this subject compelling.',
      suggestedPrompt: `What are the most fascinating or surprising aspects of ${topic.name} that most people don't know about?`,
    },
    {
      id: generateId(),
      type: 'deepen',
      title: 'The fundamentals matter',
      description: 'Build a solid foundation before exploring further.',
      suggestedPrompt: `What are the core principles or fundamentals I should understand about ${topic.name}?`,
    },
    {
      id: generateId(),
      type: 'connect',
      title: 'Unexpected connections',
      description: 'See how this topic relates to other fields.',
      suggestedPrompt: `How does ${topic.name} connect to other disciplines or areas of knowledge?`,
    },
    {
      id: generateId(),
      type: 'connect',
      title: 'Historical context',
      description: 'Understand how this knowledge developed over time.',
      suggestedPrompt: `What's the history behind ${topic.name}? How did our understanding evolve?`,
    },
    {
      id: generateId(),
      type: 'challenge',
      title: 'Test your understanding',
      description: 'Put your knowledge to the test with a thought experiment.',
      suggestedPrompt: `Can you give me a challenging problem or thought experiment related to ${topic.name}?`,
    },
    {
      id: generateId(),
      type: 'challenge',
      title: 'Common misconceptions',
      description: 'Identify and correct common misunderstandings.',
      suggestedPrompt: `What are the most common misconceptions about ${topic.name}, and why are they wrong?`,
    },
    {
      id: generateId(),
      type: 'apply',
      title: 'Real-world applications',
      description: 'See how this knowledge applies in practice.',
      suggestedPrompt: `What are some practical, real-world applications of ${topic.name}?`,
    },
    {
      id: generateId(),
      type: 'apply',
      title: 'Start a project',
      description: 'Learn by doing with a hands-on project.',
      suggestedPrompt: `What's a good beginner project I could do to learn more about ${topic.name}?`,
    },
  ];
}

export async function generateTopicSummaryFromDb(topicId: string): Promise<TopicSummaryResult> {
  const topic = await db.topics.get(topicId);
  if (!topic) {
    return { knowledgeGraph: [], followUpSuggestions: [], error: 'Topic not found' };
  }

  const concepts = await db.concepts.where('topicId').equals(topicId).toArray();

  // Get recent messages from sessions in this topic
  const sessions = await db.sessions.where('topicId').equals(topicId).toArray();
  const sessionIds = sessions.map((s) => s.id);

  let recentMessages: Message[] = [];
  if (sessionIds.length > 0) {
    recentMessages = await db.messages
      .where('sessionId')
      .anyOf(sessionIds)
      .reverse()
      .limit(20)
      .toArray();
  }

  return generateTopicSummary(topic, concepts, recentMessages);
}
