import { Suspense, lazy, useMemo, useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AquaMenu } from '@/components/AquaMenu'
import { MenuNode } from '@/components/HierarchicalMenu'
const PrawnVisualization = lazy(() => import('@/components/PrawnVisualization'))
import { PetkaGame } from '@/components/PetkaGame'
import { NavigationMenu } from '@/components/NavigationMenu'
import { HeroSection } from '@/components/HeroSection'
import { AboutSection } from '@/components/AboutSection'
import { ProductsSection } from '@/components/ProductsSection'
import { GallerySection } from '@/components/GallerySection'
import { RecipesSection } from '@/components/RecipesSection'
import { ReviewsSection } from '@/components/ReviewsSection'
import { ContactSection } from '@/components/ContactSection'
import { AdminGate } from '@/components/AdminGate'
import { EcoFarmingSection } from '@/components/EcoFarmingSection'
import { TechnologySection } from '@/components/TechnologySection'
import { DeliverySection } from '@/components/DeliverySection'
import { ProfessionalSection } from '@/components/ProfessionalSection'
import { FeedingSimulation } from '@/components/FeedingSimulation'
import { AquaGame } from '@/components/AquaGame'
import { OrdersManagement } from '@/components/OrdersManagement'
import { ShoppingCart } from '@/components/ShoppingCart'
import { FloatingCart } from '@/components/FloatingCart'
import { ShoppingTest } from '@/components/ShoppingTest'
import { PaymentAdmin } from '@/components/PaymentAdmin'
import { useAudio } from '@/hooks/useAudio'
import { Button } from '@/components/ui/button'
import AdminBanner from '@/components/AdminBanner'
import { flattenSections, navTree, NavNode, findNodeByKey } from '@/config/navigation'

function App() {
  const [currentSection, setCurrentSection] = useState<string>('hero')
  const [menuVisible, setMenuVisible] = useState(false)
  const [show3D, setShow3D] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [prevSection, setPrevSection] = useState<string | null>(null)
  const { playSwooshSound } = useAudio()

  // Навигационные секции из единого конфига
  const allSections = useMemo(() => flattenSections(navTree), [])

  // Admin mode state for menu reactivity
  const [adminMode, setAdminMode] = useState(false)
  
  // Check admin status on mount and update state
  useEffect(() => {
    const checkAdmin = () => {
      const isAdmin = typeof window !== 'undefined' && sessionStorage.getItem('adminAuthed')
      setAdminMode(!!isAdmin)
    }
    checkAdmin()
    
    // Listen for storage changes to update menu when admin status changes
    window.addEventListener('storage', checkAdmin)
    return () => window.removeEventListener('storage', checkAdmin)
  }, [])

  const labelFor = (sectionName: string) => {
    // Попробуем найти узел по section, без локализации (Debug-панель)
    const flat = (arr: any[]) => arr.flatMap(n => [n, ...(n.children ? flat(n.children) : [])])
    const node = flat(navTree).find((n: any) => n.section === sectionName)
    if (node && node.labelKey) {
      const last = String(node.labelKey).split('.').pop() || sectionName
      return last.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    }
    switch (sectionName) {
      case 'eco-farming':
        return 'Eco'
      case 'technology':
        return 'Tech'
      case 'delivery':
        return 'Ship'
      case 'professional':
        return 'Pro'
      case 'feeding':
        return 'Feed'
      case 'orders':
        return 'Orders'
      case 'shop-test':
        return 'Test'
      case 'payment-admin':
        return 'Pay'
      default:
        return sectionName
    }
  }

  const menuTree: MenuNode[] = useMemo(() => {
    const isAdmin = typeof window !== 'undefined' && sessionStorage.getItem('adminAuthed')
    
    const transform = (nodes: NavNode[]): MenuNode[] => {
      return nodes.filter(node => {
        // Show admin nodes only if admin mode is active
        if (node.requiresAuth && !isAdmin) return false
        return true
      }).map(node => ({
        key: node.key,
        label: (node.labelKey.split('.').pop() || node.key).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        icon: node.icon,
        children: node.children ? transform(node.children) : undefined,
      }))
    }

    const baseTree = transform(navTree)

    // Add any missing sections that exist in renderCurrentSection but not in navTree
    const existingSections = new Set(flattenSections(navTree))
    const additionalSections: MenuNode[] = []

    // Check for sections in renderCurrentSection that aren't in navTree
    const allRenderSections = [
      'hero', 'about', 'products', 'gallery', 'recipes', 'reviews', 'contact', 
      'admin', 'eco-farming', 'technology', 'delivery', 'professional', 
      'feeding', 'game', 'orders', 'shop-test', 'payment-admin', 'petka'
    ]

    allRenderSections.forEach(section => {
      if (!existingSections.has(section)) {
        // Only add admin sections if admin mode is active
        if ((section === 'admin' || section === 'payment-admin') && !isAdmin) return
        
        additionalSections.push({
          key: section,
          label: labelFor(section),
        })
      }
    })

    // Add additional sections to More submenu
    if (additionalSections.length > 0) {
      const moreIndex = baseTree.findIndex(node => node.key === 'more')
      if (moreIndex !== -1 && baseTree[moreIndex].children) {
        baseTree[moreIndex].children!.push(...additionalSections)
      }
    }

    return baseTree
  }, [adminMode]) // Re-compute when admin status changes


  const handleNavigate = (key: string) => {
    console.log('Navigating to key:', key)
    playSwooshSound({ volume: 0.25, playbackRate: 0.9 })

    // Special handling for container nodes that don't have sections
    if (key === 'more') {
      // "More" is just a container, don't navigate
      return
    }

    const node = findNodeByKey(navTree, key)
    const targetSection = node?.section || key

    if (targetSection === 'hero') {
      // If going to hero, show 3D
      setPrevSection(currentSection)
      setCurrentSection('hero')
      setShow3D(true)
    } else {
      // Going to any other section, hide 3D
      setPrevSection(currentSection)
      setCurrentSection(targetSection)
      setShow3D(false)
    }
    // setMenuVisible(false) // Keep open
  }

  const handleBack = () => {
    playSwooshSound({ volume: 0.25, playbackRate: 0.9 })
    if (prevSection) {
      const target = prevSection
      setPrevSection(null)
      setCurrentSection(target)
      setShow3D(target === 'hero')
    } else {
      setCurrentSection('hero')
      setShow3D(true)
    }
  }

  const handleNavigateToSite = () => {
    playSwooshSound({ volume: 0.25, playbackRate: 0.9 })
    setCurrentSection('about') // Navigate to the about section as default entry point
    setShow3D(false)
    setMenuVisible(false)
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'hero':
        return <HeroSection onNavigate={handleNavigate} />
      case 'about':
        return <AboutSection onNavigate={handleNavigate} />
      case 'products':
        return <ProductsSection onNavigate={handleNavigate} />
      case 'gallery':
        return <GallerySection onNavigate={handleNavigate} />
      case 'recipes':
        return <RecipesSection onNavigate={handleNavigate} />
      case 'reviews':
        return <ReviewsSection onNavigate={handleNavigate} />
      case 'contact':
        return <ContactSection onNavigate={handleNavigate} />
      case 'admin':
        return <AdminGate onNavigate={handleNavigate} />
      case 'eco-farming':
        return <EcoFarmingSection onNavigate={handleNavigate} />
      case 'technology':
        return <TechnologySection onNavigate={handleNavigate} />
      case 'delivery':
        return <DeliverySection onNavigate={handleNavigate} />
      case 'professional':
        return <ProfessionalSection onNavigate={handleNavigate} />
      case 'feeding':
        return <AquaGame onNavigate={handleNavigate} />
      case 'game':
        return <AquaGame onNavigate={handleNavigate} />
      case 'orders':
        return <OrdersManagement onNavigate={handleNavigate} />
      case 'shop-test':
        return <ShoppingTest onNavigate={handleNavigate} />
      case 'payment-admin':
        return <PaymentAdmin onNavigate={handleNavigate} />
      case 'petka':
  return <AquaGame onNavigate={handleNavigate} />
      default:
  return <AboutSection onNavigate={handleNavigate} />
    }
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-foreground">
        <AquaMenu
          tree={menuTree}
          onNavigate={handleNavigate}
          isAdminMode={adminMode}
          onAdminOpen={() => handleNavigate('admin')}
        />
        {/* Admin banner moved into the menu header to avoid overlap */}
        {/* Debug Navigation Panel */}
        {showDebug && (
          <div className="fixed top-4 left-4 z-50 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border max-w-xs">
            <h3 className="text-sm font-bold mb-2">Debug Navigation</h3>
            <p className="text-xs mb-2">Current: {currentSection}</p>
            <p className="text-xs mb-2">3D: {show3D ? 'Yes' : 'No'}</p>
            <p className="text-xs mb-3">Menu: {menuVisible ? 'Open' : 'Closed'}</p>
            <div className="grid grid-cols-2 gap-1">
              {allSections.map(section => (
                <Button
                  key={section}
                  size="sm"
                  variant={currentSection === section ? 'default' : 'outline'}
                  className="text-xs h-6"
                  onClick={() => handleNavigate(section)}
                >
                  {labelFor(section)}
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="w-full mt-2 text-xs h-6"
              onClick={() => setShowDebug(false)}
            >
              Hide Debug
            </Button>
          </div>
        )}

        {/* Debug Toggle */}
        <Button
          size="sm"
          variant="ghost"
          className="fixed bottom-4 left-4 z-40 bg-white/10 backdrop-blur-sm text-white"
          onClick={() => setShowDebug(!showDebug)}
        >
          Debug
        </Button>

        {/* 3D Visualization or Content */}
        {show3D && currentSection === 'hero' ? (
          <div className="fixed inset-0 z-10">
            <Suspense fallback={<div className="fixed inset-0 grid place-items-center text-white">Завантаження 3D…</div>}>
              <PrawnVisualization
                onMenuToggle={() => setMenuVisible(!menuVisible)}
                menuVisible={menuVisible}
                onNavigateToSite={() => setCurrentSection('hero')}
              />
            </Suspense>
          </div>
        ) : (
          <main className="relative z-20">
            {/* Left: Back Button (when not on main) */}
            {currentSection !== 'hero' && (
              <div className="fixed top-6 left-6 z-30">
                <button
                  onClick={handleBack}
                  className="bg-white/90 text-foreground px-4 py-2 rounded-full shadow-lg border hover:bg-white transition-all duration-300 hover:scale-105"
                >
                  ← Назад
                </button>
              </div>
            )}

            {/* Right: AquaFarm Button (always visible) and optional Open 3D when hero is active */}
            <div className="fixed top-6 right-6 z-30 flex flex-col items-end space-y-2">
              <button
                onClick={() => handleNavigate('hero')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                🏠 AquaFarm
              </button>
              {!show3D && currentSection === 'hero' && (
                <button
                  onClick={() => {
                    playSwooshSound({ volume: 0.25, playbackRate: 0.95 })
                    setShow3D(true)
                  }}
                  className="bg-white/90 text-foreground px-3 py-1 rounded-full shadow-md hover:bg-white transition-all duration-200 text-sm"
                >
                  🔍 Відкрити 3D
                </button>
              )}
            </div>

            {/* Current Section Content */}
            {renderCurrentSection()}
          </main>
        )}

        {/* OLD Navigation Menu - can be removed later */}
        <NavigationMenu
          isVisible={menuVisible}
          onNavigate={handleNavigate}
          onClose={() => setMenuVisible(false)}
        />

        {/* Floating Cart - only show when not on products page and not in 3D mode */}
        {!show3D && currentSection !== 'products' && (
          <FloatingCart onClick={() => setShowCart(true)} />
        )}

        {/* Shopping Cart Modal */}
        <ShoppingCart isVisible={showCart} onClose={() => setShowCart(false)} />

        {/* Toast Notifications */}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            duration: 2800,
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              marginTop: 6,
            },
          }}
        />
      </div>
    </LanguageProvider>
  )
}

export default App
