import { createContext, useContext, useState, ReactNode } from 'react'

interface LanguageContextType {
  language: 'uk' | 'en'
  setLanguage: (lang: 'uk' | 'en') => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations = {
  uk: {
    // Navigation
    'nav.home': 'Головна',
    'nav.about': 'Про нас',
    'nav.products': 'Продукція',
    'nav.gallery': 'Галерея',
    'nav.shop': 'Магазин',
    'nav.recipes': 'Рецепти',
    'nav.reviews': 'Відгуки',
    'nav.contact': 'Контакти',
  'nav.orders': 'Замовлення',
  'nav.game': 'Гра',
  'nav.admin': 'Адмін',
  'nav.more': 'Ще',
  'nav.eco': 'Еко-ферма',
  'nav.tech': 'Технології',
  'nav.delivery': 'Доставка',
  'nav.pro': 'Професіоналам',
  'nav.feed': 'Годування',
  'nav.shopTest': 'Тест магазину',
  'nav.payAdmin': 'Платежі (адмін)',
  'nav.petka': 'Петька',

    // Hero section
    'hero.title': 'Свіжі креветки Macrobrachium rosenbergii',
    'hero.subtitle': 'Вирощуємо найякісніші річкові креветки в екологічно чистих умовах',
    'hero.cta': 'Переглянути продукцію',
    'hero.learn-more': 'Дізнатися більше',

    // Products
    'products.title': 'Наша продукція',
    'products.fresh': 'Свіжі креветки',
    'products.frozen': 'Заморожені креветки',
    'products.live': 'Живі креветки',
  // Game submenu
  'game.interactive': 'Інтерактив',
  'game.3d': '3D',
    'products.per-kg': 'за кг',
    'products.add-to-cart': 'Додати в кошик',

    // About
    'about.title': 'Про наше господарство',
    'about.description':
      'Ми спеціалізуємося на вирощуванні малайзійських креветок Macrobrachium rosenbergii в екологічно чистих умовах. Наша ферма використовує найсучасніші технології для забезпечення найвищої якості продукції.',

    // Footer
    'footer.rights': 'Всі права захищені',
    'footer.phone': 'Телефон',
    'footer.email': 'Електронна пошта',
    'footer.address': 'Адреса',

    // Cart
    'cart.title': 'Кошик',
    'cart.empty': 'Ваш кошик порожній',
    'cart.total': 'Загальна сума',
    'cart.checkout': 'Оформити замовлення',
    'cart.remove': 'Видалити',

    // Common
    'common.loading': 'Завантаження...',
    'common.price': 'Ціна',
    'common.quantity': 'Кількість',
    'common.save': 'Зберегти',
    'common.cancel': 'Скасувати',

    // Feeding Game
    'feedingSimulation': 'Симулятор годування креветок',
    'feedingDescription': 'Нагодуйте свою креветку і слідкуйте за її розвитком!',
    'prawnStats': 'Статистика креветки',
    'hunger': 'Голод',
    'health': "Здоров'я",
    'growth': 'Ріст',
    'mood': 'Настрій',
    'colorIntensity': 'Яскравість кольору',
    'experience': 'Досвід',
    'coins': 'Монети',
    'streak': 'Серія',
    'chooseFood': 'Виберіть корм',
    'feeding': 'Годування',
    'levelUp': 'Новий рівень!',
    'notEnoughCoins': 'Недостатньо монет',
    'prawnFed': 'Креветку нагодовано!',
    'dailyBonusClaimed': 'Щоденний бонус отримано!',
    'recentFeedings': 'Останні годування',
    'unknownFood': 'Невідомий корм',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.products': 'Products',
    'nav.gallery': 'Gallery',
    'nav.shop': 'Shop',
    'nav.recipes': 'Recipes',
    'nav.reviews': 'Reviews',
    'nav.contact': 'Contact',
  'nav.orders': 'Orders',
  'nav.game': 'Game',
  'nav.admin': 'Admin',
  'nav.more': 'More',
  'nav.eco': 'Eco Farming',
  'nav.tech': 'Technology',
  'nav.delivery': 'Delivery',
  'nav.pro': 'For Professionals',
  'nav.feed': 'Feeding',
  'nav.shopTest': 'Shop Test',
  'nav.payAdmin': 'Payment Admin',
  'nav.petka': 'Petka',

    // Hero section
    'hero.title': 'Fresh Macrobrachium rosenbergii Prawns',
    'hero.subtitle': 'Growing the finest freshwater prawns in eco-friendly conditions',
    'hero.cta': 'View Products',
    'hero.learn-more': 'Learn More',

    // Products
    'products.title': 'Our Products',
    'products.fresh': 'Fresh Prawns',
    'products.frozen': 'Frozen Prawns',
    'products.live': 'Live Prawns',
  // Game submenu
  'game.interactive': 'Interactive',
  'game.3d': '3D',
    'products.per-kg': 'per kg',
    'products.add-to-cart': 'Add to Cart',

    // About
    'about.title': 'About Our Farm',
    'about.description':
      'We specialize in growing Malaysian prawns Macrobrachium rosenbergii in eco-friendly conditions. Our farm uses cutting-edge technology to ensure the highest quality products.',

    // Footer
    'footer.rights': 'All rights reserved',
    'footer.phone': 'Phone',
    'footer.email': 'Email',
    'footer.address': 'Address',

    // Cart
    'cart.title': 'Cart',
    'cart.empty': 'Your cart is empty',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'cart.remove': 'Remove',

    // Common
    'common.loading': 'Loading...',
    'common.price': 'Price',
    'common.quantity': 'Quantity',
    'common.save': 'Save',
    'common.cancel': 'Cancel',

    // Feeding Game
    'feedingSimulation': 'Prawn Feeding Simulator',
    'feedingDescription': 'Feed your prawn and watch it grow!',
    'prawnStats': 'Prawn Stats',
    'hunger': 'Hunger',
    'health': 'Health',
    'growth': 'Growth',
    'mood': 'Mood',
    'colorIntensity': 'Color Intensity',
    'experience': 'Experience',
    'coins': 'Coins',
    'streak': 'Streak',
    'chooseFood': 'Choose Food',
    'feeding': 'Feeding',
    'levelUp': 'Level Up!',
    'notEnoughCoins': 'Not enough coins',
    'prawnFed': 'Prawn fed!',
    'dailyBonusClaimed': 'Daily bonus claimed!',
    'recentFeedings': 'Recent Feedings',
    'unknownFood': 'Unknown food',
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<'uk' | 'en'>('uk')

  const t = (key: string): string => {
    const translation = translations[language][key as keyof (typeof translations)['uk']]
    return translation || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
