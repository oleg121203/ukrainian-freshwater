import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudio } from '@/hooks/useAudio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useKV } from '@/hooks/useKV'
import { toast } from 'sonner'

interface PrawnVisualizationProps {
  onMenuToggle: (show: boolean) => void
  menuVisible: boolean
  onNavigateToSite?: () => void
}

interface GameState {
  prawnMood: 'calm' | 'excited' | 'swimming' | 'feeding' | 'cooking' | 'thinking'
  interactionCount: number
  isFeeding: boolean
  isSwimming: boolean
  currentSwimPattern: 'circular' | 'figure8' | 'random' | 'patrol'
  gamePhase: 'exploring' | 'playing' | 'cooking' | 'completed'
  score: number
  correctAnswers: number
  isRobotMode: boolean
  hasAI: boolean
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
  const [threejsError, setThreejsError] = useState<string | null>(null)
  
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
    hasAI: false
  })

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
  
  // Audio hook for sound effects
  const { 
    playBubbleSound, 
    playRippleSound, 
    playClickSound, 
    playSwooshSound,
    playAmbientSound,
    resumeAudioContext 
  } = useAudio()

  // Simple 3D prawn visualization fallback
  const createSimplePrawn = (scene: THREE.Scene) => {
    try {
      const prawnGroup = new THREE.Group()
      
      // Simple body
      const bodyGeometry = new THREE.BoxGeometry(1, 0.5, 2)
      const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xff6666 })
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
      body.position.set(0, 0, 0)
      prawnGroup.add(body)

      // Simple claws
      const clawGeometry = new THREE.SphereGeometry(0.2)
      const clawMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 })
      
      const leftClaw = new THREE.Mesh(clawGeometry, clawMaterial)
      leftClaw.position.set(-0.6, 0, 0.3)
      prawnGroup.add(leftClaw)
      
      const rightClaw = new THREE.Mesh(clawGeometry, clawMaterial)
      rightClaw.position.set(0.6, 0, 0.3)
      prawnGroup.add(rightClaw)

      // Simple tail
      const tailGeometry = new THREE.ConeGeometry(0.3, 0.8)
      const tailMaterial = new THREE.MeshBasicMaterial({ color: 0xff8888 })
      const tail = new THREE.Mesh(tailGeometry, tailMaterial)
      tail.position.set(0, 0, -1.2)
      tail.rotation.x = Math.PI / 2
      prawnGroup.add(tail)

      prawnGroupRef.current = prawnGroup
      scene.add(prawnGroup)
      
      return prawnGroup
    } catch (error) {
      console.error('Failed to create simple prawn:', error)
      throw error
    }
  }

  useEffect(() => {
    if (!mountRef.current) return

    let mounted = true
    let scene: THREE.Scene | null = null
    let renderer: THREE.WebGLRenderer | null = null
    let camera: THREE.PerspectiveCamera | null = null
    let animationFrame: number | null = null

    const initializeScene = async () => {
      try {
        // Check WebGL support
        if (!window.WebGLRenderingContext) {
          throw new Error('WebGL is not supported in this browser')
        }

        // Scene setup
        scene = new THREE.Scene()
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        
        try {
          renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
          })
        } catch (error) {
          console.warn('High-performance WebGL not available, using fallback:', error)
          renderer = new THREE.WebGLRenderer({ 
            antialias: false, 
            alpha: true
          })
        }
        
        if (!renderer) {
          throw new Error('Failed to create WebGL renderer')
        }

        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setClearColor(0x000000, 0)
        
        // Store references
        sceneRef.current = scene
        rendererRef.current = renderer
        
        // Only append if still mounted
        if (mounted && mountRef.current) {
          mountRef.current.appendChild(renderer.domElement)
        }

        // Create simple prawn
        createSimplePrawn(scene)

        // Basic lighting
        const ambientLight = new THREE.AmbientLight(0x4488aa, 0.6)
        scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(5, 5, 5)
        scene.add(directionalLight)

        // Camera position
        camera.position.set(0, 1, 5)
        camera.lookAt(0, 0, 0)

        // Mouse interaction
        const handleMouseMove = (event: MouseEvent) => {
          if (!mounted) return
          const newX = (event.clientX / window.innerWidth) * 2 - 1
          const newY = -(event.clientY / window.innerHeight) * 2 + 1
          
          mouseRef.current.x = newX
          mouseRef.current.y = newY
          
          if (audioEnabled && Math.random() < 0.01) {
            playRippleSound({ volume: 0.1, playbackRate: 0.8 + Math.random() * 0.4 })
          }
        }

        // Animation loop
        const animate = () => {
          if (!mounted || !renderer || !scene || !camera) return
          animationFrame = requestAnimationFrame(animate)

          const time = Date.now() * 0.001

          // Simple prawn animation
          if (prawnGroupRef.current) {
            // Gentle bobbing motion
            prawnGroupRef.current.position.y = Math.sin(time * 2) * 0.2
            prawnGroupRef.current.rotation.y = Math.sin(time) * 0.1
            
            // React to mouse
            const targetRotationY = mouseRef.current.x * Math.PI * 0.2
            const targetRotationX = mouseRef.current.y * Math.PI * 0.1
            
            prawnGroupRef.current.rotation.y += (targetRotationY - prawnGroupRef.current.rotation.y) * 0.05
            prawnGroupRef.current.rotation.x += (targetRotationX - prawnGroupRef.current.rotation.x) * 0.05
          }

          renderer.render(scene, camera)
        }

        // Resize handler
        const handleResize = () => {
          if (!mounted || !renderer || !camera) return
          camera.aspect = window.innerWidth / window.innerHeight
          camera.updateProjectionMatrix()
          renderer.setSize(window.innerWidth, window.innerHeight)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('resize', handleResize)

        // Start animation
        animate()
        
        if (mounted) {
          setIsLoaded(true)
          setThreejsError(null)
        }

        // Store cleanup function
        return () => {
          window.removeEventListener('mousemove', handleMouseMove)
          window.removeEventListener('resize', handleResize)
          if (animationFrame) {
            cancelAnimationFrame(animationFrame)
          }
          if (renderer && renderer.domElement && mountRef.current?.contains(renderer.domElement)) {
            try {
              mountRef.current.removeChild(renderer.domElement)
            } catch (e) {
              console.warn('Failed to remove renderer element:', e)
            }
          }
          if (renderer) {
            try {
              renderer.dispose()
            } catch (e) {
              console.warn('Failed to dispose renderer:', e)
            }
          }
        }

      } catch (error) {
        console.error('Failed to initialize 3D scene:', error)
        setThreejsError(error instanceof Error ? error.message : 'Unknown 3D error')
        if (mounted) {
          setIsLoaded(true) // Still show as loaded to prevent infinite loading
        }
        return () => {} // Return empty cleanup function
      }
    }

    // Initialize scene
    initializeScene().then(cleanup => {
      if (cleanup) {
        // Store cleanup for later use
        return cleanup
      }
    }).catch(error => {
      console.error('Scene initialization failed:', error)
      setThreejsError(error instanceof Error ? error.message : 'Failed to load 3D scene')
      if (mounted) {
        setIsLoaded(true)
      }
    })

    // Cleanup on unmount
    return () => {
      mounted = false
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
      if (ambientSoundRef.current) {
        try {
          ambientSoundRef.current.stop()
        } catch (e) {
          console.warn('Failed to stop ambient sound:', e)
        }
      }
    }
  }, [audioEnabled, playRippleSound])

  // Game functions (simplified)
  const startCookingGame = () => {
    if (!audioEnabled) return
    
    setGameState(prev => ({ 
      ...prev, 
      gamePhase: 'playing', 
      prawnMood: 'thinking',
      isRobotMode: true,
      hasAI: !!geminiApiKey
    }))
    
    const randomQuestion = cookingQuestions[Math.floor(Math.random() * cookingQuestions.length)]
    setGameQuestion(randomQuestion.question)
    setGameOptions([...randomQuestion.options].sort(() => Math.random() - 0.5))
    setCorrectAnswer(randomQuestion.correct)
    setUserAnswer('')
    setShowGameUI(true)
    
    playClickSound({ volume: 0.5, playbackRate: 1.3 })
    toast.success("🤖 РобоКреветка-Кухар ChefBot-2000 активована!")
  }

  const handleAnswerSubmit = (answer: string) => {
    setUserAnswer(answer)
    
    if (answer === correctAnswer) {
      setGameState(prev => ({ 
        ...prev, 
        score: prev.score + 10,
        correctAnswers: prev.correctAnswers + 1,
        prawnMood: 'excited'
      }))
      playBubbleSound({ volume: 0.6, playbackRate: 1.5 })
      toast.success("🎉 Правильно! ChefBot-2000 схвалює! +10 балів")
      
      if (gameState.correctAnswers + 1 >= 3) {
        setTimeout(() => {
          setGameState(prev => ({ 
            ...prev, 
            gamePhase: 'cooking',
            prawnMood: 'cooking'
          }))
          setShowGameUI(false)
          setShowRecipeGenerator(true)
          toast.success("🏆 Ви виграли! ChefBot-2000 активує ШІ-кухаря!")
        }, 2000)
      } else {
        setTimeout(() => {
          const randomQuestion = cookingQuestions[Math.floor(Math.random() * cookingQuestions.length)]
          setGameQuestion(randomQuestion.question)
          setGameOptions([...randomQuestion.options].sort(() => Math.random() - 0.5))
          setCorrectAnswer(randomQuestion.correct)
          setUserAnswer('')
        }, 2000)
      }
    } else {
      setGameState(prev => ({ ...prev, prawnMood: 'calm' }))
      playRippleSound({ volume: 0.4, playbackRate: 0.8 })
      toast.error("❌ Неправильно. ChefBot-2000 вчить вас кулінарії!")
      
      setTimeout(() => {
        setUserAnswer('')
      }, 1500)
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
      const updatedRecipes = [...recipes, { ...generatedRecipe, authorName: userName, authorEmail: userEmail }]
      setRecipes(updatedRecipes)
      
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
        prawnMood: 'calm'
      }))
      
    } catch (error) {
      console.error('Error saving recipe:', error)
      toast.error("Помилка при збереженні рецепту")
    }
  }

  const handleClick = async (event: React.MouseEvent) => {
    // Enable audio on first user interaction
    if (!audioEnabled) {
      await resumeAudioContext()
      setAudioEnabled(true)
    }

    // Prawn interaction
    setGameState(prev => ({
      ...prev,
      interactionCount: prev.interactionCount + 1,
      prawnMood: 'excited',
      isFeeding: true
    }))

    setTimeout(() => {
      setGameState(prev => ({ ...prev, isFeeding: false, prawnMood: 'calm' }))
    }, 2000)

    // Check if the menu is visible
    if (menuVisible) {
      playSwooshSound({ volume: 0.3, playbackRate: 1.1 })
      onNavigateToSite?.()
      return
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
    
    if (distance < 250) {
      playClickSound({ volume: 0.5, playbackRate: 1.2 })
      playBubbleSound({ volume: 0.4, playbackRate: 1 + Math.random() * 0.3 })
      onMenuToggle(!menuVisible)
    } else {
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

  if (threejsError) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-gradient-aqua flex items-center justify-center">
        <div className="text-white text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🦐</div>
          <h2 className="text-2xl font-bold mb-4">AquaFarm 3D Visualizer</h2>
          <p className="text-lg mb-4">3D підтримка недоступна в цьому браузері</p>
          <p className="text-sm opacity-75 mb-6">{threejsError}</p>
          <Button 
            onClick={() => onNavigateToSite?.()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Продовжити до сайту →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-aqua">
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      
      {/* Logo overlay */}
      <div className="absolute top-8 left-8 text-white pointer-events-none">
        <h1 className="text-4xl font-bold heading-font">AquaFarm</h1>
        <div className="text-lg opacity-75">Macrobrachium rosenbergii</div>
        <p className="text-sm opacity-60 mt-2">3D візуалізація</p>
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
              gameState.prawnMood === 'thinking' ? '🧠 Аналізує дані' : '🎮 Інтерактив'
            }
          </p>
          <p className="text-xs opacity-75 mt-1">Взаємодій: {gameState.interactionCount}</p>
          {gameState.gamePhase !== 'exploring' && (
            <p className="text-xs text-green-300 mt-1">
              🎯 Рахунок: {gameState.score} | 🎪 Фаза: {
                gameState.gamePhase === 'playing' ? 'Гра' :
                gameState.gamePhase === 'cooking' ? 'Готування' :
                gameState.gamePhase === 'completed' ? 'Завершено' : 'Дослідження'
              }
            </p>
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
          <span>ChefBot-2000 Кулінарна Гра</span>
        </motion.button>
      )}

      {/* Game UI and other components remain the same */}
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
                  Рахунок: {gameState.score} | Правильних відповідей: {gameState.correctAnswers}/3
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
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
                          : "❌ Неправильно. ChefBot-2000: 'Мої датабази містять правильну відповідь. Давайте вчитися разом!'"
                        }
                      </p>
                    </motion.div>
                  )}
                </div>
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

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-aqua/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
            <div className="text-xl font-semibold">Завантаження 3D моделі...</div>
            <div className="text-sm opacity-75 mt-2">Креветка Macrobrachium rosenbergii</div>
          </div>
        </div>
      )}

      {/* Enter site hint */}
      {!menuVisible && isLoaded && (
        <motion.div
          className="absolute bottom-8 right-8 text-white/80 text-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.5 }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <p className="text-sm font-medium">Натисніть для входу →</p>
          </div>
        </motion.div>
      )}

      {/* Interaction guide */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/90 text-center pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
        transition={{ delay: 1.5 }}
      >
        <div className="bg-black/20 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/20 max-w-md">
          <p className="text-base font-medium">
            {gameState.isRobotMode ? '🤖 ChefBot-2000 Робот-Креветка' : '🎮 3D креветка'}
          </p>
          <p className="text-sm opacity-75 mt-1">
            {menuVisible 
              ? "Натисніть будь-де для входу на сайт"
              : gameState.gamePhase === 'playing'
                ? "🧠 ChefBot-2000 тестує ваші кулінарні знання"
                : "🤖 Активувати ChefBot • 🖱️ Керування • 🎯 Клік = меню"
            }
          </p>
        </div>
      </motion.div>
    </div>
  )
}