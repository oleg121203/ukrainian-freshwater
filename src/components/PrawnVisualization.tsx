import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { motion } from 'framer-motion'

interface PrawnVisualizationProps {
  onMenuToggle: (show: boolean) => void
  menuVisible: boolean
}

export function PrawnVisualization({ onMenuToggle, menuVisible }: PrawnVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const frameRef = useRef<number | null>(null)
  const prawnGroupRef = useRef<THREE.Group | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!mountRef.current) return

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
    mountRef.current.appendChild(renderer.domElement)

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
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Animation loop
    const animate = () => {
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

      renderer.render(scene, camera)
    }

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Start animation
    animate()
    setIsLoaded(true)

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  const handleClick = () => {
    onMenuToggle(!menuVisible)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-aqua">
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      />
      
      {/* Logo overlay */}
      <div className="absolute top-8 left-8 text-white pointer-events-none">
        <h1 className="text-4xl font-bold heading-font">AquaFarm</h1>
        <p className="text-lg opacity-75">Macrobrachium rosenbergii</p>
      </div>
      
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
          <p className="text-sm opacity-75 mt-1">Натисніть для відкриття меню</p>
        </div>
      </motion.div>

      {/* Menu button indicator */}
      <motion.div 
        className="absolute top-8 right-8 text-white pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.8 }}
        transition={{ delay: 2 }}
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 border border-white/20">
          <div className="w-6 h-6 flex flex-col justify-center space-y-1">
            <div className="h-0.5 bg-white rounded"></div>
            <div className="h-0.5 bg-white rounded"></div>
            <div className="h-0.5 bg-white rounded"></div>
          </div>
        </div>
      </motion.div>

      {/* Hover effect indicator */}
      {isHovered && isLoaded && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="w-40 h-40 border-2 border-white/40 rounded-full animate-pulse">
            <div className="w-32 h-32 border border-white/20 rounded-full m-4 animate-ping"></div>
          </div>
        </motion.div>
      )}
    </div>
  )
}