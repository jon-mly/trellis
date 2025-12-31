import { invoke } from '@tauri-apps/api/core';
import type { TeachingStyle, PromptContext } from '../../types';

export interface ClaudeResponse {
  content: string;
  error: string | null;
  cli_not_found: boolean;
}

export interface StreamMessage {
  type: 'text' | 'done' | 'error' | 'cli_not_found' | 'prompt_context';
  content: string;
  promptContext?: PromptContext;
}

export interface ChatOptions {
  teachingStyle?: TeachingStyle;
  systemPrompt?: string;
  knowledgeContext?: string;
}

function buildSystemPrompt(teachingStyle?: TeachingStyle): string {
  const base: string = 'You are a knowledgeable tutor helping someone learn.';

  if (!teachingStyle) return base;

  const parts: string[] = [base];

  if (teachingStyle.preset) {
    const presets: Record<string, string> = {
      socratic: 'Use the Socratic method: ask guiding questions rather than giving direct answers.',
      'hands-on': 'Focus on practical examples and exercises. Show code and let the learner experiment.',
      theoretical: 'Emphasize underlying theory and principles. Build a solid conceptual foundation.',
      storyteller: 'Use narratives and analogies to make concepts memorable and engaging.',
    };
    const presetInstruction: string | undefined = presets[teachingStyle.preset];
    if (presetInstruction) {
      parts.push(presetInstruction);
    }
  }

  const { parameters } = teachingStyle;

  if (parameters.depth === 'deep') {
    parts.push('Provide thorough, detailed explanations.');
  } else if (parameters.depth === 'shallow') {
    parts.push('Keep explanations concise and high-level.');
  }

  if (parameters.useAnalogies) {
    parts.push('Use analogies to relate new concepts to familiar ones.');
  }

  if (parameters.formality === 'casual') {
    parts.push('Use a casual, conversational tone.');
  } else if (parameters.formality === 'formal') {
    parts.push('Maintain a professional, academic tone.');
  }

  if (teachingStyle.customInstructions) {
    parts.push(teachingStyle.customInstructions);
  }

  return parts.filter(Boolean).join(' ');
}

export async function* streamChat(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: ChatOptions = {}
): AsyncGenerator<StreamMessage> {
  let systemPrompt: string = options.systemPrompt || buildSystemPrompt(options.teachingStyle);

  if (options.knowledgeContext) {
    systemPrompt = `${systemPrompt}\n\nPrior knowledge context:\n${options.knowledgeContext}`;
  }

  // Build conversation context from message history
  const conversationContext: string = messages
    .map((msg: { role: 'user' | 'assistant'; content: string }): string => {
      const role: string = msg.role === 'user' ? 'User' : 'Assistant';
      return `${role}: ${msg.content}`;
    })
    .join('\n\n');

  // The last message is the current user message
  const lastMessage: { role: 'user' | 'assistant'; content: string } | undefined = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    yield { type: 'error', content: 'No user message to send' };
    return;
  }

  // For single message, just send the prompt
  // For conversation, send the context
  const prompt: string = messages.length === 1
    ? lastMessage.content
    : conversationContext;

  // Yield prompt context first so it can be stored with the message
  const promptContext: PromptContext = {
    systemPrompt,
    fullPrompt: prompt,
    knowledgeContext: options.knowledgeContext,
  };
  yield { type: 'prompt_context', content: '', promptContext };

  try {
    const response: ClaudeResponse = await invoke<ClaudeResponse>('send_to_claude', {
      prompt,
      systemPrompt,
    });

    // Check if CLI was not found - trigger onboarding
    if (response.cli_not_found) {
      yield { type: 'cli_not_found', content: response.error ?? 'Claude CLI not found' };
      return;
    }

    if (response.error && !response.content) {
      yield { type: 'error', content: response.error };
      return;
    }

    // CLI doesn't stream, so we yield the entire response at once
    yield { type: 'text', content: response.content };
    yield { type: 'done', content: '' };
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error occurred';
    yield { type: 'error', content: errorMessage };
  }
}
