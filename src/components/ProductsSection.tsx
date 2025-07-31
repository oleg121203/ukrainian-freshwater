import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Plus, Minus, Phone, BookOpen, ArrowRight } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface Product {
  id: string
  name_uk: string
  name_en: string
  description_uk: string
  description_en: string
  price: number
  currency: string
  image: string
  category: 'fresh' | 'frozen' | 'live'
  weight: string
  inStock: boolean
}

interface CartItem extends Product {
  quantity: number
}

interface ProductsSectionProps {
  onNavigate?: (section: string) => void
}

export function ProductsSection({ onNavigate }: ProductsSectionProps) {
  const { language, t } = useLanguage()
  const [cart, setCart] = useKV<CartItem[]>('shopping-cart', [])
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const products: Product[] = [
    {
      id: 'fresh-prawns-1kg',
      name_uk: 'Свіжі креветки (1 кг)',
      name_en: 'Fresh Prawns (1 kg)',
      description_uk: 'Свіжі малайзійські креветки найвищої якості, виловлені сьогодні вранці',
      description_en: 'Fresh Malaysian prawns of the highest quality, caught this morning',
      price: 850,
      currency: 'UAH',
      image: '🦐',
      category: 'fresh',
      weight: '1 kg',
      inStock: true
    },
    {
      id: 'frozen-prawns-500g',
      name_uk: 'Заморожені креветки (500 г)',
      name_en: 'Frozen Prawns (500 g)',
      description_uk: 'Швидко заморожені креветки, зберігають усі корисні властивості',
      description_en: 'Quick-frozen prawns that retain all beneficial properties',
      price: 320,
      currency: 'UAH',
      image: '🧊',
      category: 'frozen',
      weight: '500 g',
      inStock: true
    },
    {
      id: 'live-prawns-2kg',
      name_uk: 'Живі креветки (2 кг)',
      name_en: 'Live Prawns (2 kg)',
      description_uk: 'Живі креветки для ресторанів та особливих випадків',
      description_en: 'Live prawns for restaurants and special occasions',
      price: 1600,
      currency: 'UAH',
      image: '🌊',
      category: 'live',
      weight: '2 kg',
      inStock: true
    },
    {
      id: 'premium-selection',
      name_uk: 'Преміум відбірні (750 г)',
      name_en: 'Premium Selection (750 g)',
      description_uk: 'Відбірні великі креветки для найвибагливіших гурманів',
      description_en: 'Selected large prawns for the most discerning gourmets',
      price: 950,
      currency: 'UAH',
      image: '⭐',
      category: 'fresh',
      weight: '750 g',
      inStock: false
    }
  ]

  const addToCart = (product: Product) => {
    const quantity = quantities[product.id] || 1
    
    setCart((currentCart) => {
      const existingItem = currentCart.find(item => item.id === product.id)
      
      if (existingItem) {
        return currentCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        return [...currentCart, { ...product, quantity }]
      }
    })

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
                    onClick={() => addToCart(product)}
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
            <Card className="bg-primary text-primary-foreground shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ShoppingCart size={24} />
                  <div>
                    <p className="font-semibold">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)} {language === 'uk' ? 'товарів' : 'items'}
                    </p>
                    <p className="text-sm opacity-90">
                      {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)} UAH
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </section>
  )
}