import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useKV } from '@/hooks/useKV'
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

interface LeaderboardEntry {
  farmName: string
  totalShrimp: number
  totalBattleExperience: number
  totalWins: number
  avgShrimpLevel: number
  rareArtifacts: number
  lastUpdated: number
}

interface NetworkHubProps {
  onNavigate?: (section: string) => void
}

export function NetworkHub({ onNavigate }: NetworkHubProps) {
  const { language } = useLanguage()
  const [shrimpColony] = useKV<ShrimpData[]>('shrimp-colony', [])
  const [farmName, setFarmName] = useKV<string>('farm-name', '')
  const [globalLeaderboard, setGlobalLeaderboard] = useKV<LeaderboardEntry[]>('global-leaderboard', [])
  const [inputFarmName, setInputFarmName] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  // Calculate farm statistics
  const farmStats = {
    totalShrimp: shrimpColony.length,
    totalBattleExperience: shrimpColony.reduce((sum, shrimp) => sum + shrimp.battleExperience, 0),
    totalWins: shrimpColony.reduce((sum, shrimp) => sum + shrimp.wins, 0),
    avgShrimpLevel: shrimpColony.length > 0 
      ? Math.round(shrimpColony.reduce((sum, shrimp) => {
          const level = shrimp.stage === 'juvenile' ? 1 : 
                       shrimp.stage === 'young' ? 2 :
                       shrimp.stage === 'adult' ? 3 : 4
          return sum + level
        }, 0) / shrimpColony.length * 10) / 10
      : 0,
    rareArtifacts: shrimpColony.reduce((sum, shrimp) => 
      sum + shrimp.artifacts.filter(a => a.rarity === 'epic' || a.rarity === 'legendary').length, 0
    )
  }

  // Submit to global leaderboard
  const submitToLeaderboard = () => {
    if (!farmName.trim()) {
      toast.error(language === 'uk' ? 'Введіть назву ферми!' : 'Enter farm name!')
      return
    }

    const entry: LeaderboardEntry = {
      farmName: farmName.trim(),
      ...farmStats,
      lastUpdated: Date.now()
    }

    // Add or update entry in leaderboard
    setGlobalLeaderboard(current => {
      const filtered = current.filter(e => e.farmName !== entry.farmName)
      const updated = [...filtered, entry].sort((a, b) => {
        // Sort by battle experience primarily, then by wins
        if (b.totalBattleExperience !== a.totalBattleExperience) {
          return b.totalBattleExperience - a.totalBattleExperience
        }
        return b.totalWins - a.totalWins
      }).slice(0, 10) // Keep top 10
      
      return updated
    })

    setIsConnected(true)
    toast.success(language === 'uk' 
      ? 'Дані відправлені в глобальну мережу!' 
      : 'Data submitted to global network!')
  }

  const saveFarmName = () => {
    if (inputFarmName.trim()) {
      setFarmName(inputFarmName.trim())
      setInputFarmName('')
      toast.success(language === 'uk' ? 'Назву ферми збережено!' : 'Farm name saved!')
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  const getProgressColor = (experience: number) => {
    if (experience > 500) return 'text-yellow-400'
    if (experience > 200) return 'text-purple-400'
    if (experience > 100) return 'text-blue-400'
    return 'text-green-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🌐 {language === 'uk' ? 'Мережевий Хаб' : 'Network Hub'}
          </h1>
          <p className="text-white/80 text-lg">
            {language === 'uk' 
              ? 'Підключайтеся до глобальної мережі аквафермерів!'
              : 'Connect to the global network of aqua farmers!'}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Farm Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏠 {language === 'uk' ? 'Профіль Ферми' : 'Farm Profile'}
                {isConnected && <Badge variant="secondary" className="bg-green-600">ONLINE</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!farmName ? (
                <div className="space-y-3">
                  <Input
                    placeholder={language === 'uk' ? 'Назва вашої ферми...' : 'Your farm name...'}
                    value={inputFarmName}
                    onChange={(e) => setInputFarmName(e.target.value)}
                    maxLength={20}
                  />
                  <Button onClick={saveFarmName} className="w-full">
                    {language === 'uk' ? 'Зберегти назву' : 'Save Name'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-yellow-400">{farmName}</h3>
                    <p className="text-sm text-white/60">
                      {language === 'uk' ? 'Ваша креветкова ферма' : 'Your Shrimp Farm'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-blue-400">{farmStats.totalShrimp}</div>
                      <div className="text-white/60">{language === 'uk' ? 'Креветок' : 'Shrimp'}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className={`text-xl font-bold ${getProgressColor(farmStats.totalBattleExperience)}`}>
                        {farmStats.totalBattleExperience}
                      </div>
                      <div className="text-white/60">{language === 'uk' ? 'Досвід' : 'Experience'}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-400">{farmStats.totalWins}</div>
                      <div className="text-white/60">{language === 'uk' ? 'Перемог' : 'Wins'}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-purple-400">{farmStats.rareArtifacts}</div>
                      <div className="text-white/60">{language === 'uk' ? 'Рідкісних' : 'Rare Items'}</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-white/60 mb-2">
                      {language === 'uk' ? 'Середній рівень:' : 'Average Level:'} {farmStats.avgShrimpLevel}
                    </div>
                    <Button 
                      onClick={submitToLeaderboard} 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      🚀 {language === 'uk' ? 'Підключитися до мережі' : 'Connect to Network'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Global Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏆 {language === 'uk' ? 'Глобальна Таблиця Лідерів' : 'Global Leaderboard'}
                <Badge variant="outline">{globalLeaderboard.length}/10</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {globalLeaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/60">
                    {language === 'uk' 
                      ? 'Станьте першим у глобальній мережі!' 
                      : 'Be the first in the global network!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {globalLeaderboard.map((entry, index) => (
                    <motion.div
                      key={entry.farmName}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white/5 rounded-lg p-3 flex items-center justify-between ${
                        entry.farmName === farmName ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold">
                          {getRankIcon(index + 1)}
                        </div>
                        <div>
                          <div className="font-medium">{entry.farmName}</div>
                          <div className="text-xs text-white/60">
                            {entry.totalShrimp} {language === 'uk' ? 'креветок' : 'shrimp'} • 
                            {entry.totalWins} {language === 'uk' ? 'перемог' : 'wins'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${getProgressColor(entry.totalBattleExperience)}`}>
                          {entry.totalBattleExperience}
                        </div>
                        <div className="text-xs text-white/60">EXP</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Network Features */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-bold mb-1">
                {language === 'uk' ? 'Виклики' : 'Challenges'}
              </h3>
              <p className="text-sm text-white/60">
                {language === 'uk' ? 'Щоденні завдання' : 'Daily missions'}
              </p>
              <Badge variant="outline" className="mt-2">
                {language === 'uk' ? 'Скоро' : 'Coming Soon'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">⚔️</div>
              <h3 className="font-bold mb-1">
                {language === 'uk' ? 'Турніри' : 'Tournaments'}
              </h3>
              <p className="text-sm text-white/60">
                {language === 'uk' ? 'Глобальні змагання' : 'Global competitions'}
              </p>
              <Badge variant="outline" className="mt-2">
                {language === 'uk' ? 'Скоро' : 'Coming Soon'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">🎁</div>
              <h3 className="font-bold mb-1">
                {language === 'uk' ? 'Торгівля' : 'Trading'}
              </h3>
              <p className="text-sm text-white/60">
                {language === 'uk' ? 'Обмін артефактами' : 'Artifact exchange'}
              </p>
              <Badge variant="outline" className="mt-2">
                {language === 'uk' ? 'Скоро' : 'Coming Soon'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Network Stats */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">
                  📊 {language === 'uk' ? 'Статистика Мережі' : 'Network Statistics'}
                </h3>
                <p className="text-sm text-white/60">
                  {language === 'uk' ? 'Активних ферм:' : 'Active farms:'} {globalLeaderboard.length}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/60">
                  {language === 'uk' ? 'Загальний досвід:' : 'Total experience:'}
                </div>
                <div className="font-bold text-lg">
                  {globalLeaderboard.reduce((sum, entry) => sum + entry.totalBattleExperience, 0).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default NetworkHub