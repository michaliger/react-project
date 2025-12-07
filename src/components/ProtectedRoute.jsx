import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')

  // אם אין טוקן – מעביר להתחברות
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // אם יש טוקן – מציג את הדף הרגיל
  return children
}