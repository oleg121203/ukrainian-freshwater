import { useKV } from '@/hooks/useKV'
import { useLanguage } from '@/contexts/LanguageContext'

export interface Product {
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

export interface CartItem extends Product {
  quantity: number
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  customerInfo: {
    firstName: string
    lastName: string
    phone: string
    email: string
  }
  deliveryInfo: {
    city: string
    address: string
    notes?: string
    deliveryTime: 'morning' | 'afternoon' | 'evening'
  }
  paymentMethod: string
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: string
  estimatedDelivery: string
}

export const useShoppingCart = () => {
  const { language } = useLanguage()
  const [cart, setCart] = useKV<CartItem[]>('shopping-cart', [])
  const [orders, setOrders] = useKV<Order[]>('user-orders', [])

  const addToCart = (product: Product, quantity: number = 1) => {
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
  }

  const removeFromCart = (productId: string) => {
    setCart((currentCart) => currentCart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((currentCart) => 
      currentCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  const createOrder = (customerInfo: Order['customerInfo'], deliveryInfo: Order['deliveryInfo'], paymentMethod: string) => {
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      items: [...cart],
      total: getTotalPrice(),
      customerInfo,
      deliveryInfo,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    setOrders((currentOrders) => [...currentOrders, newOrder])
    clearCart()
    
    return newOrder
  }

  return {
    cart,
    orders,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    createOrder,
    setCart,
    setOrders
  }
}

// Sample products data
export const SAMPLE_PRODUCTS: Product[] = [
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