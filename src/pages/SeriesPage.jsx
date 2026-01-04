import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Fuse from "fuse.js"

export default function Chry() {
  const [allSeries, setAllSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    fetch('http://localhost:5000/api/series')
      .then(res => res.json())
      .then(result => {
        const seriesArray = result?.data?.series || []
        setAllSeries(seriesArray)
        setLoading(false)
      })
      .catch(err => {
        console.error('שגיאה:', err)
        setLoading(false)
      })
  }, [])

  const deleteSeries = async (id, fileName) => {
    if (!window.confirm(`למחוק את "${fileName}"?`)) return

    try {
      const res = await fetch(`http://localhost:5000/api/series/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('שגיאה במחיקה')

      setAllSeries(prev => prev.filter(s => s._id !== id))
      alert('נמחקה בהצלחה!')
    } catch (err) {
      alert('שגיאה: ' + err.message)
    }
  }

  if (loading) return <div className="p-20 text-3xl">טוען...</div>
  if (allSeries.length === 0) return <div className="p-20 text-3xl text-red-500">אין סדרות</div>

  const fuse = new Fuse(allSeries, {
    keys: ["prefixName", "fileName", "author", "genre", "volumes.title"],
    threshold: 0.4
  })

  const filteredSeries = searchTerm.trim()
    ? fuse.search(searchTerm).map(r => r.item)
    : allSeries

  return (
    <div className="p-6" dir="rtl">
      <input
        type="text"
        placeholder="חיפוש..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="p-3 mb-6 w-80 text-lg border rounded-lg"
      />

      <div className="flex justify-end gap-4 mb-8">
        <button onClick={() => navigate('/add-series')} className="px-5 py-2 bg-black text-white rounded-xl">
          + סדרה
        </button>
        <button onClick={() => navigate('/add-volume')} className="px-5 py-2 bg-black text-white rounded-xl">
          + כרך
        </button>
      </div>

      <h1 className="text-4xl font-bold text-green-500 mb-6">
        {allSeries.length} סדרות
      </h1>

      <div className="space-y-3">
        {filteredSeries.map((s, i) => (
          <div
            key={s._id}
            className="flex items-center gap-4 p-3 bg-gray-900/70 border border-amber-600 rounded-lg hover:bg-gray-800/80 transition"
          >
            {/* כפתור מחיקה */}
            <button
              onClick={() => deleteSeries(s._id, s.fileName || s.prefixName || 'סדרה')}
              className="text-red-500 hover:text-red-400 p-1"
              title="מחק"
            >
              <Trash2 size={18} />
            </button>

            {/* תמונה */}
            <img
              src={s.coverImage ?? "/books.jpg"}
              alt="כריכה"
              className="w-16 h-20 object-cover rounded"
            />

            {/* פרטים */}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-amber-400">
                {i + 1}. {s.prefixName || s.fileName}
                {s.author && <span className="text-amber-200"> – {s.author}</span>}
              </h2>
              <div className="text-sm text-gray-400">
                ז׳אנר: {s.genre || 'לא צוין'} | כרכים: {s.volumes?.length || 0}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}