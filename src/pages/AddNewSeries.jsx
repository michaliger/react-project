import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AddNewSeries() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const prefixOptions = ['ליקוטי מוהר״ן', 'שיחות חיזוק', 'מגזין דוגמא']
  const sectorOptions = ['חינוך', 'קהילה', 'דת', 'תרבות']

  // ---------- סטייט לסדרה ----------
  const [series, setSeries] = useState({
    prefixName: '',
    fileName: '',
    identifierName: '',
    author: '',
    totalVolumes: 0,
    publicationPlace: 'לא ידוע',
    publicationYears: '',
    sector: '',
    dataCompleteness: '',
    missingVolumesList: '',
    userNotes: '',
    adminNotes: '',
    fileDescription: '',
    coverImage: null,
    enteredBy: '',
    catalogStatus: 'חלקי',
    msID: ''
  })

  // ---------- סטייט לכרכים ----------
  const [volumes, setVolumes] = useState([
    {
      id: Date.now(),
      seriesAutoName: '',
      seriesIdentifier: '',
      volumeTitle: '',
      volumeNumber: '',
      year: '',
      booklet: '',
      volumeEditor: '',
      mainTopic: '',
      publishedFor: '',
      publicationPlace: 'לא ידוע',
      publicationYear: 'לא ידוע',
      publicationPeriod: '',
      articlesCount: 0,
      coverType: '',
      volumeSize: '',
      fileCompleteness: '',
      scanCompleteness: '',
      articlesCatalogStatus: '',
      articlesTopicsSourcesStatus: ''
    }
  ])

  const updateVolume = (index, field, value) => {
    setVolumes(prev =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    )
  }

  const addVolume = () => {
    setVolumes(prev => [
      ...prev,
      {
        id: Date.now(),
        seriesAutoName: series.fileName,
        seriesIdentifier: series.identifierName,
        volumeTitle: '',
        volumeNumber: '',
        year: '',
        booklet: '',
        volumeEditor: '',
        mainTopic: '',
        publishedFor: '',
        publicationPlace: 'לא ידוע',
        publicationYear: 'לא ידוע',
        publicationPeriod: '',
        articlesCount: 0,
        coverType: '',
        volumeSize: '',
        fileCompleteness: '',
        scanCompleteness: '',
        articlesCatalogStatus: '',
        articlesTopicsSourcesStatus: ''
      }
    ])
  }

  const handleSubmit = e => {
    e.preventDefault()
    setLoading(true)

    console.log('SERIES:', series)
    console.log('VOLUMES:', volumes)

    alert('בדיקה – הנתונים נשמרו מקומית')
    setLoading(false)
  }

  const Field = ({ label, children }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-12 px-4" dir="rtl">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-5xl font-bold text-indigo-900 text-center mb-10">
          הוספת סדרה חדשה + כרכים
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-10 space-y-12">

          {/* ---------- פרטי הסדרה ---------- */}
          <div className="bg-indigo-50 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-indigo-800 mb-6">פרטי הסדרה</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <Field label="שם מקדים">
                <select
                  value={series.prefixName}
                  onChange={e => setSeries({ ...series, prefixName: e.target.value })}
                  className="p-4 border rounded-xl"
                >
                  <option value="">בחר</option>
                  {prefixOptions.map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>

              <Field label="שם הקובץ / הסדרה (חובה)">
                <input
                  required
                  value={series.fileName}
                  onChange={e => setSeries({ ...series, fileName: e.target.value })}
                  className="p-4 border rounded-xl"
                />
              </Field>

              <Field label="שם מזהה (במקרה של כפילות)">
                <input
                  value={series.identifierName}
                  onChange={e => setSeries({ ...series, identifierName: e.target.value })}
                  className="p-4 border rounded-xl"
                />
              </Field>

              <Field label='י"ל ע"י / עורכים'>
                <input
                  value={series.author}
                  onChange={e => setSeries({ ...series, author: e.target.value })}
                  className="p-4 border rounded-xl"
                />
              </Field>

              <Field label="מקום הוצאה (אוטומטי)">
                <input readOnly value={series.publicationPlace} className="p-4 border rounded-xl bg-gray-100" />
              </Field>

              <Field label="השתייכות למגזר">
                <select
                  value={series.sector}
                  onChange={e => setSeries({ ...series, sector: e.target.value })}
                  className="p-4 border rounded-xl"
                >
                  <option value="">בחר</option>
                  {sectorOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="שלמות המאגר">
                <input
                  value={series.dataCompleteness}
                  onChange={e => setSeries({ ...series, dataCompleteness: e.target.value })}
                  className="p-4 border rounded-xl"
                />
              </Field>

              <Field label="רשימת גליונות / כרכים חסרים">
                <input
                  value={series.missingVolumesList}
                  onChange={e => setSeries({ ...series, missingVolumesList: e.target.value })}
                  className="p-4 border rounded-xl"
                />
              </Field>

              <Field label="הערות למשתמש">
                <textarea
                  value={series.userNotes}
                  onChange={e => setSeries({ ...series, userNotes: e.target.value })}
                  className="p-4 border rounded-xl"
                />
              </Field>

              <Field label="הערות למערכת">
                <textarea
                  value={series.adminNotes}
                  onChange={e => setSeries({ ...series, adminNotes: e.target.value })}
                  className="p-4 border rounded-xl"
                />
              </Field>

              <Field label="תיאור הקובץ">
                <textarea
                  value={series.fileDescription}
                  onChange={e => setSeries({ ...series, fileDescription: e.target.value })}
                  className="p-4 border rounded-xl md:col-span-2"
                />
              </Field>

              <Field label="תמונת שער">
                <input type="file" onChange={e => setSeries({ ...series, coverImage: e.target.files[0] })} />
              </Field>

            </div>
          </div>

          {/* ---------- כרכים ---------- */}
          {volumes.map((vol, index) => (
            <div key={vol.id} className="bg-emerald-50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-emerald-800 mb-6">
                כרך {index + 1}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <Field label="שם גיליון / כרך">
                  <input value={vol.volumeTitle}
                    onChange={e => updateVolume(index, 'volumeTitle', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>

                <Field label="מספר כרך">
                  <input value={vol.volumeNumber}
                    onChange={e => updateVolume(index, 'volumeNumber', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>

                <Field label="שנה">
                  <input value={vol.year}
                    onChange={e => updateVolume(index, 'year', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>

                <Field label="חוברת">
                  <input value={vol.booklet}
                    onChange={e => updateVolume(index, 'booklet', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>

                <Field label="עורך הכרך">
                  <input value={vol.volumeEditor}
                    onChange={e => updateVolume(index, 'volumeEditor', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>

                <Field label="נושא ראשי">
                  <input value={vol.mainTopic}
                    onChange={e => updateVolume(index, 'mainTopic', e.target.value)}
                    className="p-4 border rounded-xl md:col-span-3" />
                </Field>

                <Field label='י"ל לרגל'>
                  <input value={vol.publishedFor}
                    onChange={e => updateVolume(index, 'publishedFor', e.target.value)}
                    className="p-4 border rounded-xl md:col-span-3" />
                </Field>

                <Field label="מקום הוצאה">
                  <input value={vol.publicationPlace}
                    className="p-4 border rounded-xl bg-gray-100" />
                </Field>

                <Field label="שנת הוצאה">
                  <input value={vol.publicationYear}
                    className="p-4 border rounded-xl bg-gray-100" />
                </Field>

                <Field label="חודש / תקופה">
                  <input value={vol.publicationPeriod}
                    onChange={e => updateVolume(index, 'publicationPeriod', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>

                <Field label="תיאור הכריכה">
                  <select value={vol.coverType}
                    onChange={e => updateVolume(index, 'coverType', e.target.value)}
                    className="p-4 border rounded-xl">
                    <option value="">בחר</option>
                    <option value="קשה">קשה</option>
                    <option value="רכה">רכה</option>
                  </select>
                </Field>

                <Field label="גודל הגיליון">
                  <select value={vol.volumeSize}
                    onChange={e => updateVolume(index, 'volumeSize', e.target.value)}
                    className="p-4 border rounded-xl">
                    <option value="">בחר</option>
                    <option value="רגיל">רגיל</option>
                    <option value="גדול">גדול</option>
                  </select>
                </Field>

                <Field label="שלימות הקובץ">
                  <input value={vol.fileCompleteness}
                    onChange={e => updateVolume(index, 'fileCompleteness', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>

                <Field label="שלימות הסריקה">
                  <input value={vol.scanCompleteness}
                    onChange={e => updateVolume(index, 'scanCompleteness', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>

                <Field label="מצב קיטלוג מאמרים">
                  <select value={vol.articlesCatalogStatus}
                    onChange={e => updateVolume(index, 'articlesCatalogStatus', e.target.value)}
                    className="p-4 border rounded-xl">
                    <option value="">בחר</option>
                    <option value="הושלם">הושלם</option>
                    <option value="חלקי">חלקי</option>
                  </select>
                </Field>

                <Field label="מצב נושאים / מקורות">
                  <select value={vol.articlesTopicsSourcesStatus}
                    onChange={e => updateVolume(index, 'articlesTopicsSourcesStatus', e.target.value)}
                    className="p-4 border rounded-xl md:col-span-2">
                    <option value="">בחר</option>
                    <option value="הושלם">הושלם</option>
                    <option value="חלקי">חלקי</option>
                    <option value="רק נושא">רק נושא</option>
                    <option value="רק מקורות">רק מקורות</option>
                  </select>
                </Field>

              </div>
            </div>
          ))}

          <button type="button" onClick={addVolume}
            className="px-6 py-4 bg-indigo-600 text-white rounded-xl">
            + הוסף כרך
          </button>

          <div className="flex justify-center gap-6">
            <button type="button" onClick={() => navigate(-1)}
              className="px-12 py-4 bg-gray-500 text-white rounded-xl">
              ביטול
            </button>

            <button type="submit" disabled={loading}
              className="px-16 py-4 bg-purple-600 text-white font-bold rounded-xl">
              שמור סדרה
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}