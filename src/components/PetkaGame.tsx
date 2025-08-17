import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useKV } from '@/hooks/useKV'
import { generateQuizQuestions, PetkaQuestion, generateProfessionalRecipe } from '@/services/petkaService'
import { useAudio } from '@/hooks/useAudio'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
  const [stage, setStage] = useState<'intro' | 'quiz' | 'builder' | 'done'>('intro')
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [typedText, setTypedText] = useState('')
  const fullTextRef = useRef('')
  // Modal-based quiz instead of left-right movement
  const [petkaProtein, setPetkaProtein] = useState<'shrimp' | 'crayfish'>('shrimp')
  const [streak, setStreak] = useState(0)
  const [aiRecipes, setAiRecipes] = useKV<NewRecipe[]>('chef-prawn-recipes', [])
  const { playBubbleSound, playAmbientSound, playSwooshSound } = useAudio()
  const ambientHandleRef = useRef<{ stop: () => void } | null>(null)
  const [questionOpen, setQuestionOpen] = useState(false)

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
  setQuestionOpen(true)
      } catch (_e) {
        toast.error('Петька: не вдалось отримати питання, використовую запасні')
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Start ambient audio on intro, stop when leaving intro
  useEffect(() => {
    if (stage === 'intro') {
      ambientHandleRef.current = playAmbientSound({ volume: 0.07, loop: true })
    } else {
      ambientHandleRef.current?.stop?.()
      ambientHandleRef.current = null
    }
    return () => {
      ambientHandleRef.current?.stop?.()
      ambientHandleRef.current = null
    }
  }, [stage, playAmbientSound])

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

  // No more left-right movement; quiz now shows in a modal dialog
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
      {/* Intro cinematic */}
      {stage === 'intro' && (
        <div className="absolute inset-0 z-20">
          {/* Light rays / vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(1200px 600px at 60% -10%, rgba(255,255,255,0.18), transparent 60%)',
          }} />

          {/* Rising bubbles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(14)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute w-1 h-1 bg-white/40 rounded-full"
                initial={{ x: Math.random() * 100 + '%', y: '110%', scale: 0.8 + Math.random() * 0.6, opacity: 0 }}
                animate={{ y: '-10%', opacity: [0, 1, 0] }}
                transition={{ duration: 6 + Math.random() * 4, delay: i * 0.2, repeat: Infinity, ease: 'easeOut' }}
              />
            ))}
          </div>

          <div className="relative h-full w-full flex items-center justify-center text-white">
            {/* Intentionally empty to avoid overlapping the main UI. We keep only the shrimp reveal below. */}

            {/* Shrimp reveal from afar */}
            <motion.div
              className="absolute bottom-10 right-10 select-none"
              initial={{ opacity: 0, scale: 0.2, x: 120, y: 40, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, delay: 0.6, ease: 'easeOut' }}
              onAnimationComplete={() => {
                // Auto enter quiz after a moment
                setTimeout(() => setStage((s) => (s === 'intro' ? 'quiz' : s)), 900)
              }}
            >
              <div className="text-7xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]">{petkaProtein === 'shrimp' ? '🦐' : '🦞'}</div>
            </motion.div>
          </div>
        </div>
      )}
      {/* Wavy floating tagline at the bottom (water tones) */}
      {stage === 'intro' && (
        <div className="absolute left-0 right-0 bottom-5 z-10 pointer-events-none select-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <motion.svg
              viewBox="0 0 1200 120"
              width="100%"
              height="90"
              preserveAspectRatio="none"
              animate={{ x: [0, -6, 0, 6, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            >
              <defs>
                <linearGradient id="af-water" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
                <filter id="af-soft" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" />
                </filter>
                <filter id="af-ripple" x="-10%" y="-30%" width="120%" height="160%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.006 0.02" numOctaves="1" seed="3" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
                </filter>
                <path id="af-wave-1" d="M0,60 C 160,20 320,100 480,60 S 800,20 960,60 S 1120,100 1200,60" fill="none" />
                <path id="af-wave-2" d="M0,85 C 160,45 320,125 480,85 S 800,45 960,85 S 1120,125 1200,85" fill="none" />
              </defs>
              <g filter="url(#af-ripple)">
                {/* Outline underlay for readability */}
                <text fontSize="18" fontWeight="800" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.2">
                  <motion.textPath
                    href="#af-wave-1"
                    startOffset="0%"
                    animate={{ startOffset: ['0%', '50%', '0%'] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    AquaFarm — Інтерактив
                  </motion.textPath>
                </text>
                {/* Top line: AquaFarm — Інтерактив */}
                <text fontSize="18" fontWeight="700" fill="url(#af-water)" filter="url(#af-soft)">
                  <motion.textPath
                    href="#af-wave-1"
                    startOffset="0%"
                    animate={{ startOffset: ['0%', '50%', '0%'] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    AquaFarm — Інтерактив
                  </motion.textPath>
                </text>

                {/* Outline underlay for readability */}
                <text fontSize="26" fontWeight="900" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.4">
                  <motion.textPath
                    href="#af-wave-2"
                    startOffset="100%"
                    animate={{ startOffset: ['100%', '50%', '100%'] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    Розумне акварільне фермерство
                  </motion.textPath>
                </text>
                {/* Bottom line: Розумне акварільне фермерство */}
                <text fontSize="26" fontWeight="800" fill="url(#af-water)">
                  <motion.textPath
                    href="#af-wave-2"
                    startOffset="100%"
                    animate={{ startOffset: ['100%', '50%', '100%'] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    Розумне акварільне фермерство
                  </motion.textPath>
                </text>
              </g>
            </motion.svg>
          </motion.div>
        </div>
      )}
      {/* Small dot to open 3D game */}
      <button
        aria-label="Відкрити 3D-гру"
        onClick={() => onOpen3D?.()}
        className="absolute bottom-4 right-4 z-20 w-3 h-3 rounded-full bg-white/80 hover:bg-white transition"
      />

      {/* Seabed decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-950/60 to-transparent" />

      {/* Quiz in modal dialog */}
      <Dialog open={stage === 'quiz' && questionOpen} onOpenChange={(o) => setQuestionOpen(o)}>
        <DialogContent className="bg-white/95 text-gray-900 border-white/40 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{petkaProtein === 'shrimp' ? '🦐' : '🦞'}</span>
              Петька питає
            </DialogTitle>
            <DialogDescription>
              Відповідайте на легкі питання. Питання {current + 1} / {questions?.length || 0} • Серія: {streak}
            </DialogDescription>
          </DialogHeader>

          {/* Animated ripple behind the question */}
          <div className="relative">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-2 rounded-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3.2, repeat: Infinity }}
              style={{ background: 'radial-gradient(600px 200px at 50% -20%, rgba(59,130,246,0.25), transparent 60%)' }}
            />
            <motion.p
              className="relative text-base font-medium"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {typedText || 'Петька думає над питанням…'}
            </motion.p>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {questions?.[current]?.options.map((opt, oi) => (
              <Button key={oi} size="sm" variant={selected === oi ? 'default' : 'outline'} className="truncate" onClick={() => setSelected(oi)}>
                {opt}
              </Button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
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
                if (streak >= 4) { setQuestionOpen(false); setStage('builder'); return }
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
                  setQuestionOpen(false)
                  setStage('builder')
                }
              }}>Далі</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-10">
        <motion.h1 className="text-4xl md:text-5xl font-bold heading-font mb-2 text-white" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          AquaFarm — Інтерактив
        </motion.h1>
        <p className="text-white/85 mb-5">Сучасна гра: годування креветки + квіз Петьки + вирощування</p>
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/90">🦐 Годування</span>
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/90">🏠 Вирощування</span>
          <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground">🤖 Петька</span>
        </div>
        <p className="text-white/80 mb-6">Відповідайте на легкі питання Петьки (через Gemini). Наберіть серію з 4 правильних відповідей поспіль і відкрийте професійний рецепт.</p>

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
