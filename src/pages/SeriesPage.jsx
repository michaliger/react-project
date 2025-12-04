import { useState, useEffect } from 'react'
import { Search, BookOpen } from 'lucide-react'

export default function SeriesPage() {
  const [series, setSeries] = useState([])
  const [filtered, setFiltered] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  // טעינה של כל הסדרות מהשרת
  useEffect(() => {
    fetch('http://localhost:5000/api/series') // תשני ל-URL שלך אם צריך
      .then(res => res.json())
      .then(data => {
        setSeries(data)
        setFiltered(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  // חיפוש חכם – עובד על שם הסדרה, שם הרב, ז'אנר
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltered(series)
      return
    }

    const lowerTerm = searchTerm.toLowerCase()
    const results = series.filter(s => 
      s.title.toLowerCase().includes(lowerTerm) ||
      s.details.toLowerCase().includes(lowerTerm) ||
      s.genre.toLowerCase().includes(lowerTerm)
    )
    setFiltered(results)
  }, [searchTerm, series])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black pt-24 pb-16 px-6">
      {/* כותרת + חיפוש חכם */}
      <div className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-black text-white mb-8">
          כל הספרים שלי
        </h1>

        {/* תיבת חיפוש חכמה וענקית */}
        <div className="max-w-3xl mx-auto relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפשי ספר, רב, נושא... (למשל: ליקוטי מוהר״ן, חזון איש, מוסר)"
            className="w-full px-20 py-7 text-xl bg-white/10 backdrop-blur-xl border-4 border-amber-600/50 rounded-full text-white placeholder-white/60 focus:outline-none focus:border-amber-400 transition-all shadow-2xl"
          />
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-10 h-10 text-amber-400" />
          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-sm text-amber-300">
            {filtered.length} תוצאות
          </div>
        </div>
      </div>

      {/* טעינה */}
      {loading && (
        <div className="text-center text-3xl text-amber-300">טוען את האוסף היקר...</div>
      )}

      {/* רשימת הספרים */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filtered.map((s) => (
          <div
            key={s._id}
            className="group relative bg-gradient-to-br from-amber-900/20 to-black/60 backdrop-blur-md rounded-3xl overflow-hidden border border-amber-800/30 shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-amber-500/40 hover:border-amber-500/70"
          >
            {/* תמונת כריכה דמה – אפשר להחליף אחר כך */}
            <div className="h-64 bg-gradient-to-br from-amber-700/40 to-amber-900/60 flex items-center justify-center">
              <BookOpen className="w-24 h-24 text-amber-300/70" />
            </div>

            <div className="p-8">
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-amber-300 transition">
                {s.title}
              </h3>
              <p className="text-amber-200 text-lg mb-3">{s.details}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-400/80">{s.genre}</span>
                <span className="text-sm text-amber-300">{s.volumes?.length || 0} כרכים</span>
              </div>
            </div>

            {/* כפתור כניסה */}
            <div className="px-8 pb-8">
              <button className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-full shadow-lg transition-all group-hover:shadow-amber-500/70">
                פתח את הסדרה
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* אם אין תוצאות */}
      {!loading && searchTerm && filtered.length === 0 && (
        <div className="text-center text-3xl text-amber-300 mt-20">
          לא נמצאו תוצאות... אבל אפשר תמיד לבקש ממני להוסיף 💛
        </div>
      )}
    </div>
  )
}