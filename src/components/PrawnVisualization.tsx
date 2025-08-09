import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { useAudio } from '@/hooks/useAudio'
import { Button } from '@/components/ui/button'
import { PrawnVisualizationProps } from './prawn/types'
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
  const waterParticlesRef = useRef<THREE.Points | null>(null)
  const fishRef = useRef<THREE.Group[]>([])
  const plantsRef = useRef<THREE.Group[]>([])

  const animationStateRef = useRef({
    time: 0,
    swimPattern: 'circular' as 'circular' | 'figure8' | 'random' | 'patrol',
    patternProgress: 0,
    basePosition: { x: 0, y: 0, z: 0 },
    targetPosition: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    tailAnimation: 0,
    antennaeAnimation: 0,
    legAnimation: 0,
  })

  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)

  const { playClickSound, playSwooshSound, playBubbleSound, resumeAudioContext } = useAudio()
  const gameLogic = useGameLogic()

  // Create realistic prawn geometry
  const createRealisticPrawn = () => {
    const prawnGroup = new THREE.Group()

    // Main body - curved shrimp-like shape
    const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.25, 1.5, 16)
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: 0xff6b35,
      transparent: true,
      opacity: 0.9,
    })
    
    // Curve the body to look more shrimp-like
    bodyGeometry.translate(0, 0, 0)
    for (let i = 0; i < bodyGeometry.attributes.position.count; i++) {
      const x = bodyGeometry.attributes.position.getX(i)
      const y = bodyGeometry.attributes.position.getY(i)
      const z = bodyGeometry.attributes.position.getZ(i)
      
      // Curve the body
      const curve = Math.sin(y * 0.5) * 0.2
      bodyGeometry.attributes.position.setX(i, x + curve)
      bodyGeometry.attributes.position.setZ(i, z + Math.abs(y) * 0.1)
    }
    bodyGeometry.attributes.position.needsUpdate = true
    bodyGeometry.computeVertexNormals()

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.rotation.z = Math.PI / 2
    body.castShadow = true
    body.receiveShadow = true
    prawnGroup.add(body)

    // Head
    const headGeometry = new THREE.SphereGeometry(0.3, 12, 8)
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xff4500 })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.set(0.8, 0, 0)
    head.scale.set(1, 0.8, 0.7)
    head.castShadow = true
    prawnGroup.add(head)

    // Eyes
    for (let i = 0; i < 2; i++) {
      const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 6)
      const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 })
      const eye = new THREE.Mesh(eyeGeometry, eyeMaterial)
      eye.position.set(0.9, i === 0 ? 0.15 : -0.15, 0.2)
      prawnGroup.add(eye)
    }

    // Antennae (long, flexible)
    for (let i = 0; i < 4; i++) {
      const antennaGroup = new THREE.Group()
      const segments = 8
      
      for (let j = 0; j < segments; j++) {
        const segmentGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6)
        const segmentMaterial = new THREE.MeshLambertMaterial({ color: 0xffaa44 })
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial)
        
        segment.position.set(j * 0.15, 0, 0)
        segment.rotation.z = Math.PI / 2
        antennaGroup.add(segment)
      }
      
      antennaGroup.position.set(1.1, i < 2 ? (i === 0 ? 0.1 : -0.1) : (i === 2 ? 0.2 : -0.2), 0.1)
      antennaGroup.rotation.y = (i < 2 ? 0 : Math.PI / 6) * (i % 2 === 0 ? 1 : -1)
      prawnGroup.add(antennaGroup)
    }

    // Swimming legs (pleopods)
    for (let i = 0; i < 5; i++) {
      for (let side = 0; side < 2; side++) {
        const legGeometry = new THREE.CylinderGeometry(0.02, 0.015, 0.3, 6)
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0xff7755 })
        const leg = new THREE.Mesh(legGeometry, legMaterial)
        
        leg.position.set(-0.3 + i * 0.2, side === 0 ? 0.25 : -0.25, -0.1)
        leg.rotation.z = Math.PI / 2 + (side === 0 ? -0.3 : 0.3)
        leg.userData = { type: 'leg', index: i, side }
        prawnGroup.add(leg)
      }
    }

    // Tail fan (uropods)
    const tailFanGeometry = new THREE.ConeGeometry(0.4, 0.6, 8)
    const tailFanMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xff8866,
      transparent: true,
      opacity: 0.8 
    })
    const tailFan = new THREE.Mesh(tailFanGeometry, tailFanMaterial)
    tailFan.position.set(-1.2, 0, 0)
    tailFan.rotation.z = Math.PI / 2
    tailFan.userData = { type: 'tailFan' }
    prawnGroup.add(tailFan)

    // Claws
    for (let i = 0; i < 2; i++) {
      const clawGroup = new THREE.Group()
      
      // Main claw segment
      const clawGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.1)
      const clawMaterial = new THREE.MeshLambertMaterial({ color: 0xdd3300 })
      const claw = new THREE.Mesh(clawGeometry, clawMaterial)
      clawGroup.add(claw)
      
      // Claw pincers
      const pincerGeometry = new THREE.CylinderGeometry(0.02, 0.04, 0.2, 6)
      const pincerMaterial = new THREE.MeshLambertMaterial({ color: 0xaa2200 })
      
      const pincer1 = new THREE.Mesh(pincerGeometry, pincerMaterial)
      pincer1.position.set(0.2, 0.05, 0)
      pincer1.rotation.z = 0.3
      clawGroup.add(pincer1)
      
      const pincer2 = new THREE.Mesh(pincerGeometry, pincerMaterial)
      pincer2.position.set(0.2, -0.05, 0)
      pincer2.rotation.z = -0.3
      clawGroup.add(pincer2)
      
      clawGroup.position.set(0.6, i === 0 ? 0.3 : -0.3, 0)
      clawGroup.userData = { type: 'claw', index: i }
      prawnGroup.add(clawGroup)
    }

    return prawnGroup
  }

  // Create realistic pond environment
  const createPondEnvironment = (scene: THREE.Scene) => {
    // Water surface effect
    const waterGeometry = new THREE.PlaneGeometry(20, 20, 50, 50)
    const waterMaterial = new THREE.MeshLambertMaterial({
      color: 0x006699,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    })
    
    // Animate water surface
    const vertices = waterGeometry.attributes.position
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i)
      const y = vertices.getY(i)
      const wave = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.1
      vertices.setZ(i, wave)
    }
    vertices.needsUpdate = true

    const water = new THREE.Mesh(waterGeometry, waterMaterial)
    water.rotation.x = -Math.PI / 2
    water.position.y = 2
    scene.add(water)

    // Pond bottom
    const bottomGeometry = new THREE.PlaneGeometry(18, 18)
    const bottomMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8B4513,
      map: createSandTexture(),
    })
    const bottom = new THREE.Mesh(bottomGeometry, bottomMaterial)
    bottom.rotation.x = -Math.PI / 2
    bottom.position.y = -3
    bottom.receiveShadow = true
    scene.add(bottom)

    // Rocks on bottom
    for (let i = 0; i < 15; i++) {
      const rockGeometry = new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.3)
      const rockMaterial = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color().setHSL(0.1, 0.3, 0.3 + Math.random() * 0.3)
      })
      const rock = new THREE.Mesh(rockGeometry, rockMaterial)
      rock.position.set(
        (Math.random() - 0.5) * 16,
        -2.8 + Math.random() * 0.3,
        (Math.random() - 0.5) * 16
      )
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
      rock.castShadow = true
      scene.add(rock)
    }

    // Aquatic plants
    for (let i = 0; i < 10; i++) {
      const plantGroup = new THREE.Group()
      const stemHeight = 1 + Math.random() * 2
      
      // Plant stem
      const stemGeometry = new THREE.CylinderGeometry(0.02, 0.04, stemHeight, 6)
      const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5a27 })
      const stem = new THREE.Mesh(stemGeometry, stemMaterial)
      stem.position.y = stemHeight / 2
      plantGroup.add(stem)
      
      // Leaves
      for (let j = 0; j < 3 + Math.random() * 4; j++) {
        const leafGeometry = new THREE.PlaneGeometry(0.3, 0.6)
        const leafMaterial = new THREE.MeshLambertMaterial({ 
          color: new THREE.Color().setHSL(0.3, 0.7, 0.3 + Math.random() * 0.3),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        })
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial)
        leaf.position.set(
          (Math.random() - 0.5) * 0.4,
          stemHeight * (0.3 + Math.random() * 0.7),
          (Math.random() - 0.5) * 0.4
        )
        leaf.rotation.y = Math.random() * Math.PI * 2
        leaf.rotation.z = (Math.random() - 0.5) * 0.5
        plantGroup.add(leaf)
      }
      
      plantGroup.position.set(
        (Math.random() - 0.5) * 14,
        -3,
        (Math.random() - 0.5) * 14
      )
      plantsRef.current.push(plantGroup)
      scene.add(plantGroup)
    }

    // Floating particles (debris, plankton)
    const particleCount = 200
    const particleGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20
      positions[i + 1] = (Math.random() - 0.5) * 6
      positions[i + 2] = (Math.random() - 0.5) * 20
      
      colors[i] = 0.8 + Math.random() * 0.2
      colors[i + 1] = 0.9 + Math.random() * 0.1
      colors[i + 2] = 0.7 + Math.random() * 0.3
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    })
    
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    waterParticlesRef.current = particles
    scene.add(particles)

    // Small fish
    for (let i = 0; i < 5; i++) {
      const fishGroup = new THREE.Group()
      
      const fishBodyGeometry = new THREE.CapsuleGeometry(0.05, 0.2, 4, 8)
      const fishBodyMaterial = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5)
      })
      const fishBody = new THREE.Mesh(fishBodyGeometry, fishBodyMaterial)
      fishGroup.add(fishBody)
      
      // Fish tail
      const tailGeometry = new THREE.ConeGeometry(0.08, 0.15, 6)
      const tailMaterial = new THREE.MeshLambertMaterial({ 
        color: fishBodyMaterial.color.clone().multiplyScalar(0.8)
      })
      const tail = new THREE.Mesh(tailGeometry, tailMaterial)
      tail.position.set(-0.15, 0, 0)
      tail.rotation.z = Math.PI / 2
      fishGroup.add(tail)
      
      fishGroup.position.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 15
      )
      fishGroup.userData = { 
        swimDirection: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.02
        ),
        turnTimer: Math.random() * 300
      }
      
      fishRef.current.push(fishGroup)
      scene.add(fishGroup)
    }

    // Bubble effects
    setInterval(() => {
      createBubble(scene)
    }, 2000 + Math.random() * 3000)
  }

  // Create sand texture
  const createSandTexture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    
    // Base sand color
    ctx.fillStyle = '#D2B48C'
    ctx.fillRect(0, 0, 256, 256)
    
    // Add sand grain texture
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 256
      const size = Math.random() * 3
      const opacity = Math.random() * 0.5
      
      ctx.fillStyle = `rgba(${139 + Math.random() * 50}, ${69 + Math.random() * 50}, ${19 + Math.random() * 50}, ${opacity})`
      ctx.fillRect(x, y, size, size)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 4)
    return texture
  }

  // Create bubble effect
  const createBubble = (scene: THREE.Scene) => {
    const bubbleGeometry = new THREE.SphereGeometry(0.02 + Math.random() * 0.05, 8, 6)
    const bubbleMaterial = new THREE.MeshLambertMaterial({
      color: 0xaaaaff,
      transparent: true,
      opacity: 0.3,
    })
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial)
    
    bubble.position.set(
      (Math.random() - 0.5) * 10,
      -2,
      (Math.random() - 0.5) * 10
    )
    
    scene.add(bubble)
    
    // Animate bubble rising
    const animateBubble = () => {
      bubble.position.y += 0.02
      bubble.position.x += (Math.random() - 0.5) * 0.01
      bubble.position.z += (Math.random() - 0.5) * 0.01
      
      if (bubble.position.y > 2) {
        scene.remove(bubble)
        bubble.geometry.dispose()
        ;(bubble.material as THREE.Material).dispose()
      } else {
        requestAnimationFrame(animateBubble)
      }
    }
    animateBubble()
  }

  // Enhanced swimming animation
  const updatePrawnAnimation = (prawnGroup: THREE.Group, deltaTime: number) => {
    const state = animationStateRef.current
    state.time += deltaTime * 0.001

    // Update swim pattern
    const pattern = gameLogic.gameState.currentSwimPattern
    const patternSpeed = gameLogic.gameState.isSwimming ? 1.5 : 0.5
    
    let targetX = 0, targetY = 0, targetZ = 0

    switch (pattern) {
      case 'circular':
        targetX = Math.cos(state.time * patternSpeed) * 3
        targetY = Math.sin(state.time * patternSpeed * 0.5) * 1
        targetZ = Math.sin(state.time * patternSpeed) * 3
        break
      case 'figure8':
        targetX = Math.sin(state.time * patternSpeed) * 3
        targetY = Math.sin(state.time * patternSpeed * 0.3) * 1
        targetZ = Math.sin(state.time * patternSpeed * 2) * 2
        break
      case 'random':
        if (Math.random() < 0.02) {
          state.targetPosition = {
            x: (Math.random() - 0.5) * 6,
            y: (Math.random() - 0.5) * 2,
            z: (Math.random() - 0.5) * 6,
          }
        }
        targetX = state.targetPosition.x
        targetY = state.targetPosition.y
        targetZ = state.targetPosition.z
        break
      case 'patrol':
        const patrolPoints = [
          { x: -4, y: 0, z: -4 },
          { x: 4, y: 0, z: -4 },
          { x: 4, y: 0, z: 4 },
          { x: -4, y: 0, z: 4 },
        ]
        const currentPoint = Math.floor(state.time * 0.3) % patrolPoints.length
        const nextPoint = (currentPoint + 1) % patrolPoints.length
        const t = (state.time * 0.3) % 1
        
        targetX = THREE.MathUtils.lerp(patrolPoints[currentPoint].x, patrolPoints[nextPoint].x, t)
        targetY = THREE.MathUtils.lerp(patrolPoints[currentPoint].y, patrolPoints[nextPoint].y, t)
        targetZ = THREE.MathUtils.lerp(patrolPoints[currentPoint].z, patrolPoints[nextPoint].z, t)
        break
    }

    // Smooth movement with physics-like behavior
    const force = 0.05
    const damping = 0.95
    
    state.velocity.x += (targetX - prawnGroup.position.x) * force
    state.velocity.y += (targetY - prawnGroup.position.y) * force
    state.velocity.z += (targetZ - prawnGroup.position.z) * force
    
    state.velocity.x *= damping
    state.velocity.y *= damping
    state.velocity.z *= damping
    
    prawnGroup.position.x += state.velocity.x
    prawnGroup.position.y += state.velocity.y
    prawnGroup.position.z += state.velocity.z

    // Realistic rotation based on movement direction
    const speed = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2 + state.velocity.z ** 2)
    if (speed > 0.001) {
      const targetRotationY = Math.atan2(state.velocity.x, state.velocity.z)
      const targetRotationX = Math.atan2(state.velocity.y, Math.sqrt(state.velocity.x ** 2 + state.velocity.z ** 2))
      
      prawnGroup.rotation.y = THREE.MathUtils.lerp(prawnGroup.rotation.y, targetRotationY, 0.1)
      prawnGroup.rotation.x = THREE.MathUtils.lerp(prawnGroup.rotation.x, targetRotationX, 0.1)
    }

    // Animate body parts
    state.tailAnimation += deltaTime * 0.008
    state.antennaeAnimation += deltaTime * 0.012
    state.legAnimation += deltaTime * 0.015

    prawnGroup.children.forEach((child) => {
      if (child.userData.type === 'tailFan') {
        child.rotation.y = Math.sin(state.tailAnimation) * 0.3 * speed * 10
      } else if (child.userData.type === 'leg') {
        const legIndex = child.userData.index
        const phase = state.legAnimation + legIndex * 0.5
        child.rotation.z += Math.sin(phase) * 0.1 * speed * 5
      } else if (child.userData.type === 'claw') {
        const clawIndex = child.userData.index
        child.rotation.z = Math.sin(state.time * 2 + clawIndex * Math.PI) * 0.2
      }
    })

    // Body undulation (swimming motion)
    if (gameLogic.gameState.isSwimming) {
      prawnGroup.rotation.z = Math.sin(state.time * 3) * 0.1
      prawnGroup.children[0].rotation.y = Math.sin(state.time * 4) * 0.05 // Body twist
    }
  }

  // Animate environment
  const updateEnvironment = (deltaTime: number) => {
    // Animate water particles
    if (waterParticlesRef.current) {
      const positions = waterParticlesRef.current.geometry.attributes.position
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        const z = positions.getZ(i)
        
        positions.setY(i, y + Math.sin(Date.now() * 0.001 + x * 0.1 + z * 0.1) * 0.01)
      }
      positions.needsUpdate = true
    }

    // Animate fish
    fishRef.current.forEach((fish) => {
      fish.userData.turnTimer--
      
      if (fish.userData.turnTimer <= 0) {
        fish.userData.swimDirection = new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.02
        )
        fish.userData.turnTimer = 100 + Math.random() * 200
      }
      
      fish.position.add(fish.userData.swimDirection)
      
      // Keep fish in bounds
      if (Math.abs(fish.position.x) > 8) fish.userData.swimDirection.x *= -1
      if (Math.abs(fish.position.y) > 3) fish.userData.swimDirection.y *= -1
      if (Math.abs(fish.position.z) > 8) fish.userData.swimDirection.z *= -1
      
      // Fish look in swimming direction
      fish.lookAt(
        fish.position.x + fish.userData.swimDirection.x * 10,
        fish.position.y + fish.userData.swimDirection.y * 10,
        fish.position.z + fish.userData.swimDirection.z * 10
      )
    })

    // Gentle plant swaying
    plantsRef.current.forEach((plant, index) => {
      plant.rotation.z = Math.sin(Date.now() * 0.001 + index) * 0.1
      plant.children.forEach((child, childIndex) => {
        if (child.geometry && child.geometry.type === 'PlaneGeometry') {
          child.rotation.y = Math.sin(Date.now() * 0.002 + index + childIndex) * 0.3
        }
      })
    })
  }

  // Three.js setup
  useEffect(() => {
    if (!mountRef.current || isLoaded) return

    try {
      // Create scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x001a2e)
      scene.fog = new THREE.Fog(0x001a2e, 10, 30)

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      )
      camera.position.set(5, 3, 5)
      camera.lookAt(0, 0, 0)

      // Create renderer with enhanced settings
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.shadowMap.autoUpdate = true
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2

      mountRef.current.appendChild(renderer.domElement)

      // Enhanced lighting
      const ambientLight = new THREE.AmbientLight(0x404080, 0.3)
      scene.add(ambientLight)

      const sunLight = new THREE.DirectionalLight(0xffffff, 1.0)
      sunLight.position.set(10, 10, 5)
      sunLight.castShadow = true
      sunLight.shadow.mapSize.width = 4096
      sunLight.shadow.mapSize.height = 4096
      sunLight.shadow.camera.near = 0.5
      sunLight.shadow.camera.far = 50
      sunLight.shadow.camera.left = -20
      sunLight.shadow.camera.right = 20
      sunLight.shadow.camera.top = 20
      sunLight.shadow.camera.bottom = -20
      scene.add(sunLight)

      // Underwater caustic lighting effect
      const causticLight = new THREE.SpotLight(0x00ffff, 0.5)
      causticLight.position.set(0, 8, 0)
      causticLight.angle = Math.PI / 3
      causticLight.penumbra = 0.5
      causticLight.decay = 2
      causticLight.distance = 15
      scene.add(causticLight)

      // Create realistic prawn
      const prawnGroup = createRealisticPrawn()
      scene.add(prawnGroup)
      prawnGroupRef.current = prawnGroup

      // Create pond environment
      createPondEnvironment(scene)

      sceneRef.current = scene
      rendererRef.current = renderer

      setIsLoaded(true)

      // Animation loop
      let lastTime = 0
      const animate = (currentTime: number) => {
        const deltaTime = currentTime - lastTime
        lastTime = currentTime

        if (prawnGroupRef.current) {
          updatePrawnAnimation(prawnGroupRef.current, deltaTime)
        }
        
        updateEnvironment(deltaTime)

        // Camera follows prawn gently
        if (prawnGroupRef.current) {
          const prawnPos = prawnGroupRef.current.position
          camera.position.lerp(
            new THREE.Vector3(prawnPos.x + 5, prawnPos.y + 3, prawnPos.z + 5),
            0.02
          )
          camera.lookAt(prawnPos)
        }

        renderer.render(scene, camera)
        frameRef.current = requestAnimationFrame(animate)
      }

      frameRef.current = requestAnimationFrame(animate)

      // Handle resize
      const handleResize = () => {
        if (!camera || !renderer) return
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }

      window.addEventListener('resize', handleResize)

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize)
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current)
        }
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement)
        }
        scene.clear()
        renderer.dispose()
      }
    } catch (error) {
      console.error('Error initializing Three.js:', error)
      toast.error('Failed to load 3D visualization')
    }
  }, [])

  // Handle interactions
  const handlePrawnClick = () => {
    if (!audioEnabled) {
      resumeAudioContext()
      setAudioEnabled(true)
    }
    
    playClickSound({ volume: 0.6, playbackRate: 1.0 })
    gameLogic.handlePrawnClick()
    
    // Change swim pattern on click
    const patterns = ['circular', 'figure8', 'random', 'patrol'] as const
    const currentIndex = patterns.indexOf(gameLogic.gameState.currentSwimPattern)
    const nextPattern = patterns[(currentIndex + 1) % patterns.length]
    
    gameLogic.setGameState(prev => ({
      ...prev,
      currentSwimPattern: nextPattern,
      isSwimming: !prev.isSwimming,
    }))
    
    toast.success(`Swimming pattern: ${nextPattern}`)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900">
      {/* Three.js mount point */}
      <div
        ref={mountRef}
        className="absolute inset-0 cursor-pointer"
        onClick={handlePrawnClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Menu toggle button */}
        <Button
          variant="outline"
          size="lg"
          className="pointer-events-auto absolute top-4 right-4 bg-white/90 backdrop-blur-sm border-blue-500/30 hover:bg-blue-500 hover:text-white transition-all duration-300"
          onClick={() => {
            playClickSound({ volume: 0.4 })
            onMenuToggle(!menuVisible)
          }}
        >
          <motion.div
            animate={{ rotate: menuVisible ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            ☰
          </motion.div>
        </Button>

        {/* Game UI */}
        <GameUI gameLogic={gameLogic} />

        {/* Interaction hints */}
        {!audioEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-sm"
          >
            🖱️ Click the prawn to interact and enable audio
          </motion.div>
        )}

        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg"
          >
            <p className="text-sm font-medium">🦐 Realistic Prawn Simulation</p>
            <p className="text-xs text-gray-600">Swimming pattern: {gameLogic.gameState.currentSwimPattern}</p>
            <p className="text-xs text-gray-600">Click to change behavior</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default PrawnVisualization
