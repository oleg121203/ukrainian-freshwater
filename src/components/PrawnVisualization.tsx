import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { motion } from 'framer-motion'

interface PrawnVisualizationProps {
  onMenuToggle: (show: boolean) => void
  menuVisible: boolean
}

export function PrawnVisualization({ onMenuToggle, menuVisible }: PrawnVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const prawnRef = useRef<THREE.Group>()
  const animationIdRef = useRef<number>()
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f8ff)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 0, 5)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0x00aaff, 0.5, 100)
    pointLight.position.set(-5, 0, 3)
    scene.add(pointLight)

    // Create stylized prawn
    const prawnGroup = new THREE.Group()
    
    // Body (main cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.2, 2, 12)
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff6b47,
      shininess: 30,
      transparent: true,
      opacity: 0.9
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.rotation.z = Math.PI / 2
    body.castShadow = true
    prawnGroup.add(body)

    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16)
    const headMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff8566,
      shininess: 20
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.x = 1.2
    head.scale.set(1.2, 0.8, 0.8)
    head.castShadow = true
    prawnGroup.add(head)

    // Tail segments
    for (let i = 0; i < 5; i++) {
      const segmentGeometry = new THREE.CylinderGeometry(
        0.15 - i * 0.02, 
        0.12 - i * 0.02, 
        0.3, 
        8
      )
      const segment = new THREE.Mesh(segmentGeometry, bodyMaterial)
      segment.position.x = -1 - i * 0.25
      segment.rotation.z = Math.PI / 2
      segment.castShadow = true
      prawnGroup.add(segment)
    }

    // Antennae
    for (let side of [-1, 1]) {
      const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.01, 1.5, 4)
      const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0xcc4422 })
      const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial)
      antenna.position.set(1.5, side * 0.2, 0.2)
      antenna.rotation.z = (Math.PI / 6) * side
      antenna.rotation.y = Math.PI / 4
      prawnGroup.add(antenna)
    }

    // Swimming legs
    for (let i = 0; i < 8; i++) {
      for (let side of [-1, 1]) {
        const legGeometry = new THREE.CylinderGeometry(0.02, 0.01, 0.4, 4)
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0xdd5533 })
        const leg = new THREE.Mesh(legGeometry, legMaterial)
        leg.position.set(0.5 - i * 0.2, side * 0.35, -0.1)
        leg.rotation.z = side * Math.PI / 3
        prawnGroup.add(leg)
      }
    }

    prawnRef.current = prawnGroup
    scene.add(prawnGroup)

    // Position prawn
    prawnGroup.position.set(0, 0, 0)
    prawnGroup.rotation.y = Math.PI / 6

    setIsLoaded(true)

    // Mouse interaction
    let mouseX = 0
    let mouseY = 0
    let targetRotationY = Math.PI / 6
    let targetRotationX = 0

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1
      
      targetRotationY = Math.PI / 6 + mouseX * 0.3
      targetRotationX = mouseY * 0.2
    }

    const handleClick = () => {
      onMenuToggle(!menuVisible)
    }

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      if (prawnRef.current) {
        // Smooth rotation
        prawnRef.current.rotation.y += (targetRotationY - prawnRef.current.rotation.y) * 0.05
        prawnRef.current.rotation.x += (targetRotationX - prawnRef.current.rotation.x) * 0.05
        
        // Floating animation
        prawnRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1
        
        // Breathing effect
        const scale = 1 + Math.sin(Date.now() * 0.002) * 0.02
        prawnRef.current.scale.set(scale, scale, scale)
      }

      renderer.render(scene, camera)
    }

    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
    }

    renderer.domElement.addEventListener('mousemove', handleMouseMove)
    renderer.domElement.addEventListener('click', handleClick)
    window.addEventListener('resize', handleResize)

    animate()

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      renderer.domElement.removeEventListener('mousemove', handleMouseMove)
      renderer.domElement.removeEventListener('click', handleClick)
      window.removeEventListener('resize', handleResize)
      mountRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [onMenuToggle, menuVisible])

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-aqua flex items-center justify-center">
          <div className="text-white text-2xl font-semibold">Завантаження 3D моделі...</div>
        </div>
      )}
      
      {/* Interaction hint */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/80 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
        transition={{ delay: 1 }}
      >
        <div className="bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2">
          <p className="text-sm">Рухайте мишкою для обертання</p>
          <p className="text-xs opacity-75">Натисніть для відкриття меню</p>
        </div>
      </motion.div>

      {/* Hover effect indicator */}
      {isHovered && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <div className="w-32 h-32 border-2 border-white/30 rounded-full animate-pulse" />
        </motion.div>
      )}
    </div>
  )
}