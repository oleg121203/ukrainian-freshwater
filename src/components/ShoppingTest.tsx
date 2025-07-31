import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Package, Plus } from '@phosphor-icons/react'
import { useShoppingCart, SAMPLE_PRODUCTS } from '@/hooks/useShoppingCart'
import { ShoppingCart as ShoppingCartComponent } from '@/components/ShoppingCart'
import { OrdersManagement } from '@/components/OrdersManagement'
import { useLanguage } from '@/contexts/LanguageContext'

interface ShoppingTestProps {
  onNavigate?: (section: string) => void
}

export function ShoppingTest({ onNavigate }: ShoppingTestProps) {
  const { language } = useLanguage()
  const { cart, orders, addToCart, getTotalItems, getTotalPrice } = useShoppingCart()
  const [showCart, setShowCart] = useState(false)
  const [showOrders, setShowOrders] = useState(false)

  const addSampleItem = () => {
    const randomProduct = SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)]
    addToCart(randomProduct, 1)
  }

  if (showOrders) {
    return <OrdersManagement onNavigate={onNavigate} />
  }

  return (
    <section className="py-20 px-6 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          {language === 'uk' ? 'Тест системи замовлень' : 'Shopping System Test'}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Cart Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart size={20} />
                {language === 'uk' ? 'Кошик' : 'Cart'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">
                    {language === 'uk' ? 'Товарів:' : 'Items:'}
                  </span>{' '}
                  {getTotalItems()}
                </p>
                <p>
                  <span className="font-medium">
                    {language === 'uk' ? 'Сума:' : 'Total:'}
                  </span>{' '}
                  {getTotalPrice()} UAH
                </p>
                <div className="pt-2 space-y-2">
                  <Button onClick={addSampleItem} className="w-full">
                    <Plus size={16} className="mr-2" />
                    {language === 'uk' ? 'Додати товар' : 'Add Item'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCart(true)} 
                    className="w-full"
                    disabled={cart.length === 0}
                  >
                    {language === 'uk' ? 'Переглянути кошик' : 'View Cart'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package size={20} />
                {language === 'uk' ? 'Замовлення' : 'Orders'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">
                    {language === 'uk' ? 'Всього замовлень:' : 'Total Orders:'}
                  </span>{' '}
                  {orders.length}
                </p>
                <p>
                  <span className="font-medium">
                    {language === 'uk' ? 'Останнє:' : 'Latest:'}
                  </span>{' '}
                  {orders.length > 0 
                    ? new Date(orders[orders.length - 1].createdAt).toLocaleDateString()
                    : language === 'uk' ? 'Немає' : 'None'
                  }
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowOrders(true)} 
                  className="w-full"
                >
                  {language === 'uk' ? 'Переглянути замовлення' : 'View Orders'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sample Products */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'uk' ? 'Тестові товари' : 'Sample Products'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {language === 'uk' 
                    ? 'У системі доступно товарів:'
                    : 'Available products in system:'
                  }
                </p>
                {SAMPLE_PRODUCTS.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">
                      {product.image} {language === 'uk' ? product.name_uk : product.name_en}
                    </span>
                    <Badge variant="secondary">{product.price} UAH</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Cart Items */}
        {cart.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {language === 'uk' ? 'Товари в кошику' : 'Items in Cart'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.image}</span>
                      <div>
                        <p className="font-medium">
                          {language === 'uk' ? item.name_uk : item.name_en}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {item.price} UAH
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {item.quantity * item.price} UAH
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shopping Cart Modal */}
        <ShoppingCartComponent 
          isVisible={showCart}
          onClose={() => setShowCart(false)}
        />
      </div>
    </section>
  )
}