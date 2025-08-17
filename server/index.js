// Simple server proxy for Gemini generation. Reads GEMINI_API_KEY from env.
// Usage: GEMINI_API_KEY=sk... node server/index.js
const http = require('http')
const { URL } = require('url')

const PORT = process.env.PORT || 4000
const GEMINI_KEY = process.env.GEMINI_API_KEY

function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

async function callGemini(prompt, maxQ = 5, temperature = 0.3) {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not set on server')

  const systemPrompt = `You are Petka the shrimp (Петька — креветка). Generate exactly ${maxQ} short question-answer pairs for a children's quiz. Output JSON only: an array of objects with {"question":"...","answer":"..."}. Questions should be varied and each batch must differ from previous ones.`

  const body = {
    model: 'gemini-1.0',
    temperature,
    prompt: `${systemPrompt}\nUser prompt:\n${prompt}`,
    max_output_tokens: 1024,
  }

  const res = await fetch('https://api.openai.com/v1/engines/gemini/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GEMINI_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemini API error: ${res.status} ${text}`)
  }

  const json = await res.json()
  let raw = null
  if (json.choices && json.choices[0] && json.choices[0].text) raw = json.choices[0].text
  if (!raw && json.output && Array.isArray(json.output) && json.output[0].content) raw = json.output[0].content
  if (!raw) raw = JSON.stringify(json)
  const m = raw.match(/\[\s*\{[\s\S]*\}\s*\]/)
  const payload = m ? m[0] : raw

  try {
    const arr = JSON.parse(payload)
    if (Array.isArray(arr)) return arr.map((it) => ({ question: String(it.question || it.q || ''), answer: String(it.answer || it.a || '') }))
  } catch (e) {
    // fallback parsing
    const lines = payload.split(/\r?\n/).filter(Boolean)
    const out = []
    for (const ln of lines) {
      const sep = ln.indexOf('?')
      if (sep > 0) out.push({ question: ln.slice(0, sep + 1).trim(), answer: ln.slice(sep + 1).trim() })
    }
    if (out.length) return out
  }

  throw new Error('Could not parse Gemini response')
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (req.method === 'POST' && url.pathname === '/api/generate') {
    try {
      const body = await parseJSONBody(req)
      const prompt = body.prompt || 'Задай питання про креветок'
      const maxQ = parseInt(body.maxQ) || 5
      const items = await callGemini(prompt, maxQ)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ items }))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: String(err.message || err) }))
    }
    return
  }

  // simple health
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, () => console.log(`Proxy server listening on http://localhost:${PORT}`))
