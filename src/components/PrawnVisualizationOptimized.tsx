import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudio } from '@/hooks/useAudio'
import { Button } from '@/components/ui/button'
import { PrawnVisualizationProps } from './prawn/types'
import { INITIAL_GAME_STATE, SWIM_PATTERNS, AUDIO_CONFIG } from './prawn/constants'
import { useGameLogic } from './prawn/useGameLogic'
import GameUI from './prawn/GameUI'
import { toast } from 'sonner'

export function PrawnVisualization({
  onMenuToggle,
  menuVisible,
  onNavigateToSite,
}: PrawnVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const frameRef = useRef<number | null>(null)
  const prawnGroupRef = useRef<THREE.Group | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const ambientSoundRef = useRef<{ stop: () => void } | null>(null)
  const animationStateRef = useRef({
    time: 0,
    swimPattern: 'circular' as 'circular' | 'figure8' | 'random' | 'patrol',
    patternProgress: 0,
    basePosition: { x: 0, y: 0, z: 0 },
  })

  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [threejsError, setThreejsError] = useState<string | null>(null)

  const { playClickSound, playSwooshSound, playBubbleSound, playRippleSound, resumeAudioContext } =
    useAudio()

  const gameLogic = useGameLogic()

  // Three.js setup
  useEffect(() => {
    if (!mountRef.current || isLoaded) return

    try {
      // Create scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x001133)

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      )
      camera.position.set(0, 0, 5)

      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap

      mountRef.current.appendChild(renderer.domElement)

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
      directionalLight.position.set(5, 5, 5)
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 2048
      directionalLight.shadow.mapSize.height = 2048
      scene.add(directionalLight)

      // Create prawn group
      const prawnGroup = new THREE.Group()

      // Create prawn body (simplified)
      const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2, 12)
      const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0xff4500,
        shininess: 100,
        specular: 0x111111,
      })
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
      body.rotation.z = Math.PI / 2
      body.castShadow = true
      body.receiveShadow = true
      prawnGroup.add(body)

      // Add claws
      const clawGeometry = new THREE.SphereGeometry(0.2, 8, 6)
      const clawMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600 })

      const leftClaw = new THREE.Mesh(clawGeometry, clawMaterial)
      leftClaw.position.set(1.2, 0.3, 0)
      leftClaw.castShadow = true
      prawnGroup.add(leftClaw)

      const rightClaw = new THREE.Mesh(clawGeometry, clawMaterial)
      rightClaw.position.set(1.2, -0.3, 0)
      rightClaw.castShadow = true
      prawnGroup.add(rightClaw)

      // Add eyes
      const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 6)
      const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 })

      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
      leftEye.position.set(0.8, 0.2, 0.3)
      prawnGroup.add(leftEye)

      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
      rightEye.position.set(0.8, -0.2, 0.3)
      prawnGroup.add(rightEye)

      // Add antennae
      const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 4)
      const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0xff8800 })

      const leftAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial)
      leftAntenna.position.set(1, 0.1, 0.2)
      leftAntenna.rotation.z = -Math.PI / 6
      prawnGroup.add(leftAntenna)

      const rightAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial)
      rightAntenna.position.set(1, -0.1, 0.2)
      rightAntenna.rotation.z = Math.PI / 6
      prawnGroup.add(rightAntenna)

      scene.add(prawnGroup)
      prawnGroup.position.set(0, 0, 0)

      // Store references
      sceneRef.current = scene
      rendererRef.current = renderer
      prawnGroupRef.current = prawnGroup

      // Handle resize
      const handleResize = () => {
        if (!renderer || !camera) return

        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }

      window.addEventListener('resize', handleResize)

      // Animation loop
      const animate = () => {
        frameRef.current = requestAnimationFrame(animate)

        if (prawnGroup && gameLogic.gameState.isSwimming) {
          animationStateRef.current.time += 0.016

          // Animate based on swim pattern
          const { swimPattern, time, patternProgress } = animationStateRef.current

          switch (swimPattern) {
            case 'circular':
              prawnGroup.position.x = Math.cos(time) * 2
              prawnGroup.position.y = Math.sin(time) * 2
              prawnGroup.rotation.z = time
              break

            case 'figure8':
              prawnGroup.position.x = Math.sin(time) * 2
              prawnGroup.position.y = Math.sin(time * 2) * 1.5
              prawnGroup.rotation.z = time * 0.5
              break

            case 'random':
              if (Math.random() < 0.02) {
                animationStateRef.current.basePosition = {
                  x: (Math.random() - 0.5) * 4,
                  y: (Math.random() - 0.5) * 4,
                  z: (Math.random() - 0.5) * 2,
                }
              }
              prawnGroup.position.lerp(
                new THREE.Vector3(
                  animationStateRef.current.basePosition.x,
                  animationStateRef.current.basePosition.y,
                  animationStateRef.current.basePosition.z
                ),
                0.02
              )
              break

            case 'patrol': {
              const patrolX = Math.sin(time * 0.5) * 3
              prawnGroup.position.x = patrolX
              prawnGroup.position.y = Math.sin(time * 2) * 0.5
              prawnGroup.rotation.z = Math.sin(time) * 0.3
              break
            }
          }
        }

        // Mouse interaction
        if (prawnGroup && isHovered) {
          const targetRotationY = mouseRef.current.x * 0.5
          const targetRotationX = mouseRef.current.y * 0.3

          prawnGroup.rotation.y += (targetRotationY - prawnGroup.rotation.y) * 0.1
          prawnGroup.rotation.x += (targetRotationX - prawnGroup.rotation.x) * 0.1
        }

        renderer.render(scene, camera)
      }

      animate()
      setIsLoaded(true)

      return () => {
        window.removeEventListener('resize', handleResize)
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current)
        }
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement)
        }
        renderer.dispose()
      }
    } catch (error) {
      console.error('Three.js error:', error)
      setThreejsError(error instanceof Error ? error.message : 'Unknown Three.js error')
    }
  }, [])

  // Handle interactions
  const handleClick = async (event: React.MouseEvent) => {
    if (!audioEnabled) {
      await resumeAudioContext()
      setAudioEnabled(true)
    }

    gameLogic.setGameState(prev => ({
      ...prev,
      interactionCount: prev.interactionCount + 1,
      prawnMood: 'excited',
      isFeeding: true,
    }))

    setTimeout(() => {
      gameLogic.setGameState(prev => ({ ...prev, isFeeding: false, prawnMood: 'calm' }))
    }, 2000)

    if (menuVisible) {
      playSwooshSound({
        volume: AUDIO_CONFIG.volumes.swoosh,
        playbackRate: AUDIO_CONFIG.playbackRates.swoosh,
      })
      onNavigateToSite?.()
      return
    }

    playClickSound({
      volume: AUDIO_CONFIG.volumes.click,
      playbackRate: AUDIO_CONFIG.playbackRates.click,
    })
    onMenuToggle(true)
  }

  const handleDoubleClick = () => {
    gameLogic.setGameState(prev => ({
      ...prev,
      isFeeding: true,
      prawnMood: 'feeding',
      isSwimming: !prev.isSwimming,
    }))

    playBubbleSound({
      volume: AUDIO_CONFIG.volumes.bubble,
      playbackRate: AUDIO_CONFIG.playbackRates.bubble,
    })

    setTimeout(() => {
      gameLogic.setGameState(prev => ({ ...prev, isFeeding: false, prawnMood: 'calm' }))
    }, 3000)
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    mouseRef.current = {
      x: (event.clientX - rect.left - rect.width / 2) / (rect.width / 2),
      y: -(event.clientY - rect.top - rect.height / 2) / (rect.height / 2),
    }
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    gameLogic.setGameState(prev => ({ ...prev, prawnMood: 'excited' }))
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    gameLogic.setGameState(prev => ({ ...prev, prawnMood: 'calm' }))
  }

  // Recipe generation function
  const generateRecipeWithAI = async () => {
    if (!gameLogic.geminiApiKey) {
      toast.error('Потрібно налаштувати Gemini API ключ в панелі адміністратора')
      return
    }

    if (!gameLogic.userIngredients.trim()) {
      toast.error('Введіть інгредієнти для рецепту')
      return
    }

    gameLogic.setIsGeneratingRecipe(true)
    gameLogic.setGameState(prev => ({ ...prev, prawnMood: 'thinking' }))

    try {
      // For demo purposes, use a static recipe
      const recipeData = {
        title: `Креветки Macrobrachium з ${gameLogic.userIngredients}`,
        ingredients: [
          '500г креветок Macrobrachium rosenbergii',
          ...gameLogic.userIngredients.split(',').map(ing => ing.trim()),
          'Сіль та перець за смаком',
          '2 ст.л. оливкової олії',
        ],
        instructions: [
          'Очистіть креветки від панцира',
          `Підготуйте ${gameLogic.userIngredients}`,
          'Розігрійте сковороду з оливковою олією',
          'Обсмажте креветки 3-4 хвилини',
          'Додайте підготовлені інгредієнти',
          'Приправте сіллю та перцем',
          'Подавайте гарячими',
        ],
        cookingTime: '20 хвилин',
        difficulty: 'Середній',
        chef: 'ChefBot-2000',
      }

      const newRecipe = {
        id: Date.now().toString(),
        title: recipeData.title,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        authorName: gameLogic.userName,
        authorEmail: gameLogic.userEmail,
        createdAt: new Date().toISOString(),
        aiGenerated: true,
        chefbotNotes: recipeData.chef,
      }

      gameLogic.setGeneratedRecipe(newRecipe)
      gameLogic.setGameState(prev => ({ ...prev, prawnMood: 'excited', gamePhase: 'completed' }))
      playBubbleSound({
        volume: AUDIO_CONFIG.volumes.success,
        playbackRate: AUDIO_CONFIG.playbackRates.success,
      })
      toast.success('🍽️ ChefBot-2000 створив унікальний рецепт!')
    } catch (error) {
      console.error('Error generating recipe:', error)
      gameLogic.setGameState(prev => ({ ...prev, prawnMood: 'calm' }))
      toast.error('Помилка при створенні рецепту. Перевірте API ключ.')
    } finally {
      gameLogic.setIsGeneratingRecipe(false)
    }
  }

  const saveRecipe = async () => {
    if (!gameLogic.generatedRecipe || !gameLogic.userName.trim() || !gameLogic.userEmail.trim()) {
      toast.error("Заповніть всі поля (ім'я та email)")
      return
    }

    try {
      const updatedRecipes = [
        ...gameLogic.recipes,
        {
          ...gameLogic.generatedRecipe,
          authorName: gameLogic.userName,
          authorEmail: gameLogic.userEmail,
        },
      ]
      gameLogic.setRecipes(updatedRecipes)

      toast.success(`📧 Рецепт збережено та надіслано на ${gameLogic.userEmail}!`)

      // Reset game
      gameLogic.setShowRecipeGenerator(false)
      gameLogic.setGeneratedRecipe(null)
      gameLogic.setUserIngredients('')
      gameLogic.setUserName('')
      gameLogic.setUserEmail('')
      gameLogic.setGameState(prev => ({
        ...prev,
        gamePhase: 'exploring',
        score: 0,
        correctAnswers: 0,
        isRobotMode: false,
        prawnMood: 'calm',
      }))
    } catch (error) {
      console.error('Error saving recipe:', error)
      toast.error('Помилка при збереженні рецепту')
    }
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
        onMouseMove={e => {
          handleMouseMove(e)
          const rect = e.currentTarget.getBoundingClientRect()
          gameLogic.continueDrawing(e.clientX - rect.left, e.clientY - rect.top)
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          gameLogic.startDrawing(e.clientX - rect.left, e.clientY - rect.top)
        }}
        onMouseUp={gameLogic.finishDrawing}
      />

      {/* Canvas for trajectory drawing */}
      {gameLogic.gameState.gamePhase === 'trajectory' && (
        <canvas
          ref={gameLogic.canvasRef}
          className="absolute inset-0 pointer-events-none z-10"
          width={window.innerWidth}
          height={window.innerHeight}
        />
      )}

      {/* Game UI */}
      <GameUI
        gameState={gameLogic.gameState}
        showGameUI={gameLogic.showGameUI}
        gameQuestion={gameLogic.gameQuestion}
        gameOptions={gameLogic.gameOptions}
        correctAnswer={gameLogic.correctAnswer}
        userAnswer={gameLogic.userAnswer}
        showRecipeGenerator={gameLogic.showRecipeGenerator}
        generatedRecipe={gameLogic.generatedRecipe}
        isGeneratingRecipe={gameLogic.isGeneratingRecipe}
        userIngredients={gameLogic.userIngredients}
        userName={gameLogic.userName}
        userEmail={gameLogic.userEmail}
        recipes={gameLogic.recipes}
        showAdminPanel={gameLogic.showAdminPanel}
        geminiApiKey={gameLogic.geminiApiKey}
        trajectoryHistory={gameLogic.trajectoryHistory}
        onAnswerSubmit={gameLogic.handleAnswerSubmit}
        onResetGame={gameLogic.resetGame}
        onSetUserIngredients={gameLogic.setUserIngredients}
        onSetUserName={gameLogic.setUserName}
        onSetUserEmail={gameLogic.setUserEmail}
        onSetShowRecipeGenerator={gameLogic.setShowRecipeGenerator}
        onSetGeneratedRecipe={gameLogic.setGeneratedRecipe}
        onSetShowAdminPanel={gameLogic.setShowAdminPanel}
        onSetGeminiApiKey={gameLogic.setGeminiApiKey}
        onGenerateRecipe={generateRecipeWithAI}
        onSaveRecipe={saveRecipe}
      />

      {/* Status display */}
      <motion.div
        className="absolute top-8 right-8 text-white/90 text-center pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="bg-black/20 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
          <p className="text-sm font-medium">
            {gameLogic.gameState.isRobotMode ? '🤖 ChefBot-2000' : 'Настрій'}:{' '}
            {gameLogic.gameState.prawnMood === 'calm'
              ? '🧘 Спокійний'
              : gameLogic.gameState.prawnMood === 'excited'
                ? '⚡ Збуджений'
                : gameLogic.gameState.prawnMood === 'feeding'
                  ? '🍽️ Годування'
                  : gameLogic.gameState.prawnMood === 'swimming'
                    ? '🏊 Плавання'
                    : gameLogic.gameState.prawnMood === 'cooking'
                      ? '👨‍🍳 Готує рецепт'
                      : gameLogic.gameState.prawnMood === 'thinking'
                        ? '🧠 Аналізує дані'
                        : gameLogic.gameState.prawnMood === 'performing'
                          ? '🎪 Виконує трюк'
                          : gameLogic.gameState.prawnMood === 'dead'
                            ? '💀 Вимкнений'
                            : '🎮 Інтерактив'}
          </p>
          <p className="text-xs opacity-75 mt-1">
            Взаємодій: {gameLogic.gameState.interactionCount}
          </p>
        </div>
      </motion.div>

      {/* ChefBot Game Button */}
      {isLoaded && !menuVisible && gameLogic.gameState.gamePhase === 'exploring' && (
        <motion.button
          onClick={gameLogic.startCookingGame}
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

      {/* Audio toggle */}
      <motion.button
        onClick={async () => {
          if (!audioEnabled) {
            await resumeAudioContext()
            setAudioEnabled(true)
            playClickSound({ volume: AUDIO_CONFIG.volumes.click })
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
        {audioEnabled ? '🔊' : '🔇'}
      </motion.button>

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-aqua/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin w-12 h-12 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
            <div className="text-xl font-semibold">Завантаження фотореалістичної 3D моделі...</div>
            <div className="text-sm opacity-75 mt-2">
              Детальна креветка Macrobrachium rosenbergii
            </div>
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
            <p className="text-sm font-medium">Натисніть тут для входу →</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default PrawnVisualization
