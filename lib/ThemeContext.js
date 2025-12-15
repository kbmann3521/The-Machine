import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

// Get initial theme synchronously without causing hydration mismatch
function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark'
  }
  // Check if theme is already set on document (by init script)
  const dataTheme = document.documentElement.getAttribute('data-theme')
  if (dataTheme) {
    return dataTheme
  }
  // Fallback to localStorage
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    return savedTheme
  }
  // Default to dark
  return 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => getInitialTheme())

  useEffect(() => {
    // Ensure data-theme is set on document
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
