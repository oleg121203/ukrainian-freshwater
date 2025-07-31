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
  const [gameState, setGameState] = useState({
    prawnMood: 'calm', // 'calm', 'excited', 'swimming', 'feeding'
    interactionCount: 0,
    isFeeding: false,
    isSwimming: false,
    currentSwimPattern: 'circular' as 'circular' | 'figure8' | 'random' | 'patrol'
  })
  
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

    // Advanced materials with realistic textures
    const createPrawnMaterial = (baseColor: number, roughness = 0.3, metalness = 0.1) => {
      return new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness,
        metalness,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide
      })
    }

    // Main body segments (realistic Macrobrachium anatomy)
    const bodySegments: THREE.Mesh[] = []
    
    // Cephalothorax (head-chest region)
    const cephalothoraxGeometry = new THREE.SphereGeometry(0.5, 16, 12)
    cephalothoraxGeometry.scale(1.2, 0.8, 1.4) // More elongated and realistic
    const cephalothoraxMaterial = createPrawnMaterial(0xc77541, 0.4, 0.2)
    const cephalothorax = new THREE.Mesh(cephalothoraxGeometry, cephalothoraxMaterial)
    cephalothorax.position.set(0, 0, 0.3)
    cephalothorax.castShadow = true
    cephalothorax.receiveShadow = true
    prawnGroup.add(cephalothorax)
    bodySegments.push(cephalothorax)

    // Abdomen segments (6 segments like real prawns)
    for (let i = 0; i < 6; i++) {
      const scale = 1 - (i * 0.12) // Gradually smaller towards tail
      const segmentGeometry = new THREE.CylinderGeometry(0.25 * scale, 0.3 * scale, 0.35, 12)
      const segmentMaterial = createPrawnMaterial(0xb86b37 - (i * 0x0a0a0a), 0.35, 0.15)
      const segment = new THREE.Mesh(segmentGeometry, segmentMaterial)
      segment.position.set(0, 0, -0.4 - (i * 0.4))
      segment.rotation.x = Math.PI / 2
      segment.castShadow = true
      segment.receiveShadow = true
      prawnGroup.add(segment)
      bodySegments.push(segment)
    }

    // Rostrum (pointed beak-like projection)
    const rostrumGeometry = new THREE.ConeGeometry(0.1, 0.4, 8)
    const rostrumMaterial = createPrawnMaterial(0xd4844a, 0.2, 0.3)
    const rostrum = new THREE.Mesh(rostrumGeometry, rostrumMaterial)
    rostrum.position.set(0, 0.2, 0.9)
    rostrum.rotation.x = Math.PI / 2
    rostrum.castShadow = true
    prawnGroup.add(rostrum)

    // Eyes (compound eyes on stalks)
    const eyeStalkGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.2, 8)
    const eyeGeometry = new THREE.SphereGeometry(0.12, 12, 8)
    const eyeStalkMaterial = createPrawnMaterial(0xff9966, 0.6, 0.1)
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x221100,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.9
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

    // Long antennae (characteristic of Macrobrachium)
    const antennaeSegments: THREE.Mesh[] = []
    for (let side = 0; side < 2; side++) {
      const xPos = side === 0 ? -0.15 : 0.15
      for (let i = 0; i < 8; i++) {
        const segmentLength = 0.3 - (i * 0.02)
        const segmentRadius = 0.015 - (i * 0.001)
        const antennaSegmentGeometry = new THREE.CylinderGeometry(segmentRadius, segmentRadius * 1.2, segmentLength, 6)
        const antennaSegmentMaterial = createPrawnMaterial(0xffaa77, 0.8, 0.05)
        const antennaSegment = new THREE.Mesh(antennaSegmentGeometry, antennaSegmentMaterial)
        
        antennaSegment.position.set(
          xPos + Math.sin(i * 0.2) * 0.1,
          0.4 + (i * segmentLength * 0.8),
          0.8 + Math.cos(i * 0.2) * 0.2
        )
        antennaSegment.rotation.z = (side === 0 ? -0.2 : 0.2) + (i * 0.1)
        antennaSegment.rotation.x = -0.3 + (i * 0.05)
        antennaSegment.castShadow = true
        prawnGroup.add(antennaSegment)
        antennaeSegments.push(antennaSegment)
      }
    }

    // Large claws (chelipeds) - characteristic of male Macrobrachium
    const clawSegments: THREE.Mesh[] = []
    
    // Left claw (larger in males)
    const leftClawBaseGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.6, 10)
    const leftClawBaseMaterial = createPrawnMaterial(0xee5533, 0.3, 0.4)
    const leftClawBase = new THREE.Mesh(leftClawBaseGeometry, leftClawBaseMaterial)
    leftClawBase.position.set(-0.45, 0, 0.4)
    leftClawBase.rotation.z = -0.5
    leftClawBase.rotation.x = Math.PI / 2
    leftClawBase.castShadow = true
    prawnGroup.add(leftClawBase)
    clawSegments.push(leftClawBase)

    const leftClawGeometry = new THREE.SphereGeometry(0.25, 12, 8)
    leftClawGeometry.scale(1.5, 0.8, 1.2)
    const leftClawMaterial = createPrawnMaterial(0xff4422, 0.25, 0.5)
    const leftClaw = new THREE.Mesh(leftClawGeometry, leftClawMaterial)
    leftClaw.position.set(-0.8, 0, 0.5)
    leftClaw.castShadow = true
    prawnGroup.add(leftClaw)
    clawSegments.push(leftClaw)

    // Right claw (smaller)
    const rightClawBase = leftClawBase.clone()
    rightClawBase.position.set(0.45, 0, 0.4)
    rightClawBase.rotation.z = 0.5
    rightClawBase.scale.setScalar(0.8)
    prawnGroup.add(rightClawBase)
    clawSegments.push(rightClawBase)

    const rightClaw = leftClaw.clone()
    rightClaw.position.set(0.7, 0, 0.5)
    rightClaw.scale.setScalar(0.8)
    prawnGroup.add(rightClaw)
    clawSegments.push(rightClaw)

    // Swimming legs (pleopods)
    const swimmingLegs: THREE.Mesh[] = []
    for (let i = 0; i < 5; i++) {
      for (let side = 0; side < 2; side++) {
        const legGeometry = new THREE.PlaneGeometry(0.15, 0.4)
        const legMaterial = new THREE.MeshStandardMaterial({
          color: 0xffccaa,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
          roughness: 0.9
        })
        const leg = new THREE.Mesh(legGeometry, legMaterial)
        leg.position.set(
          side === 0 ? -0.3 : 0.3,
          0,
          -0.2 - (i * 0.3)
        )
        leg.rotation.y = side === 0 ? -0.5 : 0.5
        leg.castShadow = true
        prawnGroup.add(leg)
        swimmingLegs.push(leg)
      }
    }

    // Walking legs
    const walkingLegs: THREE.Mesh[] = []
    for (let i = 0; i < 4; i++) {
      for (let side = 0; side < 2; side++) {
        const legSegments = []
        for (let j = 0; j < 3; j++) {
          const segmentGeometry = new THREE.CylinderGeometry(0.025, 0.03, 0.2, 6)
          const segmentMaterial = createPrawnMaterial(0xdd7744, 0.6, 0.2)
          const segment = new THREE.Mesh(segmentGeometry, segmentMaterial)
          segment.position.set(
            (side === 0 ? -0.4 : 0.4) + (j * 0.15 * (side === 0 ? -1 : 1)),
            -0.2 - (j * 0.1),
            0.2 - (i * 0.2)
          )
          segment.rotation.z = (side === 0 ? -0.7 : 0.7) + (j * 0.3)
          segment.castShadow = true
          prawnGroup.add(segment)
          walkingLegs.push(segment)
          legSegments.push(segment)
        }
      }
    }

    // Tail fan (uropods and telson)
    const tailFanGeometry = new THREE.PlaneGeometry(0.8, 0.6)
    const tailFanMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa88,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      roughness: 0.8
    })
    const tailFan = new THREE.Mesh(tailFanGeometry, tailFanMaterial)
    tailFan.position.set(0, 0, -2.8)
    tailFan.rotation.x = Math.PI / 2
    tailFan.castShadow = true
    prawnGroup.add(tailFan)

    // Store references for animation
    prawnGroup.userData = {
      bodySegments,
      antennaeSegments,
      clawSegments,
      swimmingLegs,
      walkingLegs,
      tailFan,
      leftEye,
      rightEye
    }

    scene.add(prawnGroup)

    // Enhanced underwater lighting
    const ambientLight = new THREE.AmbientLight(0x4488aa, 0.4)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
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
    scene.add(mainLight)

    // Underwater caustic lighting
    const waterLight1 = new THREE.PointLight(0x66ddff, 0.8, 15)
    waterLight1.position.set(-3, 4, 3)
    scene.add(waterLight1)

    const waterLight2 = new THREE.PointLight(0x88ffcc, 0.6, 12)
    waterLight2.position.set(4, -2, 4)
    scene.add(waterLight2)

    // Rim lighting
    const rimLight = new THREE.DirectionalLight(0xaaeeff, 0.5)
    rimLight.position.set(-8, 2, -5)
    scene.add(rimLight)

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
          rightEye
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
          tailFan.rotation.y = tailMovement + swimThrustMovement
          tailFan.material.opacity = 0.7 + Math.sin(time * 2) * 0.1
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

        // Mood-based overall scaling
        const moodScale = gameState.prawnMood === 'excited' ? 1.05 : 
                          gameState.prawnMood === 'swimming' ? 1.02 : 1
        const breathingScale = 1 + Math.sin(time * 3) * 0.02 * animationStateRef.current.breathingIntensity
        prawnGroupRef.current.scale.setScalar(moodScale * breathingScale)

        // Reactive lighting based on swimming activity
        if (scene.children.find(child => child.type === 'PointLight')) {
          const lights = scene.children.filter(child => child.type === 'PointLight') as THREE.PointLight[]
          lights.forEach((light, index) => {
            const baseIntensity = gameState.prawnMood === 'excited' ? 0.8 : 
                                 gameState.prawnMood === 'swimming' ? 0.7 : 0.6
            light.intensity = baseIntensity + Math.sin(time * 2 + index) * 0.1 * animationStateRef.current.swimIntensity
          })
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
  }, [audioEnabled, playRippleSound, playAmbientSound, gameState.prawnMood])

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
        <p className="text-lg opacity-75">Macrobrachium rosenbergii</p>
        <p className="text-sm opacity-60 mt-2">Професійна 3D візуалізація</p>
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
            Настрій: {gameState.prawnMood === 'calm' ? '🧘 Спокійний' : 
                     gameState.prawnMood === 'excited' ? '⚡ Збуджений' : 
                     gameState.prawnMood === 'feeding' ? '🍽️ Годування' : 
                     gameState.prawnMood === 'swimming' ? '🏊 Плавання' : '🎮 Інтерактив'}
          </p>
          <p className="text-xs opacity-75 mt-1">Взаємодій: {gameState.interactionCount}</p>
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
            <div className="text-xl font-semibold">Завантаження професійної 3D моделі...</div>
            <div className="text-sm opacity-75 mt-2">Реалістична креветка Macrobrachium rosenbergii</div>
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
          <p className="text-base font-medium">🎮 Інтерактивна креветка</p>
          <p className="text-sm opacity-75 mt-1">
            {menuVisible 
              ? "Натисніть будь-де для входу на сайт"
              : gameState.isSwimming 
                ? "🌊 Креветка плаває автоматично • 🖱️ Рухайте мишкою для керування"
                : "🖱️ Рухайте мишкою • 🎯 Клік = меню • 🌊 Фон = вхід • 🍽️ Подвійний клік = годування"
            }
          </p>
        </div>
      </motion.div>

      {/* Swimming pattern control */}
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
                <p className="text-sm font-medium">🎮 Інтерактивна креветка</p>
                <p className="text-xs opacity-75 mt-1">Клік для меню • Подвійний клік для годування</p>
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
              <p className="text-xs">🎮 Гра з креветкою</p>
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