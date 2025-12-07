import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Fuse from "fuse.js";

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
  const fuse = new Fuse(allSeries, {
    keys: [
      "prefixName",
      "fileName",
      "author",
      "description",
      "genre",
      "volumes.title",
      "volumes.mainTopic",
      "volumes.topics.topicTitle"
    ],
    threshold: 0.4
  });
  const filteredSeries = searchTerm.trim()
    ? fuse.search(searchTerm).map(r => r.item)
    : allSeries;
  console.log(filteredSeries.length);

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
      <div className="flex justify-end mt-4 space-x-4">
        <button
          onClick={() => navigate('/add-series')}
          className="px-6 py-3 bg-black text-white text-xl rounded-2xl hover:bg-gray-800 transition"
        >
          להוספת סדרה
        </button>

        <button
          onClick={() => navigate('/add-volume')}
          className="px-6 py-3 bg-black text-white text-xl rounded-2xl hover:bg-gray-800 transition"
        >
          להוספת כרך
        </button>
      </div>

      <h1 className="text-6xl font-bold text-green-500 mb-10">
        הנה כל {allSeries.length} הסדרות :
      </h1>
      {filteredSeries.map((s, i) => (
        <div
          key={s._id}
          className="mb-6 p-4 border-2 border-amber-600 rounded-xl bg-black/50 flex items-start gap-6"
        >
          {/* תמונה קטנה */}
          <img
            src={s.coverImage ?? "/books.jpg"}
            alt="כריכה"
            className="w-24 h-32 object-cover rounded-lg shadow-lg"
          />

          {/* פרטים ליד התמונה */}
          <div className="flex flex-col justify-start">
            <h2 className="text-2xl font-bold text-amber-400">
              {i + 1}. {s.prefixName || s.fileName}
              {s.author && <span className="text-lg text-amber-200"> – {s.author}</span>}
            </h2>

            <p className="text-sm text-gray-300 mt-1">ז׳אנר: {s.genre || 'לא צוין'}</p>
            <p className="text-sm text-gray-400">מספר כרכים: {s.volumes?.length || 0}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
