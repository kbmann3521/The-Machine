import { useState, useEffect } from 'react'

export default function useAccordion(storageKey, defaultExpanded = false) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) {
        setExpanded(JSON.parse(stored))
      } else {
        setExpanded(defaultExpanded)
      }
    }
  }, [storageKey, defaultExpanded])

  const toggle = () => {
    setExpanded(prev => {
      const newState = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(newState))
      }
      return newState
    })
  }

  return { expanded, toggle }
}
