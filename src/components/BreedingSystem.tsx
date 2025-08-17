import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { useKV } from '@/hooks/useKV'
import { useAudio } from '@/hooks/useAudio'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'

interface ShrimpData {
  id: string
  name: string
  age: number // in days
  stage: 'juvenile' | 'young' | 'adult' | 'breeding'
  gender: 'male' | 'female'
  health: number
  size: number // in cm
  breedingReadiness: number
  experienceFromFeeding: number
  birthDate: number
  lastInteraction: number
}

interface BreedingPair {
  id: string
  male: ShrimpData
  female: ShrimpData
  pairingDate: number
  pregnancyProgress: number // 0-100
  expectedOffspring: number
  gestationDays: number // typical 18-21 days
}

interface BreedingSystemProps {
  onPrawnFeed?: () => void
  onStatsUpdate?: (stats: any) => void
  feedingStats?: any
}

const BREEDING_STAGES = {
  juvenile: { name: { uk: 'Молодняк', en: 'Juvenile' }, minDays: 0, maxDays: 30, size: [1, 3] },
  young: { name: { uk: 'Підліток', en: 'Young' }, minDays: 30, maxDays: 60, size: [3, 6] },
  adult: { name: { uk: 'Дорослий', en: 'Adult' }, minDays: 60, maxDays: 90, size: [6, 10] },
  breeding: { name: { uk: 'Готовий до розмноження', en: 'Breeding Ready' }, minDays: 90, maxDays: 365, size: [10, 15] }
}

export function BreedingSystem({ onPrawnFeed, onStatsUpdate, feedingStats }: BreedingSystemProps) {
  const { language, t } = useLanguage()
  const { playSuccessSound, playBubbleSound } = useAudio()
  
  const [shrimpColony, setShrimpColony] = useKV<ShrimpData[]>('shrimp-colony', [])
  const [breedingPairs, setBreedingPairs] = useKV<BreedingPair[]>('breeding-pairs', [])
  const [totalExchangeableShrimp, setTotalExchangeableShrimp] = useKV<number>('exchangeable-shrimp', 0)
  const [colonyStartDate] = useKV<number>('colony-start-date', Date.now())
  const [selectedForBreeding, setSelectedForBreeding] = useState<string[]>([])
  const [exchangeRatePerShrimp] = useKV<number>('exchange-rate-per-shrimp', 0.05)
  const [minShrimpForExchange] = useKV<number>('min-shrimp-for-exchange', 20)
  const [exchangeHistory, setExchangeHistory] = useKV<any[]>('exchange-history', [])
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [exchangeAmount, setExchangeAmount] = useState('')
  const [initialized, setInitialized] = useState(false)

  // Initialize colony with starter shrimp if empty
  useEffect(() => {
    if (!initialized && shrimpColony.length === 0) {
      const starterShrimp: ShrimpData[] = [
        {
          id: 'starter-1',
          name: language === 'uk' ? 'Борис' : 'Boris',
          age: 15,
          stage: 'juvenile',
          gender: 'male',
          health: 80,
          size: 2.5,
          breedingReadiness: 0,
          experienceFromFeeding: 0,
          birthDate: Date.now() - (15 * 24 * 60 * 60 * 1000),
          lastInteraction: Date.now()
        },
        {
          id: 'starter-2', 
          name: language === 'uk' ? 'Марія' : 'Maria',
          age: 12,
          stage: 'juvenile',
          gender: 'female',
          health: 85,
          size: 2.2,
          breedingReadiness: 0,
          experienceFromFeeding: 0,
          birthDate: Date.now() - (12 * 24 * 60 * 60 * 1000),
          lastInteraction: Date.now()
        }
      ]
      setShrimpColony(starterShrimp)
      setInitialized(true)
    }
  }, [initialized, shrimpColony.length, setShrimpColony, language])

  // Update shrimp based on feeding stats (only when feedingStats actually change)
  useEffect(() => {
    if (feedingStats && shrimpColony.length > 0 && initialized) {
      setShrimpColony(current => 
        current.map(shrimp => ({
          ...shrimp,
          health: Math.min(100, shrimp.health + (feedingStats.health - 80) * 0.05),
          experienceFromFeeding: feedingStats.experience,
          breedingReadiness: shrimp.stage === 'adult' || shrimp.stage === 'breeding' 
            ? Math.min(100, shrimp.breedingReadiness + (feedingStats.mood / 20))
            : shrimp.breedingReadiness
        }))
      )
    }
  }, [feedingStats?.experience, feedingStats?.health, feedingStats?.mood])

  // Simplified auto-age - just run once on mount and then manually trigger updates
  useEffect(() => {
    // Update age based on current time for display purposes
    const updateAges = () => {
      const now = Date.now()
      setShrimpColony(current => 
        current.map(shrimp => {
          const daysSinceBirth = Math.floor((now - shrimp.birthDate) / (24 * 60 * 60 * 1000))
          const newStage = getStageFromAge(daysSinceBirth)
          const stageData = BREEDING_STAGES[newStage]
          const progress = Math.max(0, Math.min(1, (daysSinceBirth - stageData.minDays) / (stageData.maxDays - stageData.minDays)))
          const newSize = stageData.size[0] + progress * (stageData.size[1] - stageData.size[0])
          
          return {
            ...shrimp,
            age: daysSinceBirth,
            stage: newStage,
            size: Math.max(stageData.size[0], Math.min(stageData.size[1], newSize)),
            breedingReadiness: newStage === 'breeding' ? Math.min(100, 50 + daysSinceBirth) : shrimp.breedingReadiness
          }
        })
      )
    }

    if (initialized && shrimpColony.length > 0) {
      updateAges()
      // Update every 5 minutes instead of every 30 seconds to reduce load
      const interval = setInterval(updateAges, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [initialized, shrimpColony.length])

  const getStageFromAge = (days: number): ShrimpData['stage'] => {
    if (days < 30) return 'juvenile'
    if (days < 60) return 'young'
    if (days < 90) return 'adult'
    return 'breeding'
  }

  const getGenderEmoji = (gender: 'male' | 'female') => gender === 'male' ? '♂️' : '♀️'

  const getStageColor = (stage: ShrimpData['stage']) => {
    switch (stage) {
      case 'juvenile': return 'bg-blue-500'
      case 'young': return 'bg-green-500'
      case 'adult': return 'bg-yellow-500'
      case 'breeding': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const canBreed = (shrimp: ShrimpData) => {
    return shrimp.stage === 'breeding' && shrimp.breedingReadiness >= 80 && shrimp.health >= 70
  }

  const toggleBreedingSelection = (shrimpId: string) => {
    setSelectedForBreeding(current => {
      if (current.includes(shrimpId)) {
        return current.filter(id => id !== shrimpId)
      } else if (current.length < 2) {
        return [...current, shrimpId]
      } else {
        return [current[1], shrimpId] // Replace first selection
      }
    })
  }

  const createBreedingPair = () => {
    if (selectedForBreeding.length !== 2) return

    const selected = shrimpColony.filter(s => selectedForBreeding.includes(s.id))
    const male = selected.find(s => s.gender === 'male')
    const female = selected.find(s => s.gender === 'female')

    if (!male || !female) {
      toast.error(language === 'uk' 
        ? 'Для розмноження потрібна пара - самець і самка!'
        : 'Breeding requires a pair - male and female!')
      return
    }

    if (!canBreed(male) || !canBreed(female)) {
      toast.error(language === 'uk'
        ? 'Обидві креветки повинні бути готові до розмноження!'
        : 'Both shrimp must be ready for breeding!')
      return
    }

    const newPair: BreedingPair = {
      id: `pair-${Date.now()}`,
      male,
      female,
      pairingDate: Date.now(),
      pregnancyProgress: 0,
      expectedOffspring: Math.floor(Math.random() * 20) + 10, // 10-30 offspring
      gestationDays: Math.floor(Math.random() * 4) + 18 // 18-21 days
    }

    setBreedingPairs(current => [...current, newPair])
    setSelectedForBreeding([])
    playSuccessSound({ volume: 0.3 })
    toast.success(language === 'uk'
      ? `${male.name} та ${female.name} тепер формують пару для розмноження!`
      : `${male.name} and ${female.name} are now paired for breeding!`)
  }

  const giveBirth = (pair: BreedingPair) => {
    const newShrimp: ShrimpData[] = []
    
    for (let i = 0; i < pair.expectedOffspring; i++) {
      const isFemale = Math.random() > 0.5
      newShrimp.push({
        id: `offspring-${Date.now()}-${i}`,
        name: `${language === 'uk' ? 'Малеч' : 'Baby'} ${i + 1}`,
        age: 0,
        stage: 'juvenile',
        gender: isFemale ? 'female' : 'male',
        health: 90 + Math.random() * 10,
        size: 0.8 + Math.random() * 0.4,
        breedingReadiness: 0,
        experienceFromFeeding: 0,
        birthDate: Date.now(),
        lastInteraction: Date.now()
      })
    }

    setShrimpColony(current => [...current, ...newShrimp])
    setTotalExchangeableShrimp(current => current + Math.floor(pair.expectedOffspring * 0.8))
    playSuccessSound({ volume: 0.4, playbackRate: 1.2 })
    
    toast.success(language === 'uk'
      ? `Народилося ${pair.expectedOffspring} креветок! 🎉`
      : `${pair.expectedOffspring} new shrimp were born! 🎉`)
  }

  const performExchange = () => {
    const amount = parseInt(exchangeAmount)
    
    if (isNaN(amount) || amount < minShrimpForExchange) {
      toast.error(language === 'uk'
        ? `Мінімум ${minShrimpForExchange} креветок для обміну`
        : `Minimum ${minShrimpForExchange} shrimp required for exchange`)
      return
    }
    
    if (amount > totalExchangeableShrimp) {
      toast.error(language === 'uk'
        ? 'Недостатньо креветок для обміну'
        : 'Not enough shrimp for exchange')
      return
    }
    
    const kgReceived = amount * exchangeRatePerShrimp
    
    setTotalExchangeableShrimp(current => current - amount)
    setExchangeHistory(current => [...current, {
      shrimpCount: amount,
      kgReceived: kgReceived.toFixed(3),
      timestamp: Date.now(),
      exchangeRate: exchangeRatePerShrimp
    }])
    
    setExchangeAmount('')
    setShowExchangeModal(false)
    playSuccessSound({ volume: 0.4 })
    
    toast.success(language === 'uk'
      ? `Обмінено ${amount} креветок на ${kgReceived.toFixed(3)} кг! 🎉`
      : `Exchanged ${amount} shrimp for ${kgReceived.toFixed(3)} kg! 🎉`)
  }

  const colonyAge = Math.floor((Date.now() - colonyStartDate) / (24 * 60 * 60 * 1000))
  const readyForBreeding = shrimpColony.filter(canBreed)
  const totalMature = shrimpColony.filter(s => s.stage === 'adult' || s.stage === 'breeding')

  return (
    <div className="space-y-6">
      {/* Colony Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏠 {language === 'uk' ? 'Колонія креветок' : 'Shrimp Colony'}
            <Badge variant="secondary">{colonyAge} {language === 'uk' ? 'днів' : 'days'}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{shrimpColony.length}</div>
              <div className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Всього креветок' : 'Total Shrimp'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalMature.length}</div>
              <div className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Дорослих' : 'Mature'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{readyForBreeding.length}</div>
              <div className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Готових до розмноження' : 'Ready to Breed'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{totalExchangeableShrimp}</div>
              <div className="text-sm text-muted-foreground">
                {language === 'uk' ? 'Для обміну' : 'For Exchange'}
              </div>
              {totalExchangeableShrimp >= minShrimpForExchange && (
                <Button 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={() => setShowExchangeModal(true)}
                >
                  💰 {language === 'uk' ? 'Обмінити' : 'Exchange'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breeding Controls */}
      {readyForBreeding.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>💕 {language === 'uk' ? 'Система розмноження' : 'Breeding System'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {language === 'uk' 
                  ? 'Виберіть самця і самку для створення пари для розмноження'
                  : 'Select a male and female to create a breeding pair'}
              </p>
              {selectedForBreeding.length === 2 && (
                <Button onClick={createBreedingPair} className="w-full">
                  💕 {language === 'uk' ? 'Створити пару' : 'Create Breeding Pair'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Breeding Pairs */}
      {breedingPairs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🥚 {language === 'uk' ? 'Активні пари' : 'Active Breeding Pairs'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {breedingPairs.map((pair) => (
                <div key={pair.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      {pair.male.name} ♂️ + {pair.female.name} ♀️
                    </span>
                    <Badge>
                      {language === 'uk' ? 'Очікується:' : 'Expected:'} {pair.expectedOffspring}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{language === 'uk' ? 'Прогрес вагітності' : 'Pregnancy Progress'}</span>
                      <span>{Math.floor(pair.pregnancyProgress)}%</span>
                    </div>
                    <Progress value={pair.pregnancyProgress} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {pair.pregnancyProgress >= 100
                        ? (language === 'uk' ? 'Готові до народження!' : 'Ready to give birth!')
                        : (language === 'uk' 
                          ? `Залишилось ${pair.gestationDays - Math.floor((Date.now() - pair.pairingDate) / (24 * 60 * 60 * 1000))} днів`
                          : `${pair.gestationDays - Math.floor((Date.now() - pair.pairingDate) / (24 * 60 * 60 * 1000))} days remaining`)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shrimp Colony Display */}
      <Card>
        <CardHeader>
          <CardTitle>🦐 {language === 'uk' ? 'Колонія креветок' : 'Shrimp Colony'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shrimpColony.map((shrimp) => (
              <motion.div
                key={shrimp.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                  selectedForBreeding.includes(shrimp.id) 
                    ? 'ring-2 ring-purple-500 bg-purple-50' 
                    : 'hover:shadow-md'
                } ${canBreed(shrimp) ? 'border-purple-200' : ''}`}
                onClick={() => canBreed(shrimp) && toggleBreedingSelection(shrimp.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{shrimp.name}</span>
                    <span className="ml-1">{getGenderEmoji(shrimp.gender)}</span>
                  </div>
                  <Badge className={getStageColor(shrimp.stage)}>
                    {BREEDING_STAGES[shrimp.stage].name[language]}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>{language === 'uk' ? 'Вік:' : 'Age:'}</span>
                    <span>{shrimp.age} {language === 'uk' ? 'днів' : 'days'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'uk' ? 'Розмір:' : 'Size:'}</span>
                    <span>{shrimp.size.toFixed(1)} см</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'uk' ? 'Здоров\'я:' : 'Health:'}</span>
                    <span>{Math.floor(shrimp.health)}%</span>
                  </div>
                  
                  {(shrimp.stage === 'adult' || shrimp.stage === 'breeding') && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{language === 'uk' ? 'Готовність:' : 'Readiness:'}</span>
                        <span>{Math.floor(shrimp.breedingReadiness)}%</span>
                      </div>
                      <Progress value={shrimp.breedingReadiness} className="h-1" />
                    </div>
                  )}
                </div>
                
                {canBreed(shrimp) && (
                  <div className="mt-2 text-center">
                    <Badge variant="outline" className="text-purple-600">
                      💕 {language === 'uk' ? 'Готовий до розмноження' : 'Ready to Breed'}
                    </Badge>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exchange Modal */}
      <AnimatePresence>
        {showExchangeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-bold mb-4">
                💰 {language === 'uk' ? 'Обмін креветок' : 'Shrimp Exchange'}
              </h3>
              
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>{language === 'uk' ? 'Доступно для обміну:' : 'Available for exchange:'} <strong>{totalExchangeableShrimp}</strong></p>
                  <p>{language === 'uk' ? 'Курс обміну:' : 'Exchange rate:'} <strong>{exchangeRatePerShrimp} кг/креветка</strong></p>
                  <p>{language === 'uk' ? 'Мінімум:' : 'Minimum:'} <strong>{minShrimpForExchange} креветок</strong></p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === 'uk' ? 'Кількість креветок для обміну:' : 'Number of shrimp to exchange:'}
                  </label>
                  <Input
                    type="number"
                    min={minShrimpForExchange}
                    max={totalExchangeableShrimp}
                    value={exchangeAmount}
                    onChange={(e) => setExchangeAmount(e.target.value)}
                    placeholder={minShrimpForExchange.toString()}
                  />
                  {exchangeAmount && !isNaN(parseInt(exchangeAmount)) && (
                    <p className="text-sm text-green-600">
                      → {language === 'uk' ? 'Отримаєте:' : 'You will receive:'} <strong>{(parseInt(exchangeAmount) * exchangeRatePerShrimp).toFixed(3)} кг</strong>
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowExchangeModal(false)}
                  >
                    {language === 'uk' ? 'Скасувати' : 'Cancel'}
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={performExchange}
                    disabled={!exchangeAmount || parseInt(exchangeAmount) < minShrimpForExchange}
                  >
                    {language === 'uk' ? 'Обмінити' : 'Exchange'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BreedingSystem