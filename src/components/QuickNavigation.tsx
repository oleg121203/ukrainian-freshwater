import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { List, X } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'

interface QuickNavigationProps {
  onNavigate: (section: string) => void
  currentSection: string
}

interface NavItem {
  key: string
  label_uk: string
  label_en: string
  icon: string
}

const navItems: NavItem[] = [
  { key: 'hero', label_uk: 'Головна', label_en: 'Home', icon: '🏠' },
  { key: 'about', label_uk: 'Про нас', label_en: 'About', icon: '📖' },
  { key: 'products', label_uk: 'Магазин', label_en: 'Shop', icon: '🛒' },
  { key: 'recipes', label_uk: 'Рецепти', label_en: 'Recipes', icon: '📝' },
  { key: 'gallery', label_uk: 'Галерея', label_en: 'Gallery', icon: '🖼️' },
  { key: 'game', label_uk: 'Гра', label_en: 'Game', icon: '🎮' },
  { key: 'contact', label_uk: 'Контакти', label_en: 'Contact', icon: '📞' },
  { key: 'admin', label_uk: 'Адмін', label_en: 'Admin', icon: '⚙️' },
]

export function QuickNavigation({ onNavigate, currentSection }: QuickNavigationProps) {
  const { language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const handleNavigate = (section: string) => {
    onNavigate(section)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/90 text-foreground px-3 py-2 rounded-full shadow-lg border hover:bg-white transition-all duration-300 hover:scale-105"
      >
        {isOpen ? <X size={16} /> : <List size={16} />}
        <span className="ml-2 text-sm">
          {language === 'uk' ? 'Меню' : 'Menu'}
        </span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-20"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <motion.div
              className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border z-30"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="py-2">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleNavigate(item.key)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground transition-colors duration-200 flex items-center gap-3 ${
                      currentSection === item.key 
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{language === 'uk' ? item.label_uk : item.label_en}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}