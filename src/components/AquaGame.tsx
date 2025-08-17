import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { FeedingSimulation } from '@/components/FeedingSimulation'
import { PetkaGame } from '@/components/PetkaGame'

interface AquaGameProps {
  onNavigate?: (section: string) => void
}

// Объединённая игровая сцена: корми креветку + квіз «Петька» в одном современном оформлении
export function AquaGame({ onNavigate }: AquaGameProps) {
  const [tab, setTab] = useState<'feeding' | 'petka'>('feeding')

  return (
    <section className="min-h-screen bg-gradient-to-b from-sky-900 via-blue-900 to-cyan-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold heading-font">AquaFarm — Інтерактив</h1>
            <p className="text-white/80 text-sm">Сучасна гра: годування креветки + квіз Петьки</p>
          </div>
          <div className="flex gap-2">
            <Button variant={tab === 'feeding' ? 'default' : 'outline'} onClick={() => setTab('feeding')}>🦐 Годування</Button>
            <Button variant={tab === 'petka' ? 'default' : 'outline'} onClick={() => setTab('petka')}>🤖 Петька</Button>
          </div>
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {tab === 'feeding' ? (
            <FeedingSimulation
              onPrawnFeed={() => {}}
              onStatsUpdate={() => {}}
            />
          ) : (
            <PetkaGame onNavigate={onNavigate} />
          )}
        </motion.div>
      </div>
    </section>
  )
}

export default AquaGame
