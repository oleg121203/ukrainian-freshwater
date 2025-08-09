import { useState, useRef, useCallback } from 'react'
import { GameState, TrajectoryPoint, WaveEffect, ParticleEffect, Recipe } from './types'
import { INITIAL_GAME_STATE, COOKING_QUESTIONS } from './constants'
import {
  calculateTrajectoryComplexity,
  calculateNaturalness,
  calculateTrajectoryScore,
  updateComboMultiplier,
  generateParticleEffects,
  generateWaveEffect,
} from './gameUtils'
import { toast } from 'sonner'

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<TrajectoryPoint[]>([])
  const [trajectoryHistory, setTrajectoryHistory] = useState<TrajectoryPoint[][]>([])
  const [waveEffects, setWaveEffects] = useState<WaveEffect[]>([])
  const [particleEffects, setParticleEffects] = useState<ParticleEffect[]>([])
  const [showGameUI, setShowGameUI] = useState(false)
  const [gameQuestion, setGameQuestion] = useState('')
  const [gameOptions, setGameOptions] = useState<string[]>([])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [userAnswer, setUserAnswer] = useState('')
  const [showRecipeGenerator, setShowRecipeGenerator] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null)
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false)
  const [userIngredients, setUserIngredients] = useState('')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [geminiApiKey, setGeminiApiKey] = useState('')

  const isDrawingRef = useRef(false)
  const pathRef = useRef<TrajectoryPoint[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startDrawing = useCallback(
    (x: number, y: number) => {
      if (gameState.gamePhase !== 'trajectory') return

      setIsDrawing(true)
      isDrawingRef.current = true
      const newPath = [{ x, y, timestamp: Date.now() }]
      setCurrentPath(newPath)
      pathRef.current = newPath

      setGameState(prev => ({ ...prev, prawnMood: 'performing' }))
    },
    [gameState.gamePhase]
  )

  const continueDrawing = useCallback(
    (x: number, y: number) => {
      if (!isDrawingRef.current || gameState.gamePhase !== 'trajectory') return

      const newPoint = { x, y, timestamp: Date.now() }
      const newPath = [...pathRef.current, newPoint]
      setCurrentPath(newPath)
      pathRef.current = newPath

      // Generate wave effects
      if (pathRef.current.length % 5 === 0) {
        const waveEffect = generateWaveEffect(x, y)
        setWaveEffects(prev => [...prev, waveEffect])
      }

      // Generate particle effects based on movement speed
      if (pathRef.current.length > 1) {
        const prevPoint = pathRef.current[pathRef.current.length - 2]
        const distance = Math.sqrt((x - prevPoint.x) ** 2 + (y - prevPoint.y) ** 2)
        const timeDiff = newPoint.timestamp - prevPoint.timestamp
        const speed = timeDiff > 0 ? distance / timeDiff : 0

        if (speed > 2) {
          const particles = generateParticleEffects(x, y, speed)
          setParticleEffects(prev => [...prev, ...particles])
        }
      }

      // Draw on canvas
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx && pathRef.current.length > 1) {
          const prev = pathRef.current[pathRef.current.length - 2]
          const curr = pathRef.current[pathRef.current.length - 1]

          ctx.strokeStyle = '#00D4FF'
          ctx.lineWidth = 3
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.globalAlpha = 0.8

          ctx.beginPath()
          ctx.moveTo(prev.x, prev.y)
          ctx.lineTo(curr.x, curr.y)
          ctx.stroke()
        }
      }
    },
    [gameState.gamePhase]
  )

  const finishDrawing = useCallback(() => {
    if (!isDrawingRef.current || gameState.gamePhase !== 'trajectory') return

    setIsDrawing(false)
    isDrawingRef.current = false

    if (pathRef.current.length < 3) {
      // Too short trajectory
      setCurrentPath([])
      pathRef.current = []
      setGameState(prev => ({ ...prev, prawnMood: 'calm' }))
      return
    }

    // Calculate scores
    const complexityScore = calculateTrajectoryComplexity(pathRef.current)
    const naturalnessScore = calculateNaturalness(pathRef.current)

    // Check if movement is too unnatural (kills the prawn)
    if (naturalnessScore < 0.1 && complexityScore > 0.8) {
      setGameState(prev => ({
        ...prev,
        prawnMood: 'dead',
        lives: 0,
        score: 0,
        trajectoryPoints: 0,
        comboCount: 0,
        comboMultiplier: 1,
      }))

      // Clear canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }

      toast.error('💀 Креветка померла від надприродних рухів!')
      setGameState(prev => ({ ...prev, prawnMood: 'calm' }))
      setShowGameUI(false)
      return
    }

    // Calculate final score with combo
    const baseScore = calculateTrajectoryScore(
      complexityScore,
      naturalnessScore,
      pathRef.current.length
    )
    const finalScore = updateCombo(baseScore)
    const newTotalScore = gameState.score + finalScore

    // Update game state
    setGameState(prev => ({
      ...prev,
      score: newTotalScore,
      trajectoryPoints: prev.trajectoryPoints + baseScore,
      prawnMood: 'excited',
    }))

    // Add to trajectory history
    setTrajectoryHistory(prev => [...prev, [...pathRef.current]])

    // Check if score is enough to proceed to quiz
    if (newTotalScore >= 100 && gameState.gamePhase === 'trajectory') {
      setTimeout(() => {
        startQuizPhase()
      }, 1500)
    }

    // Reset path
    setTimeout(() => {
      setCurrentPath([])
      pathRef.current = []
      setGameState(prev => ({ ...prev, prawnMood: 'calm' }))
    }, 1000)
  }, [gameState])

  const updateCombo = useCallback(
    (baseScore: number): number => {
      const now = Date.now()
      const timeSinceLastTrick = now - gameState.lastTrickTime

      let newComboCount = gameState.comboCount
      let newMultiplier = gameState.comboMultiplier

      if (timeSinceLastTrick <= gameState.comboTimeWindow && gameState.comboCount > 0) {
        // Continue combo
        newComboCount = gameState.comboCount + 1
        newMultiplier = updateComboMultiplier(newComboCount)
      } else {
        // Start new combo or reset
        newComboCount = 1
        newMultiplier = 1
      }

      setGameState(prev => ({
        ...prev,
        comboCount: newComboCount,
        comboMultiplier: newMultiplier,
        maxCombo: Math.max(prev.maxCombo, newComboCount),
        lastTrickTime: now,
      }))

      return baseScore * newMultiplier
    },
    [gameState]
  )

  const startQuizPhase = useCallback(() => {
    setGameState(prev => ({ ...prev, gamePhase: 'quiz', prawnMood: 'thinking' }))

    // Load first question
    const question = COOKING_QUESTIONS[0]
    setGameQuestion(question.question)
    setGameOptions([...question.options].sort(() => Math.random() - 0.5))
    setCorrectAnswer(question.correct)
    setUserAnswer('')
    setShowGameUI(true)
  }, [])

  const handleAnswerSubmit = useCallback(
    (answer: string) => {
      setUserAnswer(answer)

      if (answer === correctAnswer) {
        // Correct answer
        const newCorrectAnswers = gameState.correctAnswers + 1
        const newScore = gameState.score + 25

        setGameState(prev => ({
          ...prev,
          correctAnswers: newCorrectAnswers,
          currentQuestion: prev.currentQuestion + 1,
          score: newScore,
          prawnMood: 'excited',
        }))

        if (newCorrectAnswers >= 4) {
          // All questions answered correctly
          setTimeout(() => {
            setGameState(prev => ({ ...prev, gamePhase: 'cooking', prawnMood: 'cooking' }))
            setShowGameUI(false)
            setShowRecipeGenerator(true)
          }, 2000)
        } else {
          // Next question
          setTimeout(() => {
            const nextQuestion = COOKING_QUESTIONS[gameState.currentQuestion + 1]
            setGameQuestion(nextQuestion.question)
            setGameOptions([...nextQuestion.options].sort(() => Math.random() - 0.5))
            setCorrectAnswer(nextQuestion.correct)
            setUserAnswer('')
          }, 2000)
        }
      } else {
        // Wrong answer - game over
        setGameState(prev => ({
          ...prev,
          prawnMood: 'dead',
          lives: 0,
          score: 0,
          correctAnswers: 0,
          trajectoryPoints: 0,
        }))

        setTimeout(() => {
          resetGame()
        }, 3000)
      }
    },
    [correctAnswer, gameState]
  )

  const resetGame = useCallback(() => {
    setGameState(INITIAL_GAME_STATE)
    setTrajectoryHistory([])
    setCurrentPath([])
    pathRef.current = []
    setWaveEffects([])
    setParticleEffects([])
    setShowGameUI(false)
    setUserAnswer('')
    setShowRecipeGenerator(false)
    setGeneratedRecipe(null)

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [])

  const startCookingGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'trajectory',
      isRobotMode: true,
      prawnMood: 'performing',
      score: 0,
      trajectoryPoints: 0,
      correctAnswers: 0,
      comboCount: 0,
      comboMultiplier: 1,
    }))
    setShowGameUI(true)
  }, [])

  return {
    // State
    gameState,
    isDrawing,
    currentPath,
    trajectoryHistory,
    waveEffects,
    particleEffects,
    showGameUI,
    gameQuestion,
    gameOptions,
    correctAnswer,
    userAnswer,
    showRecipeGenerator,
    generatedRecipe,
    isGeneratingRecipe,
    userIngredients,
    userName,
    userEmail,
    recipes,
    showAdminPanel,
    geminiApiKey,

    // Refs
    canvasRef,

    // Actions
    setGameState,
    setShowGameUI,
    setUserAnswer,
    setShowRecipeGenerator,
    setGeneratedRecipe,
    setIsGeneratingRecipe,
    setUserIngredients,
    setUserName,
    setUserEmail,
    setRecipes,
    setShowAdminPanel,
    setGeminiApiKey,
    setWaveEffects,
    setParticleEffects,

    // Game methods
    startDrawing,
    continueDrawing,
    finishDrawing,
    handleAnswerSubmit,
    resetGame,
    startCookingGame,
  }
}
