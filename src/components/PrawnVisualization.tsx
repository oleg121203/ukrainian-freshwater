import { useRef, useEffect, useState } from 'react'
// import * as THREE from 'three'
import { motion } from 'framer-motion'

interface PrawnVisualizationProps {
  onMenuToggle: (show: boolean) => void
  menuVisible: boolean
}

export function PrawnVisualization({ onMenuToggle, menuVisible }: PrawnVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    // Temporarily disable 3D rendering to debug the error
    setIsLoaded(true)
  }, [onMenuToggle, menuVisible])

  const handleClick = () => {
    onMenuToggle(!menuVisible)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-aqua">
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-pointer flex items-center justify-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      />
      
      {/* Temporary placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-8xl mb-4">🦐</div>
          <h2 className="text-3xl font-bold mb-2">AquaFarm</h2>
          <p className="text-lg opacity-75">Натисніть для відкриття меню</p>
        </div>
      </div>
      
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