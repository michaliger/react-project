const API_BASE = 'https://node-project-cvek.onrender.com';

export const getAllSeries = async () => {
  const response = await fetch(`${API_BASE}/series`)
  const result = await response.json()
  console.log('מה קיבלתי מהשרת:', result)   // ← שורה חשובה!
  return result.data.series || []
}