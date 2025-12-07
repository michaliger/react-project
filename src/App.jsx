import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SeriesPage from './pages/SeriesPage'
import Login from './pages/Login'
import Register from './pages/Register'

import AddNewSeries from './pages/AddNewSeries'   // ← הוספת סדרה חדשה + כרך + נושאים
import AddVolume from './pages/AddVolume'           // ← הוספת כרך לסדרה קיימת

import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/series" element={<SeriesPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* הוספת סדרה חדשה לגמרי (עם כרך ראשון ונושאים) */}
      <Route 
        path="/add-series" 
        element={
          <ProtectedRoute>
            <AddNewSeries />
          </ProtectedRoute>
        } 
      />

      {/* הוספת כרך לסדרה קיימת */}
      <Route 
        path="/add-volume" 
        element={
          <ProtectedRoute>
            <AddVolume />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

export default App