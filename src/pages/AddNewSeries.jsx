import React, { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Users, Save, X, Upload, FileText, Layout, Database, CheckCircle2, Link2 } from 'lucide-react'

const CompactField = ({ label, children, colSpan = 'col-span-1', required = false, error = false }) => (
  <div className={`flex flex-col gap-0.5 ${colSpan}`}>
    <label className="text-[11px] font-bold text-black mr-1 flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <span className="text-[9px] text-red-500 font-bold mr-1">חובה</span>}
  </div>
)

export default function App() {
  const [currentPage, setCurrentPage] = useState('editor')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' })
  const [errors, setErrors] = useState({})

  const fileInputRef = useRef(null)
  const pdfInputRef = useRef(null)
  const [activeVolume, setActiveVolume] = useState(0)

  const [series, setSeries] = useState({
    id: null, prefixName: '', fileName: '', identifierName: '', details: '',
    editor: '', publicationPlace: '', publicationYears: [], sector: '',
    missingVolumesList: '', userNotes: '', adminNotes: '', fileDescription: '',
    coverImage: null, coverPreview: null, createdBy: "691f8b89e60ae71b1932aab0",
    enteredBy: '', catalogStatus: 'טיוטה'
  })

  const createEmptyVolume = (index) => ({
    id: Math.random().toString(36).substr(2, 9),
    volumeTitle: '', volumeNumber: (index + 1).toString(), booklet: '',
    showOptionalFields: false, mainTopic: '', publishedFor: '', publicationYear: '',
    StartYear: '', publicationPeriod: '', coverType: '', volumeSize: '',
    articlesCount: 0, fileCompleteness: '', scanCompleteness: '',
    articlesCatalogStatus: '', articlesTopicsSourcesStatus: '',
    pdfFile: null, pdfFileName: '',
    articles: [{
      id: Math.random().toString(36).substr(2, 9), autoId: 1,
      authors: [{ titlePrefix: '', firstName: '', lastName: '', role: '' }],
      additionalAuthors: [], page: '', title: '', generalTopic: '', source: '',
      linkedArticleId: '', linkType: ''
    }]
  })

  const [volumes, setVolumes] = useState([createEmptyVolume(0)])

  // פונקציית עזר להוצאת כל המאמרים הקיימים בסדרה לצורך קישור
  const getAllArticlesInSeries = () => {
    const all = []
    volumes.forEach((v, vIdx) => {
      v.articles.forEach((a) => {
        if (a.title) {
          all.push({
            id: a.id,
            display: `${a.title} (${v.volumeTitle || 'גליון ' + (vIdx + 1)})`
          })
        }
      })
    })
    return all
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) setSeries(prev => ({ ...prev, coverImage: file, coverPreview: URL.createObjectURL(file) }))
  }

  const handlePdfUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const newVolumes = [...volumes]
      newVolumes[activeVolume].pdfFile = file
      newVolumes[activeVolume].pdfFileName = file.name
      setVolumes(newVolumes)
    }
  }

  const updateSeries = (field, value) => {
    setSeries(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }))
  }

  const updateVolumeField = (vIdx, field, value) => {
    const newVolumes = [...volumes]
    newVolumes[vIdx][field] = value
    setVolumes(newVolumes)
  }

  const addVolume = () => {
    const newVol = createEmptyVolume(volumes.length)
    setVolumes([...volumes, newVol])
    setActiveVolume(volumes.length)
  }

  const updateArticle = (vIdx, aIdx, field, value) => {
    const newVolumes = [...volumes]
    newVolumes[vIdx].articles[aIdx][field] = value
    setVolumes(newVolumes)
  }

  const updateArticleAuthor = (vIdx, aIdx, authorIndex, subField, value) => {
    const newVolumes = [...volumes]
    if (authorIndex === 0) {
      newVolumes[vIdx].articles[aIdx].authors[0][subField] = value
    } else {
      newVolumes[vIdx].articles[aIdx].additionalAuthors[authorIndex - 1][subField] = value
    }
    setVolumes(newVolumes)
  }

  const addArticle = (vIdx) => {
    const newVolumes = [...volumes]
    const newArt = {
      id: Math.random().toString(36).substr(2, 9), autoId: newVolumes[vIdx].articles.length + 1,
      authors: [{ titlePrefix: '', firstName: '', lastName: '', role: '' }],
      additionalAuthors: [], page: '', title: '', generalTopic: '', source: '',
      linkedArticleId: '', linkType: ''
    }
    newVolumes[vIdx].articles.push(newArt)
    setVolumes(newVolumes)
  }

  const removeArticle = (vIdx, aIdx) => {
    const newVolumes = [...volumes]
    if (newVolumes[vIdx].articles.length <= 1) return
    newVolumes[vIdx].articles = newVolumes[vIdx].articles.filter((_, i) => i !== aIdx)
    newVolumes[vIdx].articles.forEach((art, i) => art.autoId = i + 1)
    setVolumes(newVolumes)
  }

  const addAdditionalAuthor = (vIdx, aIdx) => {
    const newVolumes = [...volumes]
    newVolumes[vIdx].articles[aIdx].additionalAuthors.push({ titlePrefix: '', firstName: '', lastName: '', role: '' })
    setVolumes(newVolumes)
  }

  const removeAdditionalAuthor = (vIdx, aIdx, addIdx) => {
    const newVolumes = [...volumes]
    newVolumes[vIdx].articles[aIdx].additionalAuthors.splice(addIdx, 1)
    setVolumes(newVolumes)
  }

  const handleFinalSave = async () => {
    const newErrors = {}
    if (!series.fileName) newErrors.fileName = true
    if (!series.prefixName) newErrors.prefixName = true
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); setSaveMessage({ text: 'נא למלא שדות חובה', type: 'error' }); return; }
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSaveMessage({ text: 'נשמר בהצלחה!', type: 'success' });
      setTimeout(() => setCurrentPage('home'), 1000);
    } catch (error) { setIsSaving(false); setSaveMessage({ text: 'שגיאה בשמירה', type: 'error' }); }
  }

  const inputClass = (error) => `w-full p-1.5 bg-white border ${error ? 'border-red-400' : 'border-slate-200'} rounded text-sm text-black outline-none focus:ring-1 focus:ring-indigo-100 transition-all`

  if (currentPage === 'home') {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center font-sans text-right" dir="rtl">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-200 text-center space-y-6 max-w-md w-full">
          <CheckCircle2 size={60} className="text-green-500 mx-auto" />
          <h1 className="text-2xl font-black text-black">הנתונים נשמרו!</h1>
          <button onClick={() => { setSeries({ ...series, fileName: '' }); setVolumes([createEmptyVolume(0)]); setCurrentPage('editor'); }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">הוספת סדרה חדשה</button>
        </div>
      </div>
    )
  }

  const currentVolume = volumes[activeVolume] || { articles: [] }
  const allArticlesOptions = getAllArticlesInSeries()

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-right text-black overflow-hidden" dir="rtl">
      {/* Header */}
      <header className="h-11 bg-white border-b border-slate-200 px-4 flex justify-between items-center shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-indigo-600" />
          <h1 className="text-sm font-black text-black">מערכת קטלוג תורני </h1>
          {saveMessage.text && <span className={`mr-4 px-2 py-0.5 rounded text-[10px] font-bold ${saveMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{saveMessage.text}</span>}
        </div>
        <button onClick={handleFinalSave} disabled={isSaving} className="px-5 py-1 bg-black text-white rounded text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition-all">
          <Save size={14} /> {isSaving ? 'שומר...' : 'שמירה סופית'}
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">

        {/* Row 1: Series Info & Sidebar */}
        <div className="flex gap-3 items-start h-[430px]">
          {/* Sidebar - נשאר בגובה השדות כדי לא לדחוף את הטבלה */}
          <aside
            className="w-44 bg-white border border-slate-200 rounded-xl flex flex-col shrink-0 shadow-sm overflow-hidden"
            style={{ height: '425px' }} // זה נועל את הגובה של הסרגל
          >
            <div className="p-1.5 bg-slate-50 border-b border-slate-200 shrink-0">
              <button
                onClick={addVolume}
                className="w-full py-1 bg-indigo-600 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-indigo-700 transition-all"
              >
                <Plus size={12} /> הוסף גליון
              </button>
            </div>

            {/* רשימת הגליונות - גדלה למקסימום המקום הפנוי ומייצרת גלילה */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
              {volumes.map((v, i) => (
                <div key={v.id} className="relative group">
                  <button
                    onClick={() => setActiveVolume(i)}
                    className={`w-full text-right px-2 py-1.5 rounded text-[10px] font-bold truncate flex items-center gap-2 transition-all ${activeVolume === i
                        ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600'
                        : 'text-black hover:bg-slate-50'
                      }`}
                  >
                    <FileText size={12} className={activeVolume === i ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="truncate">{v.volumeTitle || `גליון ${i + 1}`}</span>
                  </button>

                  {/* כפתור מחיקה מהיר שמופיע בריחוף */}
                  {volumes.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeVolume(i); }}
                      className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </aside>

          {/* Series & Volume Data Content */}
          <div className="flex-1 space-y-3 h-full">
            {/* Section 1: Series Data */}
            <section className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-[10px] font-black text-indigo-600 uppercase mb-2 border-b pb-1">נתוני סדרה כלליים</h3>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-10 grid grid-cols-6 gap-x-3 gap-y-2">
                  <CompactField label="שם מקדים" required><select value={series.prefixName} onChange={e => updateSeries('prefixName', e.target.value)} className={inputClass()}><option></option><option>ספר זכרון</option><option>קובץ תורני</option><option>ירחון</option></select></CompactField>
                  <CompactField label="שם הקובץ" required colSpan="col-span-2"><input value={series.fileName} onChange={e => updateSeries('fileName', e.target.value)} className={`${inputClass()} font-bold`} /></CompactField>
                  <CompactField label="שם מזהה"><input value={series.identifierName} onChange={e => updateSeries('identifierName', e.target.value)} className={inputClass()} /></CompactField>
                  <CompactField label="עורך"><input value={series.editor} onChange={e => updateSeries('editor', e.target.value)} className={inputClass()} /></CompactField>
                  <CompactField label="מגזר"><select value={series.sector} onChange={e => updateSeries('sector', e.target.value)} className={inputClass()}><option></option><option>לטאי</option><option>חסידי</option><option>ספרדי</option></select></CompactField>
                  <CompactField label="מקום הוצאה" colSpan="col-span-2"><input value={series.publicationPlace} onChange={e => updateSeries('publicationPlace', e.target.value)} className={inputClass()} /></CompactField>
                  <CompactField label="פרטים נוספים" colSpan="col-span-2"><input value={series.details} onChange={e => updateSeries('details', e.target.value)} className={inputClass()} /></CompactField>
                  <CompactField label="סטטוס קטלוג"><input value={series.catalogStatus} onChange={e => updateSeries('catalogStatus', e.target.value)} className={inputClass()} /></CompactField>
                  <CompactField label="הוזן ע״י"><input value={series.enteredBy} onChange={e => updateSeries('enteredBy', e.target.value)} className={inputClass()} /></CompactField>
                  <CompactField label="גליונות חסרים" colSpan="col-span-3"><input value={series.missingVolumesList} onChange={e => updateSeries('missingVolumesList', e.target.value)} className={inputClass()} /></CompactField>
                  <CompactField label="הערות מנהל" colSpan="col-span-3"><input value={series.adminNotes} onChange={e => updateSeries('adminNotes', e.target.value)} className={inputClass()} /></CompactField>
                </div>
                <div className="col-span-2">
                  <div onClick={() => fileInputRef.current.click()} className="h-full min-h-[110px] border border-dashed border-slate-300 rounded flex flex-col items-center justify-center cursor-pointer bg-slate-50 overflow-hidden">
                    {series.coverPreview ? <img src={series.coverPreview} className="h-full w-full object-contain" /> : <div className="flex flex-col items-center text-black"><Upload size={16} /><span className="text-[9px] font-bold">העלאת כריכה</span></div>}
                    <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} accept="image/*" />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Volume Data */}
            <section className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-[10px] font-black text-black mb-2">נתוני גליון פעיל</h3>
              <div className="grid grid-cols-8 gap-x-2 gap-y-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                <CompactField label="שם גליון" colSpan="col-span-2"><input value={currentVolume.volumeTitle} onChange={e => updateVolumeField(activeVolume, 'volumeTitle', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="נושא ראשי" colSpan="col-span-2"><input value={currentVolume.mainTopic} onChange={e => updateVolumeField(activeVolume, 'mainTopic', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="יצא לרגל" colSpan="col-span-2"><input value={currentVolume.publishedFor} onChange={e => updateVolumeField(activeVolume, 'publishedFor', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="שנה"><input value={currentVolume.publicationYear} onChange={e => updateVolumeField(activeVolume, 'publicationYear', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="תקופה"><input value={currentVolume.publicationPeriod} onChange={e => updateVolumeField(activeVolume, 'publicationPeriod', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="כריכה"><select value={currentVolume.coverType} onChange={e => updateVolumeField(activeVolume, 'coverType', e.target.value)} className={inputClass()}><option></option><option>קשה</option><option>רכה</option></select></CompactField>
                <CompactField label="גודל"><select value={currentVolume.volumeSize} onChange={e => updateVolumeField(activeVolume, 'volumeSize', e.target.value)} className={inputClass()}><option></option><option>גדול</option><option>בינוני</option><option>קטן</option></select></CompactField>
                <CompactField label="שלמות קובץ"><input value={currentVolume.fileCompleteness} onChange={e => updateVolumeField(activeVolume, 'fileCompleteness', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="שלמות סריקה"><input value={currentVolume.scanCompleteness} onChange={e => updateVolumeField(activeVolume, 'scanCompleteness', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="סטטוס מאמרים" colSpan="col-span-2"><input value={currentVolume.articlesCatalogStatus} onChange={e => updateVolumeField(activeVolume, 'articlesCatalogStatus', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="PDF" colSpan="col-span-2">
                  <button onClick={() => pdfInputRef.current.click()} className="w-full p-1.5 border rounded text-[10px] bg-white font-bold text-black truncate flex items-center gap-1"><FileText size={12} /> {currentVolume.pdfFileName || 'צרף PDF'}</button>
                  <input type="file" ref={pdfInputRef} hidden onChange={handlePdfUpload} accept=".pdf" />
                </CompactField>
              </div>
            </section>
          </div>
        </div>

        {/* Row 2: Articles Table */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 w-full">
          <div className="flex items-center justify-between mb-2 px-1">
            <h4 className="font-black text-black text-[11px] flex items-center gap-1"><Users size={14} /> רשימת מאמרים ({currentVolume.articles.length})</h4>
            <button onClick={() => addArticle(activeVolume)} className="px-3 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold hover:bg-indigo-700 flex items-center gap-1 transition-all"><Plus size={12} /> הוסף מאמר למערכת</button>
          </div>

          <div className="w-full overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-right text-[11px] table-fixed min-w-[1000px]">
              <thead>
                <tr className="bg-black text-white font-bold">
                  <th className="p-2 w-8 text-center border-l border-slate-800">#</th>
                  <th className="p-2 w-14 border-l border-slate-800">תואר</th>
                  <th className="p-2 w-24 border-l border-slate-800">שם פרטי</th>
                  <th className="p-2 w-24 border-l border-slate-800">משפחה</th>
                  <th className="p-2 w-24 border-l border-slate-800">תפקיד</th>
                  <th className="p-2 border-l border-slate-800">שם המאמר</th>
                  <th className="p-2 w-10 border-l border-slate-800 text-center">עמ'</th>
                  <th className="p-2 w-32  text-center border-l border-slate-800">נושא</th>
                  <th className="p-2 w-44 border-l border-slate-800">קישור למאמר אחר </th>
                  <th className="p-2 w-24 border-l border-slate-800">סוג קשר</th>
                  <th className="p-2 w-16 text-center">פעולה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentVolume.articles.map((art, aIdx) => (
                  <React.Fragment key={art.id}>
                    <tr className="hover:bg-slate-50 group">
                      <td className="p-1.5 text-center font-bold text-black bg-slate-50/30">{art.autoId}</td>
                      <td className="p-1"><input value={art.authors[0]?.titlePrefix} onChange={e => updateArticleAuthor(activeVolume, aIdx, 0, 'titlePrefix', e.target.value)} className="w-full bg-transparent border-none text-black text-center" /></td>
                      <td className="p-1"><input value={art.authors[0]?.firstName} onChange={e => updateArticleAuthor(activeVolume, aIdx, 0, 'firstName', e.target.value)} className="w-full bg-transparent border-none text-black font-medium" /></td>
                      <td className="p-1"><input value={art.authors[0]?.lastName} onChange={e => updateArticleAuthor(activeVolume, aIdx, 0, 'lastName', e.target.value)} className="w-full bg-transparent border-none text-black font-medium" /></td>
                      <td className="p-1"><input value={art.authors[0]?.role} onChange={e => updateArticleAuthor(activeVolume, aIdx, 0, 'role', e.target.value)} className="w-full bg-transparent border-none text-black italic" /></td>
                      <td className="p-1"><input value={art.title} onChange={e => updateArticle(activeVolume, aIdx, 'title', e.target.value)} className="w-full bg-transparent border-none text-black font-bold" /></td>
                      <td className="p-1"><input value={art.page} onChange={e => updateArticle(activeVolume, aIdx, 'page', e.target.value)} className="w-full bg-transparent border-none text-black text-center" /></td>
                      <td className="p-1"><input value={art.generalTopic} onChange={e => updateArticle(activeVolume, aIdx, 'generalTopic', e.target.value)} className="w-full bg-transparent border-none text-black" /></td>
                      <td className="p-1">
                        <select
                          value={art.linkedArticleId}
                          onChange={e => updateArticle(activeVolume, aIdx, 'linkedArticleId', e.target.value)}
                          className="w-full bg-transparent border-none text-[10px] text-indigo-700 truncate"
                        >
                          <option value="">-- בחר מאמר לקישור --</option>
                          {allArticlesOptions.filter(opt => opt.id !== art.id).map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.display}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1">
                        <select value={art.linkType} onChange={e => updateArticle(activeVolume, aIdx, 'linkType', e.target.value)} className="w-full bg-transparent border-none text-[10px] text-indigo-600 font-bold">
                          <option value=""></option><option value="המשך">המשך</option><option value="תגובה">תגובה</option>
                        </select>
                      </td>
                      <td className="p-1">
                        <div className="flex justify-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => addAdditionalAuthor(activeVolume, aIdx)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><Users size={14} title="הוסף מחבר" /></button>
                          <button onClick={() => removeArticle(activeVolume, aIdx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} title="מחק מאמר" /></button>
                        </div>
                      </td>
                    </tr>
                    {art.additionalAuthors.map((author, addIdx) => (
                      <tr key={`${art.id}-add-${addIdx}`} className="bg-indigo-50/20 border-r-4 border-indigo-400">
                        <td className="p-1"></td>
                        <td className="p-1"><input value={author.titlePrefix} onChange={e => updateArticleAuthor(activeVolume, aIdx, addIdx + 1, 'titlePrefix', e.target.value)} className="w-full bg-transparent border-none text-black text-center" /></td>
                        <td className="p-1"><input value={author.firstName} onChange={e => updateArticleAuthor(activeVolume, aIdx, addIdx + 1, 'firstName', e.target.value)} className="w-full bg-transparent border-none text-indigo-700 font-bold" /></td>
                        <td className="p-1"><input value={author.lastName} onChange={e => updateArticleAuthor(activeVolume, aIdx, addIdx + 1, 'lastName', e.target.value)} className="w-full bg-transparent border-none text-indigo-700 font-bold" /></td>
                        <td colSpan="6" className="p-1 text-[10px] text-indigo-800 font-bold italic">מחבר שותף נוסף</td>
                        <td className="p-1 text-center"><button onClick={() => removeAdditionalAuthor(activeVolume, aIdx, addIdx)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button></td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }
      `}</style>
    </div>
  )
}