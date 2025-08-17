import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@/hooks/useKV'
import { useAudio } from '@/hooks/useAudio'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'

interface ShrimpData {
  id: string
  name: string
  age: number
  stage: 'juvenile' | 'young' | 'adult' | 'breeding'
  gender: 'male' | 'female'
  health: number
  size: number
  breedingReadiness: number
  experienceFromFeeding: number
  birthDate: number
  lastInteraction: number
  combatStats: {
    attack: number
    defense: number
    speed: number
    intelligence: number
    endurance: number
  }
  artifacts: Array<{
    id: string
    name: string
    type: 'weapon' | 'armor' | 'intelligence' | 'speed' | 'special'
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    bonuses: {
      attack?: number
      defense?: number
      speed?: number
      intelligence?: number
      endurance?: number
    }
    acquiredDate: number
  }>
  battleExperience: number
  wins: number
  losses: number
}

interface BattleArenaProps {
  onNavigate?: (section: string) => void
}

interface BattleResult {
  winner: ShrimpData
  loser: ShrimpData
  battleType: 'combat' | 'intelligence' | 'speed'
  duration: number
  experienceGained: number
  artifactReward?: any
}

export function BattleArena({ onNavigate }: BattleArenaProps) {
  const { language } = useLanguage()
  const [shrimpColony, setShrimpColony] = useKV<ShrimpData[]>('shrimp-colony', [])
  const [battleHistory, setBattleHistory] = useKV<BattleResult[]>('battle-history', [])
  const [selectedFighter1, setSelectedFighter1] = useState<ShrimpData | null>(null)
  const [selectedFighter2, setSelectedFighter2] = useState<ShrimpData | null>(null)
  const [battleType, setBattleType] = useState<'combat' | 'intelligence' | 'speed'>('combat')
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentBattle, setCurrentBattle] = useState<BattleResult | null>(null)
  const { playSuccessSound, playSwooshSound } = useAudio()

  // Get battle-ready shrimp (young stage and above)
  const battleReadyShrimp = shrimpColony.filter(shrimp => 
    shrimp.stage !== 'juvenile' && shrimp.health > 30
  )

  // Calculate total combat power including artifacts
  const calculateTotalPower = (shrimp: ShrimpData, type: 'combat' | 'intelligence' | 'speed') => {
    const baseStat = type === 'combat' 
      ? (shrimp.combatStats.attack + shrimp.combatStats.defense) / 2
      : type === 'intelligence'
      ? shrimp.combatStats.intelligence
      : shrimp.combatStats.speed

    const artifactBonus = shrimp.artifacts.reduce((total, artifact) => {
      const bonus = type === 'combat'
        ? (artifact.bonuses.attack || 0) + (artifact.bonuses.defense || 0)
        : type === 'intelligence'
        ? (artifact.bonuses.intelligence || 0)
        : (artifact.bonuses.speed || 0)
      return total + bonus
    }, 0)

    const experienceBonus = Math.floor(shrimp.battleExperience / 10)
    const stageMultiplier = {
      juvenile: 0.5,
      young: 1.0,
      adult: 1.5,
      breeding: 2.0
    }[shrimp.stage]

    return Math.round((baseStat + artifactBonus + experienceBonus) * stageMultiplier)
  }

  // Simulate battle with more sophisticated mechanics
  const simulateBattle = (fighter1: ShrimpData, fighter2: ShrimpData, type: 'combat' | 'intelligence' | 'speed') => {
    const power1 = calculateTotalPower(fighter1, type)
    const power2 = calculateTotalPower(fighter2, type)
    
    // Add some randomness but favor stronger shrimp
    const random1 = power1 * (0.8 + Math.random() * 0.4) // 80-120% of power
    const random2 = power2 * (0.8 + Math.random() * 0.4)
    
    const winner = random1 > random2 ? fighter1 : fighter2
    const loser = winner === fighter1 ? fighter2 : fighter1
    
    const duration = Math.round(30 + Math.random() * 60) // 30-90 seconds
    const baseExp = 10 + Math.round(Math.abs(power1 - power2) / 5) // More exp for closer matches
    const experienceGained = Math.round(baseExp * (winner === fighter1 ? 1.0 : 1.2)) // Slight bonus for underdog wins

    return {
      winner,
      loser,
      battleType: type,
      duration,
      experienceGained,
      power1: Math.round(random1),
      power2: Math.round(random2)
    }
  }

  // Start battle
  const startBattle = async () => {
    if (!selectedFighter1 || !selectedFighter2) {
      toast.error(language === 'uk' ? 'Оберіть двох бійців!' : 'Select two fighters!')
      return
    }

    if (selectedFighter1.id === selectedFighter2.id) {
      toast.error(language === 'uk' ? 'Креветка не може битися сама з собою!' : 'Shrimp cannot fight itself!')
      return
    }

    setIsAnimating(true)
    playSwooshSound({ volume: 0.3 })

    // Simulate battle delay
    setTimeout(() => {
      const result = simulateBattle(selectedFighter1, selectedFighter2, battleType)
      
      const artifactReward = Math.random() < 0.3 ? generateArtifact() : null // 30% chance for artifact
      
      setCurrentBattle({
        ...result,
        artifactReward
      })

      // Update shrimp stats in colony
      setShrimpColony(current => 
        current.map(shrimp => {
          if (shrimp.id === result.winner.id) {
            // Winner gets experience and possibly an artifact
            return {
              ...shrimp,
              battleExperience: shrimp.battleExperience + result.experienceGained,
              wins: shrimp.wins + 1,
              artifacts: artifactReward ? [...shrimp.artifacts, artifactReward] : shrimp.artifacts
            }
          } else if (shrimp.id === result.loser.id) {
            // Loser gets less experience
            return {
              ...shrimp,
              battleExperience: shrimp.battleExperience + Math.floor(result.experienceGained / 2),
              losses: shrimp.losses + 1
            }
          }
          return shrimp
        })
      )

      // Update battle stats
      setBattleHistory(prev => [result, ...prev.slice(0, 9)]) // Keep last 10 battles
      
      playSuccessSound({ volume: 0.4 })
      setIsAnimating(false)
      
      toast.success(language === 'uk' 
        ? `${result.winner.name} переміг за ${result.duration}с!`
        : `${result.winner.name} won in ${result.duration}s!`)
        
      // Reset fighters to update their displayed stats
      setSelectedFighter1(null)
      setSelectedFighter2(null)
    }, 3000)
  }

  // Generate random artifact as battle reward
  const generateArtifact = (): ShrimpData['artifacts'][0] => {
    const artifacts = [
      { name: { uk: 'Гострі Кліщі', en: 'Sharp Claws' }, type: 'weapon' as const, bonuses: { attack: 5 } },
      { name: { uk: 'Броня Панцира', en: 'Shell Armor' }, type: 'armor' as const, bonuses: { defense: 5 } },
      { name: { uk: 'Розумні Вуса', en: 'Smart Antennae' }, type: 'intelligence' as const, bonuses: { intelligence: 5 } },
      { name: { uk: 'Швидкі Плавці', en: 'Speed Fins' }, type: 'speed' as const, bonuses: { speed: 5 } }
    ]
    
    const rarities: Array<'common' | 'rare' | 'epic' | 'legendary'> = ['common', 'rare', 'epic', 'legendary']
    const rarity = rarities[Math.floor(Math.random() * rarities.length)]
    const artifact = artifacts[Math.floor(Math.random() * artifacts.length)]
    
    return {
      id: `artifact-${Date.now()}`,
      name: artifact.name[language],
      type: artifact.type,
      rarity,
      bonuses: artifact.bonuses,
      acquiredDate: Date.now()
    }
  }

  const getBattleTypeIcon = (type: 'combat' | 'intelligence' | 'speed') => {
    switch (type) {
      case 'combat': return '⚔️'
      case 'intelligence': return '🧠'
      case 'speed': return '💨'
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500'
      case 'rare': return 'bg-blue-500'
      case 'epic': return 'bg-purple-500'
      case 'legendary': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-orange-900 to-yellow-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            ⚔️ {language === 'uk' ? 'Арена Битв' : 'Battle Arena'}
          </h1>
          <p className="text-white/80 text-lg">
            {language === 'uk' 
              ? 'Де дорослі креветки змагаються за славу та артефакти!'
              : 'Where mature shrimp compete for glory and artifacts!'}
          </p>
        </div>

        <Tabs defaultValue="battle" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="battle">
              ⚔️ {language === 'uk' ? 'Битва' : 'Battle'}
            </TabsTrigger>
            <TabsTrigger value="fighters">
              🦐 {language === 'uk' ? 'Бійці' : 'Fighters'}
            </TabsTrigger>
            <TabsTrigger value="history">
              📜 {language === 'uk' ? 'Історія' : 'History'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="battle" className="space-y-6">
            {/* Battle Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>{language === 'uk' ? 'Тип Битви' : 'Battle Type'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {(['combat', 'intelligence', 'speed'] as const).map(type => (
                    <Button
                      key={type}
                      variant={battleType === type ? 'default' : 'outline'}
                      onClick={() => setBattleType(type)}
                      className="h-16 flex flex-col"
                    >
                      <span className="text-2xl mb-1">{getBattleTypeIcon(type)}</span>
                      <span className="text-sm">
                        {type === 'combat' ? (language === 'uk' ? 'Бій' : 'Combat') :
                         type === 'intelligence' ? (language === 'uk' ? 'Розум' : 'Intelligence') :
                         (language === 'uk' ? 'Швидкість' : 'Speed')}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fighter Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2].map(fighterNum => (
                <Card key={fighterNum}>
                  <CardHeader>
                    <CardTitle>
                      {language === 'uk' ? `Боєць ${fighterNum}` : `Fighter ${fighterNum}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(fighterNum === 1 ? selectedFighter1 : selectedFighter2) ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg">
                            {(fighterNum === 1 ? selectedFighter1 : selectedFighter2)?.name}
                          </h3>
                          <Badge variant="secondary">
                            {(fighterNum === 1 ? selectedFighter1 : selectedFighter2)?.stage}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            {language === 'uk' ? 'Сила битви' : 'Battle Power'}: {' '}
                            <span className="font-bold text-yellow-400">
                              {calculateTotalPower((fighterNum === 1 ? selectedFighter1 : selectedFighter2)!, battleType)}
                            </span>
                          </div>
                          <div>
                            {language === 'uk' ? 'Артефакти' : 'Artifacts'}: {' '}
                            <span className="font-bold">
                              {(fighterNum === 1 ? selectedFighter1 : selectedFighter2)?.artifacts.length || 0}
                            </span>
                          </div>
                          <div>
                            {language === 'uk' ? 'Досвід битв' : 'Battle Experience'}: {' '}
                            <span className="font-bold">
                              {(fighterNum === 1 ? selectedFighter1 : selectedFighter2)?.battleExperience || 0}
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => fighterNum === 1 ? setSelectedFighter1(null) : setSelectedFighter2(null)}
                        >
                          {language === 'uk' ? 'Змінити' : 'Change'}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-center text-muted-foreground">
                          {language === 'uk' ? 'Оберіть бійця' : 'Select a fighter'}
                        </p>
                        <div className="grid gap-2 max-h-48 overflow-y-auto">
                          {battleReadyShrimp
                            .filter(shrimp => shrimp.id !== (fighterNum === 1 ? selectedFighter2?.id : selectedFighter1?.id))
                            .map(shrimp => (
                            <Button
                              key={shrimp.id}
                              variant="ghost"
                              size="sm"
                              onClick={() => fighterNum === 1 ? setSelectedFighter1(shrimp) : setSelectedFighter2(shrimp)}
                              className="justify-start h-auto p-2"
                            >
                              <div className="text-left">
                                <div className="font-medium">{shrimp.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {shrimp.stage} • {language === 'uk' ? 'Сила' : 'Power'}: {calculateTotalPower(shrimp, battleType)}
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Battle Button and Animation */}
            <div className="text-center space-y-4">
              <Button
                size="lg"
                onClick={startBattle}
                disabled={!selectedFighter1 || !selectedFighter2 || isAnimating}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-xl"
              >
                {isAnimating 
                  ? (language === 'uk' ? 'Битва триває...' : 'Battle in progress...')
                  : `⚔️ ${language === 'uk' ? 'БИТВА!' : 'BATTLE!'}`}
              </Button>

              {isAnimating && (
                <motion.div 
                  className="text-6xl"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: Infinity 
                  }}
                >
                  ⚔️
                </motion.div>
              )}

              {currentBattle && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <Card className="max-w-md mx-auto">
                    <CardHeader>
                      <CardTitle className="text-center">
                        🏆 {language === 'uk' ? 'Результат Битви' : 'Battle Result'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-3">
                      <div className="text-lg font-bold text-yellow-400">
                        {currentBattle.winner.name} {language === 'uk' ? 'переміг!' : 'wins!'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'uk' ? 'Тривалість' : 'Duration'}: {currentBattle.duration}s
                      </div>
                      <div className="text-sm text-muted-foreground">
                        +{currentBattle.experienceGained} {language === 'uk' ? 'досвіду' : 'experience'}
                      </div>
                      {currentBattle.artifactReward && (
                        <div className="text-sm text-green-400">
                          🎁 {language === 'uk' ? 'Новий артефакт!' : 'New artifact!'} {currentBattle.artifactReward.name}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="fighters" className="space-y-4">
            <div className="grid gap-4">
              {battleReadyShrimp.map(shrimp => (
                <Card key={shrimp.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{shrimp.name}</h3>
                        <div className="text-sm text-muted-foreground space-x-4">
                          <span>Stage: {shrimp.stage}</span>
                          <span>W/L: {shrimp.wins}/{shrimp.losses}</span>
                          <span>Exp: {shrimp.battleExperience}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-sm">
                          <span className="text-red-400">⚔️ {calculateTotalPower(shrimp, 'combat')}</span>
                          <span className="text-blue-400 ml-2">🧠 {calculateTotalPower(shrimp, 'intelligence')}</span>
                          <span className="text-green-400 ml-2">💨 {calculateTotalPower(shrimp, 'speed')}</span>
                        </div>
                        <div className="text-xs">
                          {shrimp.artifacts.length} {language === 'uk' ? 'артефактів' : 'artifacts'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {battleHistory.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    {language === 'uk' ? 'Поки що битв не було' : 'No battles yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {battleHistory.map((battle, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {battle.winner.name} vs {battle.loser.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getBattleTypeIcon(battle.battleType)} {battle.battleType} • {battle.duration}s
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-yellow-400">
                            {battle.winner.name} {language === 'uk' ? 'переміг' : 'won'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            +{battle.experienceGained} exp
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default BattleArena