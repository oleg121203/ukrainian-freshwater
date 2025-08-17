import { useState, useCallback, useEffect } from 'react'

// Простий хук useKV з синхронізацією між компонентами і вкладками
export function useKV<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
  console.debug('[useKV] init read', key, !!item)
      return item ? JSON.parse(item) : defaultValue
    } catch (_error) {
      return defaultValue
    }
  })

  // Обновляє локальний state і localStorage, емитить кастомну подію для same-window sync
  const setStoredValue = useCallback(
  (newValue: T | ((prev: T) => T)) => {
      try {
        // Use functional setState to avoid stale closures
        setValue(prev => {
          const valueToStore =
            typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue
          console.debug('[useKV] set', key, valueToStore)
          try {
            localStorage.setItem(key, JSON.stringify(valueToStore))
          } catch (e) {
            console.error('Error saving to localStorage:', e)
          }

          // Dispatch custom event so other hooks in same window can react
          try {
            const ev = new CustomEvent('kv-change', {
              detail: { key, value: valueToStore },
            })
            console.debug('[useKV] dispatch kv-change', key)
            window.dispatchEvent(ev)
          } catch (e) {
            // ignore
          }

          return valueToStore
        })
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    },
    [key]
  )

  useEffect(() => {
    const handleStorage = (ev: StorageEvent) => {
      if (!ev.key) return
      if (ev.key !== key) return
      try {
        const parsed = ev.newValue ? JSON.parse(ev.newValue) : defaultValue
  console.debug('[useKV] storage event', key, !!ev.newValue)
        setValue(parsed)
      } catch (_e) {
        // ignore
      }
    }

    const handleKVChange = (ev: Event) => {
      try {
        // @ts-ignore detail
        const { key: changedKey, value: newVal } = (ev as CustomEvent).detail || {}
  console.debug('[useKV] kv-change event', changedKey)
        if (changedKey === key) setValue(newVal)
      } catch (_e) {
        // ignore
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('kv-change', handleKVChange as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('kv-change', handleKVChange as EventListener)
    }
  }, [key, defaultValue])

  return [value, setStoredValue]
}
