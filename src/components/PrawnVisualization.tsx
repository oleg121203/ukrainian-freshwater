import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { useAudio } from '@/hooks/useAudio'

interface PrawnVisualizationProps {
  onMenuToggle: (show: boolean) => void
  menuVisible: boolean
  onNavigateToSite?: () => void
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
    
    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0) // Transparent background
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    
    sceneRef.current = scene
    rendererRef.current = renderer
    
    // Only append if still mounted
    if (mounted && mountRef.current) {
      mountRef.current.appendChild(renderer.domElement)
    }

    // Create prawn geometry - stylized using basic shapes
    const prawnGroup = new THREE.Group()
    prawnGroupRef.current = prawnGroup

    // Prawn body (main body)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2, 8)
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff6b47,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.castShadow = true
    prawnGroup.add(body)

    // Prawn head
    const headGeometry = new THREE.SphereGeometry(0.4, 8, 6)
    const headMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff8566,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.set(0, 1.2, 0)
    head.castShadow = true
    prawnGroup.add(head)

    // Prawn tail segments
    for (let i = 0; i < 5; i++) {
      const segmentGeometry = new THREE.CylinderGeometry(0.25 - i * 0.03, 0.3 - i * 0.03, 0.3, 6)
      const segmentMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff4a2b,
        shininess: 100,
        transparent: true,
        opacity: 0.8
      })
      const segment = new THREE.Mesh(segmentGeometry, segmentMaterial)
      segment.position.set(0, -1.2 - i * 0.35, 0)
      segment.castShadow = true
      prawnGroup.add(segment)
    }

    // Antennae
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.01, 1.5, 4)
    const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0xff9977 })
    
    const leftAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial)
    leftAntenna.position.set(-0.2, 1.8, 0.2)
    leftAntenna.rotation.z = -0.3
    prawnGroup.add(leftAntenna)
    
    const rightAntenna = new THREE.Mesh(antennaGeometry, antennaMaterial)
    rightAntenna.position.set(0.2, 1.8, 0.2)
    rightAntenna.rotation.z = 0.3
    prawnGroup.add(rightAntenna)

    // Claws
    const clawGeometry = new THREE.SphereGeometry(0.15, 6, 4)
    const clawMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff3311,
      shininess: 150
    })
    
    const leftClaw = new THREE.Mesh(clawGeometry, clawMaterial)
    leftClaw.position.set(-0.6, 0.5, 0.3)
    leftClaw.castShadow = true
    prawnGroup.add(leftClaw)
    
    const rightClaw = new THREE.Mesh(clawGeometry, clawMaterial)
    rightClaw.position.set(0.6, 0.5, 0.3)
    rightClaw.castShadow = true
    prawnGroup.add(rightClaw)

    // Swimming legs (simplified)
    for (let i = 0; i < 6; i++) {
      const legGeometry = new THREE.CylinderGeometry(0.03, 0.02, 0.4, 4)
      const legMaterial = new THREE.MeshPhongMaterial({ color: 0xff7755 })
      
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
      leftLeg.position.set(-0.4, 0.2 - i * 0.2, 0.2)
      leftLeg.rotation.z = -0.5
      prawnGroup.add(leftLeg)
      
      const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
      rightLeg.position.set(0.4, 0.2 - i * 0.2, 0.2)
      rightLeg.rotation.z = 0.5
      prawnGroup.add(rightLeg)
    }

    scene.add(prawnGroup)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0x66ccff, 0.4, 20)
    pointLight.position.set(-5, 5, 5)
    scene.add(pointLight)

    // Camera position
    camera.position.set(0, 0, 6)
    camera.lookAt(0, 0, 0)

    // Mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      if (!mounted) return
      const newX = (event.clientX / window.innerWidth) * 2 - 1
      const newY = -(event.clientY / window.innerHeight) * 2 + 1
      
      // Play ripple sound on significant mouse movement when audio is enabled
      if (audioEnabled && (Math.abs(newX - mouseRef.current.x) > 0.1 || Math.abs(newY - mouseRef.current.y) > 0.1)) {
        playRippleSound({ volume: 0.1, playbackRate: 0.8 + Math.random() * 0.4 })
      }
      
      mouseRef.current.x = newX
      mouseRef.current.y = newY
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Animation loop
    const animate = () => {
      if (!mounted) return
      frameRef.current = requestAnimationFrame(animate)

      if (prawnGroupRef.current) {
        // Smooth rotation based on mouse position
        const targetRotationY = mouseRef.current.x * Math.PI * 0.3
        const targetRotationX = mouseRef.current.y * Math.PI * 0.2
        
        prawnGroupRef.current.rotation.y += (targetRotationY - prawnGroupRef.current.rotation.y) * 0.05
        prawnGroupRef.current.rotation.x += (targetRotationX - prawnGroupRef.current.rotation.x) * 0.05
        
        // Gentle floating animation
        prawnGroupRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.3
        
        // Subtle breathing scale
        const breathScale = 1 + Math.sin(Date.now() * 0.002) * 0.05
        prawnGroupRef.current.scale.setScalar(breathScale)
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
      if (ambientSoundRef.current) {
        ambientSoundRef.current.stop()
      }
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [audioEnabled, playRippleSound, playAmbientSound])

  const handleClick = async (event: React.MouseEvent) => {
    // Enable audio on first user interaction
    if (!audioEnabled) {
      await resumeAudioContext()
      setAudioEnabled(true)
    }

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
    
    if (distance < 200) { // Increased detection area
      // Click on prawn - toggle menu
      playClickSound({ volume: 0.5, playbackRate: 1.2 })
      playBubbleSound({ volume: 0.4, playbackRate: 1 + Math.random() * 0.3 })
      onMenuToggle(!menuVisible)
    } else {
      // Click on background - navigate to main site
      playSwooshSound({ volume: 0.3, playbackRate: 1.1 })
      onNavigateToSite?.()
    }
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (audioEnabled) {
      playBubbleSound({ volume: 0.2, playbackRate: 1.5 })
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
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
        <p className="text-lg opacity-75">Macrobrachium rosenbergii</p>
      </div>
      
      {/* Enter site hint - only show when menu is NOT visible */}
      {!menuVisible && isLoaded && (
        <motion.div
          className="absolute top-8 right-8 text-white/80 text-center pointer-events-none"
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
            <div className="text-xl font-semibold">Завантаження 3D моделі...</div>
          </div>
        </div>
      )}
      
      {/* Interaction hint */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/90 text-center pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
        transition={{ delay: 1.5 }}
      >
        <div className="bg-black/20 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/20">
          <p className="text-base font-medium">Рухайте мишкою для обертання креветки</p>
          <p className="text-sm opacity-75 mt-1">
            {menuVisible 
              ? "Натисніть будь-де для входу на сайт"
              : "Натисніть на креветку для меню • Натисніть на фон для входу на сайт"
            }
          </p>
        </div>
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
        className="absolute top-8 right-20 bg-white/10 backdrop-blur-sm rounded-full p-3 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
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
        className="absolute top-20 right-16 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm pointer-events-none"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: audioEnabled ? 0 : 1, y: audioEnabled ? -10 : 0 }}
        transition={{ delay: 3 }}
      >
        Натисніть для увімкнення звуку
      </motion.div>

      {/* Hover effect indicator */}
      {isHovered && isLoaded && !menuVisible && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="w-80 h-80 border-2 border-white/40 rounded-full animate-pulse">
            <div className="w-64 h-64 border border-white/20 rounded-full m-8 animate-ping"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <p className="text-white text-sm font-medium bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                Натисніть для меню
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Background click hint */}
      {!menuVisible && isLoaded && (
        <motion.div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0 : 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-20 left-20 text-white/60 text-center">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
              <p className="text-xs">Клік для входу</p>
            </div>
          </div>
          <div className="absolute top-20 right-20 text-white/60 text-center">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
              <p className="text-xs">Клік для входу</p>
            </div>
          </div>
          <div className="absolute bottom-20 left-20 text-white/60 text-center">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
              <p className="text-xs">Клік для входу</p>
            </div>
          </div>
          <div className="absolute bottom-20 right-20 text-white/60 text-center">
            <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
              <p className="text-xs">Клік для входу</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}