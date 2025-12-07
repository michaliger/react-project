import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AddNewSeries() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const prefixOptions = ['ליקוטי מוהר״ן', 'שיחות חיזוק', 'מגזין דוגמא']
  const sectorOptions = ['חינוך', 'קהילה', 'דת', 'תרבות']

  // ---------- סטייט לסדרה ----------
  const [series, setSeries] = useState({
    prefixName: '',               // מתוך רשימה
    fileName: '',                 // חובה
    identifierName: '',           // חובה במקרה של כפילות
    author: '',                   // י"ל ע"י או עורכים
    totalVolumes: 0,              // ממולא אוטומטית
    publicationPlace: 'ישראל',    // אוטומטי
    publicationYears: '',         // אוטומטי לפי הכרכים
    sector: '',                   // מתוך רשימה
    dataCompleteness: '',         // שלמות המאגר - טקסט
    missingVolumesList: '',       // רשימת כרכים/גליונות חסרים - טקסט
    userNotes: '',                // הערות למשתמש - טקסט
    adminNotes: '',               // הערות למערכת - טקסט
    fileDescription: '',          // תיאור הקובץ - טקסט
    coverImage: null,             // תמונת שער של אחד הגליונות
    enteredBy: '',                // id של מי שהכניס - hidden
    catalogStatus: 'חלקי',       // חלקי/שלם
    msID: '',                     // מ"ס אוטומטי, hidden
  })

  // ---------- סטייט לכרכים ----------
  const [volumes, setVolumes] = useState([
    {
      id: Date.now(), // id ייחודי לכל כרך
      volumeNumber: 1,
      letter: '',
      title: '',
      publicationYear: '',
      mainTopic: '',
      topics: [{ id: 1, topicNumber: 1, topicTitle: '', pageStart: '', pageEnd: '' }]
    }
  ])

  // ---------- ניהול כרכים ----------
  const addVolume = () => {
    const newVolumeNumber = volumes.length + 1
    setVolumes(prev => [
      ...prev,
      {
        id: Date.now(),
        volumeNumber: newVolumeNumber,
        letter: '',
        title: '',
        publicationYear: '',
        mainTopic: '',
        topics: [{ id: 1, topicNumber: 1, topicTitle: '', pageStart: '', pageEnd: '' }]
      }
    ])
  }

  const updateVolume = (index, field, value) => {
    setVolumes(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  // ---------- ניהול נושאים בתוך כרך ----------
  const addTopic = (volumeIndex) => {
    setVolumes(prev => prev.map((v, i) => {
      if (i === volumeIndex) {
        const newTopic = { id: Date.now(), topicNumber: v.topics.length + 1, topicTitle: '', pageStart: '', pageEnd: '' }
        return { ...v, topics: [...v.topics, newTopic] }
      }
      return v
    }))
  }

  const updateTopic = (volumeIndex, topicIndex, field, value) => {
    setVolumes(prev => prev.map((v, i) => {
      if (i === volumeIndex) {
        const updatedTopics = v.topics.map((t, ti) => ti === topicIndex ? { ...t, [field]: value } : t)
        return { ...v, topics: updatedTopics }
      }
      return v
    }))
  }

  const removeTopic = (volumeIndex, topicIndex) => {
    setVolumes(prev => prev.map((v, i) => {
      if (i === volumeIndex) {
        const updatedTopics = v.topics.filter((_, ti) => ti !== topicIndex)
        return { ...v, topics: updatedTopics }
      }
      return v
    }))
  }

  // ---------- Handle submit ----------
  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    console.log('Series:', series)
    console.log('Volumes:', volumes)

    alert('בדיקה – טופס נשמר מקומית!')
    setLoading(false)
    // navigate('/series') // אפשר להפעיל אחרי בדיקה
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-12 px-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-indigo-900 text-center mb-8">
          הוספת סדרה חדשה + כרכים
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-10 space-y-10">

          {/* ---------- פרטי הסדרה ---------- */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-indigo-800 mb-6">פרטי הסדרה</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <select value={series.prefixName} required
                onChange={e => setSeries({...series, prefixName: e.target.value})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg">
                <option value="">בחר שם מקדים</option>
                {prefixOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>

              <input required placeholder="שם קובץ" value={series.fileName}
                onChange={e => setSeries({...series, fileName: e.target.value})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg" />

              <input placeholder="שם מזהה" value={series.identifierName}
                onChange={e => setSeries({...series, identifierName: e.target.value})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg" />

              <input required placeholder="י&quot;ל ע&quot;י / עורכים" value={series.author}
                onChange={e => setSeries({...series, author: e.target.value})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg" />

              <input type="number" placeholder="מספר גליונות/כרכים" value={series.totalVolumes}
                onChange={e => setSeries({...series, totalVolumes: parseInt(e.target.value) || 0})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg" />

              <input placeholder="מקום הוצאה" value={series.publicationPlace} readOnly
                className="p-5 border-2 border-indigo-300 rounded-xl bg-gray-100 text-lg" />

              <input placeholder="שנות הוצאה" value={series.publicationYears} readOnly
                className="p-5 border-2 border-indigo-300 rounded-xl bg-gray-100 text-lg" />

              <select value={series.sector} required
                onChange={e => setSeries({...series, sector: e.target.value})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg">
                <option value="">בחר מגזר</option>
                {sectorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>

              <input placeholder="שלמות המאגר" value={series.dataCompleteness}
                onChange={e => setSeries({...series, dataCompleteness: e.target.value})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg" />

              <input placeholder="רשימת גליונות/כרכים חסרים" value={series.missingVolumesList}
                onChange={e => setSeries({...series, missingVolumesList: e.target.value})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg" />

              <textarea placeholder="הערות למשתמש" value={series.userNotes}
                onChange={e => setSeries({...series, userNotes: e.target.value})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg md:col-span-2 resize-none" />

              <textarea placeholder="הערות למערכת" value={series.adminNotes}
                onChange={e => setSeries({...series, adminNotes: e.target.value})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg md:col-span-2 resize-none" />

              <textarea placeholder="תיאור הקובץ" value={series.fileDescription}
                onChange={e => setSeries({...series, fileDescription: e.target.value})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg md:col-span-2 resize-none" />

              <input type="file"
                onChange={e => setSeries({...series, coverImage: e.target.files[0]})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg md:col-span-2" />

            </div>
          </div>

          {/* ---------- כרכים ---------- */}
          {volumes.map((vol, vIndex) => (
            <div key={vol.id} className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-emerald-800 mb-4">
                כרך {vol.volumeNumber}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <input type="text" placeholder="אות" value={vol.letter}
                  onChange={e => updateVolume(vIndex, 'letter', e.target.value)}
                  className="p-5 border-2 border-emerald-300 rounded-xl text-center text-3xl font-bold" />
                <input placeholder="כותרת הכרך" value={vol.title}
                  onChange={e => updateVolume(vIndex, 'title', e.target.value)}
                  className="p-5 border-2 border-emerald-300 rounded-xl md:col-span-3" />
                <input type="number" placeholder="שנת הוצאה" value={vol.publicationYear}
                  onChange={e => updateVolume(vIndex, 'publicationYear', e.target.value)}
                  className="p-5 border-2 border-emerald-300 rounded-xl text-center" />
                <input placeholder="נושא ראשי" value={vol.mainTopic}
                  onChange={e => updateVolume(vIndex, 'mainTopic', e.target.value)}
                  className="p-5 border-2 border-emerald-300 rounded-xl md:col-span-4" />
              </div>

              {/* נושאים/מאמרים */}
              {vol.topics.map((topic, tIndex) => (
                <div key={topic.id} className="flex gap-4 mt-4">
                  <input type="text" placeholder="שם נושא/מאמר" value={topic.topicTitle}
                    onChange={e => updateTopic(vIndex, tIndex, 'topicTitle', e.target.value)}
                    className="p-3 border border-emerald-300 rounded-lg flex-1" />
                  <input type="number" placeholder="עמוד התחלה" value={topic.pageStart}
                    onChange={e => updateTopic(vIndex, tIndex, 'pageStart', e.target.value)}
                    className="p-3 border border-emerald-300 rounded-lg w-32 text-center" />
                  <input type="number" placeholder="עמוד סיום" value={topic.pageEnd}
                    onChange={e => updateTopic(vIndex, tIndex, 'pageEnd', e.target.value)}
                    className="p-3 border border-emerald-300 rounded-lg w-32 text-center" />
                  <button type="button" onClick={() => removeTopic(vIndex, tIndex)}
                    className="px-3 bg-red-600 text-white rounded-xl">✕</button>
                </div>
              ))}

              <button type="button" onClick={() => addTopic(vIndex)}
                className="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition">
                + הוסף נושא/מאמר
              </button>
            </div>
          ))}

          <button type="button" onClick={addVolume}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
            + הוסף כרך
          </button>

          {/* ---------- Submit ---------- */}
          <div className="flex justify-center gap-8 pt-8">
            <button type="button" onClick={() => navigate(-1)}
              className="px-12 py-5 bg-gray-500 text-white text-xl rounded-2xl hover:bg-gray-600 transition">
              ביטול
            </button>
            <button type="submit" disabled={loading}
              className="px-16 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xl font-bold rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition shadow-2xl">
              {loading ? 'שומר סדרה...' : 'צור סדרה חדשה'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}