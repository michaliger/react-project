import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Chry() {
  const [allSeries, setAllSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    fetch('http://localhost:5000/api/series')
      .then(res => res.json())
      .then(result => {
        console.log('מה שהשרת החזיר:', result)

        // ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
        // הפתרון הסופי – המערך נמצא ב-result.data.series
        const seriesArray = result?.data?.series || []
        // ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←

        setAllSeries(seriesArray)
        setLoading(false)
      })
      .catch(err => {
        console.error('שגיאה:', err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-20 text-4xl">טוען...</div>

  if (allSeries.length === 0) {
    return <div className="p-20 text-3xl text-red-500">אין סדרות (אבל החיבור עובד!)</div>
  }
  const filteredSeries = allSeries.filter(s => {
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();

    return (
      s.prefixName?.toLowerCase().includes(term) ||
      s.fileName?.toLowerCase().includes(term) ||
      s.author?.toLowerCase().includes(term)
    );
  });
  // setAllSeries(filteredSeries);




  return (
    <div className="p-10" dir="rtl">
      <div>
        <input
          type="text"
          placeholder="חפש סדרה,כרך,מאמר..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "10px",
            width: "300px",
            fontSize: "16px",
            marginBottom: "20px"
          }}
        />
      </div>
      <div className="display-flex alin-items-end mb-10 space-x-4 space-y-0">
        <div>
          <button onClick={() => navigate('/add-series')}
            className="block mx-auto mt-8 px-10 py-5 bg-black text-white text-2xl rounded-2xl hover:bg-black-700 transition">
            להוספת סדרה</button>
        </div>
        <div>
          <button onClick={() => navigate('/AddVolume')} className="block mx-auto mt-8 px-10 py-5 bg-black text-white text-2xl rounded-2xl hover:bg-black-700 transition ">להוספת כרך</button>
        </div>
      </div>

      <h1 className="text-6xl font-bold text-green-500 mb-10">
        הנה כל {allSeries.length} הסדרות :
      </h1>

      {filteredSeries.map((s, i) => (
        <div key={s._id} className="mb-10 p-8 border-4 border-amber-600 rounded-xl bg-black/50">

          <h2 className="text-4xl font-bold text-amber-400">
            {i + 1}. {s.prefixName || s.fileName}
            {s.author && <span className="text-2xl text-amber-200"> – {s.author}</span>}
          </h2>

          <p className="text-xl text-gray-300 mt-4">ז׳אנר: {s.genre || 'לא צוין'}</p>
          <p className="text-lg text-gray-400">מספר כרכים: {s.volumes?.length || 0}</p>
          <p className="text-sm text-gray-500 mt-2">ID: {s._id}</p>

          {s.coverImage ? (
            <img src={s.coverImage} alt="כריכה" className="mt-6 max-w-md rounded-lg shadow-2xl" />
          ) : (
            <div className="mt-6 text-gray-500 italic">אין תמונת כריכה</div>
          )}
        </div>
      ))}
    </div>
  )
}