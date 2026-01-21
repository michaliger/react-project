import React, { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Users, Save, X, Upload, FileText, Layout, BookOpen, ChevronLeft, Info, Search, Database, AlertCircle, Home, CheckCircle2 } from 'lucide-react'

// רכיב שדה חסכוני - תופס מינימום מקום גובה
const CompactField = ({ label, children, colSpan = 'col-span-1', required = false, error = false }) => (
  <div className={`flex flex-col gap-0.5 ${colSpan}`}>
    <label className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <span className="text-[9px] text-red-500 font-bold mr-1">חובה</span>}
  </div>
)

export default function App() {
  const [currentPage, setCurrentPage] = useState('editor') // 'home' or 'editor'
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' })
  const [errors, setErrors] = useState({})
  
  const fileInputRef = useRef(null)
  const pdfInputRef = useRef(null)
  const [activeVolume, setActiveVolume] = useState(0)
  
  // נתוני סדרה - כולל ID לטיפול בעדכון מול יצירה
  const [series, setSeries] = useState({
    id: null, 
    prefixName: '', 
    fileName: '', 
    identifierName: '', 
    details: '',
    editor: '', 
    publicationPlace: '', 
    publicationYears: [],
    sector: '', 
    missingVolumesList: '', 
    userNotes: '', 
    adminNotes: '',
    fileDescription: '', 
    coverImage: null, 
    coverPreview: null,
    createdBy: "691f8b89e60ae71b1932aab0",
    enteredBy: '', 
    catalogStatus: 'טיוטה'
  })

  const createEmptyVolume = (index) => ({
    id: Math.random().toString(36).substr(2, 9),
    volumeTitle: '', 
    volumeNumber: (index + 1).toString(),
    booklet: '', 
    showOptionalFields: false,
    mainTopic: '', 
    publishedFor: '', 
    publicationYear: '',
    StartYear: '', 
    publicationPeriod: '', 
    coverType: '', 
    volumeSize: '',
    articlesCount: 0, 
    fileCompleteness: '', 
    scanCompleteness: '',
    articlesCatalogStatus: '', 
    articlesTopicsSourcesStatus: '',
    pdfFile: null, 
    pdfFileName: '',
    articles: [{
      id: Math.random().toString(36).substr(2, 9),
      autoId: 1,
      authors: [{ titlePrefix: '', firstName: '', lastName: '', role: '' }],
      additionalAuthors: [],
      page: '', 
      title: '', 
      generalTopic: '', 
      source: '', 
      linkedArticleId: '', 
      linkType: ''
    }]
  })

  const [volumes, setVolumes] = useState([createEmptyVolume(0)])

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

  const removeVolume = (idx) => {
    if (volumes.length <= 1) return
    const newVolumes = volumes.filter((_, i) => i !== idx)
    setVolumes(newVolumes)
    setActiveVolume(Math.max(0, idx - 1))
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
      id: Math.random().toString(36).substr(2, 9),
      autoId: newVolumes[vIdx].articles.length + 1,
      authors: [{ titlePrefix: '', firstName: '', lastName: '', role: '' }],
      additionalAuthors: [],
      page: '', title: '', generalTopic: '', source: '', linkedArticleId: '', linkType: ''
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
    newVolumes[vIdx].articles[aIdx].additionalAuthors.push({
      titlePrefix: '', firstName: '', lastName: '', role: ''
    })
    setVolumes(newVolumes)
  }

  const removeAdditionalAuthor = (vIdx, aIdx, addIdx) => {
    const newVolumes = [...volumes]
    newVolumes[vIdx].articles[aIdx].additionalAuthors.splice(addIdx, 1)
    setVolumes(newVolumes)
  }

  // לוגיקת שמירה סופית עם מעבר לדף הבית
  const handleFinalSave = async () => {
    const newErrors = {}
    if (!series.fileName) newErrors.fileName = true
    if (!series.prefixName) newErrors.prefixName = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSaveMessage({ text: 'נא למלא שדות חובה', type: 'error' })
      return
    }

    setIsSaving(true)
    setSaveMessage({ text: 'שומר בבסיס הנתונים...', type: 'info' })

    try {
      // כאן תתבצע הקריאה ל-API
      console.log("Saving full dataset:", { series, volumes })
      
      // הדמיית שמירה
      await new Promise(resolve => setTimeout(resolve, 1500))

      // לאחר הצלחה - עדכון מזהה (כדי שבפעם הבאה נדע שזה כבר קיים אם המשתמש יחזור)
      if (!series.id) setSeries(prev => ({ ...prev, id: 'saved_id_123' }))
      
      setSaveMessage({ text: 'נשמר בהצלחה! עובר לדף הבית...', type: 'success' })

      // מעבר אוטומטי לדף הבית
      setTimeout(() => {
        setCurrentPage('home')
      }, 1500)

    } catch (error) {
      setIsSaving(false)
      setSaveMessage({ text: 'שגיאה: ' + error.message, type: 'error' })
    }
  }

  const inputClass = (error) => `w-full p-1.5 bg-white border ${error ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:ring-indigo-100'} rounded text-sm focus:ring-1 outline-none transition-all placeholder:text-slate-300`

  // תצוגת דף הבית
  if (currentPage === 'home') {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center font-sans text-right" dir="rtl">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-200 text-center space-y-6 max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-800">הנתונים נשמרו בהצלחה!</h1>
            <p className="text-slate-500 text-sm italic">הסדרה "{series.fileName}" עודכנה במערכת.</p>
          </div>
          <button 
            onClick={() => {
              setSeries({ id: null, prefixName: '', fileName: '', identifierName: '', details: '', editor: '', publicationPlace: '', publicationYears: [], sector: '', missingVolumesList: '', userNotes: '', adminNotes: '', fileDescription: '', coverImage: null, coverPreview: null, createdBy: "691f8b89e60ae71b1932aab0", enteredBy: '', catalogStatus: 'טיוטה' })
              setVolumes([createEmptyVolume(0)])
              setActiveVolume(0)
              setCurrentPage('editor')
            }}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} /> הוספת סדרה חדשה
          </button>
        </div>
      </div>
    )
  }

  const currentVolume = volumes[activeVolume] || { articles: [] }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-right text-slate-900 overflow-hidden" dir="rtl">
      
      {/* Sidebar - ניהול גליונות */}
      <aside className="w-52 bg-white border-l border-slate-200 flex flex-col z-20 shadow-sm">
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <button 
            onClick={addVolume}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Plus size={14} /> הוסף גליון
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {volumes.map((v, i) => (
            <div key={v.id} className="group relative">
              <button 
                onClick={() => setActiveVolume(i)} 
                className={`w-full text-right px-3 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-between ${
                  activeVolume === i 
                  ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600 shadow-inner' 
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText size={14} className={activeVolume === i ? 'text-indigo-600' : 'text-slate-300'} />
                  <span className="truncate">{v.volumeTitle || `גליון ${i + 1}`}</span>
                </div>
              </button>
              {volumes.length > 1 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); removeVolume(i); }}
                  className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-11 bg-white border-b border-slate-200 px-4 flex justify-between items-center shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-indigo-600" />
            <h1 className="text-sm font-black text-slate-800 tracking-tight">מערכת קטלוג תורני</h1>
            {saveMessage.text && (
               <div className={`mr-4 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 animate-pulse ${
                 saveMessage.type === 'error' ? 'bg-red-100 text-red-600' : 
                 saveMessage.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
               }`}>
                 {saveMessage.type === 'error' && <AlertCircle size={12} />}
                 {saveMessage.text}
                 <button onClick={() => setSaveMessage({text:'', type:''})} className="hover:scale-110"><X size={10} /></button>
               </div>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleFinalSave}
              disabled={isSaving}
              className={`px-5 py-1 bg-slate-900 text-white rounded text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 shadow-md transition-all active:scale-95 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save size={14} /> {isSaving ? 'שומר...' : 'שמירה סופית'}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          
          {/* Section 1: Series Data */}
          <section className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1 border-b pb-1 border-indigo-50">
              <Layout size={12} /> נתוני סדרה כלליים
            </h3>
            
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 lg:col-span-10 grid grid-cols-2 md:grid-cols-6 gap-x-3 gap-y-2">
                <CompactField label="שם מקדים" required error={errors.prefixName}>
                  <select value={series.prefixName} onChange={e => updateSeries('prefixName', e.target.value)} className={inputClass(errors.prefixName)}>
                    <option value=""></option>
                    <option value="ספר זכרון">ספר זכרון</option>
                    <option value="קובץ תורני">קובץ תורני</option>
                    <option value="ירחון">ירחון</option>
                  </select>
                </CompactField>
                <CompactField label="שם הקובץ" required colSpan="md:col-span-2" error={errors.fileName}>
                  <input value={series.fileName} onChange={e => updateSeries('fileName', e.target.value)} className={`${inputClass(errors.fileName)} font-bold border-indigo-100`} />
                </CompactField>
                <CompactField label="שם מזהה">
                  <input value={series.identifierName} onChange={e => updateSeries('identifierName', e.target.value)} className={inputClass()} placeholder="לכפילויות..." />
                </CompactField>
                <CompactField label="עורך">
                  <input value={series.editor} onChange={e => updateSeries('editor', e.target.value)} className={inputClass()} />
                </CompactField>
                <CompactField label="מגזר">
                  <select value={series.sector} onChange={e => updateSeries('sector', e.target.value)} className={inputClass()}>
                    <option value=""></option>
                    <option value="לטאי">לטאי</option>
                    <option value="חסידי">חסידי</option>
                    <option value="ספרדי">ספרדי</option>
                  </select>
                </CompactField>

                <CompactField label="מקום הוצאה" colSpan="md:col-span-2">
                  <input value={series.publicationPlace} onChange={e => updateSeries('publicationPlace', e.target.value)} className={inputClass()} />
                </CompactField>
                <CompactField label="פרטים נוספים" colSpan="md:col-span-2">
                  <input value={series.details} onChange={e => updateSeries('details', e.target.value)} className={inputClass()} />
                </CompactField>
                <CompactField label="סטטוס קטלוג">
                  <input value={series.catalogStatus} onChange={e => updateSeries('catalogStatus', e.target.value)} className={inputClass()} />
                </CompactField>
                <CompactField label={"הוזן ע" + "י"}>
                  <input value={series.enteredBy} onChange={e => updateSeries('enteredBy', e.target.value)} className={inputClass()} />
                </CompactField>

                <CompactField label="גליונות חסרים" colSpan="md:col-span-3">
                  <input value={series.missingVolumesList} onChange={e => updateSeries('missingVolumesList', e.target.value)} className={inputClass()} />
                </CompactField>
                <CompactField label="הערות מנהל" colSpan="md:col-span-3">
                  <input value={series.adminNotes} onChange={e => updateSeries('adminNotes', e.target.value)} className={inputClass()} />
                </CompactField>
              </div>

              {/* Cover Upload */}
              <div className="col-span-12 lg:col-span-2">
                <div 
                  onClick={() => fileInputRef.current.click()} 
                  className="w-full h-full min-h-[110px] border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all overflow-hidden bg-slate-50/30"
                >
                  {series.coverPreview ? (
                    <img src={series.coverPreview} alt="Preview" className="h-full w-full object-contain p-1" />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center gap-1">
                      <Upload size={16} />
                      <span className="text-[9px] font-bold">העלאת כריכה</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} accept="image/*" />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Active Volume */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                <div className="w-1.5 h-3.5 bg-indigo-600 rounded-full"></div>
                נתוני {currentVolume.volumeTitle || `גליון ${activeVolume + 1}`}
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => pdfInputRef.current.click()} 
                  className={`px-2 py-1 border rounded text-[10px] font-bold flex items-center gap-1 transition-all ${currentVolume.pdfFileName ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}
                >
                  <FileText size={12} /> {currentVolume.pdfFileName ? 'קובץ PDF צמוד' : 'צרף PDF'}
                </button>
                <input type="file" ref={pdfInputRef} hidden onChange={handlePdfUpload} accept=".pdf" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-8 gap-x-2 gap-y-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100 shadow-inner">
              <CompactField label="שם גליון" colSpan="md:col-span-2">
                <input value={currentVolume.volumeTitle} onChange={e => updateVolumeField(activeVolume, 'volumeTitle', e.target.value)} className={inputClass()} />
              </CompactField>
              <CompactField label="נושא ראשי" colSpan="md:col-span-2">
                <input value={currentVolume.mainTopic} onChange={e => updateVolumeField(activeVolume, 'mainTopic', e.target.value)} className={inputClass()} />
              </CompactField>
              <CompactField label="יצא לרגל" colSpan="md:col-span-2">
                <input value={currentVolume.publishedFor} onChange={e => updateVolumeField(activeVolume, 'publishedFor', e.target.value)} className={inputClass()} />
              </CompactField>
              <CompactField label="שנה">
                <input value={currentVolume.publicationYear} onChange={e => updateVolumeField(activeVolume, 'publicationYear', e.target.value)} className={inputClass()} />
              </CompactField>
              <CompactField label="תקופה">
                <input value={currentVolume.publicationPeriod} onChange={e => updateVolumeField(activeVolume, 'publicationPeriod', e.target.value)} className={inputClass()} />
              </CompactField>

              <CompactField label="סוג כריכה">
                <select value={currentVolume.coverType} onChange={e => updateVolumeField(activeVolume, 'coverType', e.target.value)} className={inputClass()}>
                  <option value=""></option>
                  <option value="קשה">קשה</option>
                  <option value="רכה">רכה</option>
                </select>
              </CompactField>
              <CompactField label="גודל">
                <select value={currentVolume.volumeSize} onChange={e => updateVolumeField(activeVolume, 'volumeSize', e.target.value)} className={inputClass()}>
                  <option value=""></option>
                  <option value="גדול">גדול</option>
                  <option value="בינוני">בינוני</option>
                  <option value="קטן">קטן</option>
                </select>
              </CompactField>
              <CompactField label="שלמות קובץ">
                <input value={currentVolume.fileCompleteness} onChange={e => updateVolumeField(activeVolume, 'fileCompleteness', e.target.value)} className={inputClass()} />
              </CompactField>
              <CompactField label="שלמות סריקה">
                <input value={currentVolume.scanCompleteness} onChange={e => updateVolumeField(activeVolume, 'scanCompleteness', e.target.value)} className={inputClass()} />
              </CompactField>
              <CompactField label="סטטוס מאמרים" colSpan="md:col-span-2">
                <input value={currentVolume.articlesCatalogStatus} onChange={e => updateVolumeField(activeVolume, 'articlesCatalogStatus', e.target.value)} className={inputClass()} />
              </CompactField>
              <CompactField label="סטטוס מקורות" colSpan="md:col-span-2">
                <input value={currentVolume.articlesTopicsSourcesStatus} onChange={e => updateVolumeField(activeVolume, 'articlesTopicsSourcesStatus', e.target.value)} className={inputClass()} />
              </CompactField>
            </div>
          </section>

          {/* Section 3: Articles Table */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-2 mb-2">
               <h4 className="font-black text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                 <Users size={12} /> רשימת מאמרים ({currentVolume.articles.length})
               </h4>
               <button onClick={() => addArticle(activeVolume)} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold hover:bg-indigo-100 flex items-center gap-1 transition-all">
                  <Plus size={12} /> הוסף מאמר
               </button>
            </div>
            
            <div className="overflow-x-auto border border-slate-100 rounded-lg shadow-sm">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-1.5 w-8 text-center border-l border-slate-700">#</th>
                    <th className="p-1.5 w-12 border-l border-slate-700 text-slate-400">תואר</th>
                    <th className="p-1.5 w-24 border-l border-slate-700">שם פרטי</th>
                    <th className="p-1.5 w-24 border-l border-slate-700">משפחה</th>
                    <th className="p-1.5 w-20 border-l border-slate-700 text-slate-400 italic">תפקיד</th>
                    <th className="p-1.5 border-l border-slate-700">שם המאמר</th>
                    <th className="p-1.5 w-10 border-l border-slate-700">עמ'</th>
                    <th className="p-1.5 w-24 border-l border-slate-700">נושא</th>
                    <th className="p-1.5 w-16 border-l border-slate-700">קשר</th>
                    <th className="p-1.5 w-14 text-center">פעולה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentVolume.articles.map((art, aIdx) => (
                    <tr key={art.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-1 text-center font-bold text-slate-400 bg-slate-50/50">{art.autoId}</td>
                      <td className="p-0.5"><input value={art.authors[0]?.titlePrefix} onChange={e => updateArticleAuthor(activeVolume, aIdx, 0, 'titlePrefix', e.target.value)} className="w-full p-1 border-none bg-transparent outline-none text-center focus:bg-white" /></td>
                      <td className="p-0.5"><input value={art.authors[0]?.firstName} onChange={e => updateArticleAuthor(activeVolume, aIdx, 0, 'firstName', e.target.value)} className="w-full p-1 border-none bg-transparent outline-none font-medium focus:bg-white" /></td>
                      <td className="p-0.5"><input value={art.authors[0]?.lastName} onChange={e => updateArticleAuthor(activeVolume, aIdx, 0, 'lastName', e.target.value)} className="w-full p-1 border-none bg-transparent outline-none font-medium focus:bg-white" /></td>
                      <td className="p-0.5"><input value={art.authors[0]?.role} onChange={e => updateArticleAuthor(activeVolume, aIdx, 0, 'role', e.target.value)} className="w-full p-1 border-none bg-transparent outline-none text-slate-500 italic focus:bg-white" /></td>
                      <td className="p-0.5"><input value={art.title} onChange={e => updateArticle(activeVolume, aIdx, 'title', e.target.value)} className="w-full p-1 border-none bg-transparent outline-none font-bold focus:bg-white" placeholder="..." /></td>
                      <td className="p-0.5"><input value={art.page} onChange={e => updateArticle(activeVolume, aIdx, 'page', e.target.value)} className="w-full p-1 border-none bg-transparent outline-none text-center focus:bg-white" /></td>
                      <td className="p-0.5"><input value={art.generalTopic} onChange={e => updateArticle(activeVolume, aIdx, 'generalTopic', e.target.value)} className="w-full p-1 border-none bg-transparent outline-none focus:bg-white" /></td>
                      <td className="p-0.5">
                        <select value={art.linkType} onChange={e => updateArticle(activeVolume, aIdx, 'linkType', e.target.value)} className="w-full p-1 border-none bg-transparent outline-none text-[10px] font-bold text-indigo-600">
                          <option value=""></option>
                          <option value="המשך">המשך</option>
                          <option value="תגובה">תגובה</option>
                          <option value="ביקורת">ביקורת</option>
                        </select>
                      </td>
                      <td className="p-1 text-center">
                        <div className="flex justify-center gap-0.5 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => addAdditionalAuthor(activeVolume, aIdx)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="מחבר נוסף"><Users size={12} /></button>
                          <button onClick={() => removeArticle(activeVolume, aIdx)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="מחק מאמר"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  )
}