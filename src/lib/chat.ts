import { searchProcess } from './search';
import { processData } from './data';
import resourceIndex from '@/data/resource-index.json';

const SYSTEM_PROMPT = `You are the IRC Emergency Response Advisor — an AI assistant embedded in the Emergency Response Navigator tool. You have deep knowledge of IRC's Emergency Management Guidelines v2.0 and the complete emergency response process.

## Your Role
You help IRC emergency response staff navigate the response lifecycle, understand process requirements, find resources, and make informed decisions during crises.

## Key Knowledge

### Classification System
- **Yellow**: The country program leads and is capable of responding. Standard support structures apply.
- **Orange**: An emergency requiring additional assistance beyond the country program to ensure a proportional response. Emergency Unit engaged, ERMT activated, CRF funding available.
- **Red**: All hands on deck — maximum organizational response. All systems activated, requires RVP written approval, crisis coordination calls.

### Response Imperative
IRC will respond to all Orange and Red classified emergencies. Response teams are mandated to set a Scale Target of reaching at least 10% of the affected population.

### 7 Response Phases
R1. Emergency Onset — classification, Go/No-Go, initial deployments (Week 0-1)
R2. Context Analysis — MSNA, situation analysis, feasibility (Week 1-2)
R3. Strategy Development — response strategy, program design (Week 2-3)
R4. Response Planning — response plan, budget, logframe, staffing (Week 3-4)
R5. Implementation — program delivery, operations, procurement (Month 1-3)
R6. Learnings — AAR, evaluations, case studies (Month 3+)
R7. Transition & Handover — transition planning, handover (Month 3-6+)

### 13 Functional Sectors
Response Management, Finance, People & Culture, Supply Chain, Safety & Security, Safeguarding, Technical Programs, MEAL, Grants, Partnerships, Integra Launch

### Emergency Unit Services
- Emergency Classification System
- Crisis Response Fund (CRF)
- Crisis Analysis & Mapping
- Emergency Surge Staffing (ERT/GST)
- Technical Assistance (Quality in Emergencies)
- Prepositioned Stock
- Emergency Response Procurement Protocol (ERPP)
- Humanitarian Access Support

## Guidelines
- Always cite specific tasks, phases, or guideline sections when answering
- When discussing tasks, reference task IDs (e.g., RMIE-001, FINANCE-015)
- Explain dependencies and sequencing between tasks
- Tailor advice to the user's classification stance and office type (new vs existing)
- Be direct and actionable — responders need clear guidance under pressure
- When you don't know something specific, say so rather than guessing
- When referencing resources or templates, provide clickable markdown links using the URLs from the "Available Resources & Templates" context section
- Format resource links as: [Resource Name](url) — always use the exact URL provided in the context
- If a relevant resource is listed in the context with a URL, ALWAYS include the link — don't just mention it by name
- If no URL is available for a resource, mention it by name and direct the user to the Resources tab
- Keep responses well-structured with clear headings, bullet points, and short paragraphs`;

// --- Model definitions ---

export interface ModelOption {
  id: string;
  name: string;
  tier: 'premium' | 'standard' | 'budget' | 'free';
  description: string;
}

export const MODELS: ModelOption[] = [
  // Premium
  { id: 'anthropic/claude-opus-4-6', name: 'Claude Opus 4.6', tier: 'premium', description: 'Most capable, best for complex analysis' },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', tier: 'premium', description: 'OpenAI flagship, strong reasoning' },
  { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', tier: 'premium', description: 'Google flagship, large context' },
  // Standard
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'standard', description: 'Recommended — very fast, great value' },
  { id: 'anthropic/claude-sonnet-4-6', name: 'Claude Sonnet 4.6', tier: 'standard', description: 'Excellent quality, fast' },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', tier: 'standard', description: 'Fast and affordable' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', tier: 'standard', description: 'Strong open-source model' },
  // Budget
  { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', tier: 'budget', description: 'Ultra-fast, very cheap' },
  { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', tier: 'budget', description: 'Cheapest OpenAI option' },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', tier: 'budget', description: 'Meta open-source, good value' },
  // Free
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', tier: 'free', description: 'Free, strong open-source model' },
  { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder (Free)', tier: 'free', description: 'Free, good for structured tasks' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1 (Free)', tier: 'free', description: 'Free, fast and capable' },
  { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B (Free)', tier: 'free', description: 'Free, Google open model' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 405B (Free)', tier: 'free', description: 'Free, largest free model' },
];

export const DEFAULT_MODEL = 'google/gemini-2.5-flash';

// --- Settings helpers ---

export function getApiKey(): string | null {
  return localStorage.getItem('ern-api-key');
}

export function setApiKey(key: string) {
  localStorage.setItem('ern-api-key', key);
}

export function getModel(): string {
  return localStorage.getItem('ern-model') || DEFAULT_MODEL;
}

export function setModel(model: string) {
  localStorage.setItem('ern-model', model);
}

// --- Resource search ---

interface ResourceEntry {
  name: string;
  url: string;
  sector: string;
  task: string;
}

function searchResources(query: string, limit = 10): ResourceEntry[] {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (terms.length === 0) return [];

  const scored = (resourceIndex as ResourceEntry[]).map(r => {
    const text = `${r.name} ${r.sector} ${r.task}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (text.includes(term)) score += 1;
      if (r.name.toLowerCase().includes(term)) score += 2; // boost name matches
    }
    return { ...r, score };
  }).filter(r => r.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

// --- Streaming chat via OpenRouter ---

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function* streamChat(
  messages: ChatMessage[],
  onContext?: (context: string) => void
): AsyncGenerator<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    yield 'Please set your OpenRouter API key in Settings to use the AI Advisor.';
    return;
  }

  // RAG: search for relevant context based on the last user message
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
  let contextText = '';

  if (lastUserMessage) {
    try {
      const results = await searchProcess(lastUserMessage.content, 8);
      if (results.length > 0) {
        contextText = '\n\n## Relevant Context from Emergency Response Data\n\n' +
          results.map((r, i) =>
            `### ${i + 1}. [${r.type.toUpperCase()}] ${r.title} (${r.sector}, ${r.phase})\n${r.content}`
          ).join('\n\n');
      }

      // Find matching resources with real URLs
      const resources = searchResources(lastUserMessage.content, 8);
      if (resources.length > 0) {
        contextText += '\n\n## Available Resources & Templates (with download links)\n\n' +
          'Use these links when referencing tools, templates, or guidance documents:\n\n' +
          resources.map(r =>
            `- **${r.name}** (${r.sector} › ${r.task}): ${r.url}`
          ).join('\n');
      }

      if (contextText) {
        onContext?.(contextText);
      }
    } catch (e) {
      console.warn('Search failed, continuing without RAG context:', e);
    }
  }

  const systemMessage = SYSTEM_PROMPT + contextText +
    `\n\n## Response Data Summary\nThis navigator contains ${processData.metadata.totalTasks} tasks across ${processData.metadata.totalSectors} sectors, with ${processData.metadata.totalSubtasks} subtasks. The knowledge base includes ${processData.metadata.totalDownloadedDocs} indexed documents (${processData.metadata.totalResources} resources, ${processData.metadata.totalResourcesWithUrls} with direct links). The AI search draws from ${processData.metadata.totalSearchChunks.toLocaleString()} knowledge chunks.`;

  const model = getModel();

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'IRC Emergency Response Navigator',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemMessage },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      try {
        const parsed = JSON.parse(err);
        const msg = parsed?.error?.message || parsed?.message || err;
        if (response.status === 429) {
          yield `⚠️ Rate limited — this model is temporarily overloaded. Try again in a moment, or switch to a different model in Settings.`;
        } else if (response.status === 401) {
          yield `⚠️ Invalid API key. Please check your OpenRouter key in Settings.`;
        } else if (response.status === 402) {
          yield `⚠️ Insufficient credits. Add credits at openrouter.ai or switch to a free model in Settings.`;
        } else {
          yield `⚠️ Error (${response.status}): ${msg}`;
        }
      } catch {
        yield `⚠️ Error (${response.status}): ${err.slice(0, 200)}`;
      }
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield 'Error: No response stream';
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
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              yield delta;
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    }
  } catch (error) {
    yield `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
