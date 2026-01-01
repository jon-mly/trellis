import { invoke } from '@tauri-apps/api/core';
import type { ClaudeResponse } from './cli-provider';
import type { Topic } from '../../types';

export interface IdentifiedTopic {
  topicName: string;
  topicCategory?: string;
}

export interface TopicMatchResult {
  matchedTopicId: string | null;
  matchedTopicName: string | null;
}

const TOPIC_IDENTIFICATION_PROMPT: string = `Analyze the following user message and identify the main topic they want to learn about.

Return a JSON object with this exact structure:
{
  "topicName": "clear, concise topic name (e.g., 'Trigonometry', 'Rust Ownership', 'French Revolution')",
  "topicCategory": "optional broad category (e.g., 'Mathematics', 'Programming', 'History')"
}

Rules:
- The topic name should be specific but not too narrow
- If the message is unclear or doesn't indicate a learning topic, return null
- Only return valid JSON, no markdown or explanation

User message:
`;

const TOPIC_MATCHING_PROMPT: string = `Given a new topic the user wants to learn about, determine if it matches any existing topics.

New topic: "{newTopic}"
{newCategory}

Existing topics:
{existingTopics}

Return a JSON object with this exact structure:
{
  "matchedTopicName": "exact name of the matching existing topic, or null if no match"
}

Rules:
- Match if the new topic is essentially the same subject as an existing topic
- Match if the new topic is a subtopic or closely related aspect of an existing topic
- Examples of matches: "React Hooks" matches "React", "Linear Equations" matches "Algebra"
- Examples of non-matches: "React" does not match "Vue.js", "Calculus" does not match "Statistics"
- Only return valid JSON, no markdown or explanation
`;

export async function identifyTopicFromMessage(
  userMessage: string
): Promise<IdentifiedTopic | null> {
  if (!userMessage.trim()) {
    return null;
  }

  const prompt: string = TOPIC_IDENTIFICATION_PROMPT + userMessage;

  try {
    const response: ClaudeResponse = await invoke<ClaudeResponse>('send_to_claude', {
      prompt,
      systemPrompt: 'You are a topic identification assistant. Return only valid JSON.',
    });

    if (response.cli_not_found || response.error) {
      return null;
    }

    const content: string = response.content.trim();

    // Handle explicit null response
    if (content.toLowerCase() === 'null') {
      return null;
    }

    const jsonMatch: RegExpMatchArray | null = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed: IdentifiedTopic = JSON.parse(jsonMatch[0]) as IdentifiedTopic;

    if (!parsed.topicName) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function findMatchingTopic(
  identifiedTopic: IdentifiedTopic,
  existingTopics: Topic[]
): Promise<TopicMatchResult> {
  if (existingTopics.length === 0) {
    return { matchedTopicId: null, matchedTopicName: null };
  }

  const existingTopicsList: string = existingTopics
    .map((t: Topic): string => `- ${t.name}${t.category ? ` [${t.category}]` : ''}`)
    .join('\n');

  const categoryLine: string = identifiedTopic.topicCategory
    ? `Category: ${identifiedTopic.topicCategory}`
    : '';

  const prompt: string = TOPIC_MATCHING_PROMPT
    .replace('{newTopic}', identifiedTopic.topicName)
    .replace('{newCategory}', categoryLine)
    .replace('{existingTopics}', existingTopicsList);

  try {
    const response: ClaudeResponse = await invoke<ClaudeResponse>('send_to_claude', {
      prompt,
      systemPrompt: 'You are a topic matching assistant. Return only valid JSON.',
    });

    if (response.cli_not_found || response.error) {
      return { matchedTopicId: null, matchedTopicName: null };
    }

    const content: string = response.content.trim();
    const jsonMatch: RegExpMatchArray | null = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { matchedTopicId: null, matchedTopicName: null };
    }

    const parsed: { matchedTopicName: string | null } = JSON.parse(jsonMatch[0]) as {
      matchedTopicName: string | null;
    };

    if (!parsed.matchedTopicName) {
      return { matchedTopicId: null, matchedTopicName: null };
    }

    // Find the topic ID by matching the name (case-insensitive)
    const matchedTopic: Topic | undefined = existingTopics.find(
      (t: Topic): boolean => t.name.toLowerCase() === parsed.matchedTopicName!.toLowerCase()
    );

    if (!matchedTopic) {
      return { matchedTopicId: null, matchedTopicName: null };
    }

    return {
      matchedTopicId: matchedTopic.id,
      matchedTopicName: matchedTopic.name,
    };
  } catch {
    return { matchedTopicId: null, matchedTopicName: null };
  }
}
