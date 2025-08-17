import { MenuNode } from '@/components/HierarchicalMenu'
import { 
  House, 
  Info, 
  ShoppingCart, 
  Images, 
  CookingPot, 
  Star, 
  Phone, 
  Settings, 
  Leaf, 
  Cpu, 
  Truck, 
  Briefcase, 
  Gamepad2, 
  Package, 
  CreditCard,
  User
} from 'lucide-react'

export function createMenuTree(): MenuNode[] {
  return [
    {
      key: 'hero',
      label: '🏠 Головна',
      icon: House,
      children: [
        {
          key: 'hero',
          label: 'Головна сторінка',
          icon: House,
        },
        {
          key: 'hero-3d',
          label: '🔍 3D Візуалізація',
          icon: House,
        },
      ],
    },
    {
      key: 'information',
      label: 'ℹ️ Інформація',
      icon: Info,
      children: [
        {
          key: 'about',
          label: 'Про нас',
          icon: Info,
        },
        {
          key: 'gallery',
          label: 'Галерея',
          icon: Images,
        },
        {
          key: 'reviews',
          label: 'Відгуки',
          icon: Star,
        },
        {
          key: 'contact',
          label: 'Контакти',
          icon: Phone,
        },
      ],
    },
    {
      key: 'shop',
      label: '🛍️ Магазин',
      icon: ShoppingCart,
      children: [
        {
          key: 'products',
          label: 'Товари',
          icon: ShoppingCart,
        },
        {
          key: 'orders',
          label: 'Замовлення',
          icon: Package,
        },
        {
          key: 'shop-test',
          label: 'Тест магазину',
          icon: ShoppingCart,
        },
      ],
    },
    {
      key: 'delivery',
      label: '🚚 Доставка',
      icon: Truck,
    },
    {
      key: 'games',
      label: '🎮 Ігри',
      icon: Gamepad2,
      children: [
        {
          key: 'game',
          label: 'Aqua Гра',
          icon: Gamepad2,
        },
        {
          key: 'feeding',
          label: 'Годування',
          icon: CookingPot,
        },
        {
          key: 'petka',
          label: 'Petka Гра',
          icon: User,
        },
      ],
    },
    {
      key: 'recipes',
      label: '👨‍🍳 Рецепти',
      icon: CookingPot,
    },
    {
      key: 'technology',
      label: '⚙️ Технології',
      icon: Cpu,
      children: [
        {
          key: 'technology',
          label: 'Основні технології',
          icon: Cpu,
        },
        {
          key: 'eco-farming',
          label: 'Еко-фермерство',
          icon: Leaf,
        },
        {
          key: 'professional',
          label: 'Професійні рішення',
          icon: Briefcase,
        },
      ],
    },
    {
      key: 'admin',
      label: '🔧 Адміністрування',
      icon: Settings,
      children: [
        {
          key: 'admin',
          label: 'Панель адміна',
          icon: Settings,
        },
        {
          key: 'payment-admin',
          label: 'Платежі',
          icon: CreditCard,
        },
      ],
    },
  ]
}