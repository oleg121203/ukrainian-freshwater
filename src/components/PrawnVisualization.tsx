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
    const createPrawnMaterial = (baseColor: number, roughness = 0.3, metalness = 0.1, options: any = {}) => {
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness,
        metalness,
        transparent: true,
        opacity: options.opacity || 0.95,
        side: THREE.DoubleSide,
        ...options
      })
      
      // Add subtle texture variation using vertex colors
      if (options.addNoise) {
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
    
    // Cephalothorax (head-chest region) - more detailed and realistic
    const cephalothoraxGeometry = new THREE.SphereGeometry(0.5, 20, 16)
    cephalothoraxGeometry.scale(1.3, 0.9, 1.6) // More elongated and realistic
    
    // Add surface detail to cephalothorax
    const positions = cephalothoraxGeometry.attributes.position.array as Float32Array
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]
      
      // Add subtle bumps and ridges for realism
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

    // Eyes (compound eyes on stalks) - more realistic
    const eyeStalkGeometry = new THREE.CylinderGeometry(0.06, 0.09, 0.25, 12)
    
    // Add texture to eye stalks
    const eyeStalkPositions = eyeStalkGeometry.attributes.position.array as Float32Array
    for (let i = 0; i < eyeStalkPositions.length; i += 3) {
      const x = eyeStalkPositions[i]
      const y = eyeStalkPositions[i + 1]
      const z = eyeStalkPositions[i + 2]
      
      // Add subtle surface texture
      const texture = Math.sin(y * 20) * Math.cos(Math.atan2(z, x) * 8) * 0.008
      eyeStalkPositions[i] = x + texture
      eyeStalkPositions[i + 2] = z + texture
    }
    eyeStalkGeometry.attributes.position.needsUpdate = true
    eyeStalkGeometry.computeVertexNormals()
    
    const eyeGeometry = new THREE.SphereGeometry(0.14, 16, 12)
    
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
      
      const length = Math.sqrt(x*x + y*y + z*z)
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
      envMapIntensity: 2
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

        // Mood-based overall scaling
        const moodScale = gameState.prawnMood === 'excited' ? 1.05 : 
                          gameState.prawnMood === 'swimming' ? 1.02 : 1
        const breathingScale = 1 + Math.sin(time * 3) * 0.02 * animationStateRef.current.breathingIntensity
        prawnGroupRef.current.scale.setScalar(moodScale * breathingScale)

        // Reactive lighting based on swimming activity with enhanced effects
        if (scene.children.find(child => child.type === 'PointLight')) {
          const lights = scene.children.filter(child => child.type === 'PointLight') as THREE.PointLight[]
          lights.forEach((light, index) => {
            const baseIntensity = gameState.prawnMood === 'excited' ? 0.9 : 
                                 gameState.prawnMood === 'swimming' ? 0.8 : 0.7
            light.intensity = baseIntensity + Math.sin(time * 2 + index) * 0.1 * animationStateRef.current.swimIntensity
            
            // Add subtle color shifting for underwater ambiance
            const colorShift = Math.sin(time * 0.5 + index) * 0.1
            if (index === 0) {
              light.color.setHSL(0.55 + colorShift * 0.1, 0.8, 0.6)
            } else if (index === 1) {
              light.color.setHSL(0.5 + colorShift * 0.1, 0.7, 0.6)
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
          <p className="text-base font-medium">🎮 Фотореалістична креветка</p>
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
                <p className="text-sm font-medium">🎮 Фотореалістична креветка</p>
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