import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Trash, 
  CreditCard, 
  MapPin, 
  Phone,
  User,
  Mail,
  Package
} from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { useShoppingCart, CartItem, Order } from '@/hooks/useShoppingCart'

interface CustomerInfo {
  firstName: string
  lastName: string
  phone: string
  email: string
}

interface DeliveryInfo {
  city: string
  address: string
  notes?: string
  deliveryTime: 'morning' | 'afternoon' | 'evening'
}

interface ShoppingCartProps {
  isVisible: boolean
  onClose: () => void
}

export function ShoppingCart({ isVisible, onClose }: ShoppingCartProps) {
  const { language, t } = useLanguage()
  const { 
    cart, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getTotalPrice, 
    getTotalItems,
    createOrder 
  } = useShoppingCart()
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmation'>('cart')
  
  // Customer and delivery form state
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  })
  
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    city: '',
    address: '',
    notes: '',
    deliveryTime: 'morning'
  })
  
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Customer info persistence
  const [savedCustomerInfo, setSavedCustomerInfo] = useKV<CustomerInfo>('customer-info', {
    firstName: '', lastName: '', phone: '', email: ''
  })

  useEffect(() => {
    if (savedCustomerInfo.firstName) {
      setCustomerInfo(savedCustomerInfo)
    }
  }, [savedCustomerInfo])

  const totalPrice = getTotalPrice()
  const totalItems = getTotalItems()

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity)
  }

  const handleRemoveFromCart = (itemId: string) => {
    removeFromCart(itemId)
    toast.success(
      language === 'uk' ? 'Товар видалено з кошика' : 'Item removed from cart'
    )
  }

  const handleClearCart = () => {
    clearCart()
    toast.success(
      language === 'uk' ? 'Кошик очищено' : 'Cart cleared'
    )
  }

  const cities = [
    'Київ', 'Харків', 'Одеса', 'Дніпро', 'Львів', 'Запоріжжя', 
    'Кривий Ріг', 'Миколаїв', 'Маріуполь', 'Луганськ', 'Вінниця',
    'Макіївка', 'Сімферополь', 'Херсон', 'Полтава', 'Чернігів',
    'Черкаси', 'Житомир', 'Суми', 'Хмельницький'
  ]

  const validateForm = () => {
    const { firstName, lastName, phone, email } = customerInfo
    const { city, address } = deliveryInfo

    if (!firstName || !lastName || !phone || !email || !city || !address) {
      toast.error(
        language === 'uk' 
          ? 'Будь ласка, заповніть всі обов\'язкові поля'
          : 'Please fill in all required fields'
      )
      return false
    }

    // Basic phone validation
    if (!/^\+?[\d\s\-\(\)]+$/.test(phone)) {
      toast.error(
        language === 'uk' 
          ? 'Введіть коректний номер телефону'
          : 'Please enter a valid phone number'
      )
      return false
    }

    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error(
        language === 'uk' 
          ? 'Введіть коректну електронну адресу'
          : 'Please enter a valid email address'
      )
      return false
    }

    return true
  }

  const submitOrder = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Save customer info for future use
      setSavedCustomerInfo(customerInfo)

      // Create order using the hook
      createOrder(customerInfo, deliveryInfo, paymentMethod)
      
      // Move to confirmation
      setStep('confirmation')
      
      toast.success(
        language === 'uk' 
          ? 'Замовлення успішно оформлено!'
          : 'Order placed successfully!'
      )

    } catch (error) {
      toast.error(
        language === 'uk' 
          ? 'Помилка при оформленні замовлення'
          : 'Error placing order'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep('cart')
    onClose()
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="fixed right-0 top-0 h-full w-full max-w-lg bg-background shadow-2xl"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <ShoppingCart size={24} className="text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">
                    {step === 'cart' && (language === 'uk' ? 'Кошик' : 'Shopping Cart')}
                    {step === 'checkout' && (language === 'uk' ? 'Оформлення замовлення' : 'Checkout')}
                    {step === 'confirmation' && (language === 'uk' ? 'Підтвердження' : 'Confirmation')}
                  </h2>
                  {step === 'cart' && (
                    <p className="text-sm text-muted-foreground">
                      {totalItems} {language === 'uk' ? 'товарів' : 'items'} • {totalPrice} UAH
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X size={20} />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {step === 'cart' && (
                <div className="p-6">
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart size={64} className="text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {language === 'uk' ? 'Кошик порожній' : 'Cart is empty'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <Card key={item.id} className="p-4">
                          <div className="flex gap-4">
                            <div className="text-3xl">{item.image}</div>
                            <div className="flex-1">
                              <h3 className="font-medium leading-tight">
                                {language === 'uk' ? item.name_uk : item.name_en}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {item.weight}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-8 h-8 p-0"
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  >
                                    <Minus size={14} />
                                  </Button>
                                  <span className="w-8 text-center text-sm">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-8 h-8 p-0"
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                  >
                                    <Plus size={14} />
                                  </Button>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">
                                    {item.price * item.quantity} UAH
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive"
                                    onClick={() => handleRemoveFromCart(item.id)}
                                  >
                                    <Trash size={14} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 'checkout' && (
                <div className="p-6 space-y-6">
                  {/* Customer Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User size={20} />
                        {language === 'uk' ? 'Інформація про покупця' : 'Customer Information'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">
                            {language === 'uk' ? 'Ім\'я' : 'First Name'} *
                          </Label>
                          <Input
                            id="firstName"
                            value={customerInfo.firstName}
                            onChange={(e) => setCustomerInfo(prev => ({
                              ...prev, firstName: e.target.value
                            }))}
                            placeholder={language === 'uk' ? 'Ваше ім\'я' : 'Your first name'}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">
                            {language === 'uk' ? 'Прізвище' : 'Last Name'} *
                          </Label>
                          <Input
                            id="lastName"
                            value={customerInfo.lastName}
                            onChange={(e) => setCustomerInfo(prev => ({
                              ...prev, lastName: e.target.value
                            }))}
                            placeholder={language === 'uk' ? 'Ваше прізвище' : 'Your last name'}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone">
                          <Phone size={16} className="inline mr-1" />
                          {language === 'uk' ? 'Телефон' : 'Phone'} *
                        </Label>
                        <Input
                          id="phone"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({
                            ...prev, phone: e.target.value
                          }))}
                          placeholder="+380 XX XXX XX XX"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">
                          <Mail size={16} className="inline mr-1" />
                          {language === 'uk' ? 'Електронна пошта' : 'Email'} *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({
                            ...prev, email: e.target.value
                          }))}
                          placeholder="your@email.com"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin size={20} />
                        {language === 'uk' ? 'Доставка' : 'Delivery'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="city">
                          {language === 'uk' ? 'Місто' : 'City'} *
                        </Label>
                        <Select
                          value={deliveryInfo.city}
                          onValueChange={(value) => setDeliveryInfo(prev => ({
                            ...prev, city: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              language === 'uk' ? 'Оберіть місто' : 'Select city'
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map(city => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="address">
                          {language === 'uk' ? 'Адреса' : 'Address'} *
                        </Label>
                        <Input
                          id="address"
                          value={deliveryInfo.address}
                          onChange={(e) => setDeliveryInfo(prev => ({
                            ...prev, address: e.target.value
                          }))}
                          placeholder={
                            language === 'uk' 
                              ? 'Вулиця, будинок, квартира'
                              : 'Street, house, apartment'
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="deliveryTime">
                          {language === 'uk' ? 'Час доставки' : 'Delivery Time'}
                        </Label>
                        <Select
                          value={deliveryInfo.deliveryTime}
                          onValueChange={(value: 'morning' | 'afternoon' | 'evening') => 
                            setDeliveryInfo(prev => ({ ...prev, deliveryTime: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="morning">
                              {language === 'uk' ? 'Ранок (9:00 - 12:00)' : 'Morning (9:00 - 12:00)'}
                            </SelectItem>
                            <SelectItem value="afternoon">
                              {language === 'uk' ? 'День (12:00 - 17:00)' : 'Afternoon (12:00 - 17:00)'}
                            </SelectItem>
                            <SelectItem value="evening">
                              {language === 'uk' ? 'Вечір (17:00 - 20:00)' : 'Evening (17:00 - 20:00)'}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="notes">
                          {language === 'uk' ? 'Примітки' : 'Notes'}
                        </Label>
                        <Textarea
                          id="notes"
                          value={deliveryInfo.notes}
                          onChange={(e) => setDeliveryInfo(prev => ({
                            ...prev, notes: e.target.value
                          }))}
                          placeholder={
                            language === 'uk'
                              ? 'Додаткова інформація для кур\'єра'
                              : 'Additional information for courier'
                          }
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Method */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard size={20} />
                        {language === 'uk' ? 'Спосіб оплати' : 'Payment Method'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">
                            {language === 'uk' ? 'Готівка при отриманні' : 'Cash on delivery'}
                          </SelectItem>
                          <SelectItem value="card">
                            {language === 'uk' ? 'Картою при отриманні' : 'Card on delivery'}
                          </SelectItem>
                          <SelectItem value="transfer">
                            {language === 'uk' ? 'Банківський переказ' : 'Bank transfer'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Order Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package size={20} />
                        {language === 'uk' ? 'Підсумок замовлення' : 'Order Summary'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {language === 'uk' ? item.name_uk : item.name_en}
                          </span>
                          <span>{item.price * item.quantity} UAH</span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>{language === 'uk' ? 'Всього' : 'Total'}:</span>
                        <span>{totalPrice} UAH</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {step === 'confirmation' && (
                <div className="p-6 text-center">
                  <div className="text-6xl mb-6">🎉</div>
                  <h3 className="text-2xl font-bold mb-4">
                    {language === 'uk' ? 'Дякуємо за замовлення!' : 'Thank you for your order!'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {language === 'uk' 
                      ? 'Ваше замовлення прийнято і буде доставлено протягом 24 годин. Ми зв\'яжемося з вами для підтвердження.'
                      : 'Your order has been received and will be delivered within 24 hours. We will contact you for confirmation.'
                    }
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{language === 'uk' ? 'Сума замовлення:' : 'Order total:'} {totalPrice} UAH</p>
                    <p>{language === 'uk' ? 'Доставка:' : 'Delivery:'} {deliveryInfo.city}</p>
                    <p>{language === 'uk' ? 'Телефон:' : 'Phone:'} {customerInfo.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-6">
              {step === 'cart' && cart.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      {language === 'uk' ? 'Всього:' : 'Total:'}
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {totalPrice} UAH
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={handleClearCart}>
                      {language === 'uk' ? 'Очистити' : 'Clear'}
                    </Button>
                    <Button onClick={() => setStep('checkout')}>
                      {language === 'uk' ? 'Оформити' : 'Checkout'}
                    </Button>
                  </div>
                </div>
              )}

              {step === 'checkout' && (
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => setStep('cart')}>
                    {language === 'uk' ? 'Назад' : 'Back'}
                  </Button>
                  <Button onClick={submitOrder} disabled={isSubmitting}>
                    {isSubmitting 
                      ? (language === 'uk' ? 'Оформлення...' : 'Submitting...')
                      : (language === 'uk' ? 'Підтвердити' : 'Confirm')
                    }
                  </Button>
                </div>
              )}

              {step === 'confirmation' && (
                <Button className="w-full" onClick={handleClose}>
                  {language === 'uk' ? 'Готово' : 'Done'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}