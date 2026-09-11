const API_BASE = 'http://localhost:8000/api'

export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!response.ok) throw new Error(`API ${response.status}`)
  return response.json()
}

export async function tryApi(path, options, fallback) {
  try {
    return await api(path, options)
  } catch {
    return typeof fallback === 'function' ? fallback() : fallback
  }
}
