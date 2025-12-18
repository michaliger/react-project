import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Book, FileText, Users, Save, X, Image as ImageIcon, Upload, EyeOff } from 'lucide-react'

const Field = ({ label, children, colSpan = '' }) => (
  <div className={`flex flex-col gap-1.5 ${colSpan}`}>
    <label className="text-sm font-bold text-slate-700 mr-1">{label}</label>
    {children}
  </div>
)

export default function AddNewSeries() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [activeVolume, setActiveVolume] = useState(0)

  // ---------- כל השדות ללא יוצא מן הכלל (סדרה) ----------
  const [series, setSeries] = useState({
    prefixName: '', fileName: '', identifierName: '', author: '',
    totalVolumes: 0, publicationPlace: 'לא ידוע', publicationYears: '',
    sector: '', missingVolumesList: '',
    userNotes: '', adminNotes: '', fileDescription: '',
    coverImage: null, coverPreview: null, enteredBy: '', catalogStatus: 'חלקי'
  })

  // פונקציה ליצירת כרך עם כל השדות ללא יוצא מן הכלל
  const createEmptyVolume = (index) => ({
    id: Math.random().toString(36).substr(2, 9),
    volumeTitle: '', volumeNumber: (index + 1).toString(), year: '', booklet: '',
    showOptionalFields: false,
    mainTopic: '', publishedFor: '', publicationPlace: 'לא ידוע',
    publicationYear: 'לא ידוע', publicationPeriod: '', coverType: '', volumeSize: '',
    articlesCount: 0, fileCompleteness: '', scanCompleteness: '',
    articlesCatalogStatus: '', articlesTopicsSourcesStatus: '',
    articles: [{
      id: Math.random().toString(36).substr(2, 9),
      autoId: 1, authorTitle: '', firstName: '', lastName: '', role: '',
      title: '', generalTopic: '', source: '', linkedArticleId: '',
      linkType: '', additionalAuthors: []
    }]
  })

  const [volumes, setVolumes] = useState([createEmptyVolume(0)])

  // --- לוגיקה ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSeries(prev => ({ ...prev, coverImage: file, coverPreview: URL.createObjectURL(file) }));
    }
  }

  const updateSeries = (field, value) => setSeries(prev => ({ ...prev, [field]: value }))
  const addVolume = () => {
    const newVol = createEmptyVolume(volumes.length);
    setVolumes([...volumes, newVol]);
    setActiveVolume(volumes.length);
  }
  const removeVolume = (idx) => {
    if (volumes.length <= 1) return;
    setVolumes(volumes.filter((_, i) => i !== idx));
    setActiveVolume(Math.max(0, idx - 1));
  }

  const updateVolumeField = (vIdx, field, value) => {
    const newVolumes = [...volumes];
    newVolumes[vIdx][field] = value;
    setVolumes(newVolumes);
  }

  const updateArticle = (vIdx, aIdx, field, value) => {
    const newVolumes = [...volumes];
    newVolumes[vIdx].articles[aIdx][field] = value;
    setVolumes(newVolumes);
  }
  const addArticle = (vIdx) => {
    const newVolumes = [...volumes];
    const newArt = {
      id: Math.random().toString(36).substr(2, 9),
      autoId: newVolumes[vIdx].articles.length + 1,
      authorTitle: '', firstName: '', lastName: '', role: '', title: '',
      generalTopic: '', source: '', linkedArticleId: '', linkType: '',
      additionalAuthors: []
    };
    newVolumes[vIdx].articles.push(newArt);
    setVolumes(newVolumes);
  }
  const removeArticle = (vIdx, aIdx) => {
    const newVolumes = [...volumes];
    if (newVolumes[vIdx].articles.length <= 1) return;
    newVolumes[vIdx].articles = newVolumes[vIdx].articles.filter((_, i) => i !== aIdx);
    newVolumes[vIdx].articles.forEach((art, i) => art.autoId = i + 1);
    setVolumes(newVolumes);
  }

  const currentVolume = volumes[activeVolume];


  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-right text-slate-900" dir="rtl">
      <div className="max-w-[1650px] mx-auto space-y-6">

        {/* Header */}
        <header className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-800">הוספת קובץ חדשה</h1>
            <p className="text-slate-500 text-sm italic">כל השדות זמינים לעריכה</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="px-5 py-2 rounded-xl border border-slate-300 font-bold hover:bg-slate-50">ביטול</button>
            <button className="px-7 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg">
              <Save size={18} /> שמור הכל
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">

          {/* עמודה ימנית: סדרה - 100% מהשדות */}
          <aside className="col-span-12 lg:col-span-7 space-y-5">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4 text-indigo-600 border-b pb-3 font-black">
                <Book size={20} />
                <h2>פרטי הסדרה המלאים</h2>
              </div>

              <div className="grid grid-cols-6 gap-4">
                {/* שורה ראשונה */}
                <Field label="שם מקדים" colSpan="col-span-1">
                  <input value={series.prefixName} onChange={e => updateSeries('prefixName', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
                </Field>
                <Field label="שם הקובץ (חובה)" colSpan="col-span-2">
                  <input value={series.fileName} onChange={e => updateSeries('fileName', e.target.value)} className="p-2 bg-white border-2 border-indigo-100 rounded-lg font-bold text-slate-900" />
                </Field>
                <Field label="שם מזהה (לכפילויות בלבד)" colSpan="col-span-3">
                  <input value={series.identifierName} onChange={e => updateSeries('identifierName', e.target.value)} placeholder="רק אם יש שם זהה לסדרה אחרת" className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
                </Field>

                {/* שורה שנייה */}
                <Field label="מחבר/עורך" colSpan="col-span-3">
                  <input value={series.author} onChange={e => updateSeries('author', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
                </Field>
                <Field label="מגזר" colSpan="col-span-1">
                  <input value={series.sector} onChange={e => updateSeries('sector', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
                </Field>
                <Field label="מקום הוצאה" colSpan="col-span-1">
                  <input value={series.publicationPlace} onChange={e => updateSeries('publicationPlace', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
                </Field>

                {/* שורה שלישית */}
                <Field label="שנות הוצאה" colSpan="col-span-1">
                  <input value={series.publicationYears} onChange={e => updateSeries('publicationYears', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
                </Field>
                <Field label="סה''כ גליונות" colSpan="col-span-1">
                  <input type="number" value={series.totalVolumes} onChange={e => updateSeries('totalVolumes', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900" />
                </Field>
                <Field label="סטטוס קטלוג" colSpan="col-span-1">
                  <select value={series.catalogStatus} onChange={e => updateSeries('catalogStatus', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
                    <option value="חלקי">חלקי</option>
                    <option value="מלא">מלא</option>
                    <option value="טרם החל">טרם החל</option>
                  </select>
                </Field>

                <Field label="תיאור הקובץ" colSpan="col-span-4">
                  <textarea rows="1" value={series.fileDescription} onChange={e => updateSeries('fileDescription', e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm" />
                </Field>
                {/* שורה חמישית - הערות (רוחב מלא) */}
                <div className="col-span-4 flex flex-col gap-3">
                  <Field label="הערות">
                    <textarea
                      rows="2"
                      value={series.userNotes}
                      onChange={e => updateSeries('userNotes', e.target.value)}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm w-full"
                    />
                  </Field>

                  <Field label="רשימת כרכים חסרים">
                    <textarea
                      rows="2"
                      value={series.missingVolumesList}
                      onChange={e => updateSeries('missingVolumesList', e.target.value)}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm w-full"
                    />
                  </Field>
                </div>

                {/* שורה רביעית - תמונה משמאל + תיאור הקובץ מימין */}
                <div className="col-span-2">

                  <div
                    onClick={() => fileInputRef.current.click()}
                    className="w-full max-w-[260px] h-48 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all overflow-hidden relative bg-slate-50"
                  >
                    {series.coverPreview ? (
                      <img src={series.coverPreview} alt="Preview" className="col-span-2 h-full w-auto object-contain p-2 flex justify-flex-start" />
                    ) : (
                      <Upload size={48} className="text-slate-300" />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                </div>

                {/* שורה שישית - רשימת כרכים חסרים (רוחב מלא, מתחת להערות) */}

              </div>
            </div>
          </aside >

          {/* עמודה שמאלית: כרכים ומאמרים - 100% מהשדות */}
          <main className="col-span-12 lg:col-span-5 space-y-6">
            <div className="flex flex-wrap items-center gap-3 pb-4 -mx-1">
              {volumes.map((v, i) => (
                <button key={v.id} onClick={() => setActiveVolume(i)} className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 flex-shrink-0 ${activeVolume === i ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                  גליון {v.volumeTitle || i + 1}
                  {activeVolume === i && volumes.length > 1 && <X size={14} onClick={(e) => { e.stopPropagation(); removeVolume(i); }} />}
                </button>
              ))}
              <button onClick={addVolume} className="p-2.5 bg-white text-indigo-600 rounded-xl border-2 border-dashed border-indigo-200 hover:bg-indigo-50 shadow-sm"><Plus size={20} /></button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
              {/* כל שדות הכרך - 6 עמודות */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-slate-50/50 p-4 rounded-2xl">

                {/* שדה 1: שם גליון */}
                {/* אם שדות אופציונליים מוסתרים (false), שם גליון תופס 3 עמודות. אם גלויים (true), הוא תופס עמודה 1. */}
                <Field label="שם גליון" colSpan="md:col-span-3">
                  <input
                    value={currentVolume.volumeTitle}
                    onChange={e => updateVolumeField(activeVolume, 'volumeTitle', e.target.value)}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </Field>
                <Field label='י"ל לרגל' colSpan="md:col-span-3">
                  <input value={currentVolume.publishedFor} onChange={e => updateVolumeField(activeVolume, 'publishedFor', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg w-full text-slate-900 font-semibold" />
                </Field>
                <Field label="חודש/תקופה" colSpan="md:col-span-2 "><input value={currentVolume.publicationPeriod} onChange={e => updateVolumeField(activeVolume, 'publicationPeriod', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900" /></Field>
                <Field label="סוג כריכה" colSpan="md:col-span-2"><input value={currentVolume.coverType} onChange={e => updateVolumeField(activeVolume, 'coverType', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900" /></Field>
                <Field label="גודל גליון" colSpan="md:col-span-2"><input value={currentVolume.volumeSize} onChange={e => updateVolumeField(activeVolume, 'volumeSize', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900" /></Field>

                <Field label="נושא ראשי" colSpan="md:col-span-2">
                  <input value={currentVolume.mainTopic} onChange={e => updateVolumeField(activeVolume, 'mainTopic', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold" />
                </Field>

                <Field label="סטטוס קטלוג" colSpan="md:col-span-2">
                  <input value={currentVolume.articlesCatalogStatus} onChange={e => updateVolumeField(activeVolume, 'articlesCatalogStatus', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs" />
                </Field>

                <Field label="סטטוס מקורות" colSpan="md:col-span-2" >
                  <input value={currentVolume.articlesTopicsSourcesStatus} onChange={e => updateVolumeField(activeVolume, 'articlesTopicsSourcesStatus', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs" />
                </Field>


                {/* --- בלוק שדות אופציונליים --- */}
                {currentVolume.showOptionalFields ? (
                  // שורה חדשה עם 3 שדות + כפתור הסתר
                  <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-6 gap-4 mt-4 bg-indigo-50/30 p-4 rounded-xl">
                    <Field label="מספר גליון" colSpan="md:col-span-2">
                      <input value={currentVolume.volumeNumber} onChange={e => updateVolumeField(activeVolume, 'volumeNumber', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold w-full" />
                    </Field>
                    <Field label="שנה" colSpan="md:col-span-2">
                      <input value={currentVolume.year} onChange={e => updateVolumeField(activeVolume, 'year', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900 w-full" />
                    </Field>
                    <Field label="חוברת" colSpan="md:col-span-1">
                      <input value={currentVolume.booklet} onChange={e => updateVolumeField(activeVolume, 'booklet', e.target.value)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-900 w-full" />
                    </Field>
                    <div className="md:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => updateVolumeField(activeVolume, 'showOptionalFields', false)}
                        className="w-full py-2 px-3 bg-red-100 text-red-600 rounded-lg font-semibold flex items-center justify-center gap-1 hover:bg-red-200 transition-colors text-sm"
                      >
                        <EyeOff size={16} /> הסתר
                      </button>
                    </div>
                  </div>
                ) : (
                  // כפתור קטן בסוף השורה הראשונה
                  <div className="md:col-span-1 flex items-end pb-2">
                    <button
                      type="button"
                      onClick={() => updateVolumeField(activeVolume, 'showOptionalFields', true)}
                      className="w-full py-1.5 px-3 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs flex items-center justify-center gap-1 hover:bg-indigo-200 transition-colors border border-indigo-300"
                    >
                      <Plus size={14} /> פרטים נוספים
                    </button>
                  </div>
                )}
              </div>

              {/* טבלת מאמרים - כל השדות בטקסט שחור */}
              <div className="space-y-4">
                <h4 className="font-black text-slate-800 border-r-4 border-indigo-500 pr-3">מאמרים בגליון</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-black text-[11px] font-black">
                        <th className="p-3 w-12 text-center">מס'</th>
                        <th className="p-3 border-l border-slate-700">תואר</th>
                        <th className="p-3 border-l border-slate-700"> פרטי</th>
                        <th className="p-3 border-l border-slate-700"> משפחה</th>
                        <th className="p-3 border-l border-slate-700">תפקיד</th>
                        <th className="p-3 border-l border-slate-700"> המאמר</th>
                        <th className="p-3 border-l border-slate-700">נושא</th>
                        <th className="p-3 border-l border-slate-700">מקור</th>
                        <th className="p-3 border-l border-slate-700 w-20">ID קשר</th>
                        <th className="p-3 border-l border-slate-700 w-24">סוג קשר</th>
                        <th className="p-3 w-20 text-center">פעולות</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] text-slate-900">
                      {currentVolume.articles.map((art, aIdx) => (
                        <tr key={art.id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                          <td className="p-2 text-center font-bold text-slate-600 bg-slate-50/50 border-l border-slate-100">{art.autoId}</td>
                          <td className="p-1"><input value={art.authorTitle} onChange={e => updateArticle(activeVolume, aIdx, 'authorTitle', e.target.value)} className="w-full p-2 bg-transparent border-none text-slate-900" /></td>
                          <td className="p-1"><input value={art.firstName} onChange={e => updateArticle(activeVolume, aIdx, 'firstName', e.target.value)} className="w-full p-2 bg-transparent border-none font-bold text-slate-900" /></td>
                          <td className="p-1"><input value={art.lastName} onChange={e => updateArticle(activeVolume, aIdx, 'lastName', e.target.value)} className="w-full p-2 bg-transparent border-none font-bold text-slate-900" /></td>
                          <td className="p-1"><input value={art.role} onChange={e => updateArticle(activeVolume, aIdx, 'role', e.target.value)} className="w-full p-2 bg-transparent border-none italic text-slate-600" /></td>
                          <td className="p-1"><input value={art.title} onChange={e => updateArticle(activeVolume, aIdx, 'title', e.target.value)} className="w-full p-2 bg-transparent border-none font-black text-indigo-900" /></td>
                          <td className="p-1"><input value={art.generalTopic} onChange={e => updateArticle(activeVolume, aIdx, 'generalTopic', e.target.value)} className="w-full p-2 bg-transparent border-none text-slate-900" /></td>
                          <td className="p-1"><input value={art.source} onChange={e => updateArticle(activeVolume, aIdx, 'source', e.target.value)} className="w-full p-2 bg-transparent border-none text-slate-900" /></td>
                          <td className="p-1"><input value={art.linkedArticleId} onChange={e => updateArticle(activeVolume, aIdx, 'linkedArticleId', e.target.value)} className="w-full p-2 bg-transparent border-none text-slate-900" /></td>
                          <td className="p-1">
                            <select value={art.linkType} onChange={e => updateArticle(activeVolume, aIdx, 'linkType', e.target.value)} className="w-full bg-transparent border-none text-slate-900 text-xs">
                              <option value="">-</option><option value="המשך">המשך</option><option value="ביקורת">ביקורת</option><option value="תגובה">תגובה</option>
                            </select>
                          </td>
                          <td className="p-1 text-center">
                            <div className="flex justify-center gap-1">
                              <button onClick={() => {
                                const newVols = [...volumes];
                                newVols[activeVolume].articles[aIdx].additionalAuthors.push({ id: Date.now(), title: '', firstName: '', lastName: '' });
                                setVolumes(newVols);
                              }} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg" title="הוסף מחבר"><Users size={16} /></button>
                              <button onClick={() => removeArticle(activeVolume, aIdx)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* מחברים נוספים */}
                <div className="flex flex-wrap gap-2">
                  {currentVolume.articles.map((art, aIdx) =>
                    art.additionalAuthors.map((auth, authIdx) => (
                      <div key={auth.id} className="flex items-center gap-2 bg-indigo-50 p-2 rounded-xl border border-indigo-100 animate-in fade-in zoom-in-95">
                        <span className="text-[10px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded">מאמר {art.autoId}</span>
                        <input placeholder="תואר" className="p-1 text-xs rounded border-none w-12 text-slate-900" value={auth.title} onChange={e => {
                          const v = [...volumes]; v[activeVolume].articles[aIdx].additionalAuthors[authIdx].title = e.target.value; setVolumes(v);
                        }} />
                        <input placeholder="שם פרטי" className="p-1 text-xs rounded border-none w-20 text-slate-900" value={auth.firstName} onChange={e => {
                          const v = [...volumes]; v[activeVolume].articles[aIdx].additionalAuthors[authIdx].firstName = e.target.value; setVolumes(v);
                        }} />
                        <input placeholder="שם משפחה" className="p-1 text-xs rounded border-none w-20 text-slate-900" value={auth.lastName} onChange={e => {
                          const v = [...volumes]; v[activeVolume].articles[aIdx].additionalAuthors[authIdx].lastName = e.target.value; setVolumes(v);
                        }} />
                        <input placeholder="תפקיד" className="p-1 text-xs rounded border-none w-12 text-slate-900" value={auth.role} onChange={e => {
                          const v = [...volumes]; v[activeVolume].articles[aIdx].additionalAuthors[authIdx].role = e.target.value; setVolumes(v);
                        }} />
                        <button onClick={() => {
                          const v = [...volumes]; v[activeVolume].articles[aIdx].additionalAuthors.splice(authIdx, 1); setVolumes(v);
                        }} className="text-red-500 hover:bg-white rounded-full p-0.5"><X size={12} /></button>
                      </div>
                    ))
                  )}
                </div>

                <button onClick={() => addArticle(activeVolume)} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 flex items-center justify-center gap-2 transition-all">
                  <Plus size={20} /> הוסף שורת מאמר חדשה
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}