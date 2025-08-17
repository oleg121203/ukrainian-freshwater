/* Simple Gemini (Generative) API helper
   - Exposes generateQASet(prompt, options) which returns an array of {question, answer}
   - Uses a stored API key from localStorage by default; caller can pass apiKey.
   - This is a small wrapper around the REST API. For production, proxy the key on server-side.
*/

export interface QAItem {
  question: string
  answer: string
}

export interface GeminiOptions {
  maxQ?: number
  temperature?: number
}

const DEFAULT_OPTIONS: Required<GeminiOptions> = {
  maxQ: 5,
  temperature: 0.3,
}

function getStoredApiKey(): string | null {
  try {
    return localStorage.getItem('gemeni_api_key')
  } catch (_e) {
    return null
  }
}

export async function generateQASet(prompt: string, opts?: GeminiOptions, apiKey?: string): Promise<QAItem[]> {
  const options = { ...DEFAULT_OPTIONS, ...(opts || {}) }
  const key = apiKey || getStoredApiKey()
  if (!key) throw new Error('Gemini API key not set')

  // Build a reasonable completion prompt that instructs Gemini to return JSON array of Q/A pairs
  const systemPrompt = `You are Petka the shrimp (Петька — креветка). Generate exactly ${options.maxQ} short question-answer pairs for a children's quiz. Output JSON only: an array of objects with {"question":"...","answer":"..."}. Questions should be varied and each batch must differ from previous ones.`

  const body = {
    // This wrapper is generic; adapt to the actual Gemini REST shape if different.
    model: 'gemini-1.0',
    temperature: options.temperature,
    prompt: `${systemPrompt}\nUser prompt:\n${prompt}`,
    max_output_tokens: 1024,
  }

  const res = await fetch('https://api.openai.com/v1/engines/gemini/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini API error: ${res.status} ${text}`)
  }

  const json = await res.json()

  // Try to parse JSON from response text or choices
  let raw: string | null = null
  if (json.choices && json.choices[0] && json.choices[0].text) raw = json.choices[0].text
  if (!raw && json.output && Array.isArray(json.output) && json.output[0].content) raw = json.output[0].content

  if (!raw) {
    // fallback: stringify entire response
    raw = JSON.stringify(json)
  }

  // Attempt to extract JSON array from raw
  const m = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
  const payload = m ? m[0] : raw

  try {
    const arr = JSON.parse(payload)
    if (Array.isArray(arr)) {
      return arr.map((it: any) => ({ question: String(it.question || it.q || ''), answer: String(it.answer || it.a || '') }))
    }
  } catch (e) {
    // try to recover line-by-line
    try {
      const lines = payload.split(/\r?\n/).filter(Boolean)
      const out: QAItem[] = []
      for (const ln of lines) {
        const sep = ln.indexOf('?')
        if (sep > 0) {
          out.push({ question: ln.slice(0, sep + 1).trim(), answer: ln.slice(sep + 1).trim() })
        }
      }
      if (out.length) return out
    } catch (_e) {}
  }

  throw new Error('Could not parse Gemini response into QA items')
}

export default { generateQASet }
