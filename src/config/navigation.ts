import { ComponentType } from 'react'
import { BookOpen, ShoppingCart, Images, Star, Phone, GearSix, Package, GameController } from '@phosphor-icons/react'

export type NavNode = {
  key: string
  labelKey: string
  icon?: ComponentType<any>
  section?: string
  requiresAuth?: boolean
  children?: NavNode[]
}

export const navTree: NavNode[] = [
  { key: 'hero', labelKey: 'nav.home', section: 'hero' },
  { key: 'about', labelKey: 'nav.about', icon: BookOpen, section: 'about' },
  {
    key: 'products',
    labelKey: 'nav.products',
    icon: ShoppingCart,
    section: 'products',
    children: [
      { key: 'products-fresh', labelKey: 'products.fresh', section: 'products' },
      { key: 'products-frozen', labelKey: 'products.frozen', section: 'products' },
    ],
  },
  { key: 'gallery', labelKey: 'nav.gallery', icon: Images, section: 'gallery' },
  { key: 'recipes', labelKey: 'nav.recipes', icon: BookOpen, section: 'recipes' },
  { key: 'reviews', labelKey: 'nav.reviews', icon: Star, section: 'reviews' },
  { key: 'contact', labelKey: 'nav.contact', icon: Phone, section: 'contact' },
  { key: 'orders', labelKey: 'nav.orders', icon: Package, section: 'orders' },
  {
    key: 'game',
    labelKey: 'nav.game',
    icon: GameController,
    section: 'game',
    children: [
      { key: 'game-interactive', labelKey: 'game.interactive', section: 'game' },
      { key: 'game-3d', labelKey: 'game.3d', section: 'hero' },
    ],
  },
  {
    key: 'more',
    labelKey: 'nav.more',
    children: [
      { key: 'eco-farming', labelKey: 'nav.eco', section: 'eco-farming' },
      { key: 'technology', labelKey: 'nav.tech', section: 'technology' },
      { key: 'delivery', labelKey: 'nav.delivery', section: 'delivery' },
      { key: 'professional', labelKey: 'nav.pro', section: 'professional' },
      { key: 'feeding', labelKey: 'nav.feed', section: 'feeding' },
      { key: 'shop-test', labelKey: 'nav.shopTest', section: 'shop-test' },
      { key: 'payment-admin', labelKey: 'nav.payAdmin', section: 'payment-admin' },
      { key: 'petka', labelKey: 'nav.petka', section: 'petka' },
    ],
  },
  { key: 'admin', labelKey: 'nav.admin', icon: GearSix, section: 'admin', requiresAuth: true },
]

export function flattenSections(tree: NavNode[]): string[] {
  const out = new Set<string>()
  const walk = (nodes: NavNode[]) => {
    for (const n of nodes) {
      if (n.section) out.add(n.section)
      if (n.children) walk(n.children)
    }
  }
  walk(tree)
  return Array.from(out)
}

export function findNodeByKey(tree: NavNode[], key: string): NavNode | undefined {
  const stack: NavNode[] = [...tree]
  while (stack.length) {
    const n = stack.shift()!
    if (n.key === key) return n
    if (n.children) stack.push(...n.children)
  }
  return undefined
}
