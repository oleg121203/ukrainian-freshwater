import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@/hooks/useKV'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'

interface PrawnIndividual {
  id: string
  name: string
  birthDate: string
  age: number // в днях
  size: 'baby' | 'juvenile' | 'adult' | 'breeder'
  weight: number // в грамах
  health: number
  genetics: {
    growthRate: number
    diseaseResistance: number
    reproductionRate: number
  }
  status: 'growing' | 'breeding' | 'ready_to_harvest'
  partnerId?: string
}

interface BreedingPair {
  id: string
  maleId: string
  femaleId: string
  startDate: string
  expectedOffspring: number
  gestationDays: number
  isActive: boolean
}

interface FarmStats {
  totalPrawns: number
  totalPairs: number
  totalHarvested: number
  totalWeight: number
  monthlyIncome: number
}

interface AdminSettings {
  exchangeRatePerKg: number
  minimumHarvestWeight: number
  breedingCooldown: number
}

interface BreedingSimulationProps {
  onNavigate?: (section: string) => void
}

export function BreedingSimulation({ onNavigate }: BreedingSimulationProps) {
  const { language } = useLanguage()
  
  // State management
  const [prawns, setPrawns] = useKV<PrawnIndividual[]>('breeding-prawns', [])
  const [breedingPairs, setBreedingPairs] = useKV<BreedingPair[]>('breeding-pairs', [])
  const [farmStats, setFarmStats] = useKV<FarmStats>('farm-stats', {
    totalPrawns: 0,
    totalPairs: 0,
    totalHarvested: 0,
    totalWeight: 0,
    monthlyIncome: 0
  })
  const [adminSettings, setAdminSettings] = useKV<AdminSettings>('admin-settings', {
    exchangeRatePerKg: 1200, // UAH per kg
    minimumHarvestWeight: 50, // grams
    breedingCooldown: 30 // days
  })
  
  const [selectedPrawns, setSelectedPrawns] = useState<string[]>([])
  const [timeSpeed, setTimeSpeed] = useState<1 | 7 | 30>(1) // дні за секунду
  const [currentDate, setCurrentDate] = useState(new Date())

  // Initialize with starter prawns if empty
  useEffect(() => {
    if (prawns.length === 0) {
      const starterPrawns: PrawnIndividual[] = [
        {
          id: 'starter-1',
          name: 'Марина',
          birthDate: new Date().toISOString(),
          age: 30,
          size: 'juvenile',
          weight: 25,
          health: 90,
          genetics: {
            growthRate: 0.8,
            diseaseResistance: 0.7,
            reproductionRate: 0.9
          },
          status: 'growing'
        },
        {
          id: 'starter-2',
          name: 'Павло',
          birthDate: new Date().toISOString(),
          age: 35,
          size: 'juvenile',
          weight: 28,
          health: 85,
          genetics: {
            growthRate: 0.9,
            diseaseResistance: 0.8,
            reproductionRate: 0.7
          },
          status: 'growing'
        }
      ]
      setPrawns(starterPrawns)
    }
  }, [prawns, setPrawns])

  // Growth simulation - runs every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date())
      
      setPrawns(currentPrawns => 
        currentPrawns.map(prawn => {
          const newAge = prawn.age + timeSpeed
          let newWeight = prawn.weight
          let newSize = prawn.size
          let newStatus = prawn.status

          // Growth calculation based on age and genetics
          const dailyGrowth = prawn.genetics.growthRate * (1 - prawn.age / 365) * timeSpeed
          newWeight = Math.max(newWeight + dailyGrowth, prawn.weight)

          // Size progression
          if (newAge > 60 && prawn.size === 'juvenile') newSize = 'adult'
          if (newAge > 90 && prawn.size === 'adult') newSize = 'breeder'

          // Status updates
          if (newWeight >= adminSettings.minimumHarvestWeight && newAge > 90) {
            newStatus = 'ready_to_harvest'
          } else if (newSize === 'breeder' && !prawn.partnerId) {
            newStatus = 'breeding'
          }

          return {
            ...prawn,
            age: newAge,
            weight: Math.round(newWeight * 100) / 100,
            size: newSize,
            status: newStatus
          }
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [timeSpeed, adminSettings.minimumHarvestWeight, setPrawns])

  // Create breeding pair
  const createBreedingPair = () => {
    if (selectedPrawns.length !== 2) {
      toast.error(language === 'uk' ? 'Оберіть рівно 2 креветки для пари' : 'Select exactly 2 prawns for pairing')
      return
    }

    const [prawn1Id, prawn2Id] = selectedPrawns
    const prawn1 = prawns.find(p => p.id === prawn1Id)
    const prawn2 = prawns.find(p => p.id === prawn2Id)

    if (!prawn1 || !prawn2) return

    if (prawn1.size !== 'breeder' || prawn2.size !== 'breeder') {
      toast.error(language === 'uk' ? 'Обидві креветки мають бути дорослими для розмноження' : 'Both prawns must be adult breeders')
      return
    }

    const newPair: BreedingPair = {
      id: `pair-${Date.now()}`,
      maleId: prawn1Id,
      femaleId: prawn2Id,
      startDate: new Date().toISOString(),
      expectedOffspring: Math.floor(Math.random() * 20) + 10,
      gestationDays: 21,
      isActive: true
    }

    setBreedingPairs(prev => [...prev, newPair])
    
    setPrawns(prev => prev.map(p => 
      selectedPrawns.includes(p.id) 
        ? { ...p, status: 'breeding', partnerId: selectedPrawns.find(id => id !== p.id) }
        : p
    ))

    setSelectedPrawns([])
    toast.success(language === 'uk' ? 'Пару створено успішно!' : 'Breeding pair created successfully!')
  }

  // Harvest prawns
  const harvestPrawns = (prawnIds: string[]) => {
    const harvestedPrawns = prawns.filter(p => prawnIds.includes(p.id))
    const totalWeight = harvestedPrawns.reduce((sum, p) => sum + p.weight, 0) / 1000 // convert to kg
    const income = Math.round(totalWeight * adminSettings.exchangeRatePerKg)

    setPrawns(prev => prev.filter(p => !prawnIds.includes(p.id)))
    setFarmStats(prev => ({
      ...prev,
      totalHarvested: prev.totalHarvested + harvestedPrawns.length,
      totalWeight: prev.totalWeight + totalWeight,
      monthlyIncome: prev.monthlyIncome + income
    }))

    toast.success(
      language === 'uk' 
        ? `Зібрано ${harvestedPrawns.length} креветок (${totalWeight.toFixed(2)} кг) за ${income} UAH`
        : `Harvested ${harvestedPrawns.length} prawns (${totalWeight.toFixed(2)} kg) for ${income} UAH`
    )
  }

  const readyToHarvestPrawns = prawns.filter(p => p.status === 'ready_to_harvest')
  const breedingReadyPrawns = prawns.filter(p => p.size === 'breeder' && !p.partnerId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🌱 Вирощування креветок</h1>
        <p className="text-white/80">
          Розводіть креветок протягом 3 місяців та обмінюйте на гроші
        </p>
      </div>

      {/* Time Controls */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⏰ Швидкість часу
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              variant={timeSpeed === 1 ? 'default' : 'outline'}
              onClick={() => setTimeSpeed(1)}
            >
              1x (Реальний час)
            </Button>
            <Button 
              variant={timeSpeed === 7 ? 'default' : 'outline'}
              onClick={() => setTimeSpeed(7)}
            >
              7x (Тиждень/секунда)
            </Button>
            <Button 
              variant={timeSpeed === 30 ? 'default' : 'outline'}
              onClick={() => setTimeSpeed(30)}
            >
              30x (Місяць/секунда)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Farm Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/20 border-green-500/30 text-white">
          <CardContent className="text-center p-4">
            <div className="text-2xl font-bold">{prawns.length}</div>
            <div className="text-sm">Всього креветок</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/20 border-blue-500/30 text-white">
          <CardContent className="text-center p-4">
            <div className="text-2xl font-bold">{breedingPairs.length}</div>
            <div className="text-sm">Активних пар</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/20 border-purple-500/30 text-white">
          <CardContent className="text-center p-4">
            <div className="text-2xl font-bold">{farmStats.totalHarvested}</div>
            <div className="text-sm">Зібрано креветок</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/20 border-yellow-500/30 text-white">
          <CardContent className="text-center p-4">
            <div className="text-2xl font-bold">{farmStats.monthlyIncome} UAH</div>
            <div className="text-sm">Місячний дохід</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          onClick={createBreedingPair}
          disabled={selectedPrawns.length !== 2}
          className="bg-pink-500 hover:bg-pink-600"
        >
          💕 Створити пару ({selectedPrawns.length}/2)
        </Button>
        
        {readyToHarvestPrawns.length > 0 && (
          <Button 
            onClick={() => harvestPrawns(readyToHarvestPrawns.map(p => p.id))}
            className="bg-green-500 hover:bg-green-600"
          >
            🎣 Зібрати врожай ({readyToHarvestPrawns.length})
          </Button>
        )}
      </div>

      {/* Prawns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {prawns.map((prawn) => (
            <motion.div
              key={prawn.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              layout
            >
              <Card 
                className={`cursor-pointer transition-all duration-200 ${
                  selectedPrawns.includes(prawn.id)
                    ? 'bg-blue-500/30 border-blue-400 ring-2 ring-blue-400'
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                } text-white`}
                onClick={() => {
                  if (selectedPrawns.includes(prawn.id)) {
                    setSelectedPrawns(prev => prev.filter(id => id !== prawn.id))
                  } else if (selectedPrawns.length < 2) {
                    setSelectedPrawns(prev => [...prev, prawn.id])
                  }
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>🦐 {prawn.name}</span>
                    <Badge variant={
                      prawn.status === 'ready_to_harvest' ? 'default' :
                      prawn.status === 'breeding' ? 'secondary' : 'outline'
                    }>
                      {prawn.status === 'growing' && '🌱'}
                      {prawn.status === 'breeding' && '💕'}
                      {prawn.status === 'ready_to_harvest' && '✨'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Вік:</span>
                    <span>{prawn.age} днів</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Вага:</span>
                    <span>{prawn.weight}г</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Розмір:</span>
                    <span>
                      {prawn.size === 'baby' && '👶 Малюк'}
                      {prawn.size === 'juvenile' && '🦐 Молодь'}
                      {prawn.size === 'adult' && '🦐 Дорослий'}
                      {prawn.size === 'breeder' && '👑 Племінний'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Здоров'я:</span>
                      <span>{prawn.health}%</span>
                    </div>
                    <Progress value={prawn.health} className="h-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Exchange Rate Info */}
      <Card className="bg-yellow-500/20 border-yellow-500/30 text-white">
        <CardHeader>
          <CardTitle>💰 Курс обміну</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            <strong>{adminSettings.exchangeRatePerKg} UAH</strong> за 1 кг креветок
          </p>
          <p className="text-sm text-white/80">
            Мінімальна вага для збору: {adminSettings.minimumHarvestWeight}г
          </p>
        </CardContent>
      </Card>
    </div>
  )
}