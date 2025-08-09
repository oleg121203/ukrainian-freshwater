import { useState } from 'react'

// Простий заміщений хук для useKV
export function useKV<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      return defaultValue
    }
  })

  const setStoredValue = (newValue: T) => {
    try {
      setValue(newValue)
      localStorage.setItem(key, JSON.stringify(newValue))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  return [value, setStoredValue]
}
