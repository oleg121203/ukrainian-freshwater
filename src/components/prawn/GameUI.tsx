import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { GameState, Recipe } from './types'
import { toast } from 'sonner'

interface GameUIProps {
  gameState: GameState
  showGameUI: boolean
  gameQuestion: string
  gameOptions: string[]
  correctAnswer: string
  userAnswer: string
  showRecipeGenerator: boolean
  generatedRecipe: Recipe | null
  isGeneratingRecipe: boolean
  userIngredients: string
  userName: string
  userEmail: string
  recipes: Recipe[]
  showAdminPanel: boolean
  geminiApiKey: string
  trajectoryHistory: any[]
  onAnswerSubmit: (answer: string) => void
  onResetGame: () => void
  onSetUserIngredients: (value: string) => void
  onSetUserName: (value: string) => void
  onSetUserEmail: (value: string) => void
  onSetShowRecipeGenerator: (show: boolean) => void
  onSetGeneratedRecipe: (recipe: Recipe | null) => void
  onSetShowAdminPanel: (show: boolean) => void
  onSetGeminiApiKey: (key: string) => void
  onGenerateRecipe: () => void
  onSaveRecipe: () => void
}

export const GameUI: React.FC<GameUIProps> = ({
  gameState,
  showGameUI,
  gameQuestion,
  gameOptions,
  correctAnswer,
  userAnswer,
  showRecipeGenerator,
  generatedRecipe,
  isGeneratingRecipe,
  userIngredients,
  userName,
  userEmail,
  recipes,
  showAdminPanel,
  geminiApiKey,
  trajectoryHistory,
  onAnswerSubmit,
  onResetGame,
  onSetUserIngredients,
  onSetUserName,
  onSetUserEmail,
  onSetShowRecipeGenerator,
  onSetGeneratedRecipe,
  onSetShowAdminPanel,
  onSetGeminiApiKey,
  onGenerateRecipe,
  onSaveRecipe,
}) => {
  return (
    <>
      {/* Game UI Overlay */}
      <AnimatePresence>
        {showGameUI && (
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="max-w-2xl w-full mx-4 bg-white/95 backdrop-blur-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gradient-primary flex items-center justify-center gap-2">
                  🤖 РобоКреветка-Кухар "ChefBot-2000"
                  <Badge variant="secondary">{gameState.hasAI ? 'ШІ Активно' : 'ШІ Очікує'}</Badge>
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  {gameState.gamePhase === 'quiz' ? (
                    <>
                      Питання {gameState.currentQuestion + 1}/4 | Рахунок: {gameState.score} |
                      Правильних: {gameState.correctAnswers}/4
                    </>
                  ) : (
                    <>
                      Фаза траєкторій | Рахунок: {gameState.score}/100 | Траєкторії:{' '}
                      {gameState.trajectoryPoints}
                    </>
                  )}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {gameState.gamePhase === 'trajectory' ? (
                  <div className="text-center space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-blue-800 mb-4">
                        🎪 Малювання трюків креветки
                      </h3>
                      <p className="text-blue-700 mb-4">
                        Намалюйте складну і природну траєкторію руху креветки. ChefBot-2000 оцінить
                        ваш трюк!
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                          <p className="font-semibold text-green-800">✅ Добре:</p>
                          <ul className="text-green-700 text-xs mt-1 space-y-1">
                            <li>• Складні кривини</li>
                            <li>• Природні рухи</li>
                            <li>• Довгі траєкторії</li>
                            <li>• Зміни напрямку</li>
                          </ul>
                        </div>

                        <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                          <p className="font-semibold text-red-800">❌ Погано:</p>
                          <ul className="text-red-700 text-xs mt-1 space-y-1">
                            <li>• Надто швидко</li>
                            <li>• Різкі повороти</li>
                            <li>• Надприродні рухи</li>
                            <li>• Короткі лінії</li>
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm font-medium">
                          🎯 Поточний прогрес: {gameState.score}/100 балів
                        </p>
                        <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, gameState.score)}%` }}
                          ></div>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">Трюків:</div>
                            <div className="text-blue-800">{trajectoryHistory.length}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-600">Життів:</div>
                            <div className="text-green-800">{gameState.lives}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-purple-600">Балів/трюк:</div>
                            <div className="text-purple-800">
                              {trajectoryHistory.length > 0
                                ? Math.round(gameState.score / trajectoryHistory.length)
                                : 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button onClick={onResetGame} variant="outline" className="w-full">
                      🔄 Перезапустити гру
                    </Button>
                  </div>
                ) : (
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">{gameQuestion}</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {gameOptions.map((option, index) => (
                        <Button
                          key={index}
                          variant={
                            userAnswer === option
                              ? option === correctAnswer
                                ? 'default'
                                : 'destructive'
                              : 'outline'
                          }
                          className="text-left justify-start p-4 h-auto"
                          onClick={() => onAnswerSubmit(option)}
                          disabled={!!userAnswer}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + index)})
                          </span>
                          {option}
                        </Button>
                      ))}
                    </div>
                    {userAnswer && (
                      <motion.div
                        className="mt-4 p-3 rounded-lg bg-secondary/20"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p className="text-sm">
                          {userAnswer === correctAnswer
                            ? "✅ Правильно! ChefBot-2000: 'Ваші кулінарні знання вражаючі! Системи схвалення активовані.'"
                            : '❌ Неправильно! ChefBot-2000 вимкнувся! Всі бали згоріли. Гра починається спочатку.'}
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe Generator UI */}
      <AnimatePresence>
        {showRecipeGenerator && (
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl text-gradient-primary flex items-center justify-center gap-3">
                  🏆 Ви виграли! 👨‍🍳 ChefBot-2000 ШІ-Кухар активований
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  РобоКреветка-Кухар створить унікальний рецепт на основі ваших інгредієнтів
                </p>
                <div className="mt-2 text-sm bg-green-100 border border-green-300 rounded-lg p-3">
                  <p className="text-green-800 font-medium">
                    🎯 Фінальний рахунок: {gameState.score} балів
                  </p>
                  <p className="text-green-700 text-xs mt-1">
                    Траєкторії: {gameState.trajectoryPoints} + Питання:{' '}
                    {gameState.correctAnswers * 25} = {gameState.score}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!generatedRecipe ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        🥘 Введіть основні інгредієнти (через кому)
                      </label>
                      <Textarea
                        placeholder="Наприклад: креветки Macrobrachium rosenbergii, часник, лимон, олія, спеції..."
                        value={userIngredients}
                        onChange={e => onSetUserIngredients(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">👤 Ваше ім'я</label>
                        <Input
                          placeholder="Ім'я кухаря"
                          value={userName}
                          onChange={e => onSetUserName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">📧 Email</label>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={userEmail}
                          onChange={e => onSetUserEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={onGenerateRecipe}
                        disabled={isGeneratingRecipe || !geminiApiKey || !userIngredients.trim()}
                        className="flex-1"
                      >
                        {isGeneratingRecipe ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"></div>
                            ChefBot-2000 створює рецепт...
                          </>
                        ) : (
                          <>🧠 ChefBot-2000 створити рецепт</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          onSetShowRecipeGenerator(false)
                        }}
                      >
                        Скасувати
                      </Button>
                    </div>

                    {!geminiApiKey && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm">
                          ⚠️ Для роботи ШІ-генератора потрібно налаштувати Gemini API ключ в панелі
                          адміністратора
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => onSetShowAdminPanel(true)}
                        >
                          Налаштувати API
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
                        🍽️ {generatedRecipe.title}
                        <Badge className="bg-green-100 text-green-800">ШІ-генерований</Badge>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-green-700 mb-3">🥘 Інгредієнти:</h4>
                          <ul className="space-y-1">
                            {generatedRecipe.ingredients.map((ingredient, index) => (
                              <li key={index} className="text-sm text-green-600">
                                • {ingredient}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-green-700 mb-3">👨‍🍳 Приготування:</h4>
                          <ol className="space-y-2">
                            {generatedRecipe.instructions.map((step, index) => (
                              <li key={index} className="text-sm text-green-600">
                                <span className="font-medium">{index + 1}.</span> {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={onSaveRecipe}
                        className="flex-1"
                        disabled={!userName.trim() || !userEmail.trim()}
                      >
                        📧 Зберегти та надіслати рецепт
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          onSetGeneratedRecipe(null)
                          onSetUserIngredients('')
                        }}
                      >
                        Створити новий
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      <AnimatePresence>
        {showAdminPanel && (
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="max-w-md w-full bg-white/95 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  ⚙️ Панель адміністратора
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">🔑 Gemini API Key</label>
                  <Input
                    type="password"
                    placeholder="Введіть ваш Gemini API ключ"
                    value={geminiApiKey}
                    onChange={e => onSetGeminiApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Отримайте ключ на: https://makersuite.google.com/app/apikey
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-medium text-blue-800 mb-2">📊 ChefBot-2000 Статистика</h4>
                  <p className="text-sm text-blue-600">Всього рецептів: {recipes.length}</p>
                  <p className="text-sm text-blue-600">
                    ChefBot-2000 рецептів: {recipes.filter(r => r.aiGenerated).length}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      onSetShowAdminPanel(false)
                      toast.success('Налаштування збережено!')
                    }}
                    className="flex-1"
                  >
                    Зберегти
                  </Button>
                  <Button variant="outline" onClick={() => onSetShowAdminPanel(false)}>
                    Скасувати
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default GameUI
