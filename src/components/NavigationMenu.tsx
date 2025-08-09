import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  Fish,
  Images,
  BookOpen,
  Star,
  Phone,
  Globe,
  GearSix,
  CookingPot,
  Package,
} from '@phosphor-icons/react'
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

  const primary = [
    { key: 'about', icon: BookOpen, label: language === 'uk' ? 'Про нас' : 'About' },
    { key: 'products', icon: ShoppingCart, label: language === 'uk' ? 'Магазин' : 'Shop' },
    { key: 'recipes', icon: BookOpen, label: language === 'uk' ? 'Рецепти' : 'Recipes' },
    { key: 'contact', icon: Phone, label: language === 'uk' ? 'Контакти' : 'Contact' },
  ]
  const secondary = [
    { key: 'gallery', icon: Images, label: language === 'uk' ? 'Галерея' : 'Gallery' },
    { key: 'reviews', icon: Star, label: language === 'uk' ? 'Відгуки' : 'Reviews' },
    { key: 'orders', icon: Package, label: language === 'uk' ? 'Замовлення' : 'Orders' },
    { key: 'feeding', icon: CookingPot, label: language === 'uk' ? 'Годування' : 'Feeding' },
    { key: 'admin', icon: GearSix, label: language === 'uk' ? 'Адмін' : 'Admin' },
  ]

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

              {/* Clear actions grid */}
              <div className="relative w-[28rem]">
                <div className="grid grid-cols-2 gap-4">
                  {primary.map((item) => (
                    <motion.div key={item.key} variants={itemVariants}>
                      <Button
                        variant="default"
                        size="lg"
                        className="w-full h-20 rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-lg"
                        onMouseEnter={() => playBubbleSound({ volume: 0.15, playbackRate: 1.3 })}
                        onClick={() => {
                          playClickSound({ volume: 0.4, playbackRate: 1.1 })
                          onNavigate(item.key)
                          onClose()
                        }}
                      >
                        <div className="flex items-center gap-2 text-base">
                          <item.icon size={22} />
                          <span className="font-semibold">{item.label}</span>
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {secondary.map((item) => (
                    <motion.div key={item.key} variants={itemVariants}>
                      <Button
                        variant="outline"
                        size="default"
                        className="w-full h-12 rounded-lg bg-white/90 hover:bg-primary hover:text-primary-foreground"
                        onClick={() => {
                          playClickSound({ volume: 0.4, playbackRate: 1.05 })
                          onNavigate(item.key)
                          onClose()
                        }}
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <item.icon size={18} />
                          <span>{item.label}</span>
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
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
