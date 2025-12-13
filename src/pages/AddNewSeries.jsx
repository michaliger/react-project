import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// --- תיקון: הקומפוננטה הוצאה החוצה כדי למנוע רינדור מחדש ואיבוד פוקוס ---
const Field = ({ label, children, colSpan = '' }) => (
  <div className={`flex flex-col gap-1 ${colSpan}`}>
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    {children}
  </div>
)

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
      articlesTopicsSourcesStatus: '',
      articles: [
        {
          id: Date.now() + Math.random(),
          autoId: 1,
          seriesAndVolumeName: '',
          authorTitle: '',
          firstName: '',
          lastName: '',
          role: '',
          additionalAuthors: [],
          title: '',
          generalTopic: '',
          source: '',
          linkedArticleId: null,
          linkType: ''
        }
      ]
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
        articlesTopicsSourcesStatus: '',
        articles: [
          {
            id: Date.now() + Math.random(),
            autoId: 1,
            seriesAndVolumeName: '',
            authorTitle: '',
            firstName: '',
            lastName: '',
            role: '',
            additionalAuthors: [],
            title: '',
            generalTopic: '',
            source: '',
            linkedArticleId: null,
            linkType: ''
          }
        ]
      }
    ])
  }

  const removeVolume = (index) => {
    setVolumes(prev => {
      if (prev.length === 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  const addArticle = (volumeIndex) => {
    setVolumes(prev =>
      prev.map((v, i) => {
        if (i === volumeIndex) {
          const newArticle = {
            id: Date.now() + Math.random(),
            autoId: v.articles.length + 1,
            seriesAndVolumeName: `${series.fileName} - כרך ${v.volumeNumber || ''}`,
            authorTitle: '',
            firstName: '',
            lastName: '',
            role: '',
            additionalAuthors: [],
            title: '',
            generalTopic: '',
            source: '',
            linkedArticleId: null,
            linkType: ''
          }
          return { ...v, articles: [...v.articles, newArticle] }
        }
        return v
      })
    )
  }

  const removeArticle = (volumeIndex, articleIndex) => {
    setVolumes(prev =>
      prev.map((v, i) => {
        if (i === volumeIndex) {
          if (v.articles.length === 1) return v
          const updatedArticles = v.articles
            .filter((_, ai) => ai !== articleIndex)
            .map((art, idx) => ({ ...art, autoId: idx + 1 }))
          return { ...v, articles: updatedArticles }
        }
        return v
      })
    )
  }

  const updateArticle = (volumeIndex, articleIndex, field, value) => {
    setVolumes(prev =>
      prev.map((v, i) => {
        if (i === volumeIndex) {
          const updatedArticles = v.articles.map((art, ai) =>
            ai === articleIndex ? { ...art, [field]: value } : art
          )
          return { ...v, articles: updatedArticles }
        }
        return v
      })
    )
  }

  const addAdditionalAuthor = (volumeIndex, articleIndex) => {
    setVolumes(prev =>
      prev.map((v, i) => {
        if (i === volumeIndex) {
          const updatedArticles = v.articles.map((art, ai) => {
            if (ai === articleIndex) {
              return {
                ...art,
                additionalAuthors: [
                  ...art.additionalAuthors,
                  { title: '', firstName: '', lastName: '', role: '' }
                ]
              }
            }
            return art
          })
          return { ...v, articles: updatedArticles }
        }
        return v
      })
    )
  }

  const updateAdditionalAuthor = (volumeIndex, articleIndex, addAuthorIndex, field, value) => {
    setVolumes(prev =>
      prev.map((v, i) => {
        if (i === volumeIndex) {
          const updatedArticles = v.articles.map((art, ai) => {
            if (ai === articleIndex) {
              const updatedAdd = art.additionalAuthors.map((add, addi) =>
                addi === addAuthorIndex ? { ...add, [field]: value } : add
              )
              return { ...art, additionalAuthors: updatedAdd }
            }
            return art
          })
          return { ...v, articles: updatedArticles }
        }
        return v
      })
    )
  }

  const handleSubmit = e => {
    e.preventDefault()
    setLoading(true)
    console.log('SERIES:', series)
    console.log('VOLUMES:', volumes)
    alert('בדיקה – הנתונים נשמרו מקומית')
    setLoading(false)
  }

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
                  value={series.prefixName || ''}
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
                  value={series.fileName || ''}
                  onChange={e => setSeries({ ...series, fileName: e.target.value })}
                  className="p-4 border rounded-xl"
                />
              </Field>
              <Field label="שם מזהה (במקרה של כפילות)">
                <input
                  value={series.identifierName || ''}
                  onChange={e => setSeries({ ...series, identifierName: e.target.value })}
                  className="p-4 border rounded-xl"
                />
              </Field>
              <Field label='י"ל ע"י / עורכים'>
                <input
                  value={series.author || ''}
                  onChange={e => setSeries({ ...series, author: e.target.value })}
                  className="p-4 border rounded-xl"
                />
              </Field>
              <Field label="מקום הוצאה (אוטומטי)">
                <input readOnly value={series.publicationPlace || 'לא ידוע'} className="p-4 border rounded-xl bg-gray-100" />
              </Field>
              <Field label="השתייכות למגזר">
                <select
                  value={series.sector || ''}
                  onChange={e => setSeries({ ...series, sector: e.target.value })}
                  className="p-4 border rounded-xl"
                >
                  <option value="">בחר</option>
                  {sectorOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="שלמות המאגר">
                <input
                  value={series.dataCompleteness || ''}
                  onChange={e => setSeries({ ...series, dataCompleteness: e.target.value })}
                  className="p-4 border rounded-xl"
                />
              </Field>
              <Field label="רשימת גליונות / כרכים חסרים">
                <input
                  value={series.missingVolumesList || ''}
                  onChange={e => setSeries({ ...series, missingVolumesList: e.target.value })}
                  className="p-4 border rounded-xl"
                />
              </Field>
              <Field label="הערות למשתמש">
                <textarea
                  value={series.userNotes || ''}
                  onChange={e => setSeries({ ...series, userNotes: e.target.value })}
                  className="p-4 border rounded-xl"
                />
              </Field>
              <Field label="הערות למערכת">
                <textarea
                  value={series.adminNotes || ''}
                  onChange={e => setSeries({ ...series, adminNotes: e.target.value })}
                  className="p-4 border rounded-xl"
                />
              </Field>
              <Field label="תיאור הקובץ" colSpan="md:col-span-2">
                <textarea
                  value={series.fileDescription || ''}
                  onChange={e => setSeries({ ...series, fileDescription: e.target.value })}
                  className="p-4 border rounded-xl w-full"
                />
              </Field>
              <Field label="תמונת שער">
                <input type="file" onChange={e => setSeries({ ...series, coverImage: e.target.files[0] })} />
              </Field>
            </div>
          </div>

          {/* ---------- כרכים ---------- */}
          {volumes.map((vol, volumeIndex) => (
            <div key={vol.id} className="bg-emerald-50 rounded-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-emerald-800">
                  כרך {volumeIndex + 1}
                </h2>
                {volumes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVolume(volumeIndex)}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
                  >
                    מחק כרך
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Field label="שם גיליון / כרך">
                  <input value={vol.volumeTitle || ''}
                    onChange={e => updateVolume(volumeIndex, 'volumeTitle', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>
                <Field label="מספר כרך">
                  <input value={vol.volumeNumber || ''}
                    onChange={e => updateVolume(volumeIndex, 'volumeNumber', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>
                <Field label="שנה">
                  <input value={vol.year || ''}
                    onChange={e => updateVolume(volumeIndex, 'year', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>
                <Field label="חוברת">
                  <input value={vol.booklet || ''}
                    onChange={e => updateVolume(volumeIndex, 'booklet', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>
                <Field label="עורך הכרך">
                  <input value={vol.volumeEditor || ''}
                    onChange={e => updateVolume(volumeIndex, 'volumeEditor', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>
                <Field label="נושא ראשי" colSpan="md:col-span-3">
                  <input value={vol.mainTopic || ''}
                    onChange={e => updateVolume(volumeIndex, 'mainTopic', e.target.value)}
                    className="p-4 border rounded-xl w-full" />
                </Field>
                <Field label='י"ל לרגל' colSpan="md:col-span-3">
                  <input value={vol.publishedFor || ''}
                    onChange={e => updateVolume(volumeIndex, 'publishedFor', e.target.value)}
                    className="p-4 border rounded-xl w-full" />
                </Field>
                <Field label="מקום הוצאה">
                  <input value={vol.publicationPlace || 'לא ידוע'} readOnly
                    className="p-4 border rounded-xl bg-gray-100" />
                </Field>
                <Field label="שנת הוצאה">
                  <input value={vol.publicationYear || 'לא ידוע'} readOnly
                    className="p-4 border rounded-xl bg-gray-100" />
                </Field>
                <Field label="חודש / תקופה">
                  <input value={vol.publicationPeriod || ''}
                    onChange={e => updateVolume(volumeIndex, 'publicationPeriod', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>
                <Field label="תיאור הכריכה">
                  <select value={vol.coverType || ''}
                    onChange={e => updateVolume(volumeIndex, 'coverType', e.target.value)}
                    className="p-4 border rounded-xl">
                    <option value="">בחר</option>
                    <option value="קשה">קשה</option>
                    <option value="רכה">רכה</option>
                  </select>
                </Field>
                <Field label="גודל הגיליון">
                  <select value={vol.volumeSize || ''}
                    onChange={e => updateVolume(volumeIndex, 'volumeSize', e.target.value)}
                    className="p-4 border rounded-xl">
                    <option value="">בחר</option>
                    <option value="רגיל">רגיל</option>
                    <option value="גדול">גדול</option>
                  </select>
                </Field>
                <Field label="שלימות הקובץ">
                  <input value={vol.fileCompleteness || ''}
                    onChange={e => updateVolume(volumeIndex, 'fileCompleteness', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>
                <Field label="שלימות הסריקה">
                  <input value={vol.scanCompleteness || ''}
                    onChange={e => updateVolume(volumeIndex, 'scanCompleteness', e.target.value)}
                    className="p-4 border rounded-xl" />
                </Field>
                <Field label="מצב קיטלוג מאמרים">
                  <select value={vol.articlesCatalogStatus || ''}
                    onChange={e => updateVolume(volumeIndex, 'articlesCatalogStatus', e.target.value)}
                    className="p-4 border rounded-xl">
                    <option value="">בחר</option>
                    <option value="הושלם">הושלם</option>
                    <option value="חלקי">חלקי</option>
                  </select>
                </Field>
                <Field label="מצב נושאים / מקורות" colSpan="md:col-span-2">
                  <select value={vol.articlesTopicsSourcesStatus || ''}
                    onChange={e => updateVolume(volumeIndex, 'articlesTopicsSourcesStatus', e.target.value)}
                    className="p-4 border rounded-xl w-full">
                    <option value="">בחר</option>
                    <option value="הושלם">הושלם</option>
                    <option value="חלקי">חלקי</option>
                    <option value="רק נושא">רק נושא</option>
                    <option value="רק מקורות">רק מקורות</option>
                  </select>
                </Field>
              </div>

              {/* ---------- טבלת מאמרים ---------- */}
              <h3 className="text-xl font-bold text-emerald-700 mb-4">מאמרים בכרך זה</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse border border-gray-300 bg-white">
                  <thead>
                    <tr className="bg-emerald-100">
                      <th className="border border-gray-300 px-4 py-2">מ"ס</th>
                      <th className="border border-gray-300 px-4 py-2">שם הסדרה וכרך</th>
                      <th className="border border-gray-300 px-4 py-2">תואר מחבר</th>
                      <th className="border border-gray-300 px-4 py-2">שם פרטי</th>
                      <th className="border border-gray-300 px-4 py-2">שם משפחה</th>
                      <th className="border border-gray-300 px-4 py-2">תפקיד</th>
                      <th className="border border-gray-300 px-4 py-2">כותר</th>
                      <th className="border border-gray-300 px-4 py-2">נושא כללי</th>
                      <th className="border border-gray-300 px-4 py-2">מקור</th>
                      <th className="border border-gray-300 px-4 py-2">קישור למאמר</th>
                      <th className="border border-gray-300 px-4 py-2">סוג קישור</th>
                      <th className="border border-gray-300 px-4 py-2">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vol.articles.map((article, articleIndex) => (
                      <tr key={article.id}>
                        <td className="border border-gray-300 px-4 py-2 text-center">{article.autoId}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            readOnly
                            value={`${series.fileName || ''} - כרך ${vol.volumeNumber || ''}`}
                            className="w-full p-2 bg-gray-100"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            value={article.authorTitle || ''}
                            onChange={e => updateArticle(volumeIndex, articleIndex, 'authorTitle', e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            value={article.firstName || ''}
                            onChange={e => updateArticle(volumeIndex, articleIndex, 'firstName', e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            value={article.lastName || ''}
                            onChange={e => updateArticle(volumeIndex, articleIndex, 'lastName', e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            value={article.role || ''}
                            onChange={e => updateArticle(volumeIndex, articleIndex, 'role', e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            value={article.title || ''}
                            onChange={e => updateArticle(volumeIndex, articleIndex, 'title', e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            value={article.generalTopic || ''}
                            onChange={e => updateArticle(volumeIndex, articleIndex, 'generalTopic', e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            value={article.source || ''}
                            onChange={e => updateArticle(volumeIndex, articleIndex, 'source', e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            placeholder="ID מאמר"
                            value={article.linkedArticleId || ''}
                            onChange={e => updateArticle(volumeIndex, articleIndex, 'linkedArticleId', e.target.value)}
                            className="w-full p-2 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <select
                            value={article.linkType || ''}
                            onChange={e => updateArticle(volumeIndex, articleIndex, 'linkType', e.target.value)}
                            className="w-full p-2 border rounded"
                          >
                            <option value="">בחר</option>
                            <option value="המשך">המשך</option>
                            <option value="ביקורת">ביקורת</option>
                          </select>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeArticle(volumeIndex, articleIndex)}
                            className="text-red-600 hover:underline text-sm"
                            disabled={vol.articles.length === 1}
                          >
                            מחק
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* מחברים נוספים */}
              {vol.articles.map((article, articleIndex) => (
                <div key={article.id + '-add'} className="mb-8 border border-gray-300 p-4 rounded bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-lg">מחברים נוספים למאמר {article.autoId}</span>
                    <button
                      type="button"
                      onClick={() => addAdditionalAuthor(volumeIndex, articleIndex)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                    >
                      + הוסף מחבר נוסף
                    </button>
                  </div>
                  {article.additionalAuthors.length === 0 && (
                    <p className="text-gray-500 italic">אין מחברים נוספים</p>
                  )}
                  {article.additionalAuthors.map((addAuth, addIndex) => (
                    <div key={addIndex} className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 p-4 bg-white rounded border">
                      <Field label="תואר מחבר">
                        <input
                          value={addAuth.title || ''}
                          onChange={e => updateAdditionalAuthor(volumeIndex, articleIndex, addIndex, 'title', e.target.value)}
                          className="p-2 border rounded"
                        />
                      </Field>
                      <Field label="שם פרטי">
                        <input
                          value={addAuth.firstName || ''}
                          onChange={e => updateAdditionalAuthor(volumeIndex, articleIndex, addIndex, 'firstName', e.target.value)}
                          className="p-2 border rounded"
                        />
                      </Field>
                      <Field label="שם משפחה">
                        <input
                          value={addAuth.lastName || ''}
                          onChange={e => updateAdditionalAuthor(volumeIndex, articleIndex, addIndex, 'lastName', e.target.value)}
                          className="p-2 border rounded"
                        />
                      </Field>
                      <Field label="תפקיד">
                        <input
                          value={addAuth.role || ''}
                          onChange={e => updateAdditionalAuthor(volumeIndex, articleIndex, addIndex, 'role', e.target.value)}
                          className="p-2 border rounded"
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              ))}

              <button
                type="button"
                onClick={() => addArticle(volumeIndex)}
                className="px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold"
              >
                + הוסף מאמר חדש לכרך זה
              </button>
            </div>
          ))}

          <button type="button" onClick={addVolume}
            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
            + הוסף כרך נוסף
          </button>

          <div className="flex justify-center gap-8 mt-12">
            <button type="button" onClick={() => navigate(-1)}
              className="px-16 py-5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 text-xl">
              ביטול
            </button>
            <button type="submit" disabled={loading}
              className="px-20 py-5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 text-xl">
              {loading ? 'שומר...' : 'שמור סדרה וכרכים'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}