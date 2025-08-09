import { CookingQuestion } from './types'

export const COOKING_QUESTIONS: CookingQuestion[] = [
  {
    question: 'Яка оптимальна температура для приготування креветок Macrobrachium rosenbergii?',
    options: ['60-70°C', '80-90°C', '100-110°C', '120-130°C'],
    correct: '80-90°C',
  },
  {
    question: 'Скільки часу потрібно варити великих креветок Macrobrachium?',
    options: ['1-2 хвилини', '3-5 хвилин', '8-10 хвилин', '15-20 хвилин'],
    correct: '3-5 хвилин',
  },
  {
    question: 'Який найкращий спосіб очистити креветки перед приготуванням?',
    options: [
      'Зняти тільки голову',
      'Зняти панцир повністю',
      'Залишити панцир',
      'Зняти панцир, залишити хвіст',
    ],
    correct: 'Зняти панцир, залишити хвіст',
  },
  {
    question: 'Які спеції найкраще підходять для креветок Macrobrachium?',
    options: ['Кориця та ваніль', 'Часник, лимон, укріп', 'Шоколад та мед', 'Кава та какао'],
    correct: 'Часник, лимон, укріп',
  },
]

export const INITIAL_GAME_STATE = {
  prawnMood: 'calm' as const,
  interactionCount: 0,
  isFeeding: false,
  isSwimming: false,
  currentSwimPattern: 'circular' as const,
  gamePhase: 'exploring' as const,
  score: 0,
  correctAnswers: 0,
  isRobotMode: false,
  hasAI: false,
  trajectoryPoints: 0,
  currentQuestion: 0,
  lives: 1,
  comboCount: 0,
  comboMultiplier: 1,
  maxCombo: 0,
  lastTrickTime: 0,
  comboTimeWindow: 5000,
}

export const SWIM_PATTERNS = ['circular', 'figure8', 'random', 'patrol'] as const

export const PARTICLE_COLORS = [
  '#FFD700',
  '#FF6B35',
  '#F7931E',
  '#FFE135',
  '#FFAB00',
  '#00D4FF',
  '#0099CC',
  '#33CCFF',
  '#66E0FF',
  '#99F0FF',
  '#FF69B4',
  '#FF1493',
  '#FF6347',
  '#FFA500',
  '#32CD32',
]

export const AUDIO_CONFIG = {
  volumes: {
    click: 0.3,
    swoosh: 0.3,
    bubble: 0.5,
    success: 0.6,
    error: 0.4,
  },
  playbackRates: {
    click: 1.2,
    swoosh: 1.1,
    bubble: 1.0,
    success: 1.0,
    error: 0.9,
  },
}
