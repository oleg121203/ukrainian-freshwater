import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudio } from '@/hooks/useAudio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface PrawnVisualizationProps {
  onMenuToggle: (show: boolean) => void
  menuVisible: boolean
  onNavigateToSite?: () => void
}

interface GameState {
  prawnMood: 'calm' | 'excited' | 'swimming' | 'feeding' | 'cooking' | 'thinking' | 'performing' | 'dead'
  interactionCount: number
  isFeeding: boolean
  isSwimming: boolean
  currentSwimPattern: 'circular' | 'figure8' | 'random' | 'patrol'
  gamePhase: 'exploring' | 'trajectory' | 'quiz' | 'cooking' | 'completed'
  score: number
  correctAnswers: number
  isRobotMode: boolean
  hasAI: boolean
  trajectoryPoints: number
  currentQuestion: number
  lives: number
}

interface TrajectoryPoint {
  x: number
  y: number
  timestamp: number
}

interface GameStats {
  currentScore: number
  trajectoryComplexity: number
  naturalness: number
  isDrawing: boolean
  currentPath: TrajectoryPoint[]
  waves: WaveEffect[]
}

interface WaveEffect {
  x: number
  y: number
  radius: number
  maxRadius: number
  opacity: number
  timestamp: number
}

interface Recipe {
  id: string
  title: string
  ingredients: string[]
  instructions: string[]
  authorName: string
  authorEmail: string
  createdAt: string
  aiGenerated: boolean
  chefbotNotes?: string
}

export function PrawnVisualization({ onMenuToggle, menuVisible, onNavigateToSite }: PrawnVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const frameRef = useRef<number | null>(null)
  const prawnGroupRef = useRef<THREE.Group | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const ambientSoundRef = useRef<{ stop: () => void } | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  
  // Enhanced game state for robot-chef prawn
  const [gameState, setGameState] = useState<GameState>({
    prawnMood: 'calm',
    interactionCount: 0,
    isFeeding: false,
    isSwimming: false,
    currentSwimPattern: 'circular',
    gamePhase: 'exploring',
    score: 0,
    correctAnswers: 0,
    isRobotMode: false,
    hasAI: false,
    trajectoryPoints: 0,
    currentQuestion: 0,
    lives: 1
  })

  // Trajectory drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<TrajectoryPoint[]>([])
  const [trajectoryHistory, setTrajectoryHistory] = useState<TrajectoryPoint[][]>([])
  const [waveEffects, setWaveEffects] = useState<WaveEffect[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const pathRef = useRef<TrajectoryPoint[]>([])
  const waveAnimationRef = useRef<number>(0)

  // Game UI state
  const [showGameUI, setShowGameUI] = useState(false)
  const [gameQuestion, setGameQuestion] = useState('')
  const [gameOptions, setGameOptions] = useState<string[]>([])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [userAnswer, setUserAnswer] = useState('')
  const [showRecipeGenerator, setShowRecipeGenerator] = useState(false)
  const [userIngredients, setUserIngredients] = useState('')
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  // Persistent storage for recipes and admin settings
  const [recipes, setRecipes] = useKV<Recipe[]>('chef-prawn-recipes', [])
  const [geminiApiKey, setGeminiApiKey] = useKV<string>('gemini-api-key', '')
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  // Cooking game questions about seafood and Macrobrachium rosenbergii
  const cookingQuestions = [
    {
      question: "Яка оптимальна температура води для вирощування Macrobrachium rosenbergii?",
      options: ["15-20°C", "25-30°C", "35-40°C", "45-50°C"],
      correct: "25-30°C",
      explanation: "Малайзійські креветки потребують теплої тропічної води для оптимального росту."
    },
    {
      question: "Скільки часу готувати свіжі креветки Macrobrachium rosenbergii?",
      options: ["1-2 хвилини", "3-4 хвилини", "7-10 хвилин", "15-20 хвилин"],
      correct: "3-4 хвилини",
      explanation: "Переготовлення робить креветки жорсткими та втрачає їх ніжний смак."
    },
    {
      question: "Який розмір досягають дорослі самці Macrobrachium rosenbergii?",
      options: ["5-8 см", "12-15 см", "25-30 см", "40-45 см"],
      correct: "25-30 см",
      explanation: "Самці малайзійських креветок можуть досягати вражаючих розмірів до 30 см!"
    },
    {
      question: "Яка особливість малайзійських креветок відрізняє їх від морських?",
      options: ["Живуть у солоній воді", "Живуть у прісній воді", "Мають панцир", "Мають клешні"],
      correct: "Живуть у прісній воді",
      explanation: "Macrobrachium rosenbergii - прісноводні креветки, що робить їх унікальними."
    },
    {
      question: "Яка найкраща приправа для креветок у французькій кухні?",
      options: ["Часник та петрушка", "Карі та кокос", "Соєвий соус", "Лимон та розмарин"],
      correct: "Часник та петрушка",
      explanation: "Класична французька комбінація підкреслює природний смак креветок."
    }
  ]
  
  // Animation states for realistic behavior
  const animationStateRef = useRef({
    tailMovement: 0,
    clawMovement: 0,
    antennaeSway: 0,
    eyeRotation: 0,
    breathingIntensity: 1,
    swimDirection: new THREE.Vector3(0, 0, 0),
    // Swimming animation states
    isAutoSwimming: true,
    swimPhase: 0,
    swimTarget: new THREE.Vector3(0, 0, 0),
    swimSpeed: 0.02,
    swimPattern: 'circular', // 'circular', 'figure8', 'random', 'patrol'
    patternProgress: 0,
    swimBounds: {
      x: { min: -3, max: 3 },
      y: { min: -2, max: 2 },
      z: { min: -2, max: 2 }
    },
    lastDirectionChange: 0,
    swimIntensity: 1
  })
  
  // Game mechanics
  const startCookingGame = () => {
    if (!audioEnabled) return
    
    setGameState(prev => ({ 
      ...prev, 
      gamePhase: 'trajectory', 
      prawnMood: 'thinking',
      isRobotMode: true,
      hasAI: !!geminiApiKey,
      score: 0,
      correctAnswers: 0,
      trajectoryPoints: 0,
      currentQuestion: 0,
      lives: 1
    }))
    
    setShowGameUI(true)
    playClickSound({ volume: 0.5, playbackRate: 1.3 })
    toast.success("🤖 РобоКреветка-Кухар ChefBot-2000 активована! Намалюйте траєкторію руху криветки.")
  }

  // Trajectory drawing functions
  const startDrawing = (x: number, y: number) => {
    if (gameState.gamePhase !== 'trajectory') return
    
    setIsDrawing(true)
    isDrawingRef.current = true
    const newPath: TrajectoryPoint[] = [{ x, y, timestamp: Date.now() }]
    setCurrentPath(newPath)
    pathRef.current = newPath
    
    setGameState(prev => ({ ...prev, prawnMood: 'performing' }))
    playRippleSound({ volume: 0.3, playbackRate: 1.2 })
  }

  const continueDrawing = (x: number, y: number) => {
    if (!isDrawingRef.current || gameState.gamePhase !== 'trajectory') return
    
    const newPoint: TrajectoryPoint = { x, y, timestamp: Date.now() }
    const newPath = [...pathRef.current, newPoint]
    setCurrentPath(newPath)
    pathRef.current = newPath
    
    // Add wave effect at drawing point
    const newWave: WaveEffect = {
      x,
      y,
      radius: 0,
      maxRadius: 30 + Math.random() * 20,
      opacity: 0.8,
      timestamp: Date.now()
    }
    setWaveEffects(prev => [...prev, newWave])
    
    // Draw trajectory on canvas with gradient
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx && pathRef.current.length > 1) {
        const prev = pathRef.current[pathRef.current.length - 2]
        const curr = pathRef.current[pathRef.current.length - 1]
        
        // Create gradient for trajectory
        const gradient = ctx.createLinearGradient(prev.x, prev.y, curr.x, curr.y)
        gradient.addColorStop(0, '#3b82f6')
        gradient.addColorStop(0.5, '#06b6d4')
        gradient.addColorStop(1, '#8b5cf6')
        
        ctx.strokeStyle = gradient
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.shadowColor = '#3b82f6'
        ctx.shadowBlur = 8
        
        ctx.beginPath()
        ctx.moveTo(prev.x, prev.y)
        ctx.lineTo(curr.x, curr.y)
        ctx.stroke()
        
        // Reset shadow
        ctx.shadowBlur = 0
      }
    }
    
    // Play drawing sound
    if (Math.random() < 0.1) { // Play sound occasionally to avoid spam
      playBubbleSound({ volume: 0.2, playbackRate: 1 + Math.random() * 0.4 })
    }
  }

  // Trajectory scoring algorithms
  const calculateTrajectoryComplexity = (path: TrajectoryPoint[]): number => {
    if (path.length < 3) return 0
    
    let totalCurvature = 0
    let totalLength = 0
    let directionChanges = 0
    
    for (let i = 1; i < path.length - 1; i++) {
      const p1 = path[i - 1]
      const p2 = path[i]
      const p3 = path[i + 1]
      
      // Calculate curvature using three points
      const a = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
      const b = Math.sqrt((p3.x - p2.x) ** 2 + (p3.y - p2.y) ** 2)
      const c = Math.sqrt((p3.x - p1.x) ** 2 + (p3.y - p1.y) ** 2)
      
      if (a > 0 && b > 0 && c > 0) {
        // Calculate angle using law of cosines
        const angle = Math.acos((a * a + b * b - c * c) / (2 * a * b))
        totalCurvature += Math.abs(Math.PI - angle) // Deviation from straight line
        
        // Check for direction changes
        if (i > 1) {
          const prevDir = Math.atan2(p2.y - p1.y, p2.x - p1.x)
          const currDir = Math.atan2(p3.y - p2.y, p3.x - p2.x)
          const dirChange = Math.abs(prevDir - currDir)
          if (dirChange > Math.PI / 4) directionChanges++ // Significant direction change
        }
      }
      
      totalLength += Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
    }
    
    // Normalize complexity (0-10 scale)
    const curvatureScore = Math.min(totalCurvature / (path.length * 0.5), 6)
    const lengthScore = Math.min(totalLength / 1000, 2)
    const changeScore = Math.min(directionChanges / 5, 2)
    
    return Math.min(curvatureScore + lengthScore + changeScore, 10)
  }
  
  const calculateNaturalness = (path: TrajectoryPoint[]): number => {
    if (path.length < 5) return 0
    
    let smoothnessScore = 10
    let speedConsistency = 10
    let naturalMotion = 10
    
    // Check for smoothness (sudden jumps are unnatural)
    for (let i = 1; i < path.length; i++) {
      const distance = Math.sqrt(
        (path[i].x - path[i-1].x) ** 2 + 
        (path[i].y - path[i-1].y) ** 2
      )
      
      // Penalize jumps that are too large (unnatural)
      if (distance > 50) smoothnessScore -= 1
      
      // Check time consistency
      const timeDiff = path[i].timestamp - path[i-1].timestamp
      if (timeDiff > 100) speedConsistency -= 0.5 // Too slow
      if (timeDiff < 5) speedConsistency -= 0.5   // Too fast
    }
    
    // Check for natural swimming patterns (curves are more natural than straight lines)
    let straightLineSegments = 0
    for (let i = 2; i < path.length; i++) {
      const p1 = path[i-2]
      const p2 = path[i-1]  
      const p3 = path[i]
      
      // Check if three consecutive points are nearly in a straight line
      const area = Math.abs((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y))
      if (area < 100) straightLineSegments++
    }
    
    naturalMotion -= straightLineSegments * 0.3
    
    return Math.max(0, Math.min(10, (smoothnessScore + speedConsistency + naturalMotion) / 3))
  }

  // Game control functions
  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'exploring',
      score: 0,
      trajectoryPoints: 0,
      currentQuestion: 0,
      correctAnswers: 0,
      lives: 1,
      prawnMood: 'calm',
      isRobotMode: false
    }))
    setTrajectoryHistory([])
    setCurrentPath([])
    pathRef.current = []
    setWaveEffects([])
    setShowGameUI(false)
    
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
    
    toast.info("🔄 Гру перезапущено!")
  }

  const generateQuestion = () => {
    const questionIndex = gameState.currentQuestion
    if (questionIndex < cookingQuestions.length) {
      const question = cookingQuestions[questionIndex]
      setGameQuestion(question.question)
      setGameOptions([...question.options].sort(() => Math.random() - 0.5)) // Shuffle options
      setCorrectAnswer(question.correct)
      setUserAnswer('')
    }
  }

  const handleAnswerSubmit = (answer: string) => {
    setUserAnswer(answer)
    
    if (answer === correctAnswer) {
      const newScore = gameState.score + 25
      setGameState(prev => ({ 
        ...prev, 
        correctAnswers: prev.correctAnswers + 1,
        score: newScore,
        prawnMood: 'excited'
      }))
      
      playClickSound({ volume: 0.6, playbackRate: 1.3 })
      toast.success("🎉 Правильно! +25 балів")
      
      setTimeout(() => {
        if (gameState.currentQuestion < 3) {
          // Next question
          setGameState(prev => ({ 
            ...prev, 
            currentQuestion: prev.currentQuestion + 1 
          }))
          generateQuestion()
        } else {
          // All questions answered
          if (gameState.correctAnswers >= 3) {
            // Success - can use recipe generator
            setGameState(prev => ({ 
              ...prev, 
              gamePhase: 'cooking',
              prawnMood: 'cooking'
            }))
            setShowRecipeGenerator(true)
            toast.success("🍽️ Вітаємо! ChefBot-2000 готовий створити рецепт!")
          } else {
            // Failed - reset
            resetGame()
            toast.error("❌ Недостатньо правильних відповідей. Спробуйте ще раз!")
          }
        }
      }, 2000)
    } else {
      // Wrong answer - reset everything
      setGameState(prev => ({ 
        ...prev, 
        score: 0,
        trajectoryPoints: 0,
        correctAnswers: 0,
        prawnMood: 'dead'
      }))
      
      playRippleSound({ volume: 0.8, playbackRate: 0.5 })
      toast.error("❌ Помилка! Всі бали згоріли. Починайте спочатку!")
      
      setTimeout(() => {
        resetGame()
      }, 3000)
    }
  }



  const calculateTrajectoryComplexity = (path: TrajectoryPoint[]): number => {
    if (path.length < 3) return 0
    
    let totalCurvature = 0
    let totalDistance = 0
    let directionChanges = 0
    
    for (let i = 1; i < path.length - 1; i++) {
      const p1 = path[i - 1]
      const p2 = path[i]
      const p3 = path[i + 1]
      
      // Calculate angle between segments
      const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x)
      const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x)
      let angleDiff = Math.abs(angle2 - angle1)
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff
      
      totalCurvature += angleDiff
      
      // Count significant direction changes
      if (angleDiff > Math.PI / 4) {
        directionChanges++
      }
      
      // Calculate distance
      const distance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
      totalDistance += distance
    }
    
    // Normalize complexity (0-1)
    const curvatureScore = Math.min(1, totalCurvature / (Math.PI * path.length / 4))
    const directionScore = Math.min(1, directionChanges / (path.length / 5))
    const lengthScore = Math.min(1, totalDistance / 1000)
    
    return (curvatureScore + directionScore + lengthScore) / 3
  }

  const finishDrawing = () => {
    if (!isDrawingRef.current || gameState.gamePhase !== 'trajectory') return
    
    setIsDrawing(false)
    isDrawingRef.current = false
    
    if (pathRef.current.length < 3) {
      toast.error("Траєкторія занадто коротка! Намалюйте більш складний трюк.")
      setCurrentPath([])
      pathRef.current = []
      setGameState(prev => ({ ...prev, prawnMood: 'calm' }))
      return
    }
    
    // Calculate trajectory score
    const complexityScore = calculateTrajectoryComplexity(pathRef.current)
    const naturalnessScore = calculateNaturalness(pathRef.current)
    const totalScore = Math.round(Math.max(1, Math.min(10, complexityScore * 10)))
    
    // Check for supernatural trajectory (death condition)
    if (complexityScore > 0.95 && naturalnessScore < 0.2) {
      setGameState(prev => ({ 
        ...prev, 
        prawnMood: 'dead', 
        score: 0, 
        lives: 0,
        gamePhase: 'exploring'
      }))
      playRippleSound({ volume: 0.8, playbackRate: 0.5 })
      toast.error("💀 РобоКреветка перегрілася від надприродного трюку! Бали згоріли!")
      
      // Clear canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
      
      setTimeout(() => {
        setGameState(prev => ({ ...prev, prawnMood: 'calm' }))
        setShowGameUI(false)
      }, 3000)
      return
    }
    
    // Award points
    const newScore = gameState.score + totalScore
    setGameState(prev => ({ 
      ...prev, 
      score: newScore,
      trajectoryPoints: prev.trajectoryPoints + totalScore,
      prawnMood: 'excited'
    }))
    
    // Add to trajectory history
    setTrajectoryHistory(prev => [...prev, pathRef.current])
    setCurrentPath([])
    pathRef.current = []
    
    playClickSound({ volume: 0.4, playbackRate: 1.4 })
    toast.success(`🎯 Трюк оцінено на ${totalScore} балів! (Складність: ${(complexityScore * 10).toFixed(1)}/10, Природність: ${(naturalnessScore * 10).toFixed(1)}/10)`)
    
    // Check if ready for quiz phase
    if (newScore >= 100) {
      setTimeout(() => {
        setGameState(prev => ({ ...prev, gamePhase: 'quiz', prawnMood: 'thinking' }))
        generateQuestion()
        toast.info("🧠 Достатньо балів для вікторини! Дайте правильні відповіді на питання.")
      }, 2000)
    }
    
    // Clear canvas after a delay to show final trajectory
    setTimeout(() => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }, 2000)
  }

  const calculateNaturalness = (path: TrajectoryPoint[]): number => {
    if (path.length < 5) return 0.5 // Default moderate naturalness for short paths
    
    let smoothnessScore = 10
    let speedConsistency = 10
    let naturalMotion = 10
    
    // Check for smoothness (sudden jumps are unnatural)
    for (let i = 1; i < path.length; i++) {
      const distance = Math.sqrt(
        (path[i].x - path[i-1].x) ** 2 + 
        (path[i].y - path[i-1].y) ** 2
      )
      
      // Penalize jumps that are too large (unnatural)
      if (distance > 50) smoothnessScore -= 1
      
      // Check time consistency
      const timeDiff = path[i].timestamp - path[i-1].timestamp
      if (timeDiff > 100) speedConsistency -= 0.5 // Too slow
      if (timeDiff < 5) speedConsistency -= 0.5   // Too fast
    }
    
    // Check for natural swimming patterns (curves are more natural than straight lines)
    let straightLineSegments = 0
    for (let i = 2; i < path.length; i++) {
      const p1 = path[i-2]
      const p2 = path[i-1]  
      const p3 = path[i]
      
      // Check if three consecutive points are nearly in a straight line
      const area = Math.abs((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y))
      if (area < 100) straightLineSegments++
    }
    
    naturalMotion -= straightLineSegments * 0.3
    
    return Math.max(0, Math.min(1, (smoothnessScore + speedConsistency + naturalMotion) / 30))
  }

  const startQuizPhase = () => {
    setGameState(prev => ({ 
      ...prev, 
      gamePhase: 'quiz',
      prawnMood: 'thinking',
      currentQuestion: 0
    }))
    
    // Generate first question
    const randomQuestion = cookingQuestions[Math.floor(Math.random() * cookingQuestions.length)]
    setGameQuestion(randomQuestion.question)
    setGameOptions([...randomQuestion.options].sort(() => Math.random() - 0.5))
    setCorrectAnswer(randomQuestion.correct)
    setUserAnswer('')
    
    toast.success("🎓 Фаза питань! Відповідайте правильно, щоб отримати доступ до ШІ-кухаря!")
  }

  const resetGame = () => {
    setGameState(prev => ({ 
      ...prev, 
      gamePhase: 'exploring',
      prawnMood: 'calm',
      isRobotMode: false,
      score: 0,
      correctAnswers: 0,
      trajectoryPoints: 0,
      currentQuestion: 0,
      lives: 1
    }))
    setShowGameUI(false)
    setCurrentPath([])
    setTrajectoryHistory([])
    pathRef.current = []
    
    // Clear canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  const handleAnswerSubmit = (answer: string) => {
    setUserAnswer(answer)
    
    if (answer === correctAnswer) {
      setGameState(prev => ({ 
        ...prev, 
        score: prev.score + 25,
        correctAnswers: prev.correctAnswers + 1,
        prawnMood: 'excited',
        currentQuestion: prev.currentQuestion + 1
      }))
      playBubbleSound({ volume: 0.6, playbackRate: 1.5 })
      toast.success("🎉 Правильно! ChefBot-2000 схвалює! +25 балів")
      
      // Check if all 4 questions answered correctly
      if (gameState.correctAnswers + 1 >= 4) {
        setTimeout(() => {
          setGameState(prev => ({ 
            ...prev, 
            gamePhase: 'cooking',
            prawnMood: 'cooking'
          }))
          setShowGameUI(false)
          setShowRecipeGenerator(true)
          toast.success("🏆 Всі питання правильно! ChefBot-2000 активує ШІ-кухаря!")
        }, 2000)
      } else {
        // Next question
        setTimeout(() => {
          const randomQuestion = cookingQuestions[Math.floor(Math.random() * cookingQuestions.length)]
          setGameQuestion(randomQuestion.question)
          setGameOptions([...randomQuestion.options].sort(() => Math.random() - 0.5))
          setCorrectAnswer(randomQuestion.correct)
          setUserAnswer('')
        }, 2000)
      }
    } else {
      // Wrong answer - reset everything
      setGameState(prev => ({ 
        ...prev, 
        prawnMood: 'dead',
        score: 0,
        correctAnswers: 0,
        trajectoryPoints: 0,
        currentQuestion: 0,
        lives: 0
      }))
      playRippleSound({ volume: 0.4, playbackRate: 0.8 })
      toast.error("❌ Неправильно! ChefBot-2000 вимкнувся. Всі бали згоріли!")
      
      setTimeout(() => {
        resetGame()
      }, 3000)
    }
  }

  const generateRecipeWithAI = async () => {
    if (!geminiApiKey) {
      toast.error("Потрібно налаштувати Gemini API ключ в панелі адміністратора")
      return
    }

    if (!userIngredients.trim()) {
      toast.error("Введіть інгредієнти для рецепту")
      return
    }

    setIsGeneratingRecipe(true)
    setGameState(prev => ({ ...prev, prawnMood: 'thinking' }))

    try {
      const prompt = spark.llmPrompt`Ти - ChefBot-2000, розумна робот-креветка Macrobrachium rosenbergii з вбудованим штучним інтелектом. Ти експерт у приготуванні морепродуктів та креветок. Створи детальний кулінарний рецепт з морепродуктами та креветками Macrobrachium rosenbergii, використовуючи ці інгредієнти: ${userIngredients}. 

Говори від імені ChefBot-2000 і будь креативним! Додай власні поради як досвідчений робот-кухар.

Відповідь повинна бути у форматі JSON:
{
  "title": "Назва рецепту українською з підписом від ChefBot-2000",
  "ingredients": ["список інгредієнтів з точною кількістю"],
  "instructions": ["покрокові інструкції від ChefBot-2000"],
  "cookingTime": "час приготування",
  "difficulty": "складність (легко/середньо/складно)",
  "tips": ["ексклюзивні поради від ChefBot-2000"],
  "chefbotNotes": "Особисті коментарі від ChefBot-2000 про цей рецепт"
}

Рецепт повинен бути оригінальним та смачним, з акцентом на креветки Macrobrachium rosenbergii як основний інгредієнт.`

      const response = await spark.llm(prompt, "gpt-4o", true)
      const recipeData = JSON.parse(response)
      
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        title: recipeData.title,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        authorName: userName,
        authorEmail: userEmail,
        createdAt: new Date().toISOString(),
        aiGenerated: true,
        chefbotNotes: recipeData.chefbotNotes
      }

      setGeneratedRecipe(newRecipe)
      setGameState(prev => ({ ...prev, prawnMood: 'excited', gamePhase: 'completed' }))
      playBubbleSound({ volume: 0.8, playbackRate: 1.2 })
      toast.success("🍽️ ChefBot-2000 створив унікальний рецепт!")

    } catch (error) {
      console.error('Error generating recipe:', error)
      setGameState(prev => ({ ...prev, prawnMood: 'calm' }))
      toast.error("Помилка при створенні рецепту. Перевірте API ключ.")
    } finally {
      setIsGeneratingRecipe(false)
    }
  }

  const saveRecipe = async () => {
    if (!generatedRecipe || !userName.trim() || !userEmail.trim()) {
      toast.error("Заповніть всі поля (ім'я та email)")
      return
    }

    try {
      // Add recipe to collection
      const updatedRecipes = [...recipes, { ...generatedRecipe, authorName: userName, authorEmail: userEmail }]
      setRecipes(updatedRecipes)
      
      // Send email simulation (in real app would send actual email)
      const emailData = {
        to: userEmail,
        subject: `Ваш рецепт: ${generatedRecipe.title}`,
        recipe: generatedRecipe
      }
      
      toast.success(`📧 Рецепт збережено та надіслано на ${userEmail}!`)
      
      // Reset game
      setShowRecipeGenerator(false)
      setGeneratedRecipe(null)
      setUserIngredients('')
      setUserName('')
      setUserEmail('')
      setGameState(prev => ({ 
        ...prev, 
        gamePhase: 'exploring',
        score: 0,
        correctAnswers: 0,
        isRobotMode: false,
        prawnMood: 'calm',
        trajectoryPoints: 0,
        currentQuestion: 0,
        lives: 1
      }))
      
    } catch (error) {
      console.error('Error saving recipe:', error)
      toast.error("Помилка при збереженні рецепту")
    }
  }
  
  // Audio hook for sound effects
  const { 
    playBubbleSound, 
    playRippleSound, 
    playClickSound, 
    playSwooshSound,
    playAmbientSound,
    resumeAudioContext 
  } = useAudio()

  useEffect(() => {
    if (!mountRef.current) return

    let mounted = true
    
    // Scene setup with enhanced rendering
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    
    sceneRef.current = scene
    rendererRef.current = renderer
    
    // Only append if still mounted
    if (mounted && mountRef.current) {
      mountRef.current.appendChild(renderer.domElement)
    }

    // Create realistic prawn geometry
    const prawnGroup = new THREE.Group()
    prawnGroupRef.current = prawnGroup

    // Advanced materials (will be updated dynamically based on robot mode)
    const createPrawnMaterial = (baseColor: number, roughness = 0.3, metalness = 0.1, options: any = {}) => {
      // Create basic material first, will be updated in animation loop
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: roughness,
        metalness: metalness,
        transparent: true,
        opacity: options.opacity || 0.95,
        side: THREE.DoubleSide,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
        ...options
      })
      
      // Add basic texture (will be enhanced in animation loop)
      if (options.addNoise) {
        // Simple organic texture
        material.onBeforeCompile = (shader) => {
          shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `
            #include <common>
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            `
          )
          shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            vNormal = normalize(normalMatrix * normal);
            `
          )
          
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `
            #include <common>
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            
            float noise(vec3 p) {
              return fract(sin(dot(p, vec3(12.9898, 78.233, 54.321))) * 43758.5453);
            }
            `
          )
          
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            `
            #include <color_fragment>
            
            // Add shell-like texture pattern
            float shell = abs(sin(vWorldPosition.y * 8.0)) * 0.3;
            float spots = noise(vWorldPosition * 4.0) * 0.2;
            float segmentLines = abs(sin(vWorldPosition.z * 12.0)) * 0.15;
            
            // Natural color variation
            vec3 variation = vec3(
              noise(vWorldPosition * 2.0) * 0.1,
              noise(vWorldPosition * 3.0) * 0.08,
              noise(vWorldPosition * 1.5) * 0.12
            );
            
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb + variation - vec3(shell + spots + segmentLines), 0.6);
            
            // Add subtle iridescence based on viewing angle
            float iridescence = pow(1.0 - abs(dot(vNormal, normalize(vWorldPosition - cameraPosition))), 2.0);
            diffuseColor.rgb += vec3(0.1, 0.15, 0.2) * iridescence * 0.3;
            `
          )
        }
      }
      
      return material
    }

    // Main body segments (realistic Macrobrachium anatomy)
    const bodySegments: THREE.Mesh[] = []
    
    // Cephalothorax (head-chest region) - more detailed robotic appearance
    const cephalothoraxGeometry = new THREE.SphereGeometry(0.5, 24, 20)
    cephalothoraxGeometry.scale(1.4, 1.0, 1.8) // More pronounced and robotic
    
    // Add detailed surface modifications
    const positions = cephalothoraxGeometry.attributes.position.array as Float32Array
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]
      
      // Add basic organic bumps and ridges
      const bump = Math.sin(x * 8) * Math.cos(y * 6) * Math.sin(z * 4) * 0.05
      const ridge = Math.abs(Math.sin(z * 12)) * 0.03
      
      positions[i] = x + bump
      positions[i + 1] = y + ridge
      positions[i + 2] = z + bump * 0.5
    }
    cephalothoraxGeometry.attributes.position.needsUpdate = true
    cephalothoraxGeometry.computeVertexNormals()
    
    const cephalothoraxMaterial = createPrawnMaterial(0xd4844a, 0.35, 0.25, { addNoise: true })
    const cephalothorax = new THREE.Mesh(cephalothoraxGeometry, cephalothoraxMaterial)
    cephalothorax.position.set(0, 0, 0.3)
    cephalothorax.castShadow = true
    cephalothorax.receiveShadow = true
    prawnGroup.add(cephalothorax)
    bodySegments.push(cephalothorax)
    
    // Robot armor will be added dynamically in animation loop when isRobotMode is true

    // Abdomen segments (6 segments like real prawns) - enhanced realism
    for (let i = 0; i < 6; i++) {
      const scale = 1 - (i * 0.10) // Gradually smaller towards tail
      const segmentGeometry = new THREE.CylinderGeometry(0.28 * scale, 0.33 * scale, 0.38, 16)
      
      // Add segmentation details
      const segmentPositions = segmentGeometry.attributes.position.array as Float32Array
      for (let j = 0; j < segmentPositions.length; j += 3) {
        const x = segmentPositions[j]
        const y = segmentPositions[j + 1]
        const z = segmentPositions[j + 2]
        
        // Create realistic segmentation ridges
        const segmentRidge = Math.abs(Math.sin(y * 15)) * 0.02
        const lateralGroove = Math.sin(Math.atan2(z, x) * 4) * 0.015
        
        segmentPositions[j] = x + lateralGroove
        segmentPositions[j + 1] = y
        segmentPositions[j + 2] = z + segmentRidge
      }
      segmentGeometry.attributes.position.needsUpdate = true
      segmentGeometry.computeVertexNormals()
      
      const segmentMaterial = createPrawnMaterial(
        0xc77541 - (i * 0x080605), // Gradually darker towards tail
        0.32 + (i * 0.02), 
        0.18 + (i * 0.01),
        { addNoise: true }
      )
      
      const segment = new THREE.Mesh(segmentGeometry, segmentMaterial)
      segment.position.set(0, 0, -0.4 - (i * 0.4))
      segment.rotation.x = Math.PI / 2
      segment.castShadow = true
      segment.receiveShadow = true
      prawnGroup.add(segment)
      bodySegments.push(segment)
    }

    // Rostrum (pointed beak-like projection) - more detailed
    const rostrumGeometry = new THREE.ConeGeometry(0.12, 0.45, 10)
    
    // Add serrated edges to rostrum for realism
    const rostrumPositions = rostrumGeometry.attributes.position.array as Float32Array
    for (let i = 0; i < rostrumPositions.length; i += 3) {
      const x = rostrumPositions[i]
      const y = rostrumPositions[i + 1]
      const z = rostrumPositions[i + 2]
      
      // Add teeth-like serrations
      const angle = Math.atan2(z, x)
      const serration = Math.sin(angle * 6) * Math.max(0, y) * 0.02
      
      rostrumPositions[i] = x + serration
      rostrumPositions[i + 2] = z + serration
    }
    rostrumGeometry.attributes.position.needsUpdate = true
    rostrumGeometry.computeVertexNormals()
    
    const rostrumMaterial = createPrawnMaterial(0xe08850, 0.2, 0.35, { addNoise: true })
    const rostrum = new THREE.Mesh(rostrumGeometry, rostrumMaterial)
    rostrum.position.set(0, 0.2, 0.9)
    rostrum.rotation.x = Math.PI / 2
    rostrum.castShadow = true
    prawnGroup.add(rostrum)

    // Eyes (compound eyes with robotic enhancements)
    const eyeStalkGeometry = new THREE.CylinderGeometry(0.06, 0.09, 0.25, 12)
    
    // Add texture to eye stalks
    const eyeStalkPositions = eyeStalkGeometry.attributes.position.array as Float32Array
    for (let i = 0; i < eyeStalkPositions.length; i += 3) {
      const x = eyeStalkPositions[i]
      const y = eyeStalkPositions[i + 1]
      const z = eyeStalkPositions[i + 2]
      
      // Organic texture
      const texture = Math.sin(y * 20) * Math.cos(Math.atan2(z, x) * 8) * 0.008
      eyeStalkPositions[i] = x + texture
      eyeStalkPositions[i + 2] = z + texture
    }
    eyeStalkGeometry.attributes.position.needsUpdate = true
    eyeStalkGeometry.computeVertexNormals()
    
    const eyeGeometry = new THREE.SphereGeometry(0.14, 20, 16)
    
    // Create compound eye texture
    const eyePositions = eyeGeometry.attributes.position.array as Float32Array
    for (let i = 0; i < eyePositions.length; i += 3) {
      const x = eyePositions[i]
      const y = eyePositions[i + 1]
      const z = eyePositions[i + 2]
      
      // Create faceted compound eye surface
      const facetX = Math.floor((Math.atan2(y, x) + Math.PI) / (Math.PI / 6))
      const facetY = Math.floor((Math.acos(z / Math.sqrt(x*x + y*y + z*z)) + Math.PI) / (Math.PI / 6))
      const facetOffset = ((facetX + facetY) % 2) * 0.01
      
      eyePositions[i] = x * (1 + facetOffset)
      eyePositions[i + 1] = y * (1 + facetOffset)
      eyePositions[i + 2] = z * (1 + facetOffset)
    }
    eyeGeometry.attributes.position.needsUpdate = true
    eyeGeometry.computeVertexNormals()
    
    const eyeStalkMaterial = createPrawnMaterial(0xff9966, 0.5, 0.15, { addNoise: true })
    
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a0f0a,
      roughness: 0.05,
      metalness: 0.9,
      transparent: true,
      opacity: 0.95,
      envMapIntensity: 2,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0
    })

    const leftEyeStalk = new THREE.Mesh(eyeStalkGeometry, eyeStalkMaterial)
    leftEyeStalk.position.set(-0.25, 0.3, 0.6)
    leftEyeStalk.rotation.z = -0.3
    leftEyeStalk.castShadow = true
    prawnGroup.add(leftEyeStalk)

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.35, 0.45, 0.7)
    leftEye.castShadow = true
    prawnGroup.add(leftEye)

    const rightEyeStalk = new THREE.Mesh(eyeStalkGeometry, eyeStalkMaterial)
    rightEyeStalk.position.set(0.25, 0.3, 0.6)
    rightEyeStalk.rotation.z = 0.3
    rightEyeStalk.castShadow = true
    prawnGroup.add(rightEyeStalk)

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(0.35, 0.45, 0.7)
    rightEye.castShadow = true
    prawnGroup.add(rightEye)

    // Long antennae (characteristic of Macrobrachium) - enhanced realism
    const antennaeSegments: THREE.Mesh[] = []
    for (let side = 0; side < 2; side++) {
      const xPos = side === 0 ? -0.15 : 0.15
      for (let i = 0; i < 10; i++) { // More segments for realism
        const segmentLength = 0.35 - (i * 0.025)
        const segmentRadius = 0.018 - (i * 0.0015)
        const antennaSegmentGeometry = new THREE.CylinderGeometry(
          segmentRadius * 0.8, 
          segmentRadius * 1.2, 
          segmentLength, 
          8
        )
        
        // Add joint details
        const antennaPositions = antennaSegmentGeometry.attributes.position.array as Float32Array
        for (let j = 0; j < antennaPositions.length; j += 3) {
          const x = antennaPositions[j]
          const y = antennaPositions[j + 1]
          const z = antennaPositions[j + 2]
          
          // Add joint bulges at ends
          const jointBulge = Math.abs(y) > segmentLength * 0.3 ? 
            Math.sin((Math.abs(y) / segmentLength) * Math.PI) * 0.003 : 0
          
          antennaPositions[j] = x + jointBulge
          antennaPositions[j + 2] = z + jointBulge
        }
        antennaSegmentGeometry.attributes.position.needsUpdate = true
        antennaSegmentGeometry.computeVertexNormals()
        
        const antennaSegmentMaterial = createPrawnMaterial(
          0xffaa77 - (i * 0x050302), 
          0.7 + (i * 0.02), 
          0.08,
          { opacity: 0.9 - (i * 0.05), addNoise: true }
        )
        
        const antennaSegment = new THREE.Mesh(antennaSegmentGeometry, antennaSegmentMaterial)
        
        // More natural curved positioning
        const curvature = i * 0.15
        antennaSegment.position.set(
          xPos + Math.sin(i * 0.25 + curvature) * 0.12,
          0.4 + (i * segmentLength * 0.75),
          0.8 + Math.cos(i * 0.25 + curvature) * 0.25 + (i * 0.1)
        )
        antennaSegment.rotation.z = (side === 0 ? -0.25 : 0.25) + (i * 0.12)
        antennaSegment.rotation.x = -0.35 + (i * 0.06)
        antennaSegment.rotation.y = (side === 0 ? -0.1 : 0.1) + Math.sin(i * 0.3) * 0.05
        antennaSegment.castShadow = true
        prawnGroup.add(antennaSegment)
        antennaeSegments.push(antennaSegment)
      }
    }

    // Large claws (chelipeds) - enhanced realism for male Macrobrachium
    const clawSegments: THREE.Mesh[] = []
    
    // Left claw (dominant claw in males) - highly detailed
    const leftClawBaseGeometry = new THREE.CylinderGeometry(0.14, 0.18, 0.7, 14)
    
    // Add muscle definition to claw base
    const leftClawPositions = leftClawBaseGeometry.attributes.position.array as Float32Array
    for (let i = 0; i < leftClawPositions.length; i += 3) {
      const x = leftClawPositions[i]
      const y = leftClawPositions[i + 1]
      const z = leftClawPositions[i + 2]
      
      // Add muscle bulges and joint details
      const muscleBulge = Math.sin(Math.atan2(z, x) * 3) * 0.015
      const jointDetail = Math.abs(y) > 0.25 ? Math.sin(y * 8) * 0.008 : 0
      
      leftClawPositions[i] = x + muscleBulge
      leftClawPositions[i + 1] = y + jointDetail
      leftClawPositions[i + 2] = z + muscleBulge * 0.5
    }
    leftClawBaseGeometry.attributes.position.needsUpdate = true
    leftClawBaseGeometry.computeVertexNormals()
    
    const leftClawBaseMaterial = createPrawnMaterial(0xee5533, 0.25, 0.45, { addNoise: true })
    const leftClawBase = new THREE.Mesh(leftClawBaseGeometry, leftClawBaseMaterial)
    leftClawBase.position.set(-0.45, 0, 0.4)
    leftClawBase.rotation.z = -0.5
    leftClawBase.rotation.x = Math.PI / 2
    leftClawBase.castShadow = true
    prawnGroup.add(leftClawBase)
    clawSegments.push(leftClawBase)

    // Left claw hand - more detailed shape
    const leftClawGeometry = new THREE.SphereGeometry(0.28, 16, 12)
    leftClawGeometry.scale(1.6, 0.9, 1.3)
    
    // Add claw details - fingers and texture
    const leftClawHandPositions = leftClawGeometry.attributes.position.array as Float32Array
    for (let i = 0; i < leftClawHandPositions.length; i += 3) {
      const x = leftClawHandPositions[i]
      const y = leftClawHandPositions[i + 1]
      const z = leftClawHandPositions[i + 2]
      
      // Create claw opening/fingers
      if (z > 0.2) {
        const fingerSeparation = Math.sin(Math.atan2(y, x) * 2) * 0.08
        leftClawHandPositions[i + 1] = y + fingerSeparation
      }
      
      // Add surface texture
      const shellTexture = Math.sin(x * 12) * Math.cos(y * 8) * 0.012
      leftClawHandPositions[i] = x + shellTexture
      leftClawHandPositions[i + 2] = z + shellTexture * 0.5
    }
    leftClawGeometry.attributes.position.needsUpdate = true
    leftClawGeometry.computeVertexNormals()
    
    const leftClawMaterial = createPrawnMaterial(0xff4422, 0.2, 0.55, { addNoise: true })
    const leftClaw = new THREE.Mesh(leftClawGeometry, leftClawMaterial)
    leftClaw.position.set(-0.85, 0, 0.55)
    leftClaw.castShadow = true
    prawnGroup.add(leftClaw)
    clawSegments.push(leftClaw)

    // Right claw (smaller, feeding claw)
    const rightClawBase = leftClawBase.clone()
    rightClawBase.material = createPrawnMaterial(0xdd4422, 0.28, 0.42, { addNoise: true })
    rightClawBase.position.set(0.45, 0, 0.4)
    rightClawBase.rotation.z = 0.5
    rightClawBase.scale.setScalar(0.75) // Smaller than left claw
    prawnGroup.add(rightClawBase)
    clawSegments.push(rightClawBase)

    const rightClaw = leftClaw.clone()
    rightClaw.material = createPrawnMaterial(0xee3311, 0.22, 0.52, { addNoise: true })
    rightClaw.position.set(0.72, 0, 0.52)
    rightClaw.scale.setScalar(0.75) // Smaller than left claw
    prawnGroup.add(rightClaw)
    clawSegments.push(rightClaw)

    // Add claw tips/teeth for both claws
    for (let clawIndex = 0; clawIndex < 2; clawIndex++) {
      const isLeft = clawIndex === 0
      for (let tooth = 0; tooth < 3; tooth++) {
        const toothGeometry = new THREE.ConeGeometry(0.02, 0.08, 6)
        const toothMaterial = createPrawnMaterial(0xffffff, 0.1, 0.8)
        const toothMesh = new THREE.Mesh(toothGeometry, toothMaterial)
        
        const clawScale = isLeft ? 1 : 0.75
        toothMesh.position.set(
          (isLeft ? -0.85 : 0.72) + (tooth - 1) * 0.06 * clawScale,
          (tooth % 2 === 0 ? 0.15 : -0.15) * clawScale,
          0.75 * clawScale
        )
        toothMesh.rotation.x = Math.PI / 2
        toothMesh.rotation.z = (tooth - 1) * 0.2
        toothMesh.castShadow = true
        prawnGroup.add(toothMesh)
        clawSegments.push(toothMesh)
      }
    }

    // Swimming legs (pleopods) - enhanced realism
    const swimmingLegs: THREE.Mesh[] = []
    for (let i = 0; i < 5; i++) {
      for (let side = 0; side < 2; side++) {
        // Create more realistic swimming leg with multiple segments
        const legGeometry = new THREE.PlaneGeometry(0.18, 0.45)
        
        // Add natural curve to swimming legs
        const legPositions = legGeometry.attributes.position.array as Float32Array
        for (let j = 0; j < legPositions.length; j += 3) {
          const x = legPositions[j]
          const y = legPositions[j + 1]
          const z = legPositions[j + 2]
          
          // Create natural paddle shape
          const curve = Math.sin((y + 0.225) * Math.PI / 0.45) * 0.03
          const taper = Math.abs(y) / 0.225
          
          legPositions[j] = x * (1 - taper * 0.2) + curve
          legPositions[j + 2] = z + curve * 0.5
        }
        legGeometry.attributes.position.needsUpdate = true
        legGeometry.computeVertexNormals()
        
        const legMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0xffccaa).lerp(new THREE.Color(0xffddbb), i / 5),
          transparent: true,
          opacity: 0.7 - (i * 0.05),
          side: THREE.DoubleSide,
          roughness: 0.8,
          metalness: 0.1
        })
        
        const leg = new THREE.Mesh(legGeometry, legMaterial)
        leg.position.set(
          side === 0 ? -0.32 : 0.32,
          0,
          -0.15 - (i * 0.32)
        )
        leg.rotation.y = side === 0 ? -0.6 : 0.6
        leg.rotation.x = Math.sin(i * 0.5) * 0.2
        leg.castShadow = true
        prawnGroup.add(leg)
        swimmingLegs.push(leg)
      }
    }

    // Walking legs - more detailed and realistic
    const walkingLegs: THREE.Mesh[] = []
    for (let i = 0; i < 4; i++) {
      for (let side = 0; side < 2; side++) {
        const legSegments = []
        for (let j = 0; j < 4; j++) { // More segments for realism
          const segmentLength = j === 0 ? 0.25 : j === 1 ? 0.22 : j === 2 ? 0.18 : 0.12
          const segmentRadius = 0.028 - (j * 0.003)
          const segmentGeometry = new THREE.CylinderGeometry(
            segmentRadius * 0.8, 
            segmentRadius * 1.1, 
            segmentLength, 
            8
          )
          
          // Add joint details
          const segmentPositions = segmentGeometry.attributes.position.array as Float32Array
          for (let k = 0; k < segmentPositions.length; k += 3) {
            const x = segmentPositions[k]
            const y = segmentPositions[k + 1]
            const z = segmentPositions[k + 2]
            
            // Add joint swelling at ends
            const jointDetail = Math.abs(y) > segmentLength * 0.35 ? 
              Math.sin((Math.abs(y) / segmentLength) * Math.PI) * 0.004 : 0
            
            segmentPositions[k] = x + jointDetail
            segmentPositions[k + 2] = z + jointDetail
          }
          segmentGeometry.attributes.position.needsUpdate = true
          segmentGeometry.computeVertexNormals()
          
          const segmentMaterial = createPrawnMaterial(
            0xdd7744 - (j * 0x050302), 
            0.55 + (j * 0.05), 
            0.22 - (j * 0.02),
            { addNoise: true, opacity: 0.95 }
          )
          
          const segment = new THREE.Mesh(segmentGeometry, segmentMaterial)
          
          // Natural leg positioning
          const legAngle = (side === 0 ? -0.8 : 0.8) + (j * 0.35)
          const legExtension = j * segmentLength * 0.85
          
          segment.position.set(
            (side === 0 ? -0.42 : 0.42) + (Math.cos(legAngle) * legExtension),
            -0.15 - (Math.sin(legAngle) * legExtension),
            0.25 - (i * 0.22)
          )
          segment.rotation.z = legAngle
          segment.rotation.y = (side === 0 ? -0.2 : 0.2) + Math.sin(i * 0.5) * 0.1
          segment.castShadow = true
          prawnGroup.add(segment)
          walkingLegs.push(segment)
          legSegments.push(segment)
        }
        
        // Add leg tip/foot
        const footGeometry = new THREE.SphereGeometry(0.02, 8, 6)
        const footMaterial = createPrawnMaterial(0xaa5533, 0.8, 0.1)
        const foot = new THREE.Mesh(footGeometry, footMaterial)
        
        const lastSegment = legSegments[legSegments.length - 1]
        foot.position.copy(lastSegment.position)
        foot.position.x += (side === 0 ? -1 : 1) * 0.15
        foot.position.y -= 0.08
        foot.castShadow = true
        prawnGroup.add(foot)
        walkingLegs.push(foot)
      }
    }

    // Tail fan (uropods and telson) - highly detailed
    const createTailSegment = (width: number, height: number, curve: number = 0) => {
      const geometry = new THREE.PlaneGeometry(width, height, 8, 8)
      const positions = geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i]
        const y = positions[i + 1]
        const z = positions[i + 2]
        
        // Add natural fan curvature
        const curvature = Math.sin((x + width/2) / width * Math.PI) * curve
        const fanTexture = Math.sin(x * 8) * Math.cos(y * 6) * 0.01
        
        positions[i + 1] = y + curvature
        positions[i + 2] = z + fanTexture
      }
      
      geometry.attributes.position.needsUpdate = true
      geometry.computeVertexNormals()
      return geometry
    }
    
    // Central telson (middle tail segment)
    const telsonGeometry = createTailSegment(0.4, 0.8, 0.05)
    const telsonMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa88,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.1
    })
    const telson = new THREE.Mesh(telsonGeometry, telsonMaterial)
    telson.position.set(0, 0, -2.8)
    telson.rotation.x = Math.PI / 2
    telson.castShadow = true
    prawnGroup.add(telson)
    
    // Uropods (side tail fans)
    for (let side = 0; side < 2; side++) {
      // Outer uropod
      const outerUropodGeometry = createTailSegment(0.35, 0.7, 0.08)
      const outerUropodMaterial = new THREE.MeshStandardMaterial({
        color: 0xff9977,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.05
      })
      const outerUropod = new THREE.Mesh(outerUropodGeometry, outerUropodMaterial)
      outerUropod.position.set((side === 0 ? -0.4 : 0.4), 0, -2.75)
      outerUropod.rotation.x = Math.PI / 2
      outerUropod.rotation.z = (side === 0 ? -0.3 : 0.3)
      outerUropod.castShadow = true
      prawnGroup.add(outerUropod)
      
      // Inner uropod
      const innerUropodGeometry = createTailSegment(0.28, 0.6, 0.06)
      const innerUropodMaterial = new THREE.MeshStandardMaterial({
        color: 0xffbb99,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        roughness: 0.75,
        metalness: 0.08
      })
      const innerUropod = new THREE.Mesh(innerUropodGeometry, innerUropodMaterial)
      innerUropod.position.set((side === 0 ? -0.25 : 0.25), 0, -2.8)
      innerUropod.rotation.x = Math.PI / 2
      innerUropod.rotation.z = (side === 0 ? -0.15 : 0.15)
      innerUropod.castShadow = true
      prawnGroup.add(innerUropod)
    }
    
    // Store tail references
    const tailFan = { telson, uropods: [] }

    // Add underwater particles for enhanced realism
    const particleCount = 150
    const particleGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleVelocities = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      particlePositions[i3] = (Math.random() - 0.5) * 20
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 15
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 20
      
      particleVelocities[i3] = (Math.random() - 0.5) * 0.01
      particleVelocities[i3 + 1] = Math.random() * 0.02 + 0.005 // Gentle upward drift
      particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.01
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(particleVelocities, 3))
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })
    
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    // Add subtle underwater current effect
    const createWaterCurrent = () => {
      const currentGeometry = new THREE.PlaneGeometry(15, 15, 32, 32)
      const currentPositions = currentGeometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < currentPositions.length; i += 3) {
        const x = currentPositions[i]
        const y = currentPositions[i + 1]
        const wave = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 0.3
        currentPositions[i + 2] = wave
      }
      
      currentGeometry.attributes.position.needsUpdate = true
      currentGeometry.computeVertexNormals()
      
      const currentMaterial = new THREE.MeshStandardMaterial({
        color: 0x4488aa,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        wireframe: true
      })
      
      const waterCurrent = new THREE.Mesh(currentGeometry, currentMaterial)
      waterCurrent.position.set(0, -5, 0)
      waterCurrent.rotation.x = Math.PI / 2
      scene.add(waterCurrent)
      
      return waterCurrent
    }
    
    const waterCurrent = createWaterCurrent()

    // Add subtle water surface reflection
    const surfaceGeometry = new THREE.PlaneGeometry(20, 20, 64, 64)
    const surfacePositions = surfaceGeometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < surfacePositions.length; i += 3) {
      const x = surfacePositions[i]
      const y = surfacePositions[i + 1]
      const ripple = Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.1
      surfacePositions[i + 2] = ripple
    }
    
    surfaceGeometry.attributes.position.needsUpdate = true
    surfaceGeometry.computeVertexNormals()
    
    const surfaceMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: 0.15,
      metalness: 0.9,
      roughness: 0.1,
      side: THREE.DoubleSide
    })
    
    const waterSurface = new THREE.Mesh(surfaceGeometry, surfaceMaterial)
    waterSurface.position.set(0, 8, 0)
    waterSurface.rotation.x = Math.PI / 2
    scene.add(waterSurface)

    // Store references for animation
    prawnGroup.userData = {
      bodySegments,
      antennaeSegments,
      clawSegments,
      swimmingLegs,
      walkingLegs,
      tailFan,
      leftEye,
      rightEye,
      particles,
      waterCurrent,
      waterSurface
    }

    scene.add(prawnGroup)

    // Enhanced underwater lighting for maximum realism
    const ambientLight = new THREE.AmbientLight(0x4488aa, 0.3)
    scene.add(ambientLight)

    // Main directional light with enhanced shadows
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.4)
    mainLight.position.set(5, 10, 8)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 4096
    mainLight.shadow.mapSize.height = 4096
    mainLight.shadow.camera.near = 0.1
    mainLight.shadow.camera.far = 50
    mainLight.shadow.camera.left = -10
    mainLight.shadow.camera.right = 10
    mainLight.shadow.camera.top = 10
    mainLight.shadow.camera.bottom = -10
    mainLight.shadow.bias = -0.0001
    scene.add(mainLight)

    // Realistic underwater caustic lighting
    const waterLight1 = new THREE.PointLight(0x66ddff, 0.9, 18)
    waterLight1.position.set(-3, 4, 3)
    waterLight1.decay = 2
    scene.add(waterLight1)

    const waterLight2 = new THREE.PointLight(0x88ffcc, 0.7, 15)
    waterLight2.position.set(4, -2, 4)
    waterLight2.decay = 2
    scene.add(waterLight2)

    // Additional fill lights for realism
    const fillLight1 = new THREE.PointLight(0xaaccff, 0.4, 12)
    fillLight1.position.set(-2, -3, -2)
    scene.add(fillLight1)

    const fillLight2 = new THREE.PointLight(0xffccaa, 0.3, 10)
    fillLight2.position.set(3, 2, -3)
    scene.add(fillLight2)

    // Rim lighting for silhouette enhancement
    const rimLight = new THREE.DirectionalLight(0xaaeeff, 0.6)
    rimLight.position.set(-8, 2, -5)
    scene.add(rimLight)

    // Subtle environment reflection
    const envLight = new THREE.HemisphereLight(0x87ceeb, 0x2f4f4f, 0.5)
    scene.add(envLight)

    // Camera position
    camera.position.set(0, 1, 5)
    camera.lookAt(0, 0, 0)

    // Enhanced mouse interaction for game-like experience
    const handleMouseMove = (event: MouseEvent) => {
      if (!mounted) return
      const newX = (event.clientX / window.innerWidth) * 2 - 1
      const newY = -(event.clientY / window.innerHeight) * 2 + 1
      
      // Prawn reacts to mouse movement
      const distance = Math.sqrt(newX * newX + newY * newY)
      
      if (distance > 0.3) {
        setGameState(prev => ({ ...prev, prawnMood: 'excited' }))
        animationStateRef.current.breathingIntensity = 1.5
        // Mouse interaction temporarily overrides auto-swimming
        animationStateRef.current.isAutoSwimming = false
        // Reset auto-swimming after 3 seconds of no mouse movement
        setTimeout(() => {
          animationStateRef.current.isAutoSwimming = true
        }, 3000)
      } else {
        setGameState(prev => ({ ...prev, prawnMood: 'calm' }))
        animationStateRef.current.breathingIntensity = 1
      }
      
      // Play sound for significant movement when audio is enabled
      if (audioEnabled && (Math.abs(newX - mouseRef.current.x) > 0.1 || Math.abs(newY - mouseRef.current.y) > 0.1)) {
        playRippleSound({ volume: 0.1, playbackRate: 0.8 + Math.random() * 0.4 })
      }
      
      mouseRef.current.x = newX
      mouseRef.current.y = newY
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Game-like animation loop with realistic behaviors
    const animate = () => {
      if (!mounted) return
      frameRef.current = requestAnimationFrame(animate)

      const time = Date.now() * 0.001
      const deltaTime = time * 0.1

      if (prawnGroupRef.current && prawnGroupRef.current.userData) {
        const {
          bodySegments,
          antennaeSegments,
          clawSegments,
          swimmingLegs,
          walkingLegs,
          tailFan,
          leftEye,
          rightEye,
          particles,
          waterCurrent,
          waterSurface
        } = prawnGroupRef.current.userData

        // Auto-swimming patterns
        if (animationStateRef.current.isAutoSwimming) {
          const swimState = animationStateRef.current
          swimState.patternProgress += swimState.swimSpeed
          
          let targetX = 0, targetY = 0, targetZ = 0
          
          // Different swimming patterns
          switch (swimState.swimPattern) {
            case 'circular':
              const radius = 2.5
              targetX = Math.cos(swimState.patternProgress) * radius
              targetY = Math.sin(swimState.patternProgress * 0.5) * 1.2
              targetZ = Math.sin(swimState.patternProgress) * radius
              break
              
            case 'figure8':
              const fig8Scale = 2
              targetX = Math.sin(swimState.patternProgress) * fig8Scale
              targetY = Math.sin(swimState.patternProgress * 0.7) * 1.5
              targetZ = Math.sin(swimState.patternProgress * 2) * fig8Scale
              break
              
            case 'random':
              // Change direction every 5 seconds
              if (time - swimState.lastDirectionChange > 5) {
                swimState.swimTarget.set(
                  (Math.random() - 0.5) * 6,
                  (Math.random() - 0.5) * 4,
                  (Math.random() - 0.5) * 4
                )
                swimState.lastDirectionChange = time
              }
              targetX = swimState.swimTarget.x
              targetY = swimState.swimTarget.y
              targetZ = swimState.swimTarget.z
              break
              
            case 'patrol':
              const patrolTime = swimState.patternProgress % (Math.PI * 4)
              if (patrolTime < Math.PI) {
                targetX = -2.5 + (patrolTime / Math.PI) * 5
                targetY = Math.sin(patrolTime * 2) * 0.8
                targetZ = 1
              } else if (patrolTime < Math.PI * 2) {
                targetX = 2.5
                targetY = Math.sin((patrolTime - Math.PI) * 3) * 1.2
                targetZ = 1 - ((patrolTime - Math.PI) / Math.PI) * 2
              } else if (patrolTime < Math.PI * 3) {
                targetX = 2.5 - ((patrolTime - Math.PI * 2) / Math.PI) * 5
                targetY = Math.sin((patrolTime - Math.PI * 2) * 2) * 0.8
                targetZ = -1
              } else {
                targetX = -2.5
                targetY = Math.sin((patrolTime - Math.PI * 3) * 3) * 1.2
                targetZ = -1 + ((patrolTime - Math.PI * 3) / Math.PI) * 2
              }
              break
          }
          
          // Smooth movement towards target with boundary checking
          const smoothFactor = 0.02
          const newX = prawnGroupRef.current.position.x + (targetX - prawnGroupRef.current.position.x) * smoothFactor
          const newY = prawnGroupRef.current.position.y + (targetY - prawnGroupRef.current.position.y) * smoothFactor
          const newZ = prawnGroupRef.current.position.z + (targetZ - prawnGroupRef.current.position.z) * smoothFactor
          
          // Apply boundaries with soft bounce and pattern changes
          const bounds = swimState.swimBounds
          if (newX < bounds.x.min || newX > bounds.x.max) {
            const newPattern = 'random' as const
            swimState.swimPattern = newPattern // Change pattern when hitting boundary
            swimState.patternProgress = 0
            setGameState(prev => ({ ...prev, currentSwimPattern: newPattern }))
          }
          if (newY < bounds.y.min || newY > bounds.y.max) {
            const newPattern = 'circular' as const
            swimState.swimPattern = newPattern // Return to safe pattern
            setGameState(prev => ({ ...prev, currentSwimPattern: newPattern }))
          }
          if (newZ < bounds.z.min || newZ > bounds.z.max) {
            const newPattern = 'figure8' as const
            swimState.swimPattern = newPattern // Change to contained pattern
            setGameState(prev => ({ ...prev, currentSwimPattern: newPattern }))
          }
          
          prawnGroupRef.current.position.x = Math.max(bounds.x.min, Math.min(bounds.x.max, newX))
          prawnGroupRef.current.position.y = Math.max(bounds.y.min, Math.min(bounds.y.max, newY))
          prawnGroupRef.current.position.z = Math.max(bounds.z.min, Math.min(bounds.z.max, newZ))
          
          // Calculate swimming direction for orientation
          const direction = new THREE.Vector3(
            targetX - prawnGroupRef.current.position.x,
            targetY - prawnGroupRef.current.position.y,
            targetZ - prawnGroupRef.current.position.z
          ).normalize()
          
          // Orient prawn to swimming direction
          const targetRotationY = Math.atan2(direction.x, direction.z)
          const targetRotationX = Math.asin(-direction.y) * 0.5
          
          prawnGroupRef.current.rotation.y += (targetRotationY - prawnGroupRef.current.rotation.y) * 0.05
          prawnGroupRef.current.rotation.x += (targetRotationX - prawnGroupRef.current.rotation.x) * 0.05
          
          // Change swimming pattern occasionally
          if (Math.random() < 0.001) { // Very rare pattern change
            const patterns = ['circular', 'figure8', 'random', 'patrol'] as const
            const newPattern = patterns[Math.floor(Math.random() * patterns.length)]
            swimState.swimPattern = newPattern
            swimState.patternProgress = 0
            setGameState(prev => ({ ...prev, currentSwimPattern: newPattern }))
          }
          
          // Enhanced swimming intensity based on movement
          swimState.swimIntensity = 1 + direction.length() * 2
          setGameState(prev => ({ ...prev, prawnMood: 'swimming', isSwimming: true }))
        } else {
          // Manual control via mouse when not auto-swimming
          const targetRotationY = mouseRef.current.x * Math.PI * 0.4
          const targetRotationX = mouseRef.current.y * Math.PI * 0.3
          
          prawnGroupRef.current.rotation.y += (targetRotationY - prawnGroupRef.current.rotation.y) * 0.03
          prawnGroupRef.current.rotation.x += (targetRotationX - prawnGroupRef.current.rotation.x) * 0.03
          
          // Gentle floating when under manual control
          const baseY = Math.sin(time * 0.8) * 0.2
          const breathingY = Math.sin(time * 3) * 0.05 * animationStateRef.current.breathingIntensity
          prawnGroupRef.current.position.y = baseY + breathingY
          
          animationStateRef.current.swimIntensity = animationStateRef.current.breathingIntensity
          setGameState(prev => ({ ...prev, isSwimming: false }))
        }

        // Body segment wave motion (enhanced during swimming)
        bodySegments.forEach((segment, index) => {
          if (index > 0) { // Skip the cephalothorax
            const wave = Math.sin(time * (2 * animationStateRef.current.swimIntensity) + index * 0.3) * 0.1
            const swimWave = animationStateRef.current.isAutoSwimming ? Math.sin(time * 4 + index * 0.5) * 0.15 : 0
            segment.rotation.y = (wave + swimWave) * (gameState.prawnMood === 'excited' ? 1.5 : 1)
          }
        })

        // Enhanced antennae swaying during swimming
        antennaeSegments.forEach((segment, index) => {
          const sway = Math.sin(time * 1.5 + index * 0.1) * 0.15
          const swimSway = animationStateRef.current.isAutoSwimming ? Math.sin(time * 3 + index * 0.2) * 0.1 : 0
          const side = index < antennaeSegments.length / 2 ? -1 : 1
          segment.rotation.z += (sway + swimSway) * side * 0.1
          segment.rotation.x += Math.cos(time * 1.2 + index * 0.1) * 0.05
        })

        // Enhanced claw movements during swimming
        clawSegments.forEach((claw, index) => {
          const clawTime = time * (1.2 + index * 0.3) * animationStateRef.current.swimIntensity
          const movement = Math.sin(clawTime) * 0.1
          const swimMovement = animationStateRef.current.isAutoSwimming ? Math.sin(clawTime * 2) * 0.05 : 0
          claw.rotation.y += (movement + swimMovement) * (index % 2 === 0 ? 1 : -1) * 0.05
          
          // Occasional claw snapping
          if (Math.sin(clawTime * 0.1) > 0.95 && gameState.prawnMood === 'excited') {
            claw.scale.setScalar(1.1 + Math.sin(clawTime * 10) * 0.1)
          } else {
            claw.scale.setScalar(1)
          }
        })

        // Enhanced swimming legs movement (rapid paddling during swimming)
        swimmingLegs.forEach((leg, index) => {
          const legTime = time * (4 * animationStateRef.current.swimIntensity) + index * 0.2
          const paddling = Math.sin(legTime) * 0.3
          const swimPaddling = animationStateRef.current.isAutoSwimming ? Math.sin(legTime * 1.5) * 0.2 : 0
          leg.rotation.z = paddling + swimPaddling
          leg.material.opacity = 0.6 + Math.sin(legTime) * 0.2
        })

        // Walking legs movement (minimal during swimming)
        walkingLegs.forEach((leg, index) => {
          const legTime = time * (2 - animationStateRef.current.swimIntensity * 0.5) + index * 0.4
          leg.rotation.y = Math.sin(legTime) * 0.2
        })

        // Enhanced tail fan movement (primary propulsion during swimming)
        if (tailFan) {
          const tailTime = time * (1.8 * animationStateRef.current.swimIntensity)
          const tailMovement = Math.sin(tailTime) * 0.2
          const swimThrustMovement = animationStateRef.current.isAutoSwimming ? Math.sin(tailTime * 2) * 0.3 : 0
          
          // Animate telson
          if (tailFan.telson) {
            tailFan.telson.rotation.y = tailMovement + swimThrustMovement
            tailFan.telson.material.opacity = 0.8 + Math.sin(time * 2) * 0.1
          }
        }

        // Eye movement (tracking movement direction during swimming)
        if (leftEye && rightEye) {
          if (animationStateRef.current.isAutoSwimming) {
            // Eyes look in swimming direction
            const swimDirection = animationStateRef.current.swimDirection
            const eyeTargetX = swimDirection.x * 0.5
            const eyeTargetY = swimDirection.y * 0.3
            
            leftEye.lookAt(
              leftEye.position.x + eyeTargetX,
              leftEye.position.y + eyeTargetY,
              leftEye.position.z + 1
            )
            rightEye.lookAt(
              rightEye.position.x + eyeTargetX,
              rightEye.position.y + eyeTargetY,
              rightEye.position.z + 1
            )
          } else {
            // Eyes track mouse
            const eyeTargetX = mouseRef.current.x * 0.3
            const eyeTargetY = mouseRef.current.y * 0.2
            
            leftEye.lookAt(
              leftEye.position.x + eyeTargetX,
              leftEye.position.y + eyeTargetY,
              leftEye.position.z + 1
            )
            rightEye.lookAt(
              rightEye.position.x + eyeTargetX,
              rightEye.position.y + eyeTargetY,
              rightEye.position.z + 1
            )
          }
        }

        // Update materials based on robot mode
        const isRobotMode = gameState.isRobotMode
        bodySegments.forEach((segment: THREE.Mesh) => {
          if (segment.material instanceof THREE.MeshStandardMaterial) {
            if (isRobotMode) {
              segment.material.color.setHex(0x6699cc)
              segment.material.roughness = 0.15
              segment.material.metalness = 0.8
              segment.material.emissive.setHex(0x0066cc)
              segment.material.emissiveIntensity = 0.2
            } else {
              segment.material.color.setHex(0xd4844a)
              segment.material.roughness = 0.35
              segment.material.metalness = 0.25
              segment.material.emissive.setHex(0x000000)
              segment.material.emissiveIntensity = 0
            }
          }
        })

        // Mood-based overall scaling with robotic effects and death animation
        const moodScale = gameState.prawnMood === 'excited' ? 1.05 : 
                          gameState.prawnMood === 'swimming' ? 1.02 : 
                          gameState.prawnMood === 'cooking' ? 1.08 :
                          gameState.prawnMood === 'thinking' ? 1.03 : 
                          gameState.prawnMood === 'performing' ? 1.1 :
                          gameState.prawnMood === 'dead' ? 0.8 + Math.sin(time * 10) * 0.1 : 1 // Death twitching
        const breathingScale = gameState.prawnMood === 'dead' ? 
          1 + Math.sin(time * 15) * 0.05 : // Erratic twitching when dead
          1 + Math.sin(time * (gameState.isRobotMode ? 5 : 3)) * 0.02 * animationStateRef.current.breathingIntensity
        const roboticScale = gameState.isRobotMode ? 1 + Math.sin(time * 8) * 0.01 : 1
        prawnGroupRef.current.scale.setScalar(moodScale * breathingScale * roboticScale)

        // Death effects - rotate and fade
        if (gameState.prawnMood === 'dead') {
          prawnGroupRef.current.rotation.z = Math.sin(time * 2) * 0.3 // Rolling motion
          bodySegments.forEach((segment: THREE.Mesh) => {
            if (segment.material instanceof THREE.MeshStandardMaterial) {
              segment.material.opacity = 0.5 + Math.sin(time * 8) * 0.2 // Flickering
            }
          })
        } else {
          prawnGroupRef.current.rotation.z = 0
          bodySegments.forEach((segment: THREE.Mesh) => {
            if (segment.material instanceof THREE.MeshStandardMaterial) {
              segment.material.opacity = 0.95
            }
          })
        }

          // Enhanced robotic lighting effects
        if (scene.children.find(child => child.type === 'PointLight')) {
          const lights = scene.children.filter(child => child.type === 'PointLight') as THREE.PointLight[]
          lights.forEach((light, index) => {
            const baseIntensity = gameState.prawnMood === 'excited' ? 0.9 : 
                                 gameState.prawnMood === 'swimming' ? 0.8 :
                                 gameState.prawnMood === 'cooking' ? 1.2 :
                                 gameState.prawnMood === 'thinking' ? 1.0 :
                                 gameState.prawnMood === 'performing' ? 1.3 :
                                 gameState.prawnMood === 'dead' ? 0.2 : 0.7
            
            const roboticPulse = gameState.isRobotMode ? Math.sin(time * 4 + index) * 0.3 : 0
            const deathFlicker = gameState.prawnMood === 'dead' ? Math.random() * 0.1 : 0
            light.intensity = baseIntensity + Math.sin(time * 2 + index) * 0.1 * animationStateRef.current.swimIntensity + roboticPulse + deathFlicker
            
            // Enhanced color shifting for robotic mode
            const colorShift = Math.sin(time * 0.5 + index) * 0.1
            if (gameState.prawnMood === 'dead') {
              // Red/dark colors for death
              light.color.setHSL(0 + colorShift * 0.05, 0.9, 0.3 + Math.sin(time * 5) * 0.1)
            } else if (gameState.isRobotMode) {
              // Cyber blue colors for robot mode
              if (index === 0) {
                light.color.setHSL(0.6 + colorShift * 0.1, 0.9, 0.7 + Math.sin(time * 3) * 0.1)
              } else if (index === 1) {
                light.color.setHSL(0.55 + colorShift * 0.1, 0.8, 0.6 + Math.cos(time * 4) * 0.1)
              }
            } else {
              // Natural underwater colors
              if (index === 0) {
                light.color.setHSL(0.55 + colorShift * 0.1, 0.8, 0.6)
              } else if (index === 1) {
                light.color.setHSL(0.5 + colorShift * 0.1, 0.7, 0.6)
              }
            }
          })
        }

        // Animate underwater particles
        if (particles) {
          const positions = particles.geometry.attributes.position.array as Float32Array
          const velocities = particles.geometry.attributes.velocity.array as Float32Array
          
          for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3
            
            // Update positions based on velocities
            positions[i3] += velocities[i3] + Math.sin(time * 0.5 + i * 0.1) * 0.002
            positions[i3 + 1] += velocities[i3 + 1] + Math.sin(time * 0.3 + i * 0.05) * 0.001
            positions[i3 + 2] += velocities[i3 + 2] + Math.cos(time * 0.4 + i * 0.08) * 0.002
            
            // Wrap particles around boundaries
            if (positions[i3] > 10) positions[i3] = -10
            if (positions[i3] < -10) positions[i3] = 10
            if (positions[i3 + 1] > 8) positions[i3 + 1] = -8
            if (positions[i3 + 2] > 10) positions[i3 + 2] = -10
            if (positions[i3 + 2] < -10) positions[i3 + 2] = 10
          }
          
          particles.geometry.attributes.position.needsUpdate = true
          
          // Subtle rotation for particle sparkle effect
          particles.rotation.y += 0.001
        }

        // Animate water current
        if (waterCurrent) {
          const currentPositions = waterCurrent.geometry.attributes.position.array as Float32Array
          for (let i = 0; i < currentPositions.length; i += 3) {
            const x = currentPositions[i]
            const y = currentPositions[i + 1]
            const wave = Math.sin(x * 0.2 + time * 0.5) * Math.cos(y * 0.2 + time * 0.3) * 0.3
            currentPositions[i + 2] = wave
          }
          waterCurrent.geometry.attributes.position.needsUpdate = true
          waterCurrent.rotation.z += 0.001
        }

        // Animate water surface
        if (waterSurface) {
          const surfacePositions = waterSurface.geometry.attributes.position.array as Float32Array
          for (let i = 0; i < surfacePositions.length; i += 3) {
            const x = surfacePositions[i]
            const y = surfacePositions[i + 1]
            const ripple = Math.sin(x * 0.3 + time * 0.8) * Math.cos(y * 0.3 + time * 0.6) * 0.1
            surfacePositions[i + 2] = ripple
          }
          waterSurface.geometry.attributes.position.needsUpdate = true
        }
      }

      if (rendererRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, camera)
      }
    }

    // Resize handler
    const handleResize = () => {
      if (!mounted || !rendererRef.current) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      rendererRef.current.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Start animation
    animate()
    if (mounted) {
      setIsLoaded(true)
    }

    // Wave animation loop
    const animateWaves = () => {
      if (!canvasRef.current) {
        waveAnimationRef.current = requestAnimationFrame(animateWaves)
        return
      }

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Update wave effects
      const currentTime = Date.now()
      setWaveEffects(prevWaves => {
        const activeWaves = prevWaves
          .map(wave => {
            const age = currentTime - wave.timestamp
            const progress = age / 1000 // 1 second duration
            
            if (progress >= 1) return null
            
            return {
              ...wave,
              radius: wave.maxRadius * progress,
              opacity: 0.8 * (1 - progress)
            }
          })
          .filter(Boolean) as WaveEffect[]

        // Clear and redraw waves
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        activeWaves.forEach(wave => {
          // Draw multiple concentric circles for wave effect
          for (let i = 0; i < 3; i++) {
            const circleRadius = wave.radius * (1 - i * 0.3)
            const circleOpacity = wave.opacity * (1 - i * 0.4)
            
            if (circleRadius > 0 && circleOpacity > 0) {
              ctx.strokeStyle = `rgba(59, 130, 246, ${circleOpacity})`
              ctx.lineWidth = 2 - i * 0.5
              ctx.beginPath()
              ctx.arc(wave.x, wave.y, circleRadius, 0, Math.PI * 2)
              ctx.stroke()
              
              // Add shimmering effect
              ctx.strokeStyle = `rgba(139, 92, 246, ${circleOpacity * 0.6})`
              ctx.lineWidth = 1 - i * 0.3
              ctx.beginPath()
              ctx.arc(wave.x, wave.y, circleRadius * 0.7, 0, Math.PI * 2)
              ctx.stroke()
            }
          }
        })

        return activeWaves
      })

      waveAnimationRef.current = requestAnimationFrame(animateWaves)
    }

    waveAnimationRef.current = requestAnimationFrame(animateWaves)

    // Initialize ambient sound after a delay
    setTimeout(() => {
      if (mounted && audioEnabled) {
        ambientSoundRef.current = playAmbientSound({ volume: 0.05, loop: true })
      }
    }, 2000)

    // Cleanup
    return () => {
      mounted = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
      if (waveAnimationRef.current) {
        cancelAnimationFrame(waveAnimationRef.current)
      }
      if (ambientSoundRef.current) {
        ambientSoundRef.current.stop()
      }
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [audioEnabled, playRippleSound, playAmbientSound, gameState.prawnMood, gameState.isRobotMode])

  const handleClick = async (event: React.MouseEvent) => {
    // Enable audio on first user interaction
    if (!audioEnabled) {
      await resumeAudioContext()
      setAudioEnabled(true)
    }

    // Prawn interaction - feeding simulation
    setGameState(prev => ({
      ...prev,
      interactionCount: prev.interactionCount + 1,
      prawnMood: 'excited',
      isFeeding: true
    }))

    // Reset feeding state after animation
    setTimeout(() => {
      setGameState(prev => ({ ...prev, isFeeding: false, prawnMood: 'calm' }))
    }, 2000)

    // Check if the menu is visible - if so, clicking anywhere should close it and navigate to site
    if (menuVisible) {
      playSwooshSound({ volume: 0.3, playbackRate: 1.1 })
      onNavigateToSite?.()
      return
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Check if click is on the central area of the prawn (for menu)
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
    
    if (distance < 250) { // Increased detection area for better UX
      // Click on prawn - toggle menu with enhanced feedback
      playClickSound({ volume: 0.5, playbackRate: 1.2 })
      playBubbleSound({ volume: 0.4, playbackRate: 1 + Math.random() * 0.3 })
      
      // Enhanced visual feedback
      animationStateRef.current.breathingIntensity = 2
      setTimeout(() => {
        animationStateRef.current.breathingIntensity = 1
      }, 1000)
      
      onMenuToggle(!menuVisible)
    } else {
      // Click on background - navigate to main site
      playSwooshSound({ volume: 0.3, playbackRate: 1.1 })
      onNavigateToSite?.()
    }
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    setGameState(prev => ({ ...prev, prawnMood: 'excited' }))
    if (audioEnabled) {
      playBubbleSound({ volume: 0.2, playbackRate: 1.5 })
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setGameState(prev => ({ ...prev, prawnMood: 'calm' }))
  }

  // Special interaction: feeding mode
  const handleDoubleClick = () => {
    if (!audioEnabled) return
    
    setGameState(prev => ({
      ...prev,
      isFeeding: true,
      prawnMood: 'feeding'
    }))
    
    playBubbleSound({ volume: 0.6, playbackRate: 0.8 })
    playRippleSound({ volume: 0.4, playbackRate: 1.2 })
    
    setTimeout(() => {
      setGameState(prev => ({ ...prev, isFeeding: false, prawnMood: 'calm' }))
    }, 3000)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-aqua">
      {/* Trajectory Drawing Canvas */}
      {gameState.gamePhase === 'trajectory' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-20 cursor-crosshair"
          width={window.innerWidth}
          height={window.innerHeight}
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            startDrawing(e.clientX - rect.left, e.clientY - rect.top)
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            continueDrawing(e.clientX - rect.left, e.clientY - rect.top)
          }}
          onMouseUp={finishDrawing}
          onMouseLeave={finishDrawing}
          onTouchStart={(e) => {
            e.preventDefault()
            const rect = e.currentTarget.getBoundingClientRect()
            const touch = e.touches[0]
            startDrawing(touch.clientX - rect.left, touch.clientY - rect.top)
          }}
          onTouchMove={(e) => {
            e.preventDefault()
            const rect = e.currentTarget.getBoundingClientRect()
            const touch = e.touches[0]
            continueDrawing(touch.clientX - rect.left, touch.clientY - rect.top)
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            finishDrawing()
          }}
        />
      )}
      
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* Logo overlay */}
      <div className="absolute top-8 left-8 text-white pointer-events-none">
        <h1 className="text-4xl font-bold heading-font">AquaFarm</h1>
      <div className="text-lg opacity-75">Macrobrachium rosenbergii</div>
        <p className="text-sm opacity-60 mt-2">Фотореалістична 3D візуалізація</p>
      </div>
      
      {/* Game status display */}
      <motion.div
        className="absolute top-8 right-8 text-white/90 text-center pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="bg-black/20 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
          <p className="text-sm font-medium">
            {gameState.isRobotMode ? '🤖 ChefBot-2000' : 'Настрій'}: {
              gameState.prawnMood === 'calm' ? '🧘 Спокійний' : 
              gameState.prawnMood === 'excited' ? '⚡ Збуджений' : 
              gameState.prawnMood === 'feeding' ? '🍽️ Годування' : 
              gameState.prawnMood === 'swimming' ? '🏊 Плавання' : 
              gameState.prawnMood === 'cooking' ? '👨‍🍳 Готує рецепт' :
              gameState.prawnMood === 'thinking' ? '🧠 Аналізує дані' : 
              gameState.prawnMood === 'performing' ? '🎪 Виконує трюк' :
              gameState.prawnMood === 'dead' ? '💀 Вимкнений' : '🎮 Інтерактив'
            }
          </p>
          <p className="text-xs opacity-75 mt-1">Взаємодій: {gameState.interactionCount}</p>
          {gameState.gamePhase !== 'exploring' && (
            <div className="text-xs text-green-300 mt-1 space-y-1">
              <p>🎯 Загальний рахунок: {gameState.score}</p>
              {gameState.gamePhase === 'trajectory' && (
                <p>🎪 Траєкторії: {gameState.trajectoryPoints} балів</p>
              )}
              {gameState.gamePhase === 'quiz' && (
                <p>🧠 Питання: {gameState.correctAnswers}/4 ({gameState.currentQuestion + 1} питання)</p>
              )}
              <p>📊 Фаза: {
                gameState.gamePhase === 'trajectory' ? 'Малювання трюків' :
                gameState.gamePhase === 'quiz' ? 'Відповіді на питання' :
                gameState.gamePhase === 'cooking' ? 'Готування рецепту' :
                gameState.gamePhase === 'completed' ? 'Завершено' : 'Дослідження'
              }</p>
            </div>
          )}
          {gameState.isSwimming && (
            <motion.p 
              className="text-xs text-blue-300 mt-1"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🌊 Автоматичне плавання
            </motion.p>
          )}
          {gameState.isFeeding && (
            <motion.p 
              className="text-xs text-yellow-300 mt-1"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              🦐 Креветка годується!
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Cooking Game Button */}
      {isLoaded && !menuVisible && gameState.gamePhase === 'exploring' && (
        <motion.button
          onClick={startCookingGame}
          className="absolute top-44 right-8 bg-orange-500/80 hover:bg-orange-600/90 backdrop-blur-sm rounded-full px-6 py-3 border border-orange-300/50 text-white font-medium transition-all duration-300 hover:scale-105 shadow-lg"
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: audioEnabled ? 1 : 0.7, scale: 1, x: 0 }}
          transition={{ delay: 4 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          disabled={!audioEnabled}
        >
          <span className="text-2xl mr-2">🤖</span>
          <span>ChefBot-2000 Гра</span>
        </motion.button>
      )}

      {/* Trajectory Drawing Instructions */}
      {gameState.gamePhase === 'trajectory' && (
        <motion.div
          className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-blue-500/90 backdrop-blur-sm rounded-lg px-6 py-4 border border-blue-300/50 text-white text-center z-30"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-bold mb-2">🎪 Малювання трюків креветки</h3>
          <p className="text-sm mb-1">Намалюйте траєкторію руху мишкою або пальцем</p>
          <p className="text-xs opacity-80">• Складність і природність = бали (макс. 10 за трюк)</p>
          <p className="text-xs opacity-80">• Надприродний рух = смерть креветки ❌</p>
          <p className="text-xs opacity-80">• Потрібно 100 балів для доступу до питань</p>
          
          <div className="mt-3 text-xs bg-white/20 rounded-lg p-2">
            <p>🎯 Поточний рахунок: {gameState.score}/100 балів</p>
            <p>🎪 Траєкторії: {gameState.trajectoryPoints} балів</p>
          </div>
        </motion.div>
      )}

      {/* Quiz Phase Instructions */}
      {gameState.gamePhase === 'quiz' && !showGameUI && (
        <motion.div
          className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-purple-500/90 backdrop-blur-sm rounded-lg px-6 py-4 border border-purple-300/50 text-white text-center z-30"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-bold mb-2">🧠 Фаза питань</h3>
          <p className="text-sm mb-1">Відповідайте на 4 кулінарні питання</p>
          <p className="text-xs opacity-80">• Правильна відповідь = +25 балів</p>
          <p className="text-xs opacity-80">• Помилка = смерть креветки та втрата всіх балів ❌</p>
          
          <div className="mt-3 text-xs bg-white/20 rounded-lg p-2">
            <p>🎯 Рахунок: {gameState.score} балів</p>
            <p>✅ Правильно: {gameState.correctAnswers}/4</p>
            <p>❓ Поточне питання: {gameState.currentQuestion + 1}</p>
          </div>
        </motion.div>
      )}

      {/* Game UI Overlay */}
      <AnimatePresence>
        {showGameUI && (
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="max-w-2xl w-full mx-4 bg-white/95 backdrop-blur-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gradient-primary flex items-center justify-center gap-2">
                  🤖 РобоКреветка-Кухар "ChefBot-2000"
                  <Badge variant="secondary">{gameState.hasAI ? 'ШІ Активно' : 'ШІ Очікує'}</Badge>
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  {gameState.gamePhase === 'quiz' ? (
                    <>Питання {gameState.currentQuestion + 1}/4 | Рахунок: {gameState.score} | Правильних: {gameState.correctAnswers}/4</>
                  ) : (
                    <>Фаза траєкторій | Рахунок: {gameState.score}/100 | Траєкторії: {gameState.trajectoryPoints}</>
                  )}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {gameState.gamePhase === 'trajectory' ? (
                  <div className="text-center space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-blue-800 mb-4">🎪 Малювання трюків креветки</h3>
                      <p className="text-blue-700 mb-4">
                        Намалюйте складну і природну траєкторію руху креветки. ChefBot-2000 оцінить ваш трюк!
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                          <p className="font-semibold text-green-800">✅ Добре:</p>
                          <ul className="text-green-700 text-xs mt-1 space-y-1">
                            <li>• Складні кривини</li>
                            <li>• Природні рухи</li>
                            <li>• Довгі траєкторії</li>
                            <li>• Зміни напрямку</li>
                          </ul>
                        </div>
                        
                        <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                          <p className="font-semibold text-red-800">❌ Погано:</p>
                          <ul className="text-red-700 text-xs mt-1 space-y-1">
                            <li>• Надто швидко</li>
                            <li>• Різкі повороти</li>
                            <li>• Надприродні рухи</li>
                            <li>• Короткі лінії</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm font-medium">
                          🎯 Поточний прогрес: {gameState.score}/100 балів
                        </p>
                        <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, gameState.score)}%` }}
                          ></div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">Трюків:</div>
                            <div className="text-blue-800">{trajectoryHistory.length}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-600">Життів:</div>
                            <div className="text-green-800">{gameState.lives}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-purple-600">Балів/трюк:</div>
                            <div className="text-purple-800">
                              {trajectoryHistory.length > 0 ? Math.round(gameState.score / trajectoryHistory.length) : 0}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm font-medium mb-2">🖱️ Інструкції для малювання:</p>
                        <ol className="text-blue-700 text-xs space-y-1">
                          <li>1. Натисніть та утримуйте кнопку миші</li>
                          <li>2. Малюйте плавну траєкторію руху креветки</li>
                          <li>3. Відпустіть кнопку миші щоб завершити трюк</li>
                          <li>4. Дивіться як хвилі розходяться від вашого малюнка!</li>
                        </ol>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => resetGame()}
                      variant="outline"
                      className="w-full"
                    >
                      🔄 Перезапустити гру
                    </Button>
                  </div>
                ) : (
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">{gameQuestion}</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {gameOptions.map((option, index) => (
                        <Button
                          key={index}
                          variant={userAnswer === option ? 
                            (option === correctAnswer ? "default" : "destructive") : 
                            "outline"
                          }
                          className="text-left justify-start p-4 h-auto"
                          onClick={() => handleAnswerSubmit(option)}
                          disabled={!!userAnswer}
                        >
                          <span className="font-medium mr-2">{String.fromCharCode(65 + index)})</span>
                          {option}
                        </Button>
                      ))}
                    </div>
                    {userAnswer && (
                      <motion.div
                        className="mt-4 p-3 rounded-lg bg-secondary/20"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p className="text-sm">
                          {userAnswer === correctAnswer 
                            ? "✅ Правильно! ChefBot-2000: 'Ваші кулінарні знання вражаючі! Системи схвалення активовані.'"
                            : "❌ Неправильно! ChefBot-2000 вимкнувся! Всі бали згоріли. Гра починається спочатку."
                          }
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe Generator UI */}
      <AnimatePresence>
        {showRecipeGenerator && (
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl text-gradient-primary flex items-center justify-center gap-3">
                  🏆 Ви виграли! 👨‍🍳 ChefBot-2000 ШІ-Кухар активований
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  РобоКреветка-Кухар створить унікальний рецепт на основі ваших інгредієнтів
                </p>
                <div className="mt-2 text-sm bg-green-100 border border-green-300 rounded-lg p-3">
                  <p className="text-green-800 font-medium">
                    🎯 Фінальний рахунок: {gameState.score} балів
                  </p>
                  <p className="text-green-700 text-xs mt-1">
                    Траєкторії: {gameState.trajectoryPoints} + Питання: {gameState.correctAnswers * 25} = {gameState.score}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!generatedRecipe ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        🥘 Введіть основні інгредієнти (через кому)
                      </label>
                      <Textarea
                        placeholder="Наприклад: креветки Macrobrachium rosenbergii, часник, лимон, олія, спеції..."
                        value={userIngredients}
                        onChange={(e) => setUserIngredients(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">👤 Ваше ім'я</label>
                        <Input
                          placeholder="Ім'я кухаря"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">📧 Email</label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={generateRecipeWithAI}
                        disabled={isGeneratingRecipe || !geminiApiKey || !userIngredients.trim()}
                        className="flex-1"
                      >
                        {isGeneratingRecipe ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"></div>
                            ChefBot-2000 створює рецепт...
                          </>
                        ) : (
                          <>🧠 ChefBot-2000 створити рецепт</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRecipeGenerator(false)
                          setGameState(prev => ({ ...prev, gamePhase: 'exploring', isRobotMode: false }))
                        }}
                      >
                        Скасувати
                      </Button>
                    </div>

                    {!geminiApiKey && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm">
                          ⚠️ Для роботи ШІ-генератора потрібно налаштувати Gemini API ключ в панелі адміністратора
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setShowAdminPanel(true)}
                        >
                          Налаштувати API
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
                        🍽️ {generatedRecipe.title}
                        <Badge className="bg-green-100 text-green-800">ШІ-генерований</Badge>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-green-700 mb-3">🥘 Інгредієнти:</h4>
                          <ul className="space-y-1">
                            {generatedRecipe.ingredients.map((ingredient, index) => (
                              <li key={index} className="text-sm text-green-600">• {ingredient}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-green-700 mb-3">👨‍🍳 Приготування:</h4>
                          <ol className="space-y-2">
                            {generatedRecipe.instructions.map((step, index) => (
                              <li key={index} className="text-sm text-green-600">
                                <span className="font-medium">{index + 1}.</span> {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                      
                      {/* ChefBot-2000 Notes */}
                      {generatedRecipe && generatedRecipe.chefbotNotes && (
                        <div className="col-span-1 md:col-span-2 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                            🤖 ChefBot-2000 Коментарі:
                          </h4>
                          <p className="text-sm text-blue-600 italic">"{generatedRecipe.chefbotNotes}"</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">👤 Ваше ім'я</label>
                        <Input
                          placeholder="Ім'я автора"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">📧 Email для надсилання</label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={saveRecipe}
                        className="flex-1"
                        disabled={!userName.trim() || !userEmail.trim()}
                      >
                        📧 Зберегти та надіслати рецепт
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setGeneratedRecipe(null)
                          setUserIngredients('')
                        }}
                      >
                        Створити новий
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      <AnimatePresence>
        {showAdminPanel && (
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="max-w-md w-full bg-white/95 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  ⚙️ Панель адміністратора
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">🔑 Gemini API Key</label>
                  <Input
                    type="password"
                    placeholder="Введіть ваш Gemini API ключ"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Отримайте ключ на: https://makersuite.google.com/app/apikey
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-medium text-blue-800 mb-2">📊 ChefBot-2000 Статистика</h4>
                  <p className="text-sm text-blue-600">Всього рецептів: {recipes.length}</p>
                  <p className="text-sm text-blue-600">
                    ChefBot-2000 рецептів: {recipes.filter(r => r.aiGenerated).length}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowAdminPanel(false)
                      toast.success("Налаштування збережено!")
                    }}
                    className="flex-1"
                  >
                    Зберегти
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAdminPanel(false)}
                  >
                    Скасувати
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enter site hint - only show when menu is NOT visible */}
      {!menuVisible && isLoaded && (
        <motion.div
          className="absolute bottom-8 right-8 text-white/80 text-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.5 }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <p className="text-sm font-medium">Натисніть тут для входу →</p>
          </div>
        </motion.div>
      )}
      
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-aqua/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
            <div className="text-xl font-semibold">Завантаження фотореалістичної 3D моделі...</div>
            <div className="text-sm opacity-75 mt-2">Детальна креветка Macrobrachium rosenbergii</div>
          </div>
        </div>
      )}
      
      {/* Enhanced interaction guide */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/90 text-center pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
        transition={{ delay: 1.5 }}
      >
        <div className="bg-black/20 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/20 max-w-md">
          <p className="text-base font-medium">
            {gameState.isRobotMode ? '🤖 ChefBot-2000 Робот-Креветка' : '🎮 Фотореалістична креветка'}
          </p>
          <p className="text-sm opacity-75 mt-1">
            {menuVisible 
              ? "Натисніть будь-де для входу на сайт"
              : gameState.gamePhase === 'trajectory'
                ? "🎪 Малюйте траєкторії трюків мишкою • Потрібно 100 балів"
                : gameState.gamePhase === 'quiz'
                  ? "🧠 ChefBot-2000 тестує ваші кулінарні знання • 4 питання"
                  : gameState.gamePhase === 'cooking'
                    ? "👨‍🍳 ChefBot-2000 аналізує інгредієнти та створює рецепт"
                    : gameState.isSwimming 
                      ? "🌊 Автономне плавання • 🖱️ Ручне керування"
                      : "🤖 Активувати ChefBot • 🖱️ Керування • 🎯 Клік = меню • 🍽️ Подвійний клік = годування"
            }
          </p>
        </div>
      </motion.div>

      {/* Reset Game Button - visible during game phases */}
      {gameState.gamePhase !== 'exploring' && gameState.gamePhase !== 'completed' && (
        <motion.button
          onClick={resetGame}
          className="absolute bottom-32 left-8 bg-red-500/80 hover:bg-red-600/90 backdrop-blur-sm rounded-full px-4 py-2 border border-red-300/50 text-white text-sm transition-all duration-300 hover:scale-105 shadow-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 Перезапустити
        </motion.button>
      )}

      {/* Trajectory Progress Indicator */}
      {gameState.gamePhase === 'trajectory' && (
        <motion.div
          className="absolute bottom-8 left-8 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-3 text-white text-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span>🎯</span>
            <span className="font-medium">Прогрес до питань:</span>
          </div>
          <div className="w-48 bg-gray-700 rounded-full h-2 mb-1">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, gameState.score)}%` }}
            ></div>
          </div>
          <p className="text-xs opacity-75">{gameState.score}/100 балів</p>
        </motion.div>
      )}

      {/* Quiz Progress Indicator */}
      {gameState.gamePhase === 'quiz' && (
        <motion.div
          className="absolute bottom-8 left-8 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-3 text-white text-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span>🧠</span>
            <span className="font-medium">Питання:</span>
          </div>
          <div className="w-48 bg-gray-700 rounded-full h-2 mb-1">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(gameState.correctAnswers / 4) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs opacity-75">{gameState.correctAnswers}/4 правильно</p>
          <p className="text-xs opacity-75">Поточне: {gameState.currentQuestion + 1}</p>
        </motion.div>
      )}
      <motion.button
        onClick={() => {
          const patterns = ['circular', 'figure8', 'random', 'patrol'] as const
          const currentIndex = patterns.indexOf(animationStateRef.current.swimPattern)
          const nextIndex = (currentIndex + 1) % patterns.length
          const nextPattern = patterns[nextIndex]
          animationStateRef.current.swimPattern = nextPattern
          animationStateRef.current.patternProgress = 0
          setGameState(prev => ({ ...prev, currentSwimPattern: nextPattern }))
          
          if (audioEnabled) {
            playClickSound({ volume: 0.3, playbackRate: 1.3 })
          }
        }}
        className="absolute top-44 left-8 bg-white/10 backdrop-blur-sm rounded-full p-3 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.8 }}
        transition={{ delay: 3 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
          <path d="M19 15L20.09 18.26L24 19L20.09 19.74L19 23L17.91 19.74L14 19L17.91 18.26L19 15Z"/>
          <path d="M5 15L6.09 18.26L10 19L6.09 19.74L5 23L3.91 19.74L0 19L3.91 18.26L5 15Z"/>
        </svg>
      </motion.button>

      {/* Swimming pattern indicator */}
      <motion.div
        className="absolute top-56 left-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm pointer-events-none"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : -10 }}
        transition={{ delay: 3.5 }}
      >
        Патерн: {gameState.currentSwimPattern === 'circular' ? '🔄 Коло' :
                 gameState.currentSwimPattern === 'figure8' ? '∞ Вісімка' :
                 gameState.currentSwimPattern === 'random' ? '🎲 Випадково' :
                 '🚶 Патруль'}
      </motion.div>

      {/* Audio toggle button */}
      <motion.button
        onClick={async () => {
          if (!audioEnabled) {
            await resumeAudioContext()
            setAudioEnabled(true)
            playClickSound({ volume: 0.3 })
          } else {
            setAudioEnabled(false)
            if (ambientSoundRef.current) {
              ambientSoundRef.current.stop()
              ambientSoundRef.current = null
            }
          }
        }}
        className="absolute top-32 right-8 bg-white/10 backdrop-blur-sm rounded-full p-3 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.8 }}
        transition={{ delay: 2.5 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {audioEnabled ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        )}
      </motion.button>

      {/* Audio indicator tooltip */}
      <motion.div
        className="absolute top-44 right-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm pointer-events-none"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: audioEnabled ? 0 : 1, y: audioEnabled ? -10 : 0 }}
        transition={{ delay: 3 }}
      >
        Натисніть для увімкнення звуку
      </motion.div>

      {/* Admin Panel Access Button */}
      <motion.button
        onClick={() => setShowAdminPanel(true)}
        className="absolute bottom-44 right-8 bg-purple-500/80 hover:bg-purple-600/90 backdrop-blur-sm rounded-full p-3 border border-purple-300/50 text-white transition-all duration-300 hover:scale-105 shadow-lg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.8 }}
        transition={{ delay: 5 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </motion.button>

      {/* Enhanced hover effect indicator */}
      {isHovered && isLoaded && !menuVisible && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="w-96 h-96 border-2 border-white/40 rounded-full animate-pulse">
            <div className="w-80 h-80 border border-white/20 rounded-full m-8 animate-ping"></div>
            <div className="w-64 h-64 border border-white/10 rounded-full m-16"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="text-white text-center bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
                <p className="text-sm font-medium">🎮 ChefBot-2000 Робот-Креветка</p>
                <p className="text-xs opacity-75 mt-1">Клік для активації • Подвійний клік для годування</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Background click hints with game elements */}
      {!menuVisible && isLoaded && (
        <motion.div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0 : 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-20 left-20 text-white/60 text-center">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
              <p className="text-xs">🌊 Клік для входу</p>
            </div>
          </div>
          <div className="absolute top-32 right-32 text-white/60 text-center">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
              <p className="text-xs">🎯 Вхід на сайт</p>
            </div>
          </div>
          <div className="absolute bottom-32 left-20 text-white/60 text-center">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
              <p className="text-xs">🍽️ Подвійний клік</p>
            </div>
          </div>
          <div className="absolute bottom-20 right-32 text-white/60 text-center">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
              <p className="text-xs">{gameState.gamePhase === 'exploring' ? '🤖 ChefBot-2000' : '🎮 Робот-креветка'}</p>
            </div>
          </div>
          <div className="absolute bottom-32 right-20 text-white/60 text-center">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
              <p className="text-xs">⚙️ ChefBot-2000 ШІ</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Game achievement notifications */}
      {gameState.interactionCount > 0 && gameState.interactionCount % 5 === 0 && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="bg-yellow-500/90 backdrop-blur-sm rounded-lg px-6 py-4 border-2 border-yellow-300 text-black text-center">
            <p className="text-lg font-bold">🏆 Досягнення!</p>
            <p className="text-sm mt-1">{gameState.interactionCount} взаємодій з креветкою!</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}