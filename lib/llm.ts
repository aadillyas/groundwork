import { GoogleGenerativeAI } from '@google/generative-ai'
import { LLMProvider } from '@/lib/types'

const DEFAULT_PROVIDER: LLMProvider = 'gemini'
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.5-flash'
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat'
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.1'

function sanitiseResponseText(text: string): string {
  const stripped = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return stripped.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

function resolveProvider(provider?: LLMProvider): LLMProvider {
  return provider ?? DEFAULT_PROVIDER
}

function resolveModel(provider: LLMProvider, model?: string): string {
  if (model?.trim()) return model.trim()

  switch (provider) {
    case 'openrouter':
      return DEFAULT_OPENROUTER_MODEL
    case 'deepseek':
      return DEFAULT_DEEPSEEK_MODEL
    case 'ollama':
      return DEFAULT_OLLAMA_MODEL
    case 'gemini':
    default:
      return DEFAULT_GEMINI_MODEL
  }
}

async function callGemini(prompt: string, apiKey?: string, model?: string): Promise<string> {
  const key = apiKey ?? process.env.GEMINI_API_KEY
  if (!key) {
    throw new Error('Missing Gemini API key')
  }

  const genAI = new GoogleGenerativeAI(key)
  const result = await genAI.getGenerativeModel({ model: resolveModel('gemini', model) }).generateContent(prompt)
  return sanitiseResponseText(result.response.text())
}

async function callOpenAICompatible(
  prompt: string,
  apiKey: string | undefined,
  model: string,
  endpoint: string,
  provider: 'openrouter' | 'deepseek'
): Promise<string> {
  if (!apiKey) {
    throw new Error(`Missing ${provider} API key`)
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    headers['X-Title'] = 'Groundwork'
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${provider} request failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content

  if (typeof text !== 'string') {
    throw new Error(`${provider} response did not include message content`)
  }

  return sanitiseResponseText(text)
}

async function callOllama(prompt: string, model?: string): Promise<string> {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: resolveModel('ollama', model),
      prompt,
      stream: false,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ollama request failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  if (typeof data.response !== 'string') {
    throw new Error('ollama response did not include generated text')
  }

  return sanitiseResponseText(data.response)
}

export async function callLLM(
  prompt: string,
  apiKey?: string,
  provider?: LLMProvider,
  model?: string
): Promise<string> {
  const resolvedProvider = resolveProvider(provider)
  const resolvedModel = resolveModel(resolvedProvider, model)

  switch (resolvedProvider) {
    case 'openrouter':
      return callOpenAICompatible(prompt, apiKey, resolvedModel, 'https://openrouter.ai/api/v1/chat/completions', 'openrouter')
    case 'deepseek':
      return callOpenAICompatible(prompt, apiKey, resolvedModel, 'https://api.deepseek.com/chat/completions', 'deepseek')
    case 'ollama':
      return callOllama(prompt, resolvedModel)
    case 'gemini':
    default:
      return callGemini(prompt, apiKey, resolvedModel)
  }
}
