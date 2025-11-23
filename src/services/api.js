const API_BASE = 'http://localhost:5000/api'

export const getAllSeries = async () => {
  const response = await fetch(`${API_BASE}/series`)
  const result = await response.json()
  return result.data.series || []
}