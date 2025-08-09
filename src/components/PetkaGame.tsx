import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useKV } from '@/hooks/useKV'
import { generateQuizQuestions, PetkaQuestion, generateProfessionalRecipe } from '@/services/petkaService'
import { useAudio } from '@/hooks/useAudio'

interface PetkaGameProps {
  onNavigate?: (section: string) => void
  onOpen3D?: () => void
}

type NewRecipe = {
  id: string
  title: string
  ingredients: string[]
  instructions: string[]
  authorName: string
  authorEmail: string
  createdAt: string
  aiGenerated: boolean
}

export function PetkaGame({ onNavigate, onOpen3D }: PetkaGameProps) {
  const [userIngrInput, setUserIngrInput] = useState('')
  const [userIngr, setUserIngr] = useState<string[]>([])
  const [questions, setQuestions] = useState<PetkaQuestion[] | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [stage, setStage] = useState<'quiz' | 'builder' | 'done'>('quiz')
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [typedText, setTypedText] = useState('')
  const fullTextRef = useRef('')
  const [petkaX, setPetkaX] = useState(0)
  const dirRef = useRef(1)
  const [petkaProtein, setPetkaProtein] = useState<'shrimp' | 'crayfish'>('shrimp')
  const [streak, setStreak] = useState(0)
  const [aiRecipes, setAiRecipes] = useKV<NewRecipe[]>('chef-prawn-recipes', [])
  const { playBubbleSound } = useAudio()

  const score = useMemo(() => {
    if (!questions) return 0
    return answers.reduce((acc, a, i) => acc + (a === questions[i]?.correctIndex ? 1 : 0), 0)
  }, [answers, questions])

  const canProceed = score >= 3

  useEffect(() => {
    const load = async () => {
      try {
        const qs = await generateQuizQuestions(userIngr)
        setQuestions(qs)
        setAnswers(Array(qs.length).fill(-1))
        setCurrent(0)
        setSelected(null)
        setRevealed(false)
        // typing setup
        const t = qs[0]?.q || ''
        fullTextRef.current = t
        setTypedText('')
        typeOut(t)
      } catch (_e) {
        toast.error('Петька: не вдалось отримати питання, використовую запасні')
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Simple typing effect for question text
  const typeOut = (text: string) => {
    let i = 0
    const reveal = () => {
      i++
      setTypedText(text.slice(0, i))
      if (i < text.length) {
        setTimeout(reveal, 18)
      } else {
        playBubbleSound({ volume: 0.15 })
      }
    }
    setTimeout(reveal, 50)
  }

  // Petka floating along the bottom
  useEffect(() => {
    let raf: number
    const loop = () => {
      setPetkaX((prev) => {
        let next = prev + 0.4 * dirRef.current
        if (next > 100) { dirRef.current = -1; next = 100 }
        if (next < 0) { dirRef.current = 1; next = 0 }
        return next
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  // Handlers
  const addIngredient = () => {
    const v = userIngrInput.trim()
    if (!v) return
    setUserIngr((prev) => (prev.includes(v) ? prev : [...prev, v]))
    setUserIngrInput('')
  }

  const refreshWithIngredients = async () => {
    try {
      const qs = await generateQuizQuestions(userIngr)
      setQuestions(qs)
      setAnswers(Array(qs.length).fill(-1))
      setCurrent(0)
      setSelected(null)
      setRevealed(false)
      setStreak(0)
      const t = qs[0]?.q || ''
      fullTextRef.current = t
      setTypedText('')
      typeOut(t)
      toast.info('Питання оновлено')
    } catch (_e) {
      toast.error('Не вдалося оновити питання')
    }
  }

  const saveRecipe = async () => {
    try {
      const defaultIngr = ['креветки','лимон','часник','зелень','масло']
      const ai = await generateProfessionalRecipe({
        protein: petkaProtein,
        ingredients: userIngr.length ? userIngr : defaultIngr,
      })
      const rec: NewRecipe = {
        id: `${Date.now()}`,
        title: ai.title || (petkaProtein === 'shrimp' ? 'Креветки від Петьки' : 'Рак від Петьки'),
        ingredients: ai.ingredients?.length ? ai.ingredients : (userIngr.length ? userIngr : defaultIngr),
        instructions: ai.steps?.length ? ai.steps : [
          'Підготувати інгредієнти',
          'Обсмажити часник та зелень у маслі',
          `Додати ${petkaProtein === 'shrimp' ? 'креветки' : 'рака'} та довести до готовності`,
          'Подавати гарячим',
        ],
        authorName: 'Петька',
        authorEmail: 'petka@ai',
        createdAt: new Date().toISOString(),
        aiGenerated: true,
      }
      setAiRecipes((prev) => [rec, ...(prev || [])])
      toast.success('Рецепт збережено!')
      setStage('done')
    } catch (_e) {
      toast.error('Не вдалося зберегти рецепт')
    }
  }

  return (
    <section className="relative min-h-[85vh] w-full overflow-hidden bg-gradient-to-b from-sky-900 via-blue-900 to-cyan-900">
      {/* Small dot to open 3D game */}
      <button
        aria-label="Відкрити 3D-гру"
        onClick={() => onOpen3D?.()}
        className="absolute bottom-4 right-4 z-20 w-3 h-3 rounded-full bg-white/80 hover:bg-white transition"
      />

      {/* Seabed decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-950/60 to-transparent" />

      {/* Petka floating and asking */}
      {stage === 'quiz' && (
        <div className="absolute bottom-20 left-0 right-0 z-10 pointer-events-none">
          <div className="relative" style={{ transform: `translateX(${petkaX}%)` }}>
            <motion.div className="inline-block align-bottom" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.2, repeat: Infinity }}>
              <div className="text-6xl select-none">{petkaProtein === 'shrimp' ? '🦐' : '🦞'}</div>
            </motion.div>
            <motion.div
              className="absolute -top-24 left-10 max-w-[80vw] sm:max-w-[60vw] bg-white/95 text-gray-900 rounded-2xl px-4 py-3 border shadow-xl pointer-events-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-sm sm:text-base font-medium">{typedText || 'Петька думає над питанням…'}</p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {questions?.[current]?.options.map((opt, oi) => (
                  <Button key={oi} size="sm" variant={selected === oi ? 'default' : 'outline'} className="truncate" onClick={() => setSelected(oi)}>
                    {opt}
                  </Button>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-600">Питання {current + 1} / {questions?.length || 0} • Серія: {streak}</span>
                {!revealed ? (
                  <Button size="sm" disabled={selected === null} onClick={() => {
                    if (selected === null || !questions) return
                    const correct = selected === questions[current].correctIndex
                    setAnswers((prev) => prev.map((v, i) => (i === current ? (selected as number) : v)))
                    setRevealed(true)
                    setStreak((s) => (correct ? s + 1 : 0))
                    toast[correct ? 'success' : 'warning'](correct ? 'Правильно!' : 'Неправильно', { id: `petka-q-${current}` })
                  }}>Відповісти</Button>
                ) : (
                  <Button size="sm" onClick={() => {
                    if (!questions) return
                    if (streak >= 4) { setStage('builder'); return }
                    const next = current + 1
                    if (next < questions.length) {
                      setCurrent(next)
                      setSelected(null)
                      setRevealed(false)
                      const t = questions[next].q
                      fullTextRef.current = t
                      setTypedText('')
                      typeOut(t)
                    } else {
                      setStage('builder')
                    }
                  }}>Далі</Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-10">
        <motion.h1 className="text-4xl md:text-5xl font-bold heading-font mb-3 text-white" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          🤖 Петька — головна гра
        </motion.h1>
        <p className="text-white/80 mb-6">Відповідайте на питання Петьки (згенеровані Gemini), наберіть серію з 4 правильних відповідей поспіль і відкрийте професійний рецепт.</p>

        {/* Ingredient preferences */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
          <p className="mb-2 font-medium">Ваші інгредієнти (за бажанням):</p>
          <div className="flex gap-2 mb-3">
            <Input value={userIngrInput} onChange={(e) => setUserIngrInput(e.target.value)} placeholder="Додайте інгредієнт…" className="bg-white/20 text-white placeholder:text-white/60" />
            <Button onClick={addIngredient}>Додати</Button>
            <Button variant="outline" onClick={refreshWithIngredients}>Оновити питання</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {userIngr.map((tag) => (<Badge key={tag} className="bg-primary/80">{tag}</Badge>))}
            {!userIngr.length && <span className="text-white/70 text-sm">(порожньо)</span>}
          </div>
        </div>

        {stage === 'builder' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-3">Конструктор рецепту</h2>
            <p className="text-white/80 mb-4">Складіть рецепт з бажаних інгредієнтів та оберіть, кого покласти в тарілку.</p>

            <div className="mb-4">
              <p className="mb-2 font-medium">Інгредієнти:</p>
              <div className="flex flex-wrap gap-2">
                {(userIngr.length ? userIngr : ['креветки','лимон','часник','зелень','масло']).map((tag) => (
                  <Badge key={tag} className="bg-primary/80">{tag}</Badge>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 font-medium">Покласти в тарілку:</p>
              <div className="flex gap-3">
                <Button variant={petkaProtein === 'shrimp' ? 'default' : 'outline'} onClick={() => setPetkaProtein('shrimp')}>🦐 Петька креветка</Button>
                <Button variant={petkaProtein === 'crayfish' ? 'default' : 'outline'} onClick={() => setPetkaProtein('crayfish')}>🦞 Петька рак</Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 items-start">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-medium mb-2">Попередній перегляд тарілки</p>
                <div className="text-6xl text-center py-6">{petkaProtein === 'shrimp' ? '🦐' : '🦞'}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="font-medium mb-2">Кроки приготування</p>
                <ol className="list-decimal list-inside space-y-1 text-white/90 text-sm">
                  <li>Підготувати інгредієнти та розігріти пательню</li>
                  <li>Додати масло, часник, зелень</li>
                  <li>Додати морепродукти, приправити та довести до готовності</li>
                  <li>Додати {petkaProtein === 'shrimp' ? 'Петьку креветку' : 'Петьку рака'} у тарілку</li>
                </ol>
                <Button className="mt-4" onClick={saveRecipe}>Зберегти рецепт</Button>
              </div>
            </div>
          </div>
        )}

        {stage === 'done' && (
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-10">
            <p className="text-3xl mb-4">Готово! 🍽️</p>
            <p className="mb-6">Рецепт збережено. Перейдіть до розділу «Рецепти», щоб переглянути.</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => onNavigate?.('recipes')}>До рецептів</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStage('quiz')
                  setCurrent(0)
                  setSelected(null)
                  setRevealed(false)
                  setStreak(0)
                  if (questions && questions.length) {
                    const t = questions[0].q
                    fullTextRef.current = t
                    setTypedText('')
                    typeOut(t)
                  }
                }}
              >
                Ще раз
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default PetkaGame
