import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { motion } from 'framer-motion'
import { useAudio } from '@/hooks/useAudio'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { PetkaQuiz } from '@/components/PetkaQuiz'

// Локальні типи та логіка
interface PrawnVisualizationProps {
  onMenuToggle?: () => void
  menuVisible?: boolean
  onNavigateToSite?: (section: string) => void
}

export function PrawnVisualization({
  onMenuToggle,
  menuVisible,
  onNavigateToSite,
}: PrawnVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const frameRef = useRef<number | null>(null)
  const prawnGroupRef = useRef<THREE.Group | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const waterParticlesRef = useRef<THREE.Points | null>(null)
  const fishRef = useRef<THREE.Group[]>([])
  const plantsRef = useRef<THREE.Group[]>([])
  const collectiblesRef = useRef<THREE.Group | null>(null)
  const waterMeshRef = useRef<THREE.Mesh | null>(null)
  const composerRef = useRef<EffectComposer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const drawDistanceRef = useRef<number>(6)
  const drawMarkerRef = useRef<THREE.Mesh | null>(null)
  const lastNDCRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const snapToFloorRef = useRef<boolean>(false)

  const [postFX, setPostFX] = useState(true)
  const [freeCam, setFreeCam] = useState(false)
  const [species, setSpecies] = useState<'shrimp' | 'crayfish'>('shrimp')
  const [drawDepth, setDrawDepth] = useState(6)
  const [smoothness, setSmoothness] = useState(0.4)
  const [snapToFloor, setSnapToFloor] = useState(false)

  // Drawing / Path state
  const raycasterRef = useRef(new THREE.Raycaster())
  const navPlaneRef = useRef<THREE.Mesh | null>(null)
  const isDrawingRef = useRef(false)
  const draftPointsRef = useRef<THREE.Vector3[]>([])
  const pathLineRef = useRef<THREE.Line | null>(null)
  const pathTubeRef = useRef<THREE.Mesh | null>(null)
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null)
  const followRef = useRef({ active: false, t: 0, speed: 0.06 })

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
  const [gameState, setGameState] = useState({
    health: 100,
    happiness: 80,
    hunger: 50,
    level: 1,
    experience: 0
  })

  const { playClickSound, playSwooshSound, playBubbleSound, resumeAudioContext } = useAudio()
      // Inventory / Recipe / Feeding
      type ItemKey = 'garlic' | 'herb' | 'lemon' | 'butter' | 'salt' | 'pepper'
      const [inventory, setInventory] = useState<Record<ItemKey, number>>({
        garlic: 0,
        herb: 0,
        lemon: 0,
        butter: 0,
        salt: 0,
        pepper: 0,
      })

      // Enhanced game state for unified experience
      const [extendedGameState, setExtendedGameState] = useState({
        health: 100,
        happiness: 80,
        hunger: 50,
        growth: 30,
        colorIntensity: 60,
        level: 1,
        experience: 0,
        coins: 150,
        feedingStreak: 0
      })

      // Feeding mechanics integrated into 3D
      const [showFeedingPanel, setShowFeedingPanel] = useState(false)
      const [isFeeding, setIsFeeding] = useState(false)

      // Food types from feeding simulation
      const foodTypes = [
        {
          id: 'commercial-pellets',
          name: 'Комерційні гранули',
          type: 'pellets',
          nutritionValue: 7,
          cost: 2,
          icon: '🔶',
          effects: { growth: 5, health: 7, mood: 5, color: 3 }
        },
        {
          id: 'artemia',
          name: 'Артемія',
          type: 'premium',
          nutritionValue: 10,
          cost: 8,
          icon: '⭐',
          effects: { growth: 10, health: 8, mood: 9, color: 7 }
        },
        {
          id: 'bloodworms',
          name: 'Мотиль',
          type: 'worms',
          nutritionValue: 9,
          cost: 5,
          icon: '🪱',
          effects: { growth: 9, health: 6, mood: 10, color: 5 }
        }
      ]

      // spawned creatures reference
      const spawnedRef = useRef<THREE.Group[]>([])

      // Incubation state
      const [incubating, setIncubating] = useState(false)
      const [incubationProgress, setIncubationProgress] = useState(0) // 0..1
      const [incubationSecondsLeft, setIncubationSecondsLeft] = useState<number | null>(null)
      const incubationTimerRef = useRef<number | null>(null)
      const incubationEndsAtRef = useRef<number | null>(null)

      // localStorage keys
      const LS_KEYS = {
        extended: 'af_extended',
        inventory: 'af_inventory',
        petka: 'af_petka',
        spawns: 'af_spawns'
      }

      // Helper to spawn a creature into the scene and persist the spawn
      const spawnCreatureAt = (kind: 'shrimp' | 'crayfish', position?: THREE.Vector3) => {
        if (!sceneRef.current) return null
        const c = createCreature(kind)
        const pos = position ?? new THREE.Vector3((Math.random() - 0.5) * 10, -1.5 + Math.random() * 1, (Math.random() - 0.5) * 10)
        c.position.copy(pos)
        sceneRef.current.add(c)
        spawnedRef.current.push(c)
        // persist spawn info (append to array)
        try {
          const existing = JSON.parse(localStorage.getItem(LS_KEYS.spawns) || '[]') as any[]
          existing.push({ species: kind, pos: { x: pos.x, y: pos.y, z: pos.z }, ts: Date.now() })
          localStorage.setItem(LS_KEYS.spawns, JSON.stringify(existing))
        } catch {}
        return c
      }

      // Spawn VFX: particle burst, glow and distinct sound
      const playSpawnVFX = (position: THREE.Vector3) => {
        try {
          const scene = sceneRef.current
          if (!scene) return
          // small glow mesh
          const glowGeom = new THREE.SphereGeometry(0.18, 12, 12)
          const glowMat = new THREE.MeshBasicMaterial({ color: 0xfff4d6, transparent: true, opacity: 0.85 })
          const glow = new THREE.Mesh(glowGeom, glowMat)
          glow.position.copy(position)
          scene.add(glow)

          // burst particles (two layers)
          const makeBurst = (count: number, color: number, speedMul = 1) => {
            const geom = new THREE.BufferGeometry()
            const positions = new Float32Array(count * 3)
            const velocities = new Float32Array(count * 3)
            for (let i = 0; i < count; i++) {
              positions[i * 3] = position.x
              positions[i * 3 + 1] = position.y
              positions[i * 3 + 2] = position.z
              const theta = Math.random() * Math.PI * 2
              const phi = Math.acos(2 * Math.random() - 1)
              const speed = (0.2 + Math.random() * 0.8) * speedMul
              velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
              velocities[i * 3 + 1] = Math.cos(phi) * speed
              velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed
            }
            geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
            geom.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
            const mat = new THREE.PointsMaterial({ size: 0.08, color, transparent: true, opacity: 0.95, depthWrite: false })
            const pts = new THREE.Points(geom, mat)
            scene.add(pts)
            return { pts, geom }
          }

          // generate a soft circular sprite texture via canvas for prettier particles
          const createSpriteTexture = (size = 64) => {
            const canvas = document.createElement('canvas')
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext('2d')!
            const cx = size / 2
            const cy = size / 2
            const r = size / 2
            // radial gradient (center bright -> edge transparent)
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
            grad.addColorStop(0, 'rgba(255,250,230,1)')
            grad.addColorStop(0.25, 'rgba(255,200,160,0.95)')
            grad.addColorStop(0.5, 'rgba(255,120,120,0.6)')
            grad.addColorStop(1, 'rgba(255,120,120,0)')
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, size, size)
            const tex = new THREE.CanvasTexture(canvas)
            tex.needsUpdate = true
            return tex
          }

          const spriteTex = createSpriteTexture(128)

          const burstA = makeBurst(60, 0xffffff, 1)
          const burstB = makeBurst(30, 0xff9aa2, 0.7)

          const start = performance.now()
          const lifetime = 1100
          const ticker = () => {
            const now = performance.now()
            const t = (now - start) / lifetime
            const bursts = [burstA, burstB]
            for (let bI = 0; bI < bursts.length; bI++) {
              const pts = bursts[bI].pts
              const posAttr = pts.geometry.attributes.position as THREE.BufferAttribute
              const velAttr = pts.geometry.attributes.velocity as THREE.BufferAttribute
              for (let i = 0; i < posAttr.count; i++) {
                posAttr.setX(i, posAttr.getX(i) + velAttr.getX(i) * 0.045)
                posAttr.setY(i, posAttr.getY(i) + velAttr.getY(i) * 0.045 - 0.008)
                posAttr.setZ(i, posAttr.getZ(i) + velAttr.getZ(i) * 0.045)
                velAttr.setY(i, velAttr.getY(i) - 0.004)
              }
              posAttr.needsUpdate = true
              velAttr.needsUpdate = true
              const pm = pts.material as THREE.PointsMaterial
              // attach sprite texture once
              if (!pm.map) {
                pm.map = spriteTex
                pm.alphaTest = 0.01
                pm.blending = THREE.AdditiveBlending
                pm.depthWrite = false
              }
              pm.opacity = Math.max(0, 1 - t)
            }
            // glow fade + scale
            glow.scale.setScalar(1 + t * 1.4)
            ;(glow.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - t))
            if (t < 1) requestAnimationFrame(ticker)
            else {
              try {
                scene.remove(burstA.pts)
                scene.remove(burstB.pts)
                scene.remove(glow)
                burstA.pts.geometry.dispose()
                burstB.pts.geometry.dispose()
                ;(burstA.pts.material as THREE.Material).dispose()
                ;(burstB.pts.material as THREE.Material).dispose()
                glow.geometry.dispose()
                ;(glow.material as THREE.Material).dispose()
                try { spriteTex.dispose() } catch {}
              } catch {}
            }
          }
          ticker()

          // play distinct spawn sound if available; fallback to click or swoosh
          try {
            if ((playSwooshSound as any)) {
              playSwooshSound({ volume: 0.9, playbackRate: 1.05 })
            } else if ((playClickSound as any)) {
              playClickSound({ volume: 0.9 })
            }
          } catch {}
        } catch (err) {
          console.warn('Spawn VFX failed', err)
        }
      }
  
  const recipeRequirements: Record<ItemKey, number> = {
    garlic: 1,
    herb: 2,
    lemon: 1,
    butter: 1,
    salt: 1,
    pepper: 1,
  }
  // Feed function for 3D environment
  const feedCreature = (food: any) => {
    if (isFeeding || extendedGameState.coins < food.cost) {
      if (extendedGameState.coins < food.cost) {
        toast.error('Недостатньо монет!')
      }
      return
    }
    
    setIsFeeding(true)
    playClickSound({ volume: 0.3 })
    
    // Deduct coins
    setExtendedGameState(current => ({
      ...current,
      coins: current.coins - food.cost
    }))
    
    // Create visual feeding effect
    if (prawnGroupRef.current) {
      // Animate the creature (could enhance this further)
      prawnGroupRef.current.rotation.z += 0.2
    }
    
    // Update stats after feeding
    setTimeout(() => {
      setExtendedGameState(current => {
        const hungerBonus = current.hunger < 30 ? 1.5 : 1.0
        const newStats = {
          ...current,
          hunger: Math.min(100, current.hunger + food.nutritionValue * 8 * hungerBonus),
          health: Math.min(100, current.health + food.effects.health * hungerBonus),
          growth: Math.min(100, current.growth + food.effects.growth * 0.5),
          happiness: Math.min(100, current.happiness + food.effects.mood * 1.2),
          colorIntensity: Math.min(100, current.colorIntensity + food.effects.color),
          experience: current.experience + food.nutritionValue * 5,
          feedingStreak: current.feedingStreak + 1
        }
        
        // Level up system
        if (newStats.experience >= newStats.level * 100) {
          newStats.level += 1
          newStats.experience = newStats.experience - (newStats.level - 1) * 100
          toast.success('Новий рівень! 🎉')
          playSwooshSound({ volume: 0.4 })
        }
        
        return newStats
      })
      
      setGameState(current => ({
        ...current,
        health: extendedGameState.health,
        happiness: extendedGameState.happiness,
        hunger: extendedGameState.hunger,
        level: extendedGameState.level,
        experience: extendedGameState.experience
      }))
      
      toast.success(`Креветку нагодовано ${food.name}!`)
      setIsFeeding(false)
    }, 1500)
  }
  const [showRecipe, setShowRecipe] = useState(false)
  const [petkaOpen, setPetkaOpen] = useState(false)
  const [petkaPassed, setPetkaPassed] = useState<boolean>(() => sessionStorage.getItem('petkaPassed') === '1')
  // Load persisted state on mount
  useEffect(() => {
    try {
      const e = localStorage.getItem(LS_KEYS.extended)
      if (e) setExtendedGameState(JSON.parse(e))
      const inv = localStorage.getItem(LS_KEYS.inventory)
      if (inv) setInventory(JSON.parse(inv))
      const p = localStorage.getItem(LS_KEYS.petka)
      if (p) setPetkaPassed(p === '1')
      // load spawns
      try {
        const sp = localStorage.getItem(LS_KEYS.spawns)
        if (sp && sp.length) {
          const arr = JSON.parse(sp) as { species: string; pos: { x: number; y: number; z: number } }[]
          // postpone adding until scene ready — store in ref
          ;(window as any).__af_pending_spawns = arr
        }
      } catch {}
    } catch (err) {
      console.warn('Failed to load persisted game state', err)
    }
  }, [])

  // Persist key state changes
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.extended, JSON.stringify(extendedGameState))
    } catch {}
  }, [extendedGameState])
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.inventory, JSON.stringify(inventory))
    } catch {}
  }, [inventory])
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.petka, petkaPassed ? '1' : '0')
    } catch {}
  }, [petkaPassed])
  const canCook = Object.entries(recipeRequirements).every(
    ([k, v]) => (inventory as any)[k] >= v
  )
  // Prevent overlapping toasts on hero: single active toast id per type
  const toastIdsRef = useRef<Record<string, string>>({})

  // Create realistic shrimp (default) or crayfish model
  const createCreature = (kind: 'shrimp' | 'crayfish') => {
    const group = new THREE.Group()

    const shrimpColor = 0xffa07a
    const crayfishColor = 0x8f6b3e

    const shellMat = new THREE.MeshPhysicalMaterial({
      color: kind === 'shrimp' ? shrimpColor : crayfishColor,
      metalness: 0.05,
      roughness: 0.45,
      clearcoat: 0.8,
      clearcoatRoughness: 0.3,
      transmission: kind === 'shrimp' ? 0.4 : 0.1,
      thickness: 0.8,
      transparent: true,
      opacity: 0.95,
    })
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.2 })

    // Abdomen segments (6 for shrimp, 6 for crayfish)
    const segments: THREE.Mesh[] = []
    for (let s = 0; s < 6; s++) {
      const baseR = kind === 'shrimp' ? 0.12 : 0.18
      const segG = new THREE.CapsuleGeometry(baseR - s * 0.018, (kind === 'shrimp' ? 0.14 : 0.18) - s * 0.012, 8, 12)
      const seg = new THREE.Mesh(segG, shellMat.clone())
      seg.position.set(kind === 'shrimp' ? -0.14 - s * 0.14 : -0.18 - s * 0.18, 0, 0)
      seg.rotation.z = Math.PI / 2
      seg.castShadow = true
      seg.receiveShadow = true
      seg.userData.type = 'abdomen'
      group.add(seg)
      segments.push(seg)
    }

  // Head: round for shrimp, elongated capsule for crayfish
    const head = new THREE.Mesh(
      kind === 'shrimp'
    ? new THREE.SphereGeometry(0.16, 20, 16)
        : new THREE.CapsuleGeometry(0.3, 0.4, 10, 16),
      shellMat.clone()
    )
  head.position.set(kind === 'shrimp' ? 0.48 : 0.7, 0, 0)
    head.rotation.z = Math.PI / 2
    head.scale.set(kind === 'shrimp' ? 1 : 1, kind === 'shrimp' ? 1 : 0.8, kind === 'shrimp' ? 1 : 0.8)
    head.castShadow = true
    group.add(head)

    // Rostrum (spike on head)
  const rostrumG = new THREE.ConeGeometry(kind === 'shrimp' ? 0.03 : 0.06, kind === 'shrimp' ? 0.16 : 0.25, 8)
    const rostrum = new THREE.Mesh(rostrumG, shellMat.clone())
  rostrum.position.set(kind === 'shrimp' ? 0.78 : 1.0, 0, 0.02)
    rostrum.rotation.z = Math.PI / 2
    group.add(rostrum)

    // Eyes
    for (let i = 0; i < 2; i++) {
      const eyeRadius = kind === 'shrimp' ? 0.04 : 0.06
      const eyeG = new THREE.SphereGeometry(eyeRadius, 16, 12)
      const eyeMat = new THREE.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.05, metalness: 0.7, clearcoat: 1, clearcoatRoughness: 0.05 })
      const eye = new THREE.Mesh(eyeG, eyeMat)
      const eyeX = kind === 'shrimp' ? 0.68 : 0.95
      const eyeY = i === 0 ? (kind === 'shrimp' ? 0.09 : 0.14) : (kind === 'shrimp' ? -0.09 : -0.14)
      eye.position.set(eyeX, eyeY, 0.1)
      group.add(eye)
      // Eye stalks for shrimp for realism
      if (kind === 'shrimp') {
        const stalkG = new THREE.CylinderGeometry(0.006, 0.008, 0.14, 8)
        const stalk = new THREE.Mesh(stalkG, shellMat.clone())
        stalk.position.set(eyeX - 0.06, eyeY, 0.08)
        stalk.rotation.z = Math.PI / 2
        group.add(stalk)
      }
    }

    // Antennae (chain of thin cylinders)
    for (let a = 0; a < 2; a++) {
      const antGroup = new THREE.Group()
      const segs = kind === 'shrimp' ? 16 : 10
      for (let j = 0; j < segs; j++) {
        const g = new THREE.CylinderGeometry(kind === 'shrimp' ? 0.005 : 0.01, kind === 'shrimp' ? 0.005 : 0.01, kind === 'shrimp' ? 0.2 : 0.16, 6)
        const m = new THREE.MeshStandardMaterial({ color: 0xffc08a, roughness: 0.7 })
        const part = new THREE.Mesh(g, m)
        part.position.set(j * 0.15, 0, 0)
        part.rotation.z = Math.PI / 2
        antGroup.add(part)
      }
      antGroup.position.set(kind === 'shrimp' ? 0.82 : 1.0, a === 0 ? 0.1 : -0.1, 0.05)
      antGroup.rotation.y = (a === 0 ? 1 : -1) * 0.2
      antGroup.userData.type = 'antenna'
      group.add(antGroup)
    }

    // Pleopods (swimming legs) under abdomen for shrimp; walking legs + claws for crayfish
    if (kind === 'shrimp') {
      for (let i = 0; i < 5; i++) {
        for (let side = 0; side < 2; side++) {
          const g = new THREE.CylinderGeometry(0.015, 0.01, 0.22, 6)
          const m = new THREE.MeshStandardMaterial({ color: 0xffb499, roughness: 0.6 })
          const leg = new THREE.Mesh(g, m)
          leg.position.set(-0.25 + i * 0.18, side === 0 ? 0.18 : -0.18, -0.06)
          leg.rotation.z = Math.PI / 2 + (side === 0 ? -0.3 : 0.3)
          leg.userData = { type: 'pleopod', index: i, side }
          group.add(leg)
        }
      }
    } else {
      // Crayfish walking legs (5 pairs)
      for (let i = 0; i < 5; i++) {
        for (let side = 0; side < 2; side++) {
          const upperG = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6)
          const lowerG = new THREE.CylinderGeometry(0.02, 0.015, 0.22, 6)
          const upper = new THREE.Mesh(upperG, shellMat.clone())
          const lower = new THREE.Mesh(lowerG, shellMat.clone())
          const baseX = 0.2 - i * 0.18
          const y = side === 0 ? 0.22 : -0.22
          upper.position.set(baseX, y, 0)
          upper.rotation.z = (side === 0 ? 1 : -1) * 0.5
          lower.position.set(baseX - 0.12, y + (side === 0 ? -0.06 : 0.06), -0.02)
          lower.rotation.z = (side === 0 ? 1 : -1) * 0.9
          upper.userData = { type: 'legUpper', index: i, side }
          lower.userData = { type: 'legLower', index: i, side }
          group.add(upper)
          group.add(lower)
        }
      }
      // Claws (chelae)
      for (let side = 0; side < 2; side++) {
        const claw = new THREE.Group()
        const armG = new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8)
        const arm = new THREE.Mesh(armG, shellMat.clone())
        arm.rotation.z = (side === 0 ? 1 : -1) * 0.6
        claw.add(arm)
        const pincerG = new THREE.BoxGeometry(0.18, 0.06, 0.06)
        const pincer = new THREE.Mesh(pincerG, shellMat.clone())
        pincer.position.set(0.2, 0, 0)
        claw.add(pincer)
        claw.position.set(0.45, side === 0 ? 0.25 : -0.25, 0)
        claw.userData = { type: 'claw', side }
        group.add(claw)
      }
    }

    // Tail fan
  const tailG = new THREE.ConeGeometry(kind === 'shrimp' ? 0.22 : 0.32, kind === 'shrimp' ? 0.36 : 0.48, 10)
    const tail = new THREE.Mesh(tailG, shellMat.clone())
  tail.position.set(kind === 'shrimp' ? -0.85 : -1.1, 0, 0)
    tail.rotation.z = Math.PI / 2
    tail.userData = { type: 'tailFan' }
    group.add(tail)

    // Store metadata
    group.userData.abdomenSegments = segments
    group.userData.species = kind
    if (kind === 'shrimp') {
      // Much smaller shrimp with round head
      group.scale.setScalar(0.3)
      group.userData.pickupRadius = 0.15
      group.userData.cameraOffset = new THREE.Vector3(1.6, 0.9, 1.6)
    } else {
      group.userData.pickupRadius = 0.4
      group.userData.cameraOffset = new THREE.Vector3(4.5, 2.6, 4.5)
    }

    return group
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
  waterMeshRef.current = water

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

    // Collectibles (ingredients)
    const collectibles = new THREE.Group()
    const itemTypes: ItemKey[] = ['garlic', 'herb', 'lemon', 'butter', 'salt', 'pepper']
    const spawnItem = (type: ItemKey) => {
      let geom: THREE.BufferGeometry
      let mat: THREE.Material
      switch (type) {
        case 'garlic':
          geom = new THREE.DodecahedronGeometry(0.12)
          mat = new THREE.MeshStandardMaterial({ color: 0xf5e6c8, roughness: 0.7, metalness: 0.0 })
          break
        case 'herb':
          geom = new THREE.CapsuleGeometry(0.06, 0.12, 6, 8)
          mat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.6 })
          break
        case 'lemon':
          geom = new THREE.SphereGeometry(0.12, 16, 12)
          mat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.5 })
          break
        case 'butter':
          geom = new THREE.BoxGeometry(0.18, 0.08, 0.12)
          mat = new THREE.MeshStandardMaterial({ color: 0xffeb99, roughness: 0.8 })
          break
        case 'salt':
          geom = new THREE.TetrahedronGeometry(0.09)
          mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
          break
        case 'pepper':
        default:
          geom = new THREE.IcosahedronGeometry(0.1, 0)
          mat = new THREE.MeshStandardMaterial({ color: 0x8e5a2b, roughness: 0.8 })
          break
      }
      const mesh = new THREE.Mesh(geom, mat)
      mesh.userData.itemType = type
      mesh.castShadow = true
      const x = (Math.random() - 0.5) * 14
      const z = (Math.random() - 0.5) * 14
      mesh.position.set(x, -2.7 + Math.random() * 0.3, z)
      collectibles.add(mesh)
    }
    // spawn a few of each
    itemTypes.forEach((t) => {
      for (let i = 0; i < 3; i++) spawnItem(t)
    })
    scene.add(collectibles)
    collectiblesRef.current = collectibles
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

  // Build/update draft line while drawing
  const updateDraftLine = () => {
    const scene = sceneRef.current
    if (!scene) return
    const pts = draftPointsRef.current
    if (pts.length < 2) return
    const positions = new Float32Array(pts.length * 3)
    pts.forEach((p, i) => {
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
    })
    if (!pathLineRef.current) {
      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const mat = new THREE.LineBasicMaterial({ color: 0x00d1ff })
      const line = new THREE.Line(geom, mat)
      line.renderOrder = 2
      scene.add(line)
      pathLineRef.current = line
    } else {
      const geom = pathLineRef.current.geometry as THREE.BufferGeometry
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geom.computeBoundingSphere()
      geom.attributes.position.needsUpdate = true
    }
  }

  const finalizePath = () => {
    const scene = sceneRef.current
    if (!scene) return
    const pts = draftPointsRef.current
    if (pts.length < 2) return
    // Smooth with CatmullRom
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', smoothness)
    curveRef.current = curve

    // Remove old tube
    if (pathTubeRef.current) {
      scene.remove(pathTubeRef.current)
      pathTubeRef.current.geometry.dispose()
      ;(pathTubeRef.current.material as THREE.Material).dispose()
      pathTubeRef.current = null
    }
    // Build tube for final path
    const tubularSegments = Math.max(20, pts.length * 6)
  const tubeGeom = new THREE.TubeGeometry(curve, tubularSegments, 0.02, 8, false)
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x00c2ff, emissive: 0x002233, metalness: 0.2, roughness: 0.4, transparent: true, opacity: 0.85 })
    const tube = new THREE.Mesh(tubeGeom, tubeMat)
    tube.castShadow = false
    tube.receiveShadow = false
    tube.renderOrder = 1
    scene.add(tube)
    pathTubeRef.current = tube

    // Prepare follow
    followRef.current.t = 0
    followRef.current.active = false
  }

  const pointFromNDC = (ndc: { x: number; y: number }) => {
    if (!cameraRef.current) return null
    const camera = cameraRef.current
    const origin = new THREE.Vector3()
    const direction = new THREE.Vector3()
    const raycaster = raycasterRef.current
    raycaster.setFromCamera(ndc as any, camera)
    origin.copy(raycaster.ray.origin)
    direction.copy(raycaster.ray.direction)
    let pos: THREE.Vector3 | null = null
    if (snapToFloorRef.current && navPlaneRef.current) {
      const hit = raycaster.intersectObject(navPlaneRef.current, false)[0]
      if (hit) pos = hit.point.clone()
    }
    if (!pos) {
      // Place point at some distance from camera, clamped within pond bounds
      const dist = drawDistanceRef.current
      pos = origin.add(direction.multiplyScalar(dist))
    }
    // clamp to pond box
    pos.x = THREE.MathUtils.clamp(pos.x, -9, 9)
    pos.y = THREE.MathUtils.clamp(pos.y, -2.8, 2)
    pos.z = THREE.MathUtils.clamp(pos.z, -9, 9)
    return pos
  }

  // Enhanced swimming animation
  const updatePrawnAnimation = (prawnGroup: THREE.Group, deltaTime: number) => {
    const state = animationStateRef.current
    state.time += deltaTime * 0.001

    // If following a drawn path
    if (curveRef.current && followRef.current.active) {
      const { t, speed } = followRef.current
      const nextT = Math.min(1, t + speed * (deltaTime / 1000))
      const pos = curveRef.current.getPointAt(nextT)
      const tangent = curveRef.current.getTangentAt(Math.max(0, nextT - 0.001))
      prawnGroup.position.copy(pos)
      // Orient along tangent
      const targetY = Math.atan2(tangent.x, tangent.z)
      const targetX = Math.atan2(tangent.y, Math.sqrt(tangent.x ** 2 + tangent.z ** 2))
      prawnGroup.rotation.y = THREE.MathUtils.lerp(prawnGroup.rotation.y, targetY, 0.2)
      prawnGroup.rotation.x = THREE.MathUtils.lerp(prawnGroup.rotation.x, targetX, 0.2)
      followRef.current.t = nextT
    }

    // Update swim pattern
    const pattern = state.swimPattern
    const patternSpeed = 1.5
    
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
      case 'patrol': {
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
    }

    // Physics-like movement (mass, drag, max speed, buoyancy)
    const mass = 1.0
    const thrustFactor = 0.12 // how strongly prawn accelerates towards target
    const waterDrag = 0.85 // basic drag in water
    const maxSpeed = 0.12

    // Only apply idle physics when not following a drawn path
    if (!(curveRef.current && followRef.current.active)) {
      // desired acceleration
      const ax = (targetX - prawnGroup.position.x) * thrustFactor / mass
      const ay = (targetY - prawnGroup.position.y) * thrustFactor / mass
      const az = (targetZ - prawnGroup.position.z) * thrustFactor / mass

      // apply to velocity
      state.velocity.x += ax * (deltaTime * 0.001)
      state.velocity.y += ay * (deltaTime * 0.001)
      state.velocity.z += az * (deltaTime * 0.001)

      // buoyancy: gently push upward if below neutral depth (-1) and damp vertical oscillations
      const neutralDepth = -1.0
      const buoyancyStrength = 0.02
      const depthDiff = neutralDepth - prawnGroup.position.y
      state.velocity.y += depthDiff * buoyancyStrength * (deltaTime * 0.001)

      // apply water drag
      state.velocity.x *= Math.pow(waterDrag, deltaTime * 0.06)
      state.velocity.y *= Math.pow(waterDrag, deltaTime * 0.06)
      state.velocity.z *= Math.pow(waterDrag, deltaTime * 0.06)

      // clamp speed
      const vx = state.velocity.x
      const vy = state.velocity.y
      const vz = state.velocity.z
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz)
      if (speed > maxSpeed) {
        const k = maxSpeed / speed
        state.velocity.x *= k
        state.velocity.y *= k
        state.velocity.z *= k
      }

      // integrate
      prawnGroup.position.x += state.velocity.x * (deltaTime * 0.06)
      prawnGroup.position.y += state.velocity.y * (deltaTime * 0.06)
      prawnGroup.position.z += state.velocity.z * (deltaTime * 0.06)

      // Soft collisions with pond bounds (-9..9 / -2.8..2)
      const bounceFactor = 0.65
      if (prawnGroup.position.x < -9) { prawnGroup.position.x = -9; state.velocity.x = -state.velocity.x * bounceFactor }
      if (prawnGroup.position.x > 9) { prawnGroup.position.x = 9; state.velocity.x = -state.velocity.x * bounceFactor }
      if (prawnGroup.position.z < -9) { prawnGroup.position.z = -9; state.velocity.z = -state.velocity.z * bounceFactor }
      if (prawnGroup.position.z > 9) { prawnGroup.position.z = 9; state.velocity.z = -state.velocity.z * bounceFactor }
      if (prawnGroup.position.y < -2.8) { prawnGroup.position.y = -2.8; state.velocity.y = -state.velocity.y * bounceFactor }
      if (prawnGroup.position.y > 2) { prawnGroup.position.y = 2; state.velocity.y = -state.velocity.y * bounceFactor }
    }

    // Realistic rotation based on movement direction
    const speed = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2 + state.velocity.z ** 2)
    if (speed > 0.001 && !(curveRef.current && followRef.current.active)) {
      const targetRotationY = Math.atan2(state.velocity.x, state.velocity.z)
      const targetRotationX = Math.atan2(state.velocity.y, Math.sqrt(state.velocity.x ** 2 + state.velocity.z ** 2))

      // smoother turning at low speeds, snappier at higher speeds
      const turnLerp = THREE.MathUtils.clamp(0.04 + speed * 2.0, 0.04, 0.25)
      prawnGroup.rotation.y = THREE.MathUtils.lerp(prawnGroup.rotation.y, targetRotationY, turnLerp)
      prawnGroup.rotation.x = THREE.MathUtils.lerp(prawnGroup.rotation.x, targetRotationX, turnLerp)
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
      } else if (child.userData.type === 'pleopod') {
        // Shrimp swimming legs flap rhythmically
        const legIndex = child.userData.index ?? 0
        const phase = state.legAnimation * 1.4 + legIndex * 0.6
        child.rotation.z = Math.PI / 2 + Math.sin(phase) * 0.35
      } else if (child.userData.type === 'legUpper' || child.userData.type === 'legLower') {
        // Crayfish walking gait
        const idx = child.userData.index ?? 0
        const side = child.userData.side ?? 0
        const step = Math.sin(state.time * 8 + idx * 0.8 + (side === 0 ? 0 : Math.PI))
        if (child.userData.type === 'legUpper') {
          child.rotation.z = (side === 0 ? 1 : -1) * (0.4 + 0.25 * step)
        } else {
          child.rotation.z = (side === 0 ? 1 : -1) * (0.8 + 0.35 * step)
        }
      } else if (child.userData.type === 'claw') {
        const clawIndex = child.userData.index ?? child.userData.side ?? 0
        child.rotation.z = Math.sin(state.time * 2 + clawIndex * Math.PI) * 0.2
      } else if (child.userData.type === 'antenna') {
        // Sway antenna segments subtly
        child.children.forEach((seg, j) => {
          seg.rotation.y = Math.sin(state.time * 2 + j * 0.3) * 0.2
          seg.position.y = Math.sin(state.time * 1.5 + j * 0.4) * 0.03
        })
      }
    })

    // Body undulation (swimming motion)
    prawnGroup.rotation.z = Math.sin(state.time * 3) * 0.1
    // Abdomen per-segment sway
    const segments = (prawnGroup.userData.abdomenSegments as THREE.Mesh[]) || []
    segments.forEach((seg, i) => {
      const phase = state.time * 4 + i * 0.5
      seg.rotation.y = Math.sin(phase) * 0.12
      seg.rotation.x = Math.cos(phase) * 0.06
    })
    // Head subtle twist if exists after segments
    const headMesh = prawnGroup.children.find((c) => c instanceof THREE.Mesh && (c as THREE.Mesh).geometry.type === 'SphereGeometry') as THREE.Mesh | undefined
    if (headMesh) headMesh.rotation.y = Math.sin(state.time * 4) * 0.05

    // Subtle caustic shimmer on materials
    prawnGroup.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if ((mesh as any)?.isMesh && (mesh as any).material) {
        const mat = mesh.material as any
        if (mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = 0.7 + 0.3 * Math.sin(state.time * 3 + (mesh.id % 10))
        }
      }
    })
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
        // Type-safe check for mesh with geometry
        if (child instanceof THREE.Mesh && child.geometry.type === 'PlaneGeometry') {
          child.rotation.y = Math.sin(Date.now() * 0.002 + index + childIndex) * 0.3
        }
      })
    })

    // Float collectibles slightly
    if (collectiblesRef.current) {
      collectiblesRef.current.children.forEach((m, i) => {
        m.position.y += Math.sin(Date.now() * 0.001 + i) * 0.0008
        m.rotation.y += 0.002
      })
    }

    // Water gentle waves
    if (waterMeshRef.current) {
      const geom = waterMeshRef.current.geometry as THREE.PlaneGeometry
      const attr = geom.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < attr.count; i++) {
        const x = attr.getX(i)
        const y = attr.getY(i)
        const t = performance.now() * 0.001
        const wave = Math.sin(x * 0.5 + t) * Math.cos(y * 0.5 + t * 1.2) * 0.05
        attr.setZ(i, wave)
      }
      attr.needsUpdate = true
      geom.computeVertexNormals()
    }
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
  cameraRef.current = camera

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

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.maxPolarAngle = Math.PI * 0.49
  controls.minDistance = 2
  controls.maxDistance = 25
  controls.enabled = false
  controlsRef.current = controls

  // Postprocessing
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.4, 0.85)
  composer.addPass(bloom)
  composerRef.current = composer

  // Nav (invisible) plane for drawing at mid-depth
  const navGeom = new THREE.PlaneGeometry(30, 30)
  const navMat = new THREE.MeshBasicMaterial({ visible: false })
  const navPlane = new THREE.Mesh(navGeom, navMat)
  navPlane.rotation.x = -Math.PI / 2
  navPlane.position.y = -2.2
  scene.add(navPlane)
  navPlaneRef.current = navPlane

  // 3D draw marker (small sphere)
  const markerGeom = new THREE.SphereGeometry(0.07, 12, 10)
  const markerMat = new THREE.MeshBasicMaterial({ color: 0x00d1ff })
  const marker = new THREE.Mesh(markerGeom, markerMat)
  scene.add(marker)
  drawMarkerRef.current = marker

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

  // Create creature based on selected species
  const prawnGroup = createCreature(species)
      scene.add(prawnGroup)
      prawnGroupRef.current = prawnGroup

      // Create pond environment
      createPondEnvironment(scene)

      sceneRef.current = scene
      rendererRef.current = renderer

      setIsLoaded(true)

      // Restore any persisted spawns after scene created
      try {
        const pending = (window as any).__af_pending_spawns as any[] | undefined
        if (pending && pending.length) {
          pending.forEach(s => {
            const pos = new THREE.Vector3(s.pos.x, s.pos.y, s.pos.z)
            const spawned = spawnCreatureAt(s.species === 'crayfish' ? 'crayfish' : 'shrimp', pos)
            if (spawned) {
              // small settled scale
              spawned.scale.setScalar(1)
            }
          })
          try { localStorage.removeItem(LS_KEYS.spawns) } catch {}
        }
      } catch (err) {}

      // Animation loop
      let lastTime = 0
      const animate = (currentTime: number) => {
        const deltaTime = currentTime - lastTime
        lastTime = currentTime

        if (prawnGroupRef.current) {
          updatePrawnAnimation(prawnGroupRef.current, deltaTime)
        }
        
        updateEnvironment(deltaTime)

        // Collision check with collectibles
      if (prawnGroupRef.current && collectiblesRef.current) {
          const prawnPos = prawnGroupRef.current.position
          const toRemove: THREE.Object3D[] = []
          collectiblesRef.current.children.forEach((obj) => {
            if (!('itemType' in obj.userData)) return
        const radius = prawnGroupRef.current?.userData?.pickupRadius ?? 0.3
        if (prawnPos.distanceTo(obj.position) < radius) {
              toRemove.push(obj)
              const type = obj.userData.itemType as any
              setInventory((prev) => ({ ...prev, [type]: (prev[type] + 1) as number }))
              playBubbleSound({ volume: 0.5 })
              // Stable toast IDs per item type to avoid stacking
              const id = `pickup-${type}`
              toast.success(`Зібрано інгредієнт: ${type}`, { id })
            }
          })
          toRemove.forEach((obj) => {
            collectiblesRef.current!.remove(obj)
            if ((obj as any).geometry) (obj as any).geometry.dispose?.()
            const mat = (obj as any).material as THREE.Material | undefined
            mat?.dispose?.()
          })
        }

  // Camera follows prawn gently (unless freeCam)
  if (prawnGroupRef.current && !freeCam) {
          const prawnPos = prawnGroupRef.current.position
          const offset: THREE.Vector3 = prawnGroupRef.current.userData.cameraOffset ?? new THREE.Vector3(3, 1.8, 3)
          camera.position.lerp(new THREE.Vector3(prawnPos.x + offset.x, prawnPos.y + offset.y, prawnPos.z + offset.z), 0.02)
          camera.lookAt(prawnPos)
        }

        controls.update()
        if (postFX && composerRef.current) {
          composerRef.current.render()
        } else {
          renderer.render(scene, camera)
        }
        frameRef.current = requestAnimationFrame(animate)
      }

      frameRef.current = requestAnimationFrame(animate)

      // Handle resize
      const handleResize = () => {
        if (!camera || !renderer) return
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
      }

      window.addEventListener('resize', handleResize)

      // Pointer handlers for drawing
  const getNDC = (event: PointerEvent) => {
        const canvas = renderer.domElement
        const rect = canvas.getBoundingClientRect()
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        return { x, y }
      }
      const onDown = (e: PointerEvent) => {
        isDrawingRef.current = true
        draftPointsRef.current = []
        // Clear old line
        if (pathLineRef.current) {
          scene.remove(pathLineRef.current)
          ;(pathLineRef.current.geometry as THREE.BufferGeometry).dispose()
          ;(pathLineRef.current.material as THREE.Material).dispose()
          pathLineRef.current = null
        }
        if (pathTubeRef.current) {
          scene.remove(pathTubeRef.current)
          pathTubeRef.current.geometry.dispose()
          ;(pathTubeRef.current.material as THREE.Material).dispose()
          pathTubeRef.current = null
        }
        curveRef.current = null
        followRef.current.active = false
        onMove(e)
      }
      const onMove = (e: PointerEvent) => {
        if (!isDrawingRef.current) return
        if (!cameraRef.current) return
        const ndc = getNDC(e)
        lastNDCRef.current = ndc
        const p = pointFromNDC(ndc)
        if (!p) return
        const pts = draftPointsRef.current
        if (pts.length === 0 || pts[pts.length - 1].distanceToSquared(p) > 0.02) {
          pts.push(p.clone())
          updateDraftLine()
        }
        if (drawMarkerRef.current) drawMarkerRef.current.position.copy(p)
      }
      const onUp = () => {
        if (!isDrawingRef.current) return
        isDrawingRef.current = false
        finalizePath()
        playSwooshSound({ volume: 0.4 })
      }
      const onHover = (e: PointerEvent) => {
        if (!cameraRef.current) return
        const ndc = getNDC(e)
        lastNDCRef.current = ndc
        const p = pointFromNDC(ndc)
        if (p && drawMarkerRef.current) drawMarkerRef.current.position.copy(p)
      }
      const onWheel = (e: WheelEvent) => {
        // Adjust drawing depth
        drawDistanceRef.current = THREE.MathUtils.clamp(drawDistanceRef.current + (e.deltaY > 0 ? 0.5 : -0.5), 2, 12)
        const ndc = lastNDCRef.current
        const p = pointFromNDC(ndc)
        if (p && drawMarkerRef.current) drawMarkerRef.current.position.copy(p)
      }
      renderer.domElement.addEventListener('pointerdown', onDown)
      renderer.domElement.addEventListener('pointermove', onMove)
      renderer.domElement.addEventListener('pointermove', onHover)
      renderer.domElement.addEventListener('wheel', onWheel, { passive: true })
      window.addEventListener('pointerup', onUp)

      // Cleanup
      return () => {
  renderer.domElement.removeEventListener('pointerdown', onDown)
  renderer.domElement.removeEventListener('pointermove', onMove)
  renderer.domElement.removeEventListener('pointermove', onHover)
  renderer.domElement.removeEventListener('wheel', onWheel)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('resize', handleResize)
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current)
        }
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement)
        }
        scene.clear()
        renderer.dispose()
        // clear incubation timer
        if (incubationTimerRef.current) {
          clearInterval(incubationTimerRef.current)
          incubationTimerRef.current = null
        }
        // remove spawned creatures
        spawnedRef.current.forEach(s => {
          try {
            scene.remove(s)
            if ((s as any).geometry) (s as any).geometry.dispose?.()
          } catch {}
        })
        spawnedRef.current = []
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
    
    // Change swim pattern on click
    const patterns = ['circular', 'figure8', 'random', 'patrol'] as const
    const currentIndex = patterns.indexOf(animationStateRef.current.swimPattern)
    const nextPattern = patterns[(currentIndex + 1) % patterns.length]
    
    animationStateRef.current.swimPattern = nextPattern
    
    // Update game state
    setGameState(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 10),
      experience: prev.experience + 5
    }))
    
  toast.success(`Патерн плавання: ${nextPattern}`, { id: 'swim-pattern' })
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
            if (onMenuToggle) onMenuToggle()
          }}
        >
          <motion.div
            animate={{ rotate: menuVisible ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            ☰
          </motion.div>
        </Button>

        {/* AquaFarm home button */}
        <Button
          variant="default"
          size="sm"
          className="pointer-events-auto absolute top-4 right-20 bg-white/95 backdrop-blur-sm border hover:bg-primary hover:text-white transition-all duration-300"
          onClick={() => {
            playClickSound({ volume: 0.4 })
            if (onNavigateToSite) onNavigateToSite('hero')
          }}
        >
          🏠 AquaFarm
        </Button>

        {/* Enhanced game stats */}
        <div className="pointer-events-auto absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">❤️ Health:</span>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${extendedGameState.health}%` }}
                />
              </div>
              <span className="text-xs">{extendedGameState.health}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">😊 Happiness:</span>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${extendedGameState.happiness}%` }}
                />
              </div>
              <span className="text-xs">{extendedGameState.happiness}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">🍽️ Hunger:</span>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    extendedGameState.hunger < 30 ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${extendedGameState.hunger}%` }}
                />
              </div>
              <span className={`text-xs ${extendedGameState.hunger < 30 ? 'text-red-500 font-bold' : ''}`}>
                {extendedGameState.hunger}%
              </span>
            </div>
            <div className="text-xs text-gray-600">
              Level: {extendedGameState.level} | XP: {extendedGameState.experience} | 💰: {extendedGameState.coins}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant={freeCam ? 'default' : 'outline'}
                onClick={() => {
                  setFreeCam((prev) => {
                    const next = !prev
                    if (controlsRef.current) controlsRef.current.enabled = next
                    return next
                  })
                }}
              >
                🎥 Free Cam
              </Button>
              <Button
                size="sm"
                variant={postFX ? 'default' : 'outline'}
                onClick={() => setPostFX((s) => !s)}
              >
                ✨ Bloom
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const next = species === 'shrimp' ? 'crayfish' : 'shrimp'
                  setSpecies(next)
                  // Rebuild creature
                  const scene = sceneRef.current
                  if (!scene) return
                  const current = prawnGroupRef.current
                  const newCreature = createCreature(next)
                  if (current) {
                    newCreature.position.copy(current.position)
                    scene.remove(current)
                  }
                  scene.add(newCreature)
                  prawnGroupRef.current = newCreature
                }}
              >
                🔁 {species === 'shrimp' ? 'Рак' : 'Креветка'}
              </Button>
            </div>
          </div>
        </div>

  {/* Drawing controls */}
  <div className="pointer-events-auto absolute bottom-6 left-6 flex gap-3 flex-wrap items-center">
          <Button
            variant="default"
            onClick={() => {
              if (!curveRef.current && !isDrawingRef.current) {
                toast.message('Режим малювання: утримуйте ліву кнопку миші')
              }
            }}
          >
            ✏️ Намалювати траєкторію
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Start following if path exists
              if (curveRef.current) {
                followRef.current.t = 0
                followRef.current.active = true
                playSwooshSound({ volume: 0.4 })
              } else {
                toast.error('Немає траєкторії')
              }
            }}
          >
            ▶️ Старт руху
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              // Clear path
              const scene = sceneRef.current
              if (!scene) return
              if (pathLineRef.current) {
                scene.remove(pathLineRef.current)
                ;(pathLineRef.current.geometry as THREE.BufferGeometry).dispose()
                ;(pathLineRef.current.material as THREE.Material).dispose()
                pathLineRef.current = null
              }
              if (pathTubeRef.current) {
                scene.remove(pathTubeRef.current)
                pathTubeRef.current.geometry.dispose()
                ;(pathTubeRef.current.material as THREE.Material).dispose()
                pathTubeRef.current = null
              }
              curveRef.current = null
              draftPointsRef.current = []
              followRef.current.active = false
            }}
          >
            🧹 Очистити
          </Button>
          {/* Drawing tweak controls */}
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md shadow">
            <label className="text-xs text-gray-700">Глибина</label>
            <input
              type="range"
              min={2}
              max={12}
              step={0.5}
              value={drawDepth}
              onChange={(e) => {
                const v = Number(e.target.value)
                setDrawDepth(v)
                drawDistanceRef.current = v
              }}
            />
            <span className="text-xs w-8 text-right">{drawDepth.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md shadow">
            <label className="text-xs text-gray-700">Плавність</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={smoothness}
              onChange={(e) => {
                const v = Number(e.target.value)
                setSmoothness(v)
                // Rebuild tube if curve exists
                if (curveRef.current && draftPointsRef.current.length > 1) {
                  curveRef.current = new THREE.CatmullRomCurve3(draftPointsRef.current, false, 'catmullrom', v)
                  if (pathTubeRef.current && sceneRef.current) {
                    const scene = sceneRef.current
                    scene.remove(pathTubeRef.current)
                    pathTubeRef.current.geometry.dispose()
                    ;(pathTubeRef.current.material as THREE.Material).dispose()
                    pathTubeRef.current = null
                    // regenerate tube
                    const tubularSegments = Math.max(20, draftPointsRef.current.length * 6)
                    const tubeGeom = new THREE.TubeGeometry(curveRef.current, tubularSegments, 0.02, 8, false)
                    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x00c2ff, emissive: 0x002233, metalness: 0.2, roughness: 0.4, transparent: true, opacity: 0.85 })
                    const tube = new THREE.Mesh(tubeGeom, tubeMat)
                    tube.renderOrder = 1
                    scene.add(tube)
                    pathTubeRef.current = tube
                  }
                }
              }}
            />
            <span className="text-xs w-8 text-right">{smoothness.toFixed(2)}</span>
          </div>
          <label className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md shadow text-xs">
            <input
              type="checkbox"
              checked={snapToFloor}
              onChange={(e) => {
                setSnapToFloor(e.target.checked)
                snapToFloorRef.current = e.target.checked
              }}
            />
            Прив'язка до дна
          </label>
          <Button
            variant="outline"
            onClick={() => setShowFeedingPanel(!showFeedingPanel)}
          >
            🍽️ Годування
          </Button>
          <Button
            variant={canCook ? 'default' : 'outline'}
            disabled={!canCook || !petkaPassed}
            onClick={() => {
              if (!petkaPassed) {
                setPetkaOpen(true)
                toast.message('Петька: пройдіть невеликий квіз, щоб відкрити рецепт', { id: 'petka-hint' })
                return
              }
              setShowRecipe((s) => !s)
            }}
          >
            {petkaPassed ? '🍳 Рецепт' : '🤖 Петька: Квіз'}
          </Button>
        </div>

        {/* Inventory & Recipe Panel */}
        <div className="pointer-events-auto absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg min-w-64">
          <p className="font-semibold mb-2">Інвентар</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>🧄 Часник: {inventory.garlic}</div>
            <div>🌿 Зелень: {inventory.herb}</div>
            <div>🍋 Лимон: {inventory.lemon}</div>
            <div>🧈 Верш. масло: {inventory.butter}</div>
            <div>🧂 Сіль: {inventory.salt}</div>
            <div>🌶️ Перець: {inventory.pepper}</div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              variant={
                inventory.garlic >= (recipeRequirements.garlic || 1) &&
                inventory.herb >= (recipeRequirements.herb || 2) &&
                inventory.lemon >= (recipeRequirements.lemon || 1)
                ? 'default' : 'outline'
              }
              onClick={() => {
                const can = inventory.garlic >= (recipeRequirements.garlic || 1) && inventory.herb >= (recipeRequirements.herb || 2) && inventory.lemon >= (recipeRequirements.lemon || 1)
                if (!can) { toast.error('Немає потрібних інгредієнтів для рецепту'); return }
                // consume minimal recipe
                setInventory(prev => ({ ...prev, garlic: prev.garlic - 1, herb: Math.max(0, prev.herb - 2), lemon: Math.max(0, prev.lemon - 1) }))
                setExtendedGameState(s => ({ ...s, coins: s.coins + 25, experience: s.experience + 20 }))
                toast.success('Швидке приготування: +25💰 +20 XP')
              }}
            >
              ✅ Приготувати
            </Button>

            <Button
              size="sm"
              variant={extendedGameState.coins >= 50 && !incubating ? 'default' : 'outline'}
              onClick={() => {
                if (incubating) { toast('Інкубація вже йде'); return }
                if (extendedGameState.coins < 50) { toast.error('Потрібно 50💰 для інкубації'); return }
                setExtendedGameState(s => ({ ...s, coins: s.coins - 50 }))
                // start incubation
                const duration = 20000
                setIncubating(true)
                setIncubationProgress(0)
                incubationEndsAtRef.current = Date.now() + duration
                toast('Інкубація розпочата: через 20с з`явиться нова креветка')
                incubationTimerRef.current = window.setInterval(() => {
                  // use rAF-driven smooth progress
                  const updateSmooth = () => {
                    if (!incubationEndsAtRef.current) return
                    const now = Date.now()
                    const remaining = Math.max(0, incubationEndsAtRef.current - now)
                    const t = Math.max(0, Math.min(1, 1 - remaining / duration))
                    setIncubationProgress(t)
                    // if completed
                    if (t >= 1) {
                      // finish
                      if (incubationTimerRef.current) { clearInterval(incubationTimerRef.current); incubationTimerRef.current = null }
                      setIncubating(false)
                      setIncubationProgress(1)
                      // reward + spawn
                      setExtendedGameState(s => ({ ...s, growth: Math.min(100, s.growth + 15), coins: s.coins + 80, experience: s.experience + 30 }))
                      toast.success('Інкубація завершена: народилася креветка! +80💰')
                      // spawn creature visually
                      const spawned = spawnCreatureAt(species)
                      if (spawned) {
                        // small pop animation
                        spawned.scale.setScalar(0.01)
                        const targetScale = 1
                        let tAnim = 0
                        const anim = () => {
                          tAnim += 0.06
                          const s = THREE.MathUtils.lerp(0.01, targetScale, Math.min(1, tAnim))
                          spawned.scale.setScalar(s)
                          if (tAnim < 1) requestAnimationFrame(anim)
                        }
                        anim()
                        // spawn VFX
                        playSpawnVFX(spawned.position)
                      }
                    }
                  }
                  updateSmooth()
                }, 200)
              }}
            >
              🐣 Інкубація (50💰)
            </Button>
          </div>
          {/* Incubation progress */}
          {incubating && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <div>Інкубація</div>
                <div>{incubationSecondsLeft !== null ? `${incubationSecondsLeft}s` : ''}</div>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${incubationProgress * 100}%` }}
                  transition={{ ease: 'linear', duration: 0.18 }}
                  className="bg-emerald-500 h-2 rounded"
                />
              </div>
            </div>
          )}
          {showRecipe && petkaPassed && (
            <div className="mt-3 text-sm">
              <p className="font-medium mb-1">Рецепт: Смажені креветки з часником та лимоном</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Промийте креветку та обсушіть.</li>
                <li>Розтопіть 🧈 масло на сковороді.</li>
                <li>Додайте 🧄 часник та 🌿 зелень, обсмажте 30 сек.</li>
                <li>Покладіть креветку, посоліть 🧂 та поперчіть 🌶️.</li>
                <li>Додайте сік 🍋 лимона, готуйте до рожевого кольору.</li>
              </ul>
              <Button
                className="mt-3"
                disabled={!canCook}
                onClick={() => {
                  if (!canCook) return
                  toast.success('Страва готова! Смачного 🦐')
                  // consume items
                  setInventory((prev) => {
                    const next = { ...prev }
                    ;(Object.keys(recipeRequirements) as any).forEach((k: keyof typeof recipeRequirements) => {
                      next[k] = Math.max(0, next[k] - recipeRequirements[k])
                    })
                    return next
                  })
                  setShowRecipe(false)
                }}
              >
                ✅ Приготувати
              </Button>
            </div>
          )}
        </div>

        {/* Feeding Panel */}
        {showFeedingPanel && (
          <div className="pointer-events-auto absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-2xl max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">🍽️ Годування креветки</h3>
              <Button size="sm" variant="outline" onClick={() => setShowFeedingPanel(false)}>✕</Button>
            </div>
            
            {/* Enhanced stats display */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>🍽️ Голод:</span>
                  <span className={extendedGameState.hunger < 30 ? 'text-red-500 font-bold' : 'text-green-600'}>{extendedGameState.hunger}%</span>
                </div>
                <div className="flex justify-between">
                  <span>💰 Монети:</span>
                  <span className="font-bold">{extendedGameState.coins}</span>
                </div>
                <div className="flex justify-between">
                  <span>🔥 Серія:</span>
                  <span>{extendedGameState.feedingStreak}</span>
                </div>
              </div>
            </div>

            {/* Food selection */}
            <div className="space-y-3">
              <h4 className="font-semibold">Виберіть корм:</h4>
              {foodTypes.map(food => (
                <div
                  key={food.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    extendedGameState.coins < food.cost ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'
                  } ${isFeeding ? 'pointer-events-none' : ''}`}
                  onClick={() => !isFeeding && extendedGameState.coins >= food.cost && feedCreature(food)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{food.icon}</span>
                      <div>
                        <div className="font-medium">{food.name}</div>
                        <div className="text-xs text-gray-600">📊 {food.nutritionValue}/10</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">💰 {food.cost}</div>
                      {extendedGameState.coins < food.cost && (
                        <div className="text-xs text-red-500">Недостатньо монет</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {isFeeding && (
              <div className="mt-4 text-center">
                <div className="text-2xl animate-bounce">🦐</div>
                <div className="text-sm text-gray-600">Годування...</div>
              </div>
            )}
          </div>
        )}

        {/* Interaction hints */}
        {!audioEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-auto absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-sm"
          >
            🖱️ Клікніть, щоб активувати звук. Утримуйте ЛКМ для малювання шляху.
          </motion.div>
        )}

        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg"
          >
            <p className="text-sm font-medium">🦐 Реалістична симуляція креветки</p>
            <p className="text-xs text-gray-600">Порада: намалюйте траєкторію по дну, а потім запустіть рух ▶️</p>
            <p className="text-xs text-gray-600">Збирайте інгредієнти для рецепту 🍳</p>
          </motion.div>
        )}
      </div>
      {/* Petka Quiz Modal */}
      <PetkaQuiz
        isOpen={petkaOpen}
        onClose={() => setPetkaOpen(false)}
        onPassed={() => {
          setPetkaPassed(true)
          sessionStorage.setItem('petkaPassed', '1')
          toast.success('Петька: доступ до рецепту відкрито!', { id: 'petka-pass' })
          setShowRecipe(true)
        }}
        requiredCorrect={3}
      />
    </div>
  )
}

export default PrawnVisualization
