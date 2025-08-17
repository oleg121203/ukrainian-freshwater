import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useKV } from '@/hooks/useKV'
import { generateQuizQuestions, PetkaQuestion, generateProfessionalRecipe } from '@/services/petkaService'
import { useAudio } from '@/hooks/useAudio'
import { ArrowRight, CookingPot, Sparkle } from '@phosphor-icons/react'

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
  const [currentQuestion, setCurrentQuestion] = useState<PetkaQuestion | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [stage, setStage] = useState<'intro' | 'quiz' | 'builder' | 'done'>('intro')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [isAnswering, setIsAnswering] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [petkaPosition, setPetkaPosition] = useState({ x: 50, y: 50 })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [petkaProtein, setPetkaProtein] = useState<'shrimp' | 'crayfish'>('shrimp')
  const [aiRecipes, setAiRecipes] = useKV<NewRecipe[]>('chef-prawn-recipes', [])
  const containerRef = useRef<HTMLDivElement>(null)
  const { playBubbleSound, playAmbientSound, playSwooshSound } = useAudio()
  const ambientHandleRef = useRef<{ stop: () => void } | null>(null)

  // Track mouse position
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setMousePosition({ x, y })
    }
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  // Make Petka approach the cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setPetkaPosition(prev => {
        const dx = mousePosition.x - prev.x
        const dy = mousePosition.y - prev.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance > 5) {
          const speed = 0.8
          return {
            x: prev.x + (dx / distance) * speed,
            y: prev.y + (dy / distance) * speed
          }
        }
        return prev
      })
    }, 50)
    
    return () => clearInterval(interval)
  }, [mousePosition])

  // Initialize questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const qs = await generateQuizQuestions(userIngr)
        setQuestions(qs)
        setCurrentQuestion(qs[0] || null)
        setQuestionIndex(0)
        setScore(0)
        setStreak(0)
      } catch (e) {
        toast.error('Петька: не вдалось отримати питання, використовую запасні')
      }
    }
    loadQuestions()
  }, [userIngr])

  // Start ambient audio on intro
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

  const addIngredient = () => {
    const v = userIngrInput.trim()
    if (!v) return
    setUserIngr(prev => prev.includes(v) ? prev : [...prev, v])
    setUserIngrInput('')
  }

  const refreshWithIngredients = async () => {
    try {
      const qs = await generateQuizQuestions(userIngr)
      setQuestions(qs)
      setCurrentQuestion(qs[0] || null)
      setQuestionIndex(0)
      setScore(0)
      setStreak(0)
      toast.info('Питання оновлено')
    } catch (e) {
      toast.error('Не вдалося оновити питання')
    }
  }

  const handleAnswerSubmit = () => {
    if (!currentQuestion || !userAnswer.trim()) return
    
    setIsAnswering(true)
    
    // Simulate AI evaluation of the answer (in real implementation, this would call Gemini API)
    const isCorrect = currentQuestion.options.some(option => 
      userAnswer.toLowerCase().includes(option.toLowerCase().slice(0, 3))
    )
    
    if (isCorrect) {
      setScore(prev => prev + 1)
      setStreak(prev => prev + 1)
      toast.success('Правильно! Петька задоволений!')
      playBubbleSound({ volume: 0.2 })
    } else {
      setStreak(0)
      toast.warning('Хм... Петька думає інакше. Спробуйте ще!')
    }
    
    setTimeout(() => {
      if (questionIndex + 1 < (questions?.length || 0)) {
        setQuestionIndex(prev => prev + 1)
        setCurrentQuestion(questions![questionIndex + 1])
        setUserAnswer('')
      } else if (score >= 3) {
        setStage('builder')
      } else {
        // Restart quiz
        setQuestionIndex(0)
        setCurrentQuestion(questions![0])
        setUserAnswer('')
      }
      setIsAnswering(false)
    }, 2000)
  }

  const saveRecipe = async () => {
    try {
      const defaultIngr = ['креветки', 'лимон', 'часник', 'зелень', 'масло']
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
      setAiRecipes(prev => [rec, ...(prev || [])])
      toast.success('Рецепт збережено!')
      setStage('done')
    } catch (e) {
      toast.error('Не вдалося зберегти рецепт')
    }
  }

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-blue-50 via-cyan-50 to-teal-50"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full blur-3xl" />
        <div className="absolute top-32 right-20 w-24 h-24 bg-cyan-200 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-teal-200 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-28 h-28 bg-blue-300 rounded-full blur-2xl" />
      </div>

      {/* Photo-realistic water effect overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 60% 40%, rgba(20, 184, 166, 0.1) 0%, transparent 50%)
          `
        }}
      />

      {/* Intro cinematic */}
      <AnimatePresence>
        {stage === 'intro' && (
          <motion.div 
            className="absolute inset-0 z-20 bg-gradient-to-b from-blue-900 via-cyan-900 to-teal-900"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center px-6 max-w-4xl">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.8 }}
                  className="mb-8"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
                    <Sparkle className="w-4 h-4" />
                    <span className="text-sm font-medium tracking-wider">AquaFarm — Інтерактив</span>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-bold heading-font mb-6">
                    Петька Шеф-Кухар
                  </h1>
                  <p className="text-xl md:text-2xl text-white/80 mb-8">
                    Кмітлива креветка, що знає всі секрети морської кухні
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="mb-8"
                >
                  <div className="text-8xl mb-4">{petkaProtein === 'shrimp' ? '🦐' : '🦞'}</div>
                  <p className="text-lg text-white/90">
                    Привіт! Я Петька, і я допоможу вам створити найсмачніші рецепти!
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="flex gap-4 justify-center"
                >
                  <Button 
                    size="lg"
                    onClick={() => setStage('quiz')}
                    className="bg-white text-gray-900 hover:bg-white/90"
                  >
                    <CookingPot className="w-5 h-5 mr-2" />
                    Почати кулінарний квест
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => onNavigate?.('recipes')}
                    className="border-white text-white hover:bg-white/10"
                  >
                    Переглянути рецепти
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cursor-following Petka */}
      <motion.div
        className="absolute z-10 pointer-events-none"
        style={{
          left: `${petkaPosition.x}%`,
          top: `${petkaPosition.y}%`,
          transform: 'translate(-50%, -50%)'
        }}
        animate={{
          y: [0, -8, 0],
          rotate: [0, 5, 0, -5, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="text-6xl drop-shadow-lg">
          {petkaProtein === 'shrimp' ? '🦐' : '🦞'}
        </div>
        
        {/* Speech bubble when asking questions */}
        {stage === 'quiz' && currentQuestion && (
          <motion.div
            className="absolute -top-20 left-12 max-w-xs bg-white rounded-xl shadow-lg border p-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm font-medium text-gray-800 mb-2">
              {currentQuestion.q}
            </p>
            <div className="text-xs text-gray-500">
              Питання {questionIndex + 1} з {questions?.length || 0} • Рахунок: {score}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-10">
        {stage === 'quiz' && (
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CookingPot className="w-6 h-6 text-primary" />
                Кулінарний виклик від Петьки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ingredient preferences */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Ваші улюблені інгредієнти</h3>
                <div className="flex gap-2">
                  <Input 
                    value={userIngrInput} 
                    onChange={(e) => setUserIngrInput(e.target.value)}
                    placeholder="Додайте інгредієнт..."
                    onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                  />
                  <Button onClick={addIngredient}>Додати</Button>
                  <Button variant="outline" onClick={refreshWithIngredients}>
                    Оновити питання
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userIngr.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                  {!userIngr.length && (
                    <span className="text-gray-500 text-sm">
                      Додайте інгредієнти для персоналізованих питань
                    </span>
                  )}
                </div>
              </div>

              {/* Question and answer form */}
              {currentQuestion && (
                <div className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                  <h4 className="font-semibold text-lg text-gray-800">
                    {currentQuestion.q}
                  </h4>
                  
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Ваша відповідь (вільна форма):
                    </label>
                    <Textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Поділіться своїми знаннями або здогадками..."
                      className="min-h-[100px]"
                      disabled={isAnswering}
                    />
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Серія правильних відповідей: {streak}
                      </div>
                      <Button 
                        onClick={handleAnswerSubmit}
                        disabled={!userAnswer.trim() || isAnswering}
                        className="min-w-[120px]"
                      >
                        {isAnswering ? 'Обробляю...' : 'Відповісти'}
                      </Button>
                    </div>
                  </div>

                  {/* Hint section */}
                  <div className="text-xs text-gray-500 bg-white/50 rounded p-3">
                    💡 Підказка: відповіді можуть включати варіанти: {currentQuestion.options.join(', ')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {stage === 'builder' && (
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkle className="w-6 h-6 text-primary" />
                Конструктор рецепту від Петьки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700">
                Вітаю! Ви пройшли кулінарний тест. Тепер створимо особливий рецепт разом!
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Інгредієнти для рецепту:</h3>
                  <div className="flex flex-wrap gap-2">
                    {(userIngr.length ? userIngr : ['креветки', 'лимон', 'часник', 'зелень', 'масло']).map(tag => (
                      <Badge key={tag} className="bg-primary/10 text-primary">{tag}</Badge>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Головний інгредієнт:</h3>
                    <div className="flex gap-3">
                      <Button 
                        variant={petkaProtein === 'shrimp' ? 'default' : 'outline'}
                        onClick={() => setPetkaProtein('shrimp')}
                      >
                        🦐 Креветки
                      </Button>
                      <Button 
                        variant={petkaProtein === 'crayfish' ? 'default' : 'outline'}
                        onClick={() => setPetkaProtein('crayfish')}
                      >
                        🦞 Раки
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Попередній перегляд страви:</h3>
                  <div className="text-center">
                    <div className="text-7xl mb-4">
                      {petkaProtein === 'shrimp' ? '🦐' : '🦞'}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {petkaProtein === 'shrimp' ? 'Креветки від Петьки' : 'Раки від Петьки'}
                    </p>
                    <Button onClick={saveRecipe} className="w-full">
                      <CookingPot className="w-4 h-4 mr-2" />
                      Створити рецепт
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === 'done' && (
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl text-center">
            <CardContent className="p-10">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold mb-4">Рецепт створено!</h2>
              <p className="text-gray-700 mb-8">
                Петька створив для вас унікальний рецепт. Перегляньте його в розділі "Рецепти"!
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => onNavigate?.('recipes')} size="lg">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  До рецептів
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStage('quiz')
                    setQuestionIndex(0)
                    setScore(0)
                    setStreak(0)
                    setUserAnswer('')
                    setCurrentQuestion(questions?.[0] || null)
                  }}
                  size="lg"
                >
                  Спробувати ще раз
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 3D toggle button */}
      <button
        onClick={() => onOpen3D?.()}
        className="absolute bottom-6 right-6 z-20 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
        aria-label="Відкрити 3D-гру"
      >
        <span className="text-xl">🌊</span>
      </button>
    </section>
  )
}

export default PetkaGame