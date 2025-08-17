import { motion, AnimatePresence } from 'framer-motion'
import { Globe } from '@phosphor-icons/react'
import HierarchicalMenu, { MenuNode } from '@/components/HierarchicalMenu'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAudio } from '@/hooks/useAudio'
import { Button } from '@/components/ui/button'
import { navTree, findNodeByKey } from '@/config/navigation'

interface NavigationMenuProps {
  isVisible: boolean
  onNavigate: (section: string) => void
  onClose: () => void
}

export function NavigationMenu({ isVisible, onNavigate, onClose }: NavigationMenuProps) {
  const { language, setLanguage, t } = useLanguage()
  const { playClickSound, playBubbleSound } = useAudio()
  const isAuthed = typeof window !== 'undefined' && !!sessionStorage.getItem('adminAuthed')

  // Преобразуем конфиг в структуру MenuNode, подтягивая локализацию
  const toMenuNodes = (nodes: typeof navTree): MenuNode[] =>
    nodes
      .filter(n => (n.requiresAuth ? isAuthed : true))
      .map(n => ({
        key: n.key,
        label: t(n.labelKey) || n.labelKey,
        icon: n.icon,
        children: n.children ? toMenuNodes(n.children) : undefined,
      }))
  const tree = toMenuNodes(navTree)

  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: -50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -50,
      transition: {
        duration: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.6, -0.05, 0.01, 0.99] as [number, number, number, number],
      },
    },
  }

  const bubbleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 15,
      },
    },
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Background overlay */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Menu container */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="relative">
              {/* Central logo/title */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10"
                variants={bubbleVariants}
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-primary/20">
                  <h2 className="text-2xl font-bold text-gradient-primary heading-font mb-2">
                    AquaFarm
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {language === 'uk' ? 'Свіжі креветки' : 'Fresh Prawns'}
                  </p>
                </div>
              </motion.div>

              {/* Hierarchical menu */}
              <div className="relative w-[28rem]">
                <HierarchicalMenu
                  className="p-2"
                  onNavigate={(k) => {
                    const node = findNodeByKey(navTree, k)
                    if (node?.requiresAuth && !isAuthed) {
                      onNavigate('admin-login')
                    } else {
                      onNavigate(node?.section || k)
                    }
                    onClose()
                  }}
                  onClose={onClose}
                  tree={tree as MenuNode[]}
                />
              </div>

              {/* Language switcher */}
              <motion.div
                className="absolute -bottom-16 left-1/2 transform -translate-x-1/2"
                variants={itemVariants}
              >
                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                  <Globe size={20} className="text-muted-foreground" />
                  <Button
                    variant={language === 'uk' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      playClickSound({ volume: 0.3, playbackRate: 1.2 })
                      setLanguage('uk')
                    }}
                  >
                    УК
                  </Button>
                  <Button
                    variant={language === 'en' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      playClickSound({ volume: 0.3, playbackRate: 1.2 })
                      setLanguage('en')
                    }}
                  >
                    EN
                  </Button>
                </div>
              </motion.div>

              {/* Close hint */}
              <motion.div
                className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-center"
                variants={itemVariants}
              >
                <p className="text-white text-sm bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1">
                  {language === 'uk'
                    ? 'Натисніть поза меню для закриття'
                    : 'Click outside to close'}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
