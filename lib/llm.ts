import { GoogleGenerativeAI } from '@google/generative-ai'

export async function callLLM(prompt: string, apiKey?: string): Promise<string> {
  const key = apiKey ?? process.env.GEMINI_API_KEY!
  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent(prompt)
  const text = result.response.text()
  // Strip markdown fences if the model adds them despite instructions
  const stripped = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  // Remove control characters that break JSON.parse (except tab, newline, carriage return)
  return stripped.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}
