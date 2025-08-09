import { useState, useCallback } from 'react'

// Простий заміщений хук для useKV
export function useKV<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (_error) {
      return defaultValue
    }
  })

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue
        setValue(valueToStore)
        localStorage.setItem(key, JSON.stringify(valueToStore))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    },
    [key, value]
  )

  return [value, setStoredValue]
}
