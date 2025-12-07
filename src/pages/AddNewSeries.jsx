import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function AddNewSeries() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  const [series, setSeries] = useState({
    fileName: '',
    prefixName: '',
    author: '',
    description: ''
  })

  const [volume, setVolume] = useState({
    volumeNumber: 1,
    letter: '',
    title: '',
    publicationYear: '',
    mainTopic: ''
  })

  const [topics, setTopics] = useState([
    { topicNumber: 1, topicTitle: '', pageStart: '', pageEnd: '' }
  ])

  const addTopicRow = () => {
    setTopics([...topics, { topicNumber: topics.length + 1, topicTitle: '', pageStart: '', pageEnd: '' }])
  }

  const updateTopic = (index, field, value) => {
    const updated = [...topics]
    updated[index][field] = value
    updated[index].topicNumber = index + 1
    setTopics(updated)
  }

  const removeTopic = (index) => {
    setTopics(topics.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: אם את רוצה לבדוק בלי שרת – אפשר להערים כאן
      // const seriesRes = await axios.post('http://localhost:5000/api/series', series)

      // TODO: יצירת כרך בלי שרת
      // await axios.post('http://localhost:5000/api/volumes', {
      //   ...volume,
      //   series: seriesRes.data._id,
      //   topics: topics.filter(t => t.topicTitle.trim() !== '')
      // })

      alert('שומרים רק באופן מקומי – בדיקה של הטופס עובדת!')
      // navigate('/series') // TODO: אפשר להשאיר מסומן אחרי בדיקה
    } catch (err) {
      console.error(err)
      alert('שגיאה: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-12 px-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-indigo-900 text-center mb-8">
          הוספת סדרה חדשה + כרך ראשון
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-10 space-y-10">

          {/* פרטי הסדרה */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-indigo-800 mb-6">פרטי הסדרה</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input required placeholder="שם קובץ (למשל: likutei-moharan)" value={series.fileName}
                onChange={e => setSeries({...series, fileName: e.target.value.replace(/\s/g,'-').toLowerCase()})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg" />

              <input placeholder="קידומת (למשל: ליקוטי מוהר״ן)" value={series.prefixName}
                onChange={e => setSeries({...series, prefixName: e.target.value})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg" />

              <input required placeholder="מחבר" value={series.author}
                onChange={e => setSeries({...series, author: e.target.value})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg" />

              <textarea rows={3} placeholder="תיאור הסדרה (אופציונלי)" value={series.description}
                onChange={e => setSeries({...series, description: e.target.value})}
                className="p-5 border-2 border-indigo-300 rounded-xl text-lg md:col-span-2 resize-none" />
            </div>
          </div>

          {/* פרטי הכרך */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-emerald-800 mb-6">פרטי הכרך הראשון</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <input type="number" value={volume.volumeNumber} placeholder="מספר כרך" readOnly
                className="p-5 border-2 border-emerald-300 rounded-xl text-center" />

              <input type="text" maxLength="1" placeholder="אות" value={volume.letter}
                onChange={e => setVolume({...volume, letter: e.target.value.toUpperCase()})}
                className="p-5 border-2 border-emerald-300 rounded-xl text-center text-3xl font-bold" />

              <input required placeholder="כותרת הכרך" value={volume.title}
                onChange={e => setVolume({...volume, title: e.target.value})}
                className="p-5 border-2 border-emerald-300 rounded-xl md:col-span-2" />

              <input type="number" placeholder="שנת הוצאה" value={volume.publicationYear}
                onChange={e => setVolume({...volume, publicationYear: e.target.value})}
                className="p-5 border-2 border-emerald-300 rounded-xl text-center" />

              <input placeholder="נושא ראשי" value={volume.mainTopic}
                onChange={e => setVolume({...volume, mainTopic: e.target.value})}
                className="p-5 border-2 border-emerald-300 rounded-xl md:col-span-4" />
            </div>
          </div>

          {/* טבלת נושאים */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-amber-800">נושאים / פרקים בכרך</h2>
              <button type="button" onClick={addTopicRow}
                className="px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition font-bold">
                + הוסף שורה
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-2 border-amber-300 rounded-xl overflow-hidden">
                <thead className="bg-amber-600 text-white">
                  <tr>
                    <th className="p-4">#</th>
                    <th className="p-4">שם הנושא / פרק</th>
                    <th className="p-4">עמוד התחלה</th>
                    <th className="p-4">עמוד סיום</th>
                    <th className="p-4">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic, i) => (
                    <tr key={i} className="border-b border-amber-200">
                      <td className="p-4 text-center font-bold">{i + 1}</td>
                      <td className="p-4">
                        <input required type="text" value={topic.topicTitle}
                          onChange={e => updateTopic(i, 'topicTitle', e.target.value)}
                          className="w-full p-3 border border-amber-300 rounded-lg" />
                      </td>
                      <td className="p-4">
                        <input type="number" value={topic.pageStart}
                          onChange={e => updateTopic(i, 'pageStart', e.target.value)}
                          className="w-full p-3 border border-amber-300 rounded-lg text-center" />
                      </td>
                      <td className="p-4">
                        <input type="number" value={topic.pageEnd}
                          onChange={e => updateTopic(i, 'pageEnd', e.target.value)}
                          className="w-full p-3 border border-amber-300 rounded-lg text-center" />
                      </td>
                      <td className="p-4 text-center">
                        <button type="button" onClick={() => removeTopic(i)}
                          className="text-red-600 hover:text-red-800 font-bold">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center gap-8 pt-8">
            <button type="button" onClick={() => navigate(-1)}
              className="px-12 py-5 bg-gray-500 text-white text-xl rounded-2xl hover:bg-gray-600 transition">
              ביטול
            </button>
            <button type="submit" disabled={loading}
              className="px-16 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xl font-bold rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition shadow-2xl">
              {loading ? 'שומר סדרה וכרך...' : 'צור סדרה חדשה + כרך ראשון'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}