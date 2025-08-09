export type PetkaQuestion = {
  q: string
  options: string[]
  correctIndex: number
}

export async function generateQuizQuestions(ingrs: string[] = []): Promise<PetkaQuestion[]> {
  const key = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined
  const prompt = `Ти — Петька, кмітлива креветка-кухар. Згенеруй 5 коротких кулінарних запитань українською мовою з варіантами відповідей (3 варіанти) і познач правильний індекс. Запитання мають стосуватися приготування морепродуктів, безпеки харчування, смакових поєднань. Якщо задано інгредієнти користувача, додай 1-2 питання саме про них: ${ingrs.join(', ')}. Поверни тільки валідний JSON масив у форматі:
  [
    { "q": "...", "options": ["A","B","C"], "correctIndex": 1 },
    ...
  ]`
  
  // If no key, return local fallback
  if (!key) {
    return fallbackQuestions(ingrs)
  }

  try {
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    }

    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
    const data = await res.json()
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No text from Gemini')

    // Extract JSON array from text
    const match = text.match(/\[\s*{[\s\S]*}\s*\]/)
    const jsonStr = match ? match[0] : text
    const parsed = JSON.parse(jsonStr) as PetkaQuestion[]

    return sanitizeQuestions(parsed)
  } catch (_err) {
    return fallbackQuestions(ingrs)
  }
}

function sanitizeQuestions(arr: PetkaQuestion[]): PetkaQuestion[] {
  return arr
    .filter((q) => q && Array.isArray(q.options) && typeof q.correctIndex === 'number')
    .slice(0, 5)
    .map((q) => ({
      q: String(q.q).trim(),
      options: q.options.slice(0, 3).map((o) => String(o)),
      correctIndex: Math.min(Math.max(0, q.correctIndex), 2),
    }))
}

function fallbackQuestions(ingrs: string[]): PetkaQuestion[] {
  const base: PetkaQuestion[] = [
    {
      q: 'Скільки хвилин зазвичай обсмажують креветки з кожного боку?',
      options: ['1–2 хв', '5–7 хв', '10–12 хв'],
      correctIndex: 0,
    },
    {
      q: 'Що додасть свіжості смаку морепродуктів?',
      options: ['Лимонний сік', 'Цукор', 'Какао'],
      correctIndex: 0,
    },
    {
      q: 'Щоб креветки не стали гумовими, їх потрібно...',
      options: ['Пересмажити', 'Готувати коротко на сильному вогні', 'Варити понад 20 хв'],
      correctIndex: 1,
    },
  ]
  if (ingrs.length) {
    base.push({
      q: `Який інгредієнт найкраще поєднується з: ${ingrs[0]}?`,
      options: ['Лимон', 'Маршмелоу', 'Кава'],
      correctIndex: 0,
    })
  }
  while (base.length < 5) {
    base.push({
      q: 'Яка сіль підходить для морепродуктів?',
      options: ['Морська', 'Без різниці', 'Шоколадна'],
      correctIndex: 0,
    })
  }
  return base
}

export type PetkaRecipe = {
  title: string
  ingredients: string[]
  steps: string[]
}

export async function generateProfessionalRecipe(params: {
  ingredients: string[]
  protein: 'shrimp' | 'crayfish'
  locale?: 'uk' | 'en'
}): Promise<PetkaRecipe> {
  const key = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined
  const locale = params.locale || 'uk'
  const proteinLabel = params.protein === 'shrimp' ? 'креветки' : 'рака'
  const prompt = `${locale === 'uk' ? 'Ти — Петька, професійний кухар морепродуктів. Склади короткий професійний рецепт українською на основі інгредієнтів користувача.' : 'You are Petka, a professional seafood chef. Create a concise professional recipe in the selected language based on user ingredients.'}
Інгредієнти: ${params.ingredients.join(', ')}. Основний продукт: ${proteinLabel}.
Поверни ТІЛЬКИ JSON у форматі:
{ "title": "Назва", "ingredients": ["..."], "steps": ["Крок 1", "Крок 2", "Крок 3"] }`

  if (!key) return fallbackRecipe(params.ingredients, params.protein)
  try {
    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    }
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
    const data = await res.json()
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No text from Gemini')
    const match = text.match(/\{[\s\S]*\}/)
    const jsonStr = match ? match[0] : text
    const parsed = JSON.parse(jsonStr) as PetkaRecipe
    return sanitizeRecipe(parsed, params.ingredients, params.protein)
  } catch {
    return fallbackRecipe(params.ingredients, params.protein)
  }
}

function sanitizeRecipe(r: PetkaRecipe, baseIngr: string[], protein: 'shrimp' | 'crayfish'): PetkaRecipe {
  const title = (r?.title || `Страва з ${protein === 'shrimp' ? 'креветками' : 'раком'} від Петьки`).toString()
  const ingredients = Array.isArray(r?.ingredients) && r.ingredients.length ? r.ingredients.map(String) : baseIngr
  const steps = Array.isArray(r?.steps) && r.steps.length ? r.steps.map(String) : defaultSteps(protein)
  return { title, ingredients, steps }
}

function defaultSteps(protein: 'shrimp' | 'crayfish'): string[] {
  return [
    'Підготувати інгредієнти та розігріти пательню/посуд',
    'Додати масло, часник, зелень; коротко прогріти',
    `Додати ${protein === 'shrimp' ? 'креветки' : 'рака'}, приправити, довести до готовності`,
    'Додати кислоту (лимонний сік) та подати гарячим',
  ]
}

function fallbackRecipe(ingredients: string[], protein: 'shrimp' | 'crayfish'): PetkaRecipe {
  return {
    title: `Професійна страва від Петьки (${protein === 'shrimp' ? 'креветка' : 'рак'})`,
    ingredients: ingredients.length ? ingredients : ['креветки', 'лимон', 'часник', 'зелень', 'масло'],
    steps: defaultSteps(protein),
  }
}
