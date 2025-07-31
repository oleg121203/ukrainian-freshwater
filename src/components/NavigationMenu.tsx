import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Fish, Images, BookOpen, Star, Phone, Globe, GearSix, Bowl } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAudio } from '@/hooks/useAudio'
import { Button } from '@/components/ui/button'

interface NavigationMenuProps {
  isVisible: boolean
  onNavigate: (section: string) => void
  onClose: () => void
}

export function NavigationMenu({ isVisible, onNavigate, onClose }: NavigationMenuProps) {
  const { language, setLanguage, t } = useLanguage()
  const { playClickSound, playBubbleSound } = useAudio()

  const menuItems = [
    { key: 'hero', icon: Fish, label: t('nav.home') },
    { key: 'about', icon: BookOpen, label: t('nav.about') },
    { key: 'products', icon: ShoppingCart, label: t('nav.products') },
    { key: 'feeding', icon: Bowl, label: language === 'uk' ? 'Годування' : 'Feeding' },
    { key: 'gallery', icon: Images, label: t('nav.gallery') },
    { key: 'recipes', icon: BookOpen, label: t('nav.recipes') },
    { key: 'reviews', icon: Star, label: t('nav.reviews') },
    { key: 'contact', icon: Phone, label: t('nav.contact') },
    { key: 'admin', icon: GearSix, label: 'Адмін' },
  ]

  const containerVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      y: -50
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -50,
      transition: {
        duration: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.8
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  }

  const bubbleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    }
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

              {/* Circular menu items */}
              <div className="relative w-96 h-96">
                {menuItems.map((item, index) => {
                  const angle = (index * 360) / menuItems.length
                  const radian = (angle * Math.PI) / 180
                  const radius = 150
                  const x = Math.cos(radian) * radius
                  const y = Math.sin(radian) * radius

                  return (
                    <motion.div
                      key={item.key}
                      className="absolute top-1/2 left-1/2"
                      style={{
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      }}
                      variants={itemVariants}
                      whileHover={{ 
                        scale: 1.1,
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg hover:shadow-xl"
                        onMouseEnter={() => playBubbleSound({ volume: 0.15, playbackRate: 1.3 + Math.random() * 0.4 })}
                        onClick={() => {
                          playClickSound({ volume: 0.4, playbackRate: 1.1 })
                          onNavigate(item.key)
                          onClose()
                        }}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <item.icon size={24} />
                          <span className="text-xs font-medium">{item.label}</span>
                        </div>
                      </Button>
                    </motion.div>
                  )
                })}
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
                  {language === 'uk' ? 'Натисніть поза меню для закриття' : 'Click outside to close'}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}