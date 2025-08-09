import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useKV } from '@/hooks/useKV'
import { useAudio } from '@/hooks/useAudio'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'

interface FoodItem {
  id: string
  name: { uk: string; en: string }
  type: 'pellets' | 'algae' | 'worms' | 'fish' | 'vegetables' | 'premium'
  nutritionValue: number
  prawnPreference: number
  cost: number
  color: string
  description: { uk: string; en: string }
  effects: {
    growth: number
    health: number
    mood: number
    color: number
  }
}

interface PrawnStats {
  hunger: number
  health: number
  growth: number
  mood: number
  colorIntensity: number
  level: number
  experience: number
}

interface FeedingSession {
  id: string
  timestamp: string
  foodUsed: string[]
  statsChange: Partial<PrawnStats>
  duration: number
  success: boolean
}

const foodTypes: FoodItem[] = [
  {
    id: 'commercial-pellets',
    name: { uk: 'Комерційні гранули', en: 'Commercial Pellets' },
    type: 'pellets',
    nutritionValue: 7,
    prawnPreference: 8,
    cost: 2,
    color: '#8B4513',
    description: {
      uk: 'Збалансований корм для щоденного годування',
      en: 'Balanced feed for daily feeding',
    },
    effects: { growth: 5, health: 7, mood: 5, color: 3 },
  },
  {
    id: 'spirulina-algae',
    name: { uk: 'Спіруліна', en: 'Spirulina Algae' },
    type: 'algae',
    nutritionValue: 6,
    prawnPreference: 7,
    cost: 3,
    color: '#006400',
    description: {
      uk: 'Природні водорості багаті на білок',
      en: 'Natural algae rich in protein',
    },
    effects: { growth: 4, health: 8, mood: 6, color: 8 },
  },
  {
    id: 'bloodworms',
    name: { uk: 'Мотиль', en: 'Bloodworms' },
    type: 'worms',
    nutritionValue: 9,
    prawnPreference: 10,
    cost: 5,
    color: '#DC143C',
    description: {
      uk: 'Живий корм з високим вмістом білка',
      en: 'Live food with high protein content',
    },
    effects: { growth: 9, health: 6, mood: 10, color: 5 },
  },
  {
    id: 'fish-flakes',
    name: { uk: 'Рибні пластівці', en: 'Fish Flakes' },
    type: 'fish',
    nutritionValue: 5,
    prawnPreference: 6,
    cost: 1,
    color: '#FFD700',
    description: {
      uk: 'Економічний варіант для молодих креветок',
      en: 'Economical option for young prawns',
    },
    effects: { growth: 3, health: 5, mood: 4, color: 2 },
  },
  {
    id: 'blanched-spinach',
    name: { uk: 'Вареный шпинат', en: 'Blanched Spinach' },
    type: 'vegetables',
    nutritionValue: 4,
    prawnPreference: 5,
    cost: 1,
    color: '#228B22',
    description: {
      uk: 'Натуральний джерело вітамінів та мінералів',
      en: 'Natural source of vitamins and minerals',
    },
    effects: { growth: 2, health: 9, mood: 3, color: 6 },
  },
  {
    id: 'artemia',
    name: { uk: 'Артемія', en: 'Artemia' },
    type: 'premium',
    nutritionValue: 10,
    prawnPreference: 9,
    cost: 8,
    color: '#FF6347',
    description: {
      uk: 'Преміум живий корм для максимального росту',
      en: 'Premium live food for maximum growth',
    },
    effects: { growth: 10, health: 8, mood: 9, color: 7 },
  },
  {
    id: 'calcium-supplement',
    name: { uk: 'Кальцієва добавка', en: 'Calcium Supplement' },
    type: 'premium',
    nutritionValue: 3,
    prawnPreference: 4,
    cost: 6,
    color: '#FFFFFF',
    description: {
      uk: 'Спеціальна добавка для міцного панцира',
      en: 'Special supplement for strong shell',
    },
    effects: { growth: 1, health: 10, mood: 2, color: 4 },
  },
  {
    id: 'krill-meal',
    name: { uk: 'Борошно з крилю', en: 'Krill Meal' },
    type: 'premium',
    nutritionValue: 8,
    prawnPreference: 8,
    cost: 4,
    color: '#FF1493',
    description: {
      uk: 'Багатий на каротиноїди для яскравого забарвлення',
      en: 'Rich in carotenoids for vibrant coloration',
    },
    effects: { growth: 6, health: 6, mood: 7, color: 10 },
  },
]

interface FeedingSimulationProps {
  onPrawnFeed?: (foodType: string, intensity: number) => void
  onStatsUpdate?: (stats: PrawnStats) => void
}

export function FeedingSimulation({ onPrawnFeed, onStatsUpdate }: FeedingSimulationProps) {
  const { t, language } = useLanguage()
  const { playClickSound, playSuccessSound, playWarnSound } = useAudio()

  const [prawnStats, setPrawnStats] = useKV<PrawnStats>('prawn-stats', {
    hunger: 50,
    health: 80,
    growth: 30,
    mood: 70,
    colorIntensity: 60,
    level: 1,
    experience: 0,
  })

  const [feedingSessions, setFeedingSessions] = useKV<FeedingSession[]>('feeding-sessions', [])
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [isFeeding, setIsFeeding] = useState(false)
  const [feedingAnimation, setFeedingAnimation] = useState<number[]>([])
  const [coins, setCoins] = useKV<number>('prawn-coins', 100)
  const [lastFeedTime, setLastFeedTime] = useKV<number>('last-feed-time', 0)
  const [feedingStreak, setFeedingStreak] = useKV<number>('feeding-streak', 0)
  const [lastDailyBonus, setLastDailyBonus] = useKV<number>('last-daily-bonus', 0)
  const [achievements, setAchievements] = useKV<string[]>('prawn-achievements', [])
  const [showDailyBonus, setShowDailyBonus] = useState(false)
  const [newAchievement, setNewAchievement] = useState<string | null>(null)

  const feedingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Achievement definitions
  const achievementList = [
    {
      id: 'first-feed',
      name: { uk: 'Перше годування', en: 'First Feeding' },
      description: { uk: 'Нагодуйте креветку вперше', en: 'Feed the prawn for the first time' },
      condition: (stats: PrawnStats, sessions: FeedingSession[]) => sessions.length >= 1,
    },
    {
      id: 'level-5',
      name: { uk: 'Досвідчений', en: 'Experienced' },
      description: { uk: 'Досягніть 5-го рівня', en: 'Reach level 5' },
      condition: (stats: PrawnStats) => stats.level >= 5,
    },
    {
      id: 'streak-7',
      name: { uk: 'Відданий годувальник', en: 'Dedicated Feeder' },
      description: { uk: 'Годуйте 7 днів поспіль', en: 'Feed for 7 days straight' },
      condition: () => feedingStreak >= 7,
    },
    {
      id: 'max-health',
      name: { uk: "Ідеальне здоров'я", en: 'Perfect Health' },
      description: { uk: "Досягніть 100% здоров'я", en: 'Reach 100% health' },
      condition: (stats: PrawnStats) => stats.health >= 100,
    },
    {
      id: 'colorful',
      name: { uk: 'Яскрава креветка', en: 'Colorful Prawn' },
      description: { uk: 'Досягніть 90% інтенсивності кольору', en: 'Reach 90% color intensity' },
      condition: (stats: PrawnStats) => stats.colorIntensity >= 90,
    },
  ]

  // Check for new achievements
  useEffect(() => {
    achievementList.forEach(achievement => {
      if (!achievements.includes(achievement.id)) {
        const isUnlocked = achievement.condition(prawnStats, feedingSessions)
        if (isUnlocked) {
          setAchievements(current => [...current, achievement.id])
          setNewAchievement(achievement.id)
          playSuccessSound({ volume: 0.5, playbackRate: 1.3 })
          toast.success(
            `🏆 ${language === 'uk' ? 'Нове досягнення!' : 'New Achievement!'} ${achievement.name[language]}`
          )

          // Award bonus coins for achievements
          setCoins(current => current + 25)

          setTimeout(() => setNewAchievement(null), 3000)
        }
      }
    })
  }, [
    prawnStats,
    feedingSessions,
    achievements,
    language,
    playSuccessSound,
    setAchievements,
    setCoins,
  ])

  // Check for daily bonus
  useEffect(() => {
    const now = Date.now()
    const oneDayMs = 24 * 60 * 60 * 1000
    const timeSinceLastBonus = now - lastDailyBonus

    if (timeSinceLastBonus >= oneDayMs) {
      setShowDailyBonus(true)
    }
  }, [lastDailyBonus])

  const claimDailyBonus = () => {
    const bonusCoins = 50 + feedingStreak * 5 // More coins for longer streaks
    setCoins(current => current + bonusCoins)
    setLastDailyBonus(Date.now())
    setShowDailyBonus(false)

    playSuccessSound({ volume: 0.4, playbackRate: 1.1 })
    toast.success(t('dailyBonusClaimed', `Daily bonus claimed! +${bonusCoins} coins 🎁`))
  }

  // Auto-decay stats over time
  useEffect(() => {
    const decayInterval = setInterval(() => {
      setPrawnStats(current => {
        const now = Date.now()
        const timeSinceLastFeed = now - lastFeedTime
        const hoursWithoutFood = timeSinceLastFeed / (1000 * 60 * 60)

        const newStats = { ...current }

        // Hunger increases over time
        if (hoursWithoutFood > 2) {
          newStats.hunger = Math.max(0, current.hunger - 2)
        }

        // Health decreases if very hungry
        if (newStats.hunger < 20) {
          newStats.health = Math.max(0, current.health - 1)
        }

        // Mood affected by hunger
        if (newStats.hunger < 30) {
          newStats.mood = Math.max(0, current.mood - 1)
        }

        return newStats
      })
    }, 30000) // Check every 30 seconds

    return () => clearInterval(decayInterval)
  }, [lastFeedTime, setPrawnStats])

  // Level up system
  useEffect(() => {
    if (prawnStats.experience >= prawnStats.level * 100) {
      setPrawnStats(current => ({
        ...current,
        level: current.level + 1,
        experience: current.experience - current.level * 100,
      }))
      playSuccessSound({ volume: 0.3, playbackRate: 1.2 })
      toast.success(t('levelUp', `Level Up! Now level ${prawnStats.level + 1}`))
    }
  }, [prawnStats.experience, prawnStats.level, setPrawnStats, playSuccessSound, t])

  // Notify parent about stats changes
  useEffect(() => {
    onStatsUpdate?.(prawnStats)
  }, [prawnStats, onStatsUpdate])

  const feedPrawn = async (food: FoodItem) => {
    if (isFeeding || coins < food.cost) {
      if (coins < food.cost) {
        playWarnSound({ volume: 0.2 })
        toast.error(t('notEnoughCoins', 'Not enough coins!'))
      }
      return
    }

    playClickSound({ volume: 0.1 })
    setIsFeeding(true)
    setSelectedFood(food)

    // Deduct coins
    setCoins(current => current - food.cost)

    // Create feeding animation
    const particles = Array.from({ length: 8 }, (_, i) => i)
    setFeedingAnimation(particles)

    // Trigger prawn feeding animation
    onPrawnFeed?.(food.type, food.prawnPreference / 10)

    // Calculate stat changes based on current stats and food effects
    setTimeout(() => {
      setPrawnStats(current => {
        const hungerBonus = current.hunger < 30 ? 1.5 : 1.0 // Extra benefit if very hungry
        const moodBonus = current.mood > 80 ? 0.8 : 1.0 // Less benefit if already happy

        const newStats = {
          hunger: Math.min(100, current.hunger + food.nutritionValue * 8 * hungerBonus),
          health: Math.min(100, current.health + food.effects.health * hungerBonus),
          growth: Math.min(100, current.growth + food.effects.growth * 0.5),
          mood: Math.min(100, current.mood + food.effects.mood * moodBonus),
          colorIntensity: Math.min(100, current.colorIntensity + food.effects.color),
          level: current.level,
          experience: current.experience + food.nutritionValue * 5,
        }

        // Record feeding session
        const session: FeedingSession = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          foodUsed: [food.id],
          statsChange: {
            hunger: newStats.hunger - current.hunger,
            health: newStats.health - current.health,
            growth: newStats.growth - current.growth,
            mood: newStats.mood - current.mood,
            colorIntensity: newStats.colorIntensity - current.colorIntensity,
          },
          duration: 0,
          success: newStats.hunger > current.hunger,
        }

        setFeedingSessions(sessions => [session, ...sessions.slice(0, 49)]) // Keep last 50 sessions
        setLastFeedTime(Date.now())

        // Update feeding streak
        setFeedingStreak(current => current + 1)

        return newStats
      })

      playSuccessSound({ volume: 0.2, playbackRate: 0.9 })
      toast.success(t('prawnFed', `Fed prawn with ${food.name[language]}!`))

      // Clear animation
      setTimeout(() => {
        setFeedingAnimation([])
        setIsFeeding(false)
        setSelectedFood(null)
      }, 1000)
    }, 1500)
  }

  const getStatColor = (value: number) => {
    if (value >= 80) return 'text-green-500'
    if (value >= 50) return 'text-yellow-500'
    if (value >= 30) return 'text-orange-500'
    return 'text-red-500'
  }

  const getStatBgColor = (value: number) => {
    if (value >= 80) return 'bg-green-500'
    if (value >= 50) return 'bg-yellow-500'
    if (value >= 30) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getFoodTypeIcon = (type: string) => {
    switch (type) {
      case 'pellets':
        return '🔶'
      case 'algae':
        return '🌿'
      case 'worms':
        return '🪱'
      case 'fish':
        return '🐟'
      case 'vegetables':
        return '🥬'
      case 'premium':
        return '⭐'
      default:
        return '🍽️'
    }
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient-primary mb-2">
            {t('feedingSimulation', 'Virtual Prawn Feeding Simulation')}
          </h1>
          <p className="text-muted-foreground mb-4">
            {t(
              'feedingDescription',
              'Take care of your virtual Macrobrachium rosenbergii by feeding it the right food!'
            )}
          </p>

          {/* Quick Instructions */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold mb-2">
              {language === 'uk' ? '🎮 Як грати:' : '🎮 How to play:'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-left">
              <div>
                • {language === 'uk' ? 'Виберіть корм для креветки' : 'Choose food for the prawn'}
              </div>
              <div>
                •{' '}
                {language === 'uk'
                  ? 'Різний корм має різний ефект'
                  : 'Different food has different effects'}
              </div>
              <div>
                • {language === 'uk' ? 'Слідкуйте за статистикою' : 'Monitor the statistics'}
              </div>
              <div>
                • {language === 'uk' ? 'Заробляйте досвід та рівні' : 'Earn experience and levels'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prawn Stats Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🦐 {t('prawnStats', 'Prawn Stats')}
                <Badge variant="secondary">Level {prawnStats.level}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats Display */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t('hunger', 'Hunger')}</span>
                    <span className={getStatColor(prawnStats.hunger)}>{prawnStats.hunger}%</span>
                  </div>
                  <Progress value={prawnStats.hunger} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t('health', 'Health')}</span>
                    <span className={getStatColor(prawnStats.health)}>{prawnStats.health}%</span>
                  </div>
                  <Progress value={prawnStats.health} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t('growth', 'Growth')}</span>
                    <span className={getStatColor(prawnStats.growth)}>{prawnStats.growth}%</span>
                  </div>
                  <Progress value={prawnStats.growth} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t('mood', 'Mood')}</span>
                    <span className={getStatColor(prawnStats.mood)}>{prawnStats.mood}%</span>
                  </div>
                  <Progress value={prawnStats.mood} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t('colorIntensity', 'Color Intensity')}</span>
                    <span className={getStatColor(prawnStats.colorIntensity)}>
                      {prawnStats.colorIntensity}%
                    </span>
                  </div>
                  <Progress value={prawnStats.colorIntensity} className="h-2" />
                </div>
              </div>

              {/* Experience and Coins */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('experience', 'Experience')}</span>
                  <span>
                    {prawnStats.experience}/{prawnStats.level * 100}
                  </span>
                </div>
                <Progress
                  value={(prawnStats.experience / (prawnStats.level * 100)) * 100}
                  className="h-2"
                />

                <div className="flex justify-between items-center">
                  <span className="text-sm">💰 {t('coins', 'Coins')}</span>
                  <Badge variant="outline">{coins}</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">🔥 {t('streak', 'Feeding Streak')}</span>
                  <Badge variant="outline">{feedingStreak}</Badge>
                </div>

                {/* Emergency Feeding Option */}
                {prawnStats.hunger < 20 && (
                  <div className="border border-orange-200 bg-orange-50 rounded-lg p-3 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-orange-600">⚠️</span>
                      <span className="text-sm font-medium text-orange-800">
                        {language === 'uk' ? 'Критично голодна!' : 'Critically Hungry!'}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                      onClick={() => {
                        if (coins >= 10) {
                          setCoins(c => c - 10)
                          setPrawnStats(current => ({
                            ...current,
                            hunger: Math.min(100, current.hunger + 30),
                          }))
                          toast.success(
                            language === 'uk' ? 'Екстрене годування!' : 'Emergency feeding!'
                          )
                        }
                      }}
                      disabled={coins < 10}
                    >
                      {language === 'uk'
                        ? 'Екстрене годування (10 монет)'
                        : 'Emergency Feed (10 coins)'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Food Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>🍽️ {t('chooseFood', 'Choose Food')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {foodTypes.map(food => (
                  <motion.div key={food.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Card
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        coins < food.cost ? 'opacity-50 cursor-not-allowed' : ''
                      } ${selectedFood?.id === food.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => feedPrawn(food)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm"
                            style={{ backgroundColor: food.color + '20' }}
                          >
                            {getFoodTypeIcon(food.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-sm">{food.name[language]}</h3>
                              <Badge variant="secondary" className="text-xs">
                                💰 {food.cost}
                              </Badge>
                            </div>

                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {food.description[language]}
                            </p>

                            <div className="flex gap-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                📊 {food.nutritionValue}/10
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                ❤️ {food.prawnPreference}/10
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievement Notification */}
        <AnimatePresence>
          {newAchievement && (
            <div className="fixed bottom-4 right-4 z-50">
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="bg-white border border-primary/30 rounded-lg p-4 shadow-lg max-w-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🏆</span>
                  <div>
                    <h3 className="font-bold text-primary">
                      {language === 'uk' ? 'Нове досягнення!' : 'New Achievement!'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {achievementList.find(a => a.id === newAchievement)?.name[language]}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      +25 💰
                    </Badge>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Daily Bonus Modal */}
        <AnimatePresence>
          {showDailyBonus && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="bg-white rounded-2xl p-6 shadow-2xl text-center max-w-sm w-full"
              >
                <div className="text-6xl mb-4">🎁</div>
                <h3 className="text-2xl font-bold text-primary mb-2">
                  {language === 'uk' ? 'Щоденний бонус!' : 'Daily Bonus!'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {language === 'uk'
                    ? `Отримайте ${50 + feedingStreak * 5} монет за активність!`
                    : `Get ${50 + feedingStreak * 5} coins for being active!`}
                </p>
                <Button onClick={claimDailyBonus} size="lg" className="w-full">
                  {language === 'uk' ? 'Отримати бонус' : 'Claim Bonus'}
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Feeding Animation */}
        <AnimatePresence>
          {feedingAnimation.length > 0 && (
            <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
              {feedingAnimation.map(particle => (
                <motion.div
                  key={particle}
                  initial={{
                    scale: 0,
                    x: 0,
                    y: 0,
                    opacity: 1,
                  }}
                  animate={{
                    scale: [0, 1.5, 0],
                    x: (Math.random() - 0.5) * 300,
                    y: (Math.random() - 0.5) * 300,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: particle * 0.1,
                    ease: 'easeOut',
                  }}
                  className="absolute text-4xl"
                  style={{ color: selectedFood?.color }}
                >
                  {selectedFood && getFoodTypeIcon(selectedFood.type)}
                </motion.div>
              ))}

              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border text-center"
              >
                <div className="text-6xl mb-2">🦐</div>
                <h3 className="text-xl font-bold text-primary mb-1">
                  {t('feeding', 'Feeding...')}
                </h3>
                <p className="text-muted-foreground">{selectedFood?.name[language]}</p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Recent Feeding Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {feedingSessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>📈 {t('recentFeedings', 'Recent Feeding Sessions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {feedingSessions.slice(0, 10).map(session => {
                    const foodItem = foodTypes.find(f => f.id === session.foodUsed[0])
                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {foodItem && getFoodTypeIcon(foodItem.type)}
                          </span>
                          <div>
                            <p className="text-sm font-medium">
                              {foodItem?.name[language] || t('unknownFood', 'Unknown Food')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-1 text-xs">
                            {session.statsChange.hunger && (
                              <Badge variant="secondary" className="text-xs">
                                🍽️ +{Math.round(session.statsChange.hunger)}
                              </Badge>
                            )}
                            {session.statsChange.mood && (
                              <Badge variant="secondary" className="text-xs">
                                😊 +{Math.round(session.statsChange.mood)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>
                🏆 {language === 'uk' ? 'Досягнення' : 'Achievements'} ({achievements.length}/
                {achievementList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {achievementList.map(achievement => {
                  const isUnlocked = achievements.includes(achievement.id)
                  return (
                    <div
                      key={achievement.id}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        isUnlocked
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-muted/30 border-muted opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{isUnlocked ? '🏆' : '🔒'}</span>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${isUnlocked ? 'text-primary' : 'text-muted-foreground'}`}
                          >
                            {achievement.name[language]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {achievement.description[language]}
                          </p>
                        </div>
                        {isUnlocked && (
                          <Badge variant="secondary" className="text-xs">
                            +25 💰
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
