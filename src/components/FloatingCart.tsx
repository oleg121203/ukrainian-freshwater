import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useShoppingCart } from '@/hooks/useShoppingCart'

interface FloatingCartProps {
  onClick: () => void
  className?: string
}

export function FloatingCart({ onClick, className = '' }: FloatingCartProps) {
  const { language } = useLanguage()
  const { cart, getTotalItems, getTotalPrice } = useShoppingCart()

  return (
    <AnimatePresence>
      {cart.length > 0 && (
        <motion.div
          className={`fixed bottom-6 right-6 z-30 ${className}`}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card 
            className="bg-primary text-primary-foreground shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-primary-foreground/20"
            onClick={onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart size={24} />
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 bg-accent text-accent-foreground min-w-[20px] h-5 text-xs flex items-center justify-center"
                  >
                    {getTotalItems()}
                  </Badge>
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {getTotalItems()} {language === 'uk' ? 'товарів' : 'items'}
                  </p>
                  <p className="text-xs opacity-90">
                    {getTotalPrice()} UAH
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}