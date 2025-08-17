import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@/hooks/useKV'
import { useAudio } from '@/hooks/useAudio'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'

interface Shrimp {
  id: string
  name: string
  age: number // days
  size: number // grams
  health: number // 0-100
  gender: 'male' | 'female'
  breed: 'macrobrachium' | 'hybrid'
  isPregnant: boolean
  pregnancyProgress: number // 0-100
  maturityLevel: 'juvenile' | 'adult' | 'senior'
  color: string
  traits: string[]
  birthDate: number
  parentIds?: string[]
}

interface ShrimpFarm {
  shrimps: Shrimp[]
  totalProduction: number // total kg produced
  exchangeHistory: ExchangeRecord[]
  farmLevel: number
  experiencePoints: number
  lastUpdate: number
}

interface ExchangeRecord {
  id: string
  date: number
  shrimpCount: number
  totalWeight: number // kg
  value: number
  type: 'admin_exchange' | 'breeding'
}

interface AdminConfig {
  exchangeRate: number // kg per shrimp
  minExchangeWeight: number // minimum kg to exchange
  breedingChance: number // 0-1
  growthSpeed: number // multiplier
}

const GROWTH_STAGES = {
  juvenile: { minDays: 0, maxDays: 30, color: '#FFE4B5' },
  adult: { minDays: 30, maxDays: 80, color: '#FFA500' },
  senior: { minDays: 80, maxDays: 120, color: '#FF4500' }
}

const SHRIMP_COLORS = ['#FFB6C1', '#87CEEB', '#98FB98', '#F0E68C', '#DDA0DD', '#20B2AA']

export function ShrimpGrowingGame() {
  const { language } = useLanguage()
  const { playBubbleSound, playClickSound } = useAudio()
  
  // Game state
  const [farm, setFarm] = useKV<ShrimpFarm>('shrimp-farm', {
    shrimps: [],
    totalProduction: 0,
    exchangeHistory: [],
    farmLevel: 1,
    experiencePoints: 0,
    lastUpdate: Date.now()
  })
  
  const [adminConfig, setAdminConfig] = useKV<AdminConfig>('admin-shrimp-config', {
    exchangeRate: 0.15, // 0.15 kg per adult shrimp
    minExchangeWeight: 1.0, // minimum 1kg to exchange
    breedingChance: 0.3,
    growthSpeed: 1.0
  })
  
  const [selectedShrimp, setSelectedShrimp] = useState<string | null>(null)
  const [gameTime, setGameTime] = useState(Date.now())
  const [autoGrowth, setAutoGrowth] = useState(true)

  // Auto-growth timer (reduced frequency to prevent issues)
  useEffect(() => {
    if (!autoGrowth) return
    
    const interval = setInterval(() => {
      setGameTime(Date.now())
      updateShrimpGrowth()
    }, 30000) // Update every 30 seconds (slower, more stable)
    
    return () => clearInterval(interval)
  }, [autoGrowth, adminConfig.growthSpeed])

  const createShrimp = useCallback((parentIds?: string[]): Shrimp => {
    const id = `shrimp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const colors = SHRIMP_COLORS
    
    return {
      id,
      name: `Креветка #${farm.shrimps.length + 1}`,
      age: 0,
      size: 0.1 + Math.random() * 0.2, // 0.1-0.3g newborn
      health: 80 + Math.random() * 20,
      gender: Math.random() > 0.5 ? 'male' : 'female',
      breed: parentIds ? 'hybrid' : 'macrobrachium',
      isPregnant: false,
      pregnancyProgress: 0,
      maturityLevel: 'juvenile',
      color: colors[Math.floor(Math.random() * colors.length)],
      traits: generateTraits(),
      birthDate: Date.now(),
      parentIds
    }
  }, [farm.shrimps.length])

  const generateTraits = (): string[] => {
    const traits = ['швидкий ріст', 'стійкість', 'великий розмір', 'яскравий колір', 'активність']
    return traits.filter(() => Math.random() > 0.7)
  }

  const updateShrimpGrowth = useCallback(() => {
    setFarm(prevFarm => {
      const timePassed = Date.now() - prevFarm.lastUpdate
      const daysToAdd = (timePassed / 1000) * adminConfig.growthSpeed / 100 // Slower growth: 1 real second = 0.01 game day
      
      const updatedShrimps = prevFarm.shrimps.map(shrimp => {
        const newAge = shrimp.age + daysToAdd
        let newSize = shrimp.size
        let newMaturity = shrimp.maturityLevel
        let newHealth = shrimp.health
        
        // Growth calculations
        if (newAge < 30) {
          newSize += daysToAdd * 0.3 // Fast juvenile growth
          newMaturity = 'juvenile'
        } else if (newAge < 80) {
          newSize += daysToAdd * 0.15 // Slower adult growth
          newMaturity = 'adult'
        } else {
          newSize += daysToAdd * 0.05 // Very slow senior growth
          newMaturity = 'senior'
          newHealth = Math.max(20, newHealth - daysToAdd * 0.5) // Health decline with age
        }
        
        // Maximum size based on traits
        const maxSize = shrimp.traits.includes('великий розмір') ? 250 : 180
        newSize = Math.min(newSize, maxSize)
        
        // Pregnancy progress
        let pregnancyProgress = shrimp.pregnancyProgress
        if (shrimp.isPregnant) {
          pregnancyProgress += daysToAdd * 5 // 20 days pregnancy
        }
        
        return {
          ...shrimp,
          age: newAge,
          size: newSize,
          maturityLevel: newMaturity,
          health: newHealth,
          pregnancyProgress
        }
      })
      
      return {
        ...prevFarm,
        shrimps: updatedShrimps,
        lastUpdate: Date.now()
      }
    })
  }, [adminConfig.growthSpeed])

  const startNewFarm = () => {
    const initialShrimps = Array.from({ length: 3 }, () => createShrimp())
    setFarm({
      shrimps: initialShrimps,
      totalProduction: 0,
      exchangeHistory: [],
      farmLevel: 1,
      experiencePoints: 0,
      lastUpdate: Date.now()
    })
    toast.success('Нова ферма створена! 🦐')
    playBubbleSound()
  }

  const breedShrimps = (maleId: string, femaleId: string) => {
    const male = farm.shrimps.find(s => s.id === maleId)
    const female = farm.shrimps.find(s => s.id === femaleId)
    
    if (!male || !female || male.gender !== 'male' || female.gender !== 'female') {
      toast.error('Виберіть самця та самку для розмноження')
      return
    }
    
    if (male.maturityLevel === 'juvenile' || female.maturityLevel === 'juvenile') {
      toast.error('Креветки повинні бути дорослими для розмноження')
      return
    }
    
    if (female.isPregnant) {
      toast.error('Самка вже вагітна')
      return
    }
    
    if (Math.random() > adminConfig.breedingChance) {
      toast.error('Розмноження не вдалося. Спробуйте пізніше.')
      return
    }
    
    setFarm(prev => ({
      ...prev,
      shrimps: prev.shrimps.map(s => 
        s.id === femaleId 
          ? { ...s, isPregnant: true, pregnancyProgress: 0 }
          : s
      )
    }))
    
    toast.success('Розмноження почалося! 🥚')
    playBubbleSound()
  }

  const giveBirth = (motherId: string) => {
    const mother = farm.shrimps.find(s => s.id === motherId)
    if (!mother || !mother.isPregnant || mother.pregnancyProgress < 100) return
    
    const offspringCount = 2 + Math.floor(Math.random() * 4) // 2-5 offspring
    const newShrimps = Array.from({ length: offspringCount }, () => 
      createShrimp([motherId, 'unknown_father'])
    )
    
    setFarm(prev => ({
      ...prev,
      shrimps: [
        ...prev.shrimps.map(s => 
          s.id === motherId 
            ? { ...s, isPregnant: false, pregnancyProgress: 0 }
            : s
        ),
        ...newShrimps
      ],
      experiencePoints: prev.experiencePoints + 50
    }))
    
    toast.success(`Народилося ${offspringCount} креветенят! 🍼`)
    playBubbleSound()
  }

  const exchangeForBatch = () => {
    const adultsReady = farm.shrimps.filter(s => 
      s.maturityLevel === 'adult' && s.size > 50 && !s.isPregnant
    )
    
    if (adultsReady.length === 0) {
      toast.error('Немає дорослих креветок для обміну')
      return
    }
    
    const totalWeight = adultsReady.reduce((sum, s) => sum + s.size, 0) / 1000 // convert to kg
    
    if (totalWeight < adminConfig.minExchangeWeight) {
      toast.error(`Мінімальна вага для обміну: ${adminConfig.minExchangeWeight} кг`)
      return
    }
    
    const exchangeRecord: ExchangeRecord = {
      id: `exchange_${Date.now()}`,
      date: Date.now(),
      shrimpCount: adultsReady.length,
      totalWeight,
      value: totalWeight * 100, // $100 per kg
      type: 'admin_exchange'
    }
    
    setFarm(prev => ({
      ...prev,
      shrimps: prev.shrimps.filter(s => !adultsReady.includes(s)),
      totalProduction: prev.totalProduction + totalWeight,
      exchangeHistory: [...prev.exchangeHistory, exchangeRecord],
      experiencePoints: prev.experiencePoints + Math.floor(totalWeight * 20)
    }))
    
    toast.success(`Обмін успішний! ${totalWeight.toFixed(2)} кг → $${exchangeRecord.value}`)
    playClickSound()
  }

  // Check for births
  useEffect(() => {
    farm.shrimps.forEach(shrimp => {
      if (shrimp.isPregnant && shrimp.pregnancyProgress >= 100) {
        giveBirth(shrimp.id)
      }
    })
  }, [farm.shrimps])

  const getMaturityColor = (maturity: string) => {
    switch (maturity) {
      case 'juvenile': return 'bg-blue-500'
      case 'adult': return 'bg-green-500'
      case 'senior': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const adultsForBreeding = farm.shrimps.filter(s => 
    s.maturityLevel === 'adult' && !s.isPregnant
  )
  const males = adultsForBreeding.filter(s => s.gender === 'male')
  const females = adultsForBreeding.filter(s => s.gender === 'female')

  return (
    <div className="space-y-6">
      {/* Farm Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              🦐 Креветкова Ферма
              <Badge variant="secondary">Рівень {farm.farmLevel}</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAutoGrowth(!autoGrowth)}
              >
                {autoGrowth ? '⏸️ Пауза' : '▶️ Старт'}
              </Button>
              {farm.shrimps.length === 0 && (
                <Button size="sm" onClick={startNewFarm}>
                  🆕 Нова ферма
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{farm.shrimps.length}</div>
              <div className="text-sm text-muted-foreground">Креветок</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {farm.totalProduction.toFixed(2)}кг
              </div>
              <div className="text-sm text-muted-foreground">Всього виробництво</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{farm.experiencePoints}</div>
              <div className="text-sm text-muted-foreground">Досвід</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{farm.exchangeHistory.length}</div>
              <div className="text-sm text-muted-foreground">Обмінів</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breeding Section */}
      {males.length > 0 && females.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>💕 Розмноження</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Самець:</label>
                <select 
                  className="w-full mt-1 p-2 border rounded"
                  onChange={(e) => {
                    const femaleSelect = document.querySelector('#female-select') as HTMLSelectElement
                    if (e.target.value && femaleSelect.value) {
                      breedShrimps(e.target.value, femaleSelect.value)
                    }
                  }}
                >
                  <option value="">Оберіть самця</option>
                  {males.map(male => (
                    <option key={male.id} value={male.id}>
                      {male.name} ({male.size.toFixed(1)}g, {male.age.toFixed(0)} днів)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Самка:</label>
                <select 
                  id="female-select"
                  className="w-full mt-1 p-2 border rounded"
                >
                  <option value="">Оберіть самку</option>
                  {females.map(female => (
                    <option key={female.id} value={female.id}>
                      {female.name} ({female.size.toFixed(1)}g, {female.age.toFixed(0)} днів)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Шанс розмноження: {(adminConfig.breedingChance * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* Exchange Section */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Обмін на партію</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm">
                Готові до обміну: {farm.shrimps.filter(s => 
                  s.maturityLevel === 'adult' && s.size > 50 && !s.isPregnant
                ).length} креветок
              </p>
              <p className="text-xs text-muted-foreground">
                Курс: {adminConfig.exchangeRate} кг за креветку | Мінімум: {adminConfig.minExchangeWeight} кг
              </p>
            </div>
            <Button onClick={exchangeForBatch}>
              🔄 Обміняти
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shrimp Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {farm.shrimps.map((shrimp) => (
            <motion.div
              key={shrimp.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`cursor-pointer ${selectedShrimp === shrimp.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedShrimp(selectedShrimp === shrimp.id ? null : shrimp.id)}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm">{shrimp.name}</CardTitle>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className={getMaturityColor(shrimp.maturityLevel)}>
                          {shrimp.maturityLevel}
                        </Badge>
                        <Badge variant="outline">
                          {shrimp.gender === 'male' ? '♂️' : '♀️'}
                        </Badge>
                      </div>
                    </div>
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: shrimp.color }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Вік: {shrimp.age.toFixed(0)} днів</div>
                    <div>Розмір: {shrimp.size.toFixed(1)}г</div>
                    <div>Здоров'я: {shrimp.health.toFixed(0)}%</div>
                    <div>Порода: {shrimp.breed}</div>
                  </div>
                  
                  {shrimp.isPregnant && (
                    <div>
                      <div className="text-xs text-pink-600 mb-1">🤰 Вагітна</div>
                      <Progress value={shrimp.pregnancyProgress} className="h-2" />
                      <div className="text-xs text-center">{shrimp.pregnancyProgress.toFixed(0)}%</div>
                    </div>
                  )}
                  
                  {shrimp.traits.length > 0 && (
                    <div className="text-xs">
                      <div className="font-medium">Особливості:</div>
                      {shrimp.traits.map((trait, i) => (
                        <Badge key={i} variant="secondary" className="text-xs mr-1">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {farm.shrimps.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🦐</div>
            <h3 className="text-xl font-bold mb-2">Ваша ферма порожня</h3>
            <p className="text-muted-foreground mb-6">
              Розпочніть свою креветкову ферму і виростіть власних креветок!
            </p>
            <Button onClick={startNewFarm} size="lg">
              🚀 Розпочати ферму
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ShrimpGrowingGame