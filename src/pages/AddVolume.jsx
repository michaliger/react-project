import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function AddSeries() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [seriesList, setSeriesList] = useState([])

  const [form, setForm] = useState({
    series: '',
    volumeNumber: '',
    letter: '',
    title: '',
    mainTopic: '',
    publicationYear: '',
    publicationMonth: '',
    occasion: '',
    pages: '',
    heightCm: '',
    coverType: '',
    source: '',
    notes: '',
    serialId: '',
    coverImage: '',
    isAvailable: true
  })

  // טעינת כל הסדרות לבחירה
  useEffect(() => {
    axios.get('http://localhost:5000/api/series')
      .then(res => setSeriesList(res.data))
      .catch(() => alert('לא ניתן לטעון סדרות'))
  }, [])

  // const handleSubmit = async (e) => {
  //   e.preventDefault()
  //   setLoading(true)

  //   try {
  //     await axios.post('http://localhost:5000/api/volumes', {
  //       ...form,
  //       volumeNumber: Number(form.volumeNumber) || undefined,
  //       publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
  //       publicationMonth: form.publicationMonth ? Number(form.publicationMonth) : null,
  //       pages: form.pages ? Number(form.pages) : null,
  //       heightCm: form.heightCm ? Number(form.heightCm) : null,
  //       isAvailable: form.isAvailable === true || form.isAvailable === 'true',
  //     }, {
  //       headers: {
  //         'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
  //         'Content-Type': 'application/json'
  //       }
  //     })

  //     alert('🎉 הכרך נוסף בהצלחה! את מלכה אמיתית!')
  //     navigate(-1)
  //   } catch (err) {
  //     console.error(err)
  //     alert('שגיאה: ' + (err.response?.data?.message || err.message))
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold text-amber-900 text-center mb-4">
          הוספת כרך חדש לספרייה
        </h1>
        <p className="text-center text-amber-700 mb-10 text-lg">כל השדות שצריך – בדף אחד מושלם ✨</p>

        <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-10 space-y-8">

          {/* סדרה */}
          <div>
            <label className="block text-xl font-bold text-amber-800 mb-3">סדרה *</label>
            <select
              required
              value={form.series}
              onChange={e => setForm({...form, series: e.target.value})}
              className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg focus:border-amber-600 outline-none transition"
            >
              <option value="">בחר סדרה...</option>
              {seriesList.map(s => (
                <option key={s._id} value={s._id}>
                  {s.prefixName ? `${s.prefixName} ` : ''}{s.fileName.replace(/-/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xl font-bold text-amber-800 mb-3">מספר כרך *</label>
              <input required type="number" min="1" placeholder="1" value={form.volumeNumber}
                onChange={e => setForm({...form, volumeNumber: e.target.value})}
                className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg text-center" />
            </div>

            <div>
              <label className="block text-xl font-bold text-amber-800 mb-3">אות (א, ב, ג...)</label>
              <input type="text" maxLength="1" placeholder="א" value={form.letter}
                onChange={e => setForm({...form, letter: e.target.value.toUpperCase()})}
                className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg text-center text-3xl font-bold" />
            </div>

            <div>
              <label className="block text-xl font-bold text-amber-800 mb-3">שנת הוצאה</label>
              <input type="number" placeholder="תשפ״ה" value={form.publicationYear}
                onChange={e => setForm({...form, publicationYear: e.target.value})}
                className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg text-center" />
            </div>
          </div>

          <div>
            <label className="block text-xl font-bold text-amber-800 mb-3">כותרת הכרך *</label>
            <input required type="text" placeholder="למשל: חלק ראשון - אורח חיים" value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xl font-bold text-amber-800 mb-3">נושא ראשי</label>
              <input type="text" placeholder="הלכה, חסידות, מוסר, קבלה..." value={form.mainTopic}
                onChange={e => setForm({...form, mainTopic: e.target.value})}
                className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg" />
            </div>

            <div>
              <label className="block text-xl font-bold text-amber-800 mb-3">לרגל / לכבוד</label>
              <input type="text" placeholder="לכבוד הרב..." value={form.occasion}
                onChange={e => setForm({...form, occasion: e.target.value})}
                className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xl font-bold text-amber-800 mb-3">חודש הוצאה</label>
              <input type="number" min="1" max="12" placeholder="6" value={form.publicationMonth}
                onChange={e => setForm({...form, publicationMonth: e.target.value})}
                className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg text-center" />
            </div>

            <div>
              <label className="block text-xl font-bold text-amber-800 mb-3">מספר עמודים</label>
              <input type="number" placeholder="432" value={form.pages}
                onChange={e => setForm({...form, pages: e.target.value})}
                className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg text-center" />
            </div>

            <div>
              <label className="block text-xl font-bold text-amber-800 mb-3">גובה (ס״מ)</label>
              <input type="number" step="0.1" placeholder="24.5" value={form.heightCm}
                onChange={e => setForm({...form, heightCm: e.target.value})}
                className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg text-center" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xl font-bold text-amber-800 mb-3">סוג כריכה</label>
              <select value={form.coverType} onChange={e => setForm({...form, coverType: e.target.value})}
                className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg">
                <option value="">בחר...</option>
                <option>קשה</option>
                <option>רכה</option>
                <option>עור</option>
                <option>כריכה קשה</option>
                <option>כריכה רכה</option>
                <option>אחר</option>
              </select>
            </div>

            <div>
              <label className="block text-xl font-bold text-amber-800 mb-3">זמין בספרייה?</label>
              <select value={form.isAvailable} onChange={e => setForm({...form, isAvailable: e.target.value})}
                className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg">
                <option value={true}>כן, זמין</option>
                <option value={false}>לא זמין כרגע</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xl font-bold text-amber-800 mb-3">מקור / מהדורה</label>
              <input type="text" placeholder="ירושלים תשע״ה, מהדורה ראשונה..." value={form.source}
                onChange={e => setForm({...form, source: e.target.value})}
                className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg" />
            </div>

            <div>
              <label className="block text-xl font-bold text-amber-800 mb-3">קוד סידורי פנימי</label>
              <input type="text" placeholder="SH-001" value={form.serialId}
                onChange={e => setForm({...form, serialId: e.target.value})}
                className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg" />
            </div>
          </div>

          <div>
            <label className="block text-xl font-bold text-amber-800 mb-3">הערות חופשיות</label>
            <textarea rows={4} placeholder="מצב הכרך, חסרים עמודים, חתימות, הקדשות..."
              value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              className="w-full p-5 border-2 border-amber-300 rounded-2xl text-lg resize-none" />
          </div>

          <div className="flex justify-center gap-8 pt-8">
            <button type="button" onClick={() => navigate(-1)}
              className="px-12 py-5 bg-gray-500 text-white text-xl rounded-2xl hover:bg-gray-600 transition">
              ביטול
            </button>

            <button type="submit" disabled={loading}
              className="px-16 py-5 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xl font-bold rounded-2xl hover:from-emerald-700 hover:to-green-700 transition shadow-xl disabled:opacity-70">
              {loading ? 'שומר כרך...' : 'שמור כרך חדש ✨'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}