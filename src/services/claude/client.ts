import type { TeachingStyle } from '../../types';

export interface StreamMessage {
  type: 'text' | 'done' | 'error';
  content: string;
}

export interface ChatOptions {
  teachingStyle?: TeachingStyle;
  systemPrompt?: string;
}

function buildSystemPrompt(teachingStyle?: TeachingStyle): string {
  const base = 'You are a knowledgeable tutor helping someone learn.';

  if (!teachingStyle) return base;

  const parts = [base];

  if (teachingStyle.preset) {
    const presets: Record<string, string> = {
      socratic: 'Use the Socratic method: ask guiding questions rather than giving direct answers.',
      'hands-on': 'Focus on practical examples and exercises. Show code and let the learner experiment.',
      theoretical: 'Emphasize underlying theory and principles. Build a solid conceptual foundation.',
      storyteller: 'Use narratives and analogies to make concepts memorable and engaging.',
    };
    parts.push(presets[teachingStyle.preset] || '');
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
  apiKey: string,
  options: ChatOptions = {}
): AsyncGenerator<StreamMessage> {
  const systemPrompt = options.systemPrompt || buildSystemPrompt(options.teachingStyle);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    yield { type: 'error', content: `API Error: ${response.status} - ${error}` };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { type: 'error', content: 'No response body' };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          yield { type: 'done', content: '' };
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            yield { type: 'text', content: parsed.delta.text };
          }
        } catch {
          // Skip non-JSON lines
        }
      }
    }
  }

  yield { type: 'done', content: '' };
}
