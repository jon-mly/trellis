import { invoke } from '@tauri-apps/api/core';
import type { ClaudeResponse } from './cli-provider';
import type { Message, Concept, Topic } from '../../types';
import { generateId } from '../storage/db';

export interface ExtractedKnowledge {
  topicName: string;
  topicCategory?: string;
  topicSummary: string;
  concepts: Array<{
    name: string;
    familiarityLevel: 'introduced' | 'explored' | 'understood';
    relatedTo?: string[];
  }>;
}

const EXTRACTION_PROMPT = `Analyze the following learning conversation and extract knowledge information.

Return a JSON object with this exact structure:
{
  "topicName": "clear topic name (e.g., 'Trigonometry', 'Rust Ownership')",
  "topicCategory": "optional category (e.g., 'Mathematics', 'Programming')",
  "topicSummary": "1-2 sentence summary of what was learned",
  "concepts": [
    {
      "name": "concept name",
      "familiarityLevel": "introduced|explored|understood",
      "relatedTo": ["other concept names if any"]
    }
  ]
}

Familiarity levels:
- "introduced": briefly mentioned or just started learning
- "explored": discussed in some detail
- "understood": thoroughly explained with examples

Only return valid JSON, no markdown or explanation.

Conversation:
`;

export async function extractKnowledge(
  messages: Message[]
): Promise<ExtractedKnowledge | null> {
  if (messages.length < 2) {
    return null;
  }

  const conversationText: string = messages
    .map((m: Message): string => `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.content}`)
    .join('\n\n');

  const prompt: string = EXTRACTION_PROMPT + conversationText;

  try {
    const response: ClaudeResponse = await invoke<ClaudeResponse>('send_to_claude', {
      prompt,
      systemPrompt: 'You are a knowledge extraction assistant. Return only valid JSON.',
    });

    if (response.cli_not_found || response.error) {
      return null;
    }

    const content: string = response.content.trim();
    const jsonMatch: RegExpMatchArray | null = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed: ExtractedKnowledge = JSON.parse(jsonMatch[0]) as ExtractedKnowledge;
    return parsed;
  } catch {
    return null;
  }
}

export function createTopicFromExtraction(
  extraction: ExtractedKnowledge,
  sessionId: string
): Topic {
  const now: Date = new Date();
  return {
    id: generateId(),
    name: extraction.topicName,
    category: extraction.topicCategory,
    conceptIds: [],
    sessionIds: [sessionId],
    createdAt: now,
    lastExploredAt: now,
    summary: extraction.topicSummary,
  };
}

export function createConceptsFromExtraction(
  extraction: ExtractedKnowledge,
  topicId: string,
  sessionId: string
): Concept[] {
  return extraction.concepts.map((c): Concept => ({
    id: generateId(),
    name: c.name,
    topicId,
    relatedConceptIds: [],
    familiarityLevel: c.familiarityLevel,
    extractedFromSessionId: sessionId,
  }));
}

export function linkRelatedConcepts(
  concepts: Concept[],
  extraction: ExtractedKnowledge
): Concept[] {
  const nameToId: Map<string, string> = new Map();
  concepts.forEach((c: Concept): void => {
    nameToId.set(c.name.toLowerCase(), c.id);
  });

  return concepts.map((concept: Concept, index: number): Concept => {
    const extractedConcept = extraction.concepts[index];
    if (!extractedConcept?.relatedTo) {
      return concept;
    }

    const relatedIds: string[] = extractedConcept.relatedTo
      .map((name: string): string | undefined => nameToId.get(name.toLowerCase()))
      .filter((id: string | undefined): id is string => id !== undefined && id !== concept.id);

    return {
      ...concept,
      relatedConceptIds: relatedIds,
    };
  });
}
