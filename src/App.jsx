import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SeriesPage from './pages/SeriesPage'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminExcelUpload from './pages/AdminExcelUpload';
import AddNewSeries from './pages/AddNewSeries'

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
      
      {/* 🌟 עטפנו גם את האקסל והגדרנו שזה רק למנהלים! 🌟 */}
      <Route 
        path="/admin/import" 
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminExcelUpload />
          </ProtectedRoute>
        } 
      />

    </Routes>
  )
}

export default App