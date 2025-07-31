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
import { AdminDashboard } from '@/components/AdminDashboard'
import { useAudio } from '@/hooks/useAudio'
import { Button } from '@/components/ui/button'

function App() {
  const [currentSection, setCurrentSection] = useState<string>('hero')
  const [menuVisible, setMenuVisible] = useState(false)
  const [show3D, setShow3D] = useState(true)
  const [showDebug, setShowDebug] = useState(false)
  const { playSwooshSound } = useAudio()

  // All available sections for debugging
  const allSections = ['hero', 'about', 'products', 'gallery', 'recipes', 'reviews', 'contact', 'admin']

  const handleNavigate = (section: string) => {
    if (section === 'hero') {
      // If going back to hero, show 3D
      setCurrentSection('hero')
      setShow3D(true)
    } else {
      // Going to any other section, hide 3D
      setCurrentSection(section)
      setShow3D(false)
    }
    setMenuVisible(false)
  }

  const handleBackToHero = () => {
    playSwooshSound({ volume: 0.25, playbackRate: 0.9 })
    setCurrentSection('hero')
    setShow3D(true)
  }

  const handleNavigateToSite = () => {
    playSwooshSound({ volume: 0.25, playbackRate: 0.9 })
    setCurrentSection('about') // Navigate to the about section as default entry point
    setShow3D(false)
    setMenuVisible(false)
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
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
        return <AdminDashboard />
      default:
        return <HeroSection onNavigate={handleNavigate} />
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
              {allSections.map(section => (
                <Button
                  key={section}
                  size="sm"
                  variant={currentSection === section ? "default" : "outline"}
                  className="text-xs h-6"
                  onClick={() => handleNavigate(section)}
                >
                  {section}
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
            <PrawnVisualization 
              onMenuToggle={setMenuVisible}
              menuVisible={menuVisible}
              onNavigateToSite={handleNavigateToSite}
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