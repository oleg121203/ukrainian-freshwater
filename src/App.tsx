import { Suspense, lazy, useState } from 'react'
import { Toaster } from 'sonner'
import { LanguageProvider } from '@/contexts/LanguageContext'
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

function App() {
  const [currentSection, setCurrentSection] = useState<string>('hero')
  const [menuVisible, setMenuVisible] = useState(false)
  const [show3D, setShow3D] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [prevSection, setPrevSection] = useState<string | null>(null)
  const { playSwooshSound } = useAudio()

  // All available sections for debugging
  const allSections = [
    'hero',
    'about',
    'products',
    'gallery',
    'recipes',
    'reviews',
    'contact',
    'admin',
    'eco-farming',
    'technology',
    'delivery',
    'professional',
  'feeding', // оставляем для обратной совместимости
  'game',
    'orders',
    'shop-test',
    'payment-admin',
  'petka',
  ]

  const handleNavigate = (section: string) => {
    console.log('Navigating to section:', section)
    playSwooshSound({ volume: 0.25, playbackRate: 0.9 })
    
    if (section === 'hero') {
      // If going back to hero, show 3D
      setPrevSection(currentSection)
      setCurrentSection('hero')
      setShow3D(false)
    } else {
      // Going to any other section, hide 3D
      setPrevSection(currentSection)
      setCurrentSection(section)
      setShow3D(false)
    }
    setMenuVisible(false)
  }

  const handleBack = () => {
    playSwooshSound({ volume: 0.25, playbackRate: 0.9 })
    if (prevSection) {
      const target = prevSection
      setPrevSection(null)
      setCurrentSection(target)
      setShow3D(false)
    } else {
      setCurrentSection('hero')
      setShow3D(false)
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
        {/* Debug Navigation Panel */}
        {showDebug && (
          <div className="fixed top-4 left-4 z-50 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border max-w-xs">
            <h3 className="text-sm font-bold mb-2">Debug Navigation</h3>
            <p className="text-xs mb-2">Current: {currentSection}</p>
            <p className="text-xs mb-2">3D: {show3D ? 'Yes' : 'No'}</p>
            <p className="text-xs mb-3">Menu: {menuVisible ? 'Open' : 'Closed'}</p>
            <div className="grid grid-cols-2 gap-1">
              {allSections.map(section => {
                const getSectionLabel = (sectionName: string) => {
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

                return (
                  <Button
                    key={section}
                    size="sm"
                    variant={currentSection === section ? 'default' : 'outline'}
                    className="text-xs h-6"
                    onClick={() => handleNavigate(section)}
                  >
                    {getSectionLabel(section)}
                  </Button>
                )
              })}
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

            {/* Right: AquaFarm Button (always visible) */}
            <div className="fixed top-6 right-6 z-30">
              <button
                onClick={() => handleNavigate('hero')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                🏠 AquaFarm
              </button>
            </div>

            {/* Current Section Content */}
            {renderCurrentSection()}
          </main>
        )}

        {/* Navigation Menu */}
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
