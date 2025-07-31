import { useState } from 'react'
import { Toaster } from 'sonner'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { PrawnVisualization } from '@/components/PrawnVisualization'
import { NavigationMenu } from '@/components/NavigationMenu'
import { HeroSection } from '@/components/HeroSection'
import { AboutSection } from '@/components/AboutSection'
import { ProductsSection } from '@/components/ProductsSection'
import { GallerySection } from '@/components/GallerySection'
import { RecipesSection } from '@/components/RecipesSection'
import { ReviewsSection } from '@/components/ReviewsSection'
import { ContactSection } from '@/components/ContactSection'

function App() {
  const [currentSection, setCurrentSection] = useState<string>('hero')
  const [menuVisible, setMenuVisible] = useState(false)
  const [show3D, setShow3D] = useState(true)

  const handleNavigate = (section: string) => {
    setCurrentSection(section)
    setShow3D(false)
    setMenuVisible(false)
  }

  const handleBackToHero = () => {
    setCurrentSection('hero')
    setShow3D(true)
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'about':
        return <AboutSection />
      case 'products':
        return <ProductsSection />
      case 'gallery':
        return <GallerySection />
      case 'recipes':
        return <RecipesSection />
      case 'reviews':
        return <ReviewsSection />
      case 'contact':
        return <ContactSection />
      default:
        return <HeroSection onNavigate={handleNavigate} />
    }
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* 3D Visualization or Content */}
        {show3D && currentSection === 'hero' ? (
          <div className="fixed inset-0 z-10">
            <PrawnVisualization 
              onMenuToggle={setMenuVisible}
              menuVisible={menuVisible}
            />
          </div>
        ) : (
          <main className="relative z-20">
            {/* Back to Hero Button */}
            {currentSection !== 'hero' && (
              <div className="fixed top-6 left-6 z-30">
                <button
                  onClick={handleBackToHero}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  🏠 AquaFarm
                </button>
              </div>
            )}
            
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

        {/* Toast Notifications */}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            },
          }}
        />
      </div>
    </LanguageProvider>
  )
}

export default App