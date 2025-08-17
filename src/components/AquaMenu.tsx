import React, { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { HierarchicalMenu, MenuNode } from '@/components/HierarchicalMenu'
import { X, Menu } from 'lucide-react'
import { useClickAway } from 'react-use'

import '@/styles/AquaMenu.css'

interface AquaMenuProps {
  tree: MenuNode[]
  onNavigate: (key: string) => void
  // Admin mode integration
  isAdminMode?: boolean
  onAdminOpen?: () => void
}

export function AquaMenu({ tree, onNavigate, isAdminMode, onAdminOpen }: AquaMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useClickAway(menuRef, () => {
    if (isOpen) {
      setIsOpen(false)
    }
  })

  const handleNavigate = (key: string) => {
    onNavigate(key)
    setIsOpen(false)
  }

  return (
    <>
      <Button
        className="aqua-menu-trigger"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* keep container in DOM to avoid layout shift / missing mount on some environments */}
      <motion.div
        ref={menuRef}
        className={`aqua-menu-container ${isOpen ? 'open' : 'closed'}`}
        initial={false}
        animate={isOpen ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        aria-hidden={!isOpen}
      >
        <HierarchicalMenu
          tree={tree}
          onNavigate={handleNavigate}
          onClose={() => setIsOpen(false)}
          isAdminMode={isAdminMode}
          onAdminOpen={onAdminOpen}
        />
      </motion.div>
    </>
  )
}
