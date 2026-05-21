// Thin Claude API wrapper used by the AI listing pipeline (Module 2) and
// search-intent matching (Module 3). Wraps with a default model so callsites
// can swap easily.

import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

let _client: Anthropic | null = null;

export function anthropic() {
  if (!_client) {
    if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export const DEFAULT_MODEL = "claude-sonnet-4-6";

export async function generateText(opts: {
  system?: string;
  prompt: string;
  maxTokens?: number;
  model?: string;
}) {
  const res = await anthropic().messages.create({
    model: opts.model ?? DEFAULT_MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return { text, stopReason: res.stop_reason, usage: res.usage };
}
