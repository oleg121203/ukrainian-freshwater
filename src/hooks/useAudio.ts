import { useCallback, useRef, useMemo } from 'react'

export interface AudioConfig {
  volume?: number
  playbackRate?: number
  loop?: boolean
}

/**
 * Custom hook for managing audio effects in the application
 * Uses Web Audio API for synthetic sound generation
 */
export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize AudioContext lazily with browser compatibility
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextConstructor) {
          audioContextRef.current = new AudioContextConstructor()
        } else {
          console.warn('Web Audio API not supported in this browser')
          return null
        }
      } catch (error) {
        console.warn('Failed to create AudioContext:', error)
        return null
      }
    }
    return audioContextRef.current
  }, [])

  /**
   * Play a synthetic underwater bubble sound
   */
  const playBubbleSound = useCallback(
    (config: AudioConfig = {}) => {
      const audioContext = getAudioContext()
      if (!audioContext) return

      try {
        const { volume = 0.3, playbackRate = 1 } = config

        // Create oscillator for bubble effect
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Bubble sound characteristics
        oscillator.frequency.setValueAtTime(800 * playbackRate, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(
          200 * playbackRate,
          audioContext.currentTime + 0.3
        )

        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)

        oscillator.type = 'sine'
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } catch (error) {
        console.warn('Failed to play bubble sound:', error)
      }
    },
    [getAudioContext]
  )

  /**
   * Play a gentle water ripple sound
   */
  const playRippleSound = useCallback(
    (config: AudioConfig = {}) => {
      const audioContext = getAudioContext()
      if (!audioContext) return

      try {
        const { volume = 0.2, playbackRate = 1 } = config

        // Create noise buffer for ripple effect
        const bufferSize = audioContext.sampleRate * 0.5
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
        const output = buffer.getChannelData(0)

        // Generate filtered noise
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3))
        }

        const bufferSource = audioContext.createBufferSource()
        const filter = audioContext.createBiquadFilter()
        const gainNode = audioContext.createGain()

        bufferSource.buffer = buffer
        bufferSource.playbackRate.value = playbackRate

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(1000, audioContext.currentTime)
        filter.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5)

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5)

        bufferSource.connect(filter)
        filter.connect(gainNode)
        gainNode.connect(audioContext.destination)

        bufferSource.start(audioContext.currentTime)
      } catch (error) {
        console.warn('Failed to play ripple sound:', error)
      }
    },
    [getAudioContext]
  )

  /**
   * Play a soft click sound for UI interactions
   */
  const playClickSound = useCallback(
    (config: AudioConfig = {}) => {
      const audioContext = getAudioContext()
      if (!audioContext) return

      try {
        const { volume = 0.4, playbackRate = 1 } = config

        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Soft click characteristics
        oscillator.frequency.setValueAtTime(1200 * playbackRate, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(
          800 * playbackRate,
          audioContext.currentTime + 0.1
        )

        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1)

        oscillator.type = 'triangle'
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      } catch (error) {
        console.warn('Failed to play click sound:', error)
      }
    },
    [getAudioContext]
  )

  /**
   * Play a gentle swoosh sound for transitions
   */
  const playSwooshSound = useCallback(
    (config: AudioConfig = {}) => {
      const audioContext = getAudioContext()
      if (!audioContext) return

      try {
        const { volume = 0.3, playbackRate = 1 } = config

        // Create white noise
        const bufferSize = audioContext.sampleRate * 0.6
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
        const output = buffer.getChannelData(0)

        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1
        }

        const bufferSource = audioContext.createBufferSource()
        const filter = audioContext.createBiquadFilter()
        const gainNode = audioContext.createGain()

        bufferSource.buffer = buffer
        bufferSource.playbackRate.value = playbackRate

        // High-pass filter for swoosh effect
        filter.type = 'highpass'
        filter.frequency.setValueAtTime(2000, audioContext.currentTime)
        filter.frequency.exponentialRampToValueAtTime(4000, audioContext.currentTime + 0.3)
        filter.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.6)

        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6)

        bufferSource.connect(filter)
        filter.connect(gainNode)
        gainNode.connect(audioContext.destination)

        bufferSource.start(audioContext.currentTime)
      } catch (error) {
        console.warn('Failed to play swoosh sound:', error)
      }
    },
    [getAudioContext]
  )

  /**
   * Play ambient underwater sound
   */
  const playAmbientSound = useCallback(
    (config: AudioConfig = {}) => {
      const audioContext = getAudioContext()
      if (!audioContext) return null

      try {
        const { volume = 0.1, loop = true } = config

        // Create low-frequency oscillator for ambient underwater effect
        const oscillator1 = audioContext.createOscillator()
        const oscillator2 = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        const filter = audioContext.createBiquadFilter()

        oscillator1.connect(filter)
        oscillator2.connect(filter)
        filter.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator1.frequency.setValueAtTime(60, audioContext.currentTime)
        oscillator2.frequency.setValueAtTime(40, audioContext.currentTime)

        filter.type = 'lowpass'
        filter.frequency.value = 200
        filter.Q.value = 10

        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 2)

        oscillator1.type = 'sine'
        oscillator2.type = 'sine'
        oscillator1.start(audioContext.currentTime)
        oscillator2.start(audioContext.currentTime)

        if (!loop) {
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 10)
          oscillator1.stop(audioContext.currentTime + 10)
          oscillator2.stop(audioContext.currentTime + 10)
        }

        return {
          stop: () => {
            try {
              gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1)
              oscillator1.stop(audioContext.currentTime + 1)
              oscillator2.stop(audioContext.currentTime + 1)
            } catch (error) {
              console.warn('Failed to stop ambient sound:', error)
            }
          },
        }
      } catch (error) {
        console.warn('Failed to play ambient sound:', error)
        return null
      }
    },
    [getAudioContext]
  )

  /**
   * Play a success sound
   */
  const playSuccessSound = useCallback(
    (config: AudioConfig = {}) => {
      const audioContext = getAudioContext()
      if (!audioContext) return

      try {
        const { volume = 0.4, playbackRate = 1 } = config

        // Create oscillator for success effect
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Success sound - ascending notes
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5

        oscillator.type = 'sine'

        // Volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.4)
      } catch (error) {
        console.warn('Failed to play success sound:', error)
      }
    },
    [getAudioContext]
  )

  /**
   * Play a warning sound
   */
  const playWarnSound = useCallback(
    (config: AudioConfig = {}) => {
      const audioContext = getAudioContext()
      if (!audioContext) return

      try {
        const { volume = 0.3, playbackRate = 1 } = config

        // Create oscillator for warning effect
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Warning sound - low frequency buzz
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.2)

        oscillator.type = 'square'

        // Volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } catch (error) {
        console.warn('Failed to play warning sound:', error)
      }
    },
    [getAudioContext]
  )

  /**
   * Resume audio context if suspended (required for user interaction)
   */
  const resumeAudioContext = useCallback(async () => {
    const audioContext = getAudioContext()
    if (audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume()
      } catch (error) {
        console.warn('Failed to resume audio context:', error)
      }
    }
  }, [getAudioContext])

  return useMemo(
    () => ({
      playBubbleSound,
      playRippleSound,
      playClickSound,
      playSwooshSound,
      playAmbientSound,
      playSuccessSound,
      playWarnSound,
      resumeAudioContext,
    }),
    [
      playBubbleSound,
      playRippleSound,
      playClickSound,
      playSwooshSound,
      playAmbientSound,
      playSuccessSound,
      playWarnSound,
      resumeAudioContext,
    ]
  )
}
