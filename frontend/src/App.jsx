import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import MemoryMatch from './pages/MemoryMatch'
import SequenceRecall from './games/SequenceRecall'
import Games from './pages/Games'
import Memories from './pages/Memories'
import Reminders from './pages/Reminders'
import Progress from './pages/Progress'
import Caregiver from './pages/Caregiver'
import PatientDashboard from './pages/PatientDashboard'

const THEME_KEY = 'memorycare-theme'

export default function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_KEY)

    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme
    }

    return 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === 'dark' ? 'light' : 'dark',
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <AppLayout
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          }
        >
          <Route path="/" element={<Navigate to="/patient" replace />} />
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/memory-match" element={<MemoryMatch />} />
          <Route path="/games/sequence" element={<SequenceRecall />} />
          <Route path="/memories" element={<Memories />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/caregiver" element={<Caregiver />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}