import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

export type MenuNode = {
  key: string
  label: string
  icon?: React.ComponentType<any>
  children?: MenuNode[]
}

interface HierarchicalMenuProps {
  tree: MenuNode[]
  onNavigate: (key: string) => void
  onClose?: () => void
  className?: string
  // Admin mode integration
  isAdminMode?: boolean
  onAdminOpen?: () => void
}

export function HierarchicalMenu({ tree, onNavigate, onClose, className, isAdminMode, onAdminOpen }: HierarchicalMenuProps) {
  const [stack, setStack] = useState<MenuNode[][]>([tree])

  const current = stack[stack.length - 1]

  const drillIn = (node: MenuNode) => {
    if (node.children && node.children.length) {
      setStack(prev => [...prev, node.children!])
    } else {
      onNavigate(node.key)
      onClose?.()
    }
  }

  const goBack = () => {
    if (stack.length > 1) setStack(prev => prev.slice(0, prev.length - 1))
    else onClose?.()
  }

  const breadcrumb = stack.map(level => level[0]?.key).filter(Boolean)

  const container = {
    enter: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 },
  }

  return (
    <div className={`aqua-hierarchical-menu ${className || ''}`}>
      <div className="aqua-menu-header">
        <div className="aqua-menu-nav">
          <Button size="sm" variant="ghost" onClick={goBack} className="aqua-back-btn">
            ←
          </Button>
          <div className="aqua-menu-title">Меню</div>
        </div>
        <div className="aqua-menu-right">
          {isAdminMode && (
            <div className="aqua-admin-tools">
              <span className="aqua-admin-chip">Admin mode</span>
              <Button size="sm" className="aqua-admin-btn" onClick={() => onAdminOpen?.()}>
                Open Admin
              </Button>
            </div>
          )}
          <div className="aqua-menu-level">
            {stack.length > 1 ? `Level ${stack.length}` : 'Top'}
          </div>
        </div>
      </div>

      <div className="aqua-menu-content">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={stack.length}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="aqua-menu-items"
          >
            <div className="aqua-items-grid">
              {current.map(node => (
                <Button
                  key={node.key}
                  variant="outline"
                  size="default"
                  className="aqua-menu-item"
                  onClick={() => {
                    // clicking the main item name navigates directly to the node
                    onNavigate(node.key)
                    onClose?.()
                  }}
                >
                  {node.icon ? (
                    <node.icon size={18} className="aqua-menu-icon" />
                  ) : (
                    <span className="aqua-menu-icon-placeholder" />
                  )}
                  <span className="aqua-menu-label">{node.label}</span>
                  {node.children && node.children.length > 0 && (
                    <span
                      className="aqua-menu-arrow"
                      onClick={(e: React.MouseEvent) => {
                        // stop propagation so the parent click doesn't also navigate
                        e.stopPropagation()
                        // drill into children
                        setStack(prev => [...prev, node.children!])
                      }}
                    >
                      {node.children.length} →
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="aqua-menu-footer">Кроки: {stack.length}</div>
    </div>
  )
}

export default HierarchicalMenu
