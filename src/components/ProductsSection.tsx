import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Plus, Minus, Phone, BookOpen, ArrowRight, Package } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useKV } from '@/hooks/useKV'
import { toast } from 'sonner'
import { ShoppingCart as ShoppingCartComponent } from '@/components/ShoppingCart'
import { useShoppingCart, SAMPLE_PRODUCTS } from '@/hooks/useShoppingCart'

interface ProductsSectionProps {
  onNavigate?: (section: string) => void
}

export function ProductsSection({ onNavigate }: ProductsSectionProps) {
  const { language, t } = useLanguage()
  const { cart, addToCart, getTotalItems, getTotalPrice } = useShoppingCart()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [showCart, setShowCart] = useState(false)

  const products = SAMPLE_PRODUCTS

  const handleAddToCart = (product: typeof products[0]) => {
    const quantity = quantities[product.id] || 1
    addToCart(product, quantity)

    toast.success(
      language === 'uk' 
        ? `Додано ${quantity} x ${product.name_uk} до кошика`
        : `Added ${quantity} x ${product.name_en} to cart`
    )

    setQuantities(prev => ({ ...prev, [product.id]: 1 }))
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) newQuantity = 1
    if (newQuantity > 10) newQuantity = 10
    setQuantities(prev => ({ ...prev, [productId]: newQuantity }))
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'fresh': return 'bg-green-500'
      case 'frozen': return 'bg-blue-500'
      case 'live': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground heading-font mb-4">
            {t('products.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === 'uk' 
              ? 'Оберіть найкращі креветки для ваших потреб'
              : 'Choose the best prawns for your needs'
            }
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
                <CardHeader className="pb-4">
                  <div className="relative">
                    <div className="text-6xl text-center mb-4">{product.image}</div>
                    <Badge 
                      className={`absolute top-0 right-0 text-white ${getCategoryBadgeColor(product.category)}`}
                    >
                      {t(`products.${product.category}`)}
                    </Badge>
                    {!product.inStock && (
                      <Badge variant="destructive" className="absolute bottom-0 left-0">
                        {language === 'uk' ? 'Немає в наявності' : 'Out of Stock'}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg leading-tight">
                    {language === 'uk' ? product.name_uk : product.name_en}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {language === 'uk' ? product.description_uk : product.description_en}
                  </p>
                </CardHeader>

                <CardContent className="pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-2xl font-bold text-primary">
                        {product.price} {product.currency}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {t('products.per-kg')} • {product.weight}
                      </p>
                    </div>
                  </div>

                  {product.inStock && (
                    <div className="flex items-center justify-between bg-muted rounded-lg p-2">
                      <span className="text-sm font-medium">{t('common.quantity')}:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-8 h-8 p-0"
                          onClick={() => updateQuantity(product.id, (quantities[product.id] || 1) - 1)}
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {quantities[product.id] || 1}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-8 h-8 p-0"
                          onClick={() => updateQuantity(product.id, (quantities[product.id] || 1) + 1)}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    disabled={!product.inStock}
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart size={18} className="mr-2" />
                    {t('products.add-to-cart')}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Info Section */}
        <motion.div
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50" onClick={() => onNavigate?.('contact')}>
            <CardContent className="p-8 text-center">
              <Phone size={48} className="text-primary mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-semibold mb-3">
                {language === 'uk' ? 'Індивідуальні замовлення' : 'Custom Orders'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'uk' 
                  ? 'Потрібні особливі розміри або великі обсяги? Зв\'яжіться з нами для індивідуального пропозиції.'
                  : 'Need special sizes or large volumes? Contact us for a custom offer.'
                }
              </p>
              <Button variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">
                {language === 'uk' ? 'Зв\'язатися' : 'Contact'} <ArrowRight size={16} className="ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50" onClick={() => onNavigate?.('recipes')}>
            <CardContent className="p-8 text-center">
              <BookOpen size={48} className="text-primary mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-semibold mb-3">
                {language === 'uk' ? 'Рецепти приготування' : 'Cooking Recipes'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'uk' 
                  ? 'Дізнайтеся секрети приготування найсмачніших страв з наших креветок.'
                  : 'Learn the secrets of cooking the most delicious dishes with our prawns.'
                }
              </p>
              <Button variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">
                {language === 'uk' ? 'Переглянути рецепти' : 'View Recipes'} <ArrowRight size={16} className="ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cart summary */}
        {cart.length > 0 && (
          <motion.div
            className="fixed bottom-6 right-6 z-30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card 
              className="bg-primary text-primary-foreground shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300"
              onClick={() => setShowCart(true)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ShoppingCart size={24} />
                  <div>
                    <p className="font-semibold">
                      {getTotalItems()} {language === 'uk' ? 'товарів' : 'items'}
                    </p>
                    <p className="text-sm opacity-90">
                      {getTotalPrice()} UAH
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Additional Action Buttons */}
        <motion.div
          className="mt-16 flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => setShowCart(true)}
            className="flex items-center gap-3"
          >
            <ShoppingCart size={20} />
            {language === 'uk' ? 'Переглянути кошик' : 'View Cart'}
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getTotalItems()}
              </Badge>
            )}
          </Button>
          
          <Button 
            size="lg" 
            onClick={() => onNavigate?.('orders')}
            className="flex items-center gap-3"
          >
            <Package size={20} />
            {language === 'uk' ? 'Мої замовлення' : 'My Orders'}
          </Button>
        </motion.div>

        {/* Shopping Cart Modal */}
        <ShoppingCartComponent 
          isVisible={showCart}
          onClose={() => setShowCart(false)}
        />
      </div>
    </section>
  )
}