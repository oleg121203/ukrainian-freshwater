import { TrajectoryPoint, ParticleEffect, WaveEffect } from './types'
import { PARTICLE_COLORS } from './constants'

export const calculateTrajectoryComplexity = (path: TrajectoryPoint[]): number => {
  if (path.length < 3) return 0

  let totalCurvature = 0
  let totalDistance = 0
  let directionChanges = 0

  for (let i = 1; i < path.length - 1; i++) {
    const p1 = path[i - 1]
    const p2 = path[i]
    const p3 = path[i + 1]

    // Calculate angle between segments
    const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x)
    const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x)
    let angleDiff = Math.abs(angle2 - angle1)
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff

    totalCurvature += angleDiff

    // Count significant direction changes
    if (angleDiff > Math.PI / 4) {
      directionChanges++
    }

    // Calculate distance
    const distance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
    totalDistance += distance
  }

  // Normalize complexity (0-1)
  const curvatureScore = Math.min(1, totalCurvature / ((Math.PI * path.length) / 4))
  const directionScore = Math.min(1, directionChanges / (path.length / 5))
  const lengthScore = Math.min(1, totalDistance / 1000)

  return (curvatureScore + directionScore + lengthScore) / 3
}

export const calculateNaturalness = (path: TrajectoryPoint[]): number => {
  if (path.length < 3) return 0

  let totalSpeed = 0
  let speedVariance = 0
  let naturalMovement = 0
  const speeds: number[] = []

  for (let i = 1; i < path.length; i++) {
    const p1 = path[i - 1]
    const p2 = path[i]
    const timeDiff = p2.timestamp - p1.timestamp
    const distance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
    const speed = timeDiff > 0 ? distance / timeDiff : 0

    speeds.push(speed)
    totalSpeed += speed
  }

  if (speeds.length === 0) return 0

  const averageSpeed = totalSpeed / speeds.length

  // Calculate speed variance
  for (const speed of speeds) {
    speedVariance += Math.abs(speed - averageSpeed)
  }
  speedVariance /= speeds.length

  // Penalize extremely fast movements (supernatural)
  const maxNaturalSpeed = 5 // pixels per ms
  const speedPenalty = Math.max(0, (averageSpeed - maxNaturalSpeed) / maxNaturalSpeed)

  // Reward moderate speed variation (natural movement)
  const varianceScore = Math.min(1, speedVariance / (averageSpeed * 0.5))

  // Calculate smoothness
  let smoothness = 0
  for (let i = 2; i < path.length; i++) {
    const p1 = path[i - 2]
    const p2 = path[i - 1]
    const p3 = path[i]

    const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x)
    const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x)
    let angleDiff = Math.abs(angle2 - angle1)
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff

    smoothness += Math.max(0, Math.PI / 2 - angleDiff) / (Math.PI / 2)
  }

  if (path.length > 2) {
    smoothness /= path.length - 2
  }

  naturalMovement = (varianceScore + smoothness) / 2 - speedPenalty

  return Math.max(0, Math.min(1, naturalMovement))
}

export const generateParticleEffects = (x: number, y: number, speed: number): ParticleEffect[] => {
  const particles: ParticleEffect[] = []
  const particleCount = Math.floor(speed * 3) + 5

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5
    const velocity = Math.random() * 3 + 1
    const type =
      Math.random() < 0.3
        ? 'spark'
        : Math.random() < 0.6
          ? 'bubble'
          : Math.random() < 0.8
            ? 'star'
            : 'diamond'

    particles.push({
      id: `particle-${Date.now()}-${i}`,
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: 1000 + Math.random() * 1000,
      maxLife: 1000 + Math.random() * 1000,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      size: Math.random() * 4 + 2,
      type,
    })
  }

  return particles
}

export const generateWaveEffect = (x: number, y: number): WaveEffect => {
  return {
    id: `wave-${Date.now()}-${Math.random()}`,
    x,
    y,
    timestamp: Date.now(),
    amplitude: Math.random() * 20 + 10,
    frequency: Math.random() * 0.02 + 0.01,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
  }
}

export const updateComboMultiplier = (comboCount: number): number => {
  if (comboCount < 2) return 1
  if (comboCount < 4) return 2
  if (comboCount < 6) return 3
  if (comboCount < 8) return 4
  if (comboCount < 10) return 5
  return Math.min(10, Math.floor(comboCount / 2))
}

export const calculateTrajectoryScore = (
  complexity: number,
  naturalness: number,
  pathLength: number
): number => {
  // Base score from complexity and naturalness
  const baseScore = (complexity * 0.6 + naturalness * 0.4) * 10

  // Length bonus (longer trajectories get more points)
  const lengthBonus = Math.min(3, pathLength / 50)

  // Penalize very short trajectories
  const lengthPenalty = pathLength < 10 ? 0.5 : 1

  return Math.round(Math.max(1, baseScore + lengthBonus) * lengthPenalty)
}
