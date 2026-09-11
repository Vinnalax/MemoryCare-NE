export const RESULTS_KEY = 'memorycare_game_results'
export const MEMORIES_KEY = 'memorycare_memories'
export const REMINDERS_KEY = 'memorycare_reminders'

export function readJson(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
    return value ?? fallback
  } catch { return fallback }
}
export function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)) }
export function addJson(key, value) { const items = readJson(key, []); items.push(value); writeJson(key, items); return items }
