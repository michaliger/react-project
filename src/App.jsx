import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SeriesPage from './pages/SeriesPage'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminExcelUpload from './pages/AdminExcelUpload';
import AddNewSeries from './pages/AddNewSeries'
import AiTocUpload from './pages/AiTocUpload'

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

      {/* ייבוא מאקסל - רק למנהלים */}
      <Route
        path="/admin/import"
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminExcelUpload />
          </ProtectedRoute>
        }
      />

      {/* חילוץ תוכן עניינים בעזרת AI - רק למנהלים */}
      <Route
        path="/admin/ai-toc"
        element={
          <ProtectedRoute adminOnly={true}>
            <AiTocUpload />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App