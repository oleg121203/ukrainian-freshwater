export interface PrawnVisualizationProps {
  onMenuToggle: (show: boolean) => void
  menuVisible: boolean
  onNavigateToSite?: () => void
}

export interface GameState {
  prawnMood:
    | 'calm'
    | 'excited'
    | 'happy'
    | 'performing'
    | 'dead'
    | 'feeding'
    | 'swimming'
    | 'cooking'
    | 'thinking'
  interactionCount: number
  isFeeding: boolean
  isSwimming: boolean
  currentSwimPattern: 'circular' | 'figure8' | 'random' | 'patrol'
  gamePhase: 'exploring' | 'trajectory' | 'quiz' | 'cooking' | 'completed'
  score: number
  correctAnswers: number
  isRobotMode: boolean
  hasAI: boolean
  trajectoryPoints: number
  currentQuestion: number
  lives: number
  comboCount: number
  comboMultiplier: number
  maxCombo: number
  lastTrickTime: number
  comboTimeWindow: number
}

export interface TrajectoryPoint {
  x: number
  y: number
  timestamp: number
}

export interface GameStats {
  currentScore: number
  trajectoryComplexity: number
  naturalness: number
  isDrawing: boolean
}

export interface WaveEffect {
  id: string
  x: number
  y: number
  timestamp: number
  amplitude: number
  frequency: number
  color: string
}

export interface ParticleEffect {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'spark' | 'bubble' | 'star' | 'diamond'
}

export interface Recipe {
  id: string
  title: string
  ingredients: string[]
  instructions: string[]
  authorName: string
  authorEmail: string
  createdAt: string
  aiGenerated: boolean
  chefbotNotes?: string
}

export interface CookingQuestion {
  question: string
  options: string[]
  correct: string
}
