// Simple test to check PrawnVisualization component
import { PrawnVisualization } from './components/PrawnVisualization'
import { LanguageProvider } from './contexts/LanguageContext'

export default function Test() {
  return (
    <LanguageProvider>
      <PrawnVisualization onMenuToggle={() => {}} menuVisible={false} onNavigateToSite={() => {}} />
    </LanguageProvider>
  )
}
