import { invoke } from '@tauri-apps/api/core';
import type { ClaudeResponse } from './cli-provider';
import type { Message } from '../../types';

export interface DemoGenerationResult {
  success: boolean;
  title?: string;
  html?: string;
  error?: string;
  cliNotFound?: boolean;
}

function buildDemoPrompt(messages: Message[]): string {
  const recentMessages = messages.slice(-6);
  const context = recentMessages
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');

  return `Based on our recent conversation, create an interactive HTML demo that visualizes the main concept being discussed.

Recent conversation:
${context}

Requirements:
1. Create a single self-contained HTML document with embedded CSS and JavaScript
2. The demo should be interactive and help visualize the concept
3. Use a clean, minimal design with a dark background (#0a0a0a) and light text (#ededed)
4. Make it educational - the user should learn by interacting with it
5. Include brief instructions within the demo itself

Respond with ONLY valid HTML - no markdown, no explanation, just the complete HTML document starting with <!DOCTYPE html>.`;
}

const SYSTEM_PROMPT = `You are an expert at creating interactive educational visualizations. You create self-contained HTML demos that help learners understand concepts through interaction. Your demos are clean, functional, and focused on the learning objective. Always output only valid HTML - no markdown formatting, no code blocks, no explanations.`;

export async function generateDemo(messages: Message[]): Promise<DemoGenerationResult> {
  if (messages.length === 0) {
    return { success: false, error: 'No conversation context available' };
  }

  const prompt = buildDemoPrompt(messages);

  try {
    const response: ClaudeResponse = await invoke<ClaudeResponse>('send_to_claude', {
      prompt,
      systemPrompt: SYSTEM_PROMPT,
    });

    if (response.cli_not_found) {
      return { success: false, cliNotFound: true, error: 'Claude CLI not found' };
    }

    if (response.error && !response.content) {
      return { success: false, error: response.error };
    }

    const html = response.content.trim();

    if (!html.includes('<!DOCTYPE html>') && !html.includes('<html')) {
      return { success: false, error: 'Invalid HTML response from Claude' };
    }

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'Interactive Demo';

    return {
      success: true,
      title,
      html,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
}
