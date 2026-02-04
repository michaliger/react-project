import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Plus, Trash2, Users, FileText, Database, CheckCircle2, Link2, Upload, X, UserPlus, Info } from 'lucide-react'

const CompactField = ({ label, children, colSpan = 'col-span-1', required = false }) => (
  <div className={`flex flex-col gap-0.5 ${colSpan}`}>
    <label className="text-[11px] font-bold text-black mr-1 flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
)

export default function App() {
  const [currentPage, setCurrentPage] = useState('editor')
  const [isSaving, setIsSaving] = useState(false)
  const [dbArticles, setDbArticles] = useState([])
  const [activeVolume, setActiveVolume] = useState(0)
  const fileInputRef = useRef(null)
  const pdfInputRef = useRef(null)

  const [series, setSeries] = useState({
    prefixName: '', fileName: '', identifierName: '', details: '',
    editor: '', publicationPlace: '', sector: '',
    missingVolumesList: '', adminNotes: '', catalogStatus: 'טיוטה',
    enteredBy: '', coverPreview: null
  })

  const createEmptyVolume = (index) => ({
    id: Math.random().toString(36).substr(2, 9),
    volumeTitle: '', volumeNumber: (index + 1).toString(), booklet: '',
    mainTopic: '', publishedFor: '', publicationYear: '',
    publicationPeriod: '', coverType: '', volumeSize: '',
    fileCompleteness: '', scanCompleteness: '',
    articlesCatalogStatus: 'ממתין',
    pdfFileName: '',
    articles: [{
      id: Math.random().toString(36).substr(2, 9), autoId: 1,
      authors: [{ titlePrefix: '', firstName: '', lastName: '', role: '' }],
      page: '', title: '', generalTopic: '', source: '', linkedArticleId: '', linkType: ''
    }]
  })

  const [volumes, setVolumes] = useState([createEmptyVolume(0)])

  // חישוב שנות הוצאה אוטומטי
  const displayYears = useMemo(() => {
    const years = volumes.map(v => v.publicationYear).filter(y => y !== '');
    if (years.length === 0) return 'טרם הוזנו שנים';
    if (years.length === 1) return years[0];
    return `${years[0]} - ${years[years.length - 1]}`;
  }, [volumes]);

  useEffect(() => {
    fetch('http://localhost:5000/api/subtitle')
      .then(res => res.json())
      .then(result => {
        const articles = result?.data?.subtitles || result?.data || result || [];
        setDbArticles(Array.isArray(articles) ? articles : []);
      })
      .catch(err => console.error('Error fetching:', err));
  }, []);

  const addNewVolume = () => {
    const newIdx = volumes.length;
    setVolumes([...volumes, createEmptyVolume(newIdx)]);
    setActiveVolume(newIdx);
  }

  const removeVolume = (e, index) => {
    e.stopPropagation();
    if (volumes.length <= 1) return;
    const newVolumes = volumes.filter((_, i) => i !== index);
    setVolumes(newVolumes);
    setActiveVolume(Math.max(0, index - 1));
  }

  const addAuthorRow = (vIdx, aIdx) => {
    const nv = [...volumes];
    nv[vIdx].articles[aIdx].authors.push({ titlePrefix: '', firstName: '', lastName: '', role: '' });
    setVolumes(nv);
  }

  const updateAuthor = (vIdx, aIdx, authIdx, field, val) => {
    const nv = [...volumes];
    nv[vIdx].articles[aIdx].authors[authIdx][field] = val;
    setVolumes(nv);
  }

  const updateVolume = (field, val) => {
    const nv = [...volumes];
    nv[activeVolume][field] = val;
    setVolumes(nv);
  }

  const inputClass = "w-full p-1 border border-slate-200 rounded text-[12px] text-black outline-none focus:border-indigo-500 bg-white shadow-sm";
  const currentVolume = volumes[activeVolume];

  if (currentPage === 'home') return <div className="h-screen flex items-center justify-center bg-slate-50" dir="rtl"><div className="text-center p-10 bg-white rounded-2xl shadow-lg border"><CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" /><h1 className="text-xl font-bold">הנתונים נשמרו בהצלחה!</h1><button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg">חזרה</button></div></div>;

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-right overflow-hidden" dir="rtl">
      {/* Header */}
      <header className="h-12 bg-white border-b px-4 flex justify-between items-center shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-indigo-600" />
          <span className="font-black text-sm text-slate-800">מערכת קטלוג תורני מאוחדת</span>
        </div>
        <button onClick={() => { setIsSaving(true); setTimeout(() => setCurrentPage('home'), 800); }} className="px-6 py-1.5 bg-black text-white rounded text-xs font-bold hover:bg-slate-800 transition-colors">
          {isSaving ? 'שומר נתונים...' : 'שמירה סופית'}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden p-3 gap-3">
        {/* Sidebar */}
        <aside className="w-48 bg-white border rounded-xl flex flex-col shrink-0 shadow-sm overflow-hidden">
          <div className="p-2 border-b bg-slate-50">
            <button onClick={addNewVolume} className="w-full py-2 bg-indigo-600 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-indigo-700">
              <Plus size={14} /> הוסף גליון חדש
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            {volumes.map((v, i) => (
              <div key={v.id} onClick={() => setActiveVolume(i)} className={`group relative w-full text-right px-2 py-2.5 rounded text-[10px] font-bold cursor-pointer flex items-center justify-between transition-all ${activeVolume === i ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600 shadow-sm' : 'hover:bg-slate-50 text-slate-600'}`}>
                <div className="flex items-center gap-2 truncate"><FileText size={12} /> {v.volumeTitle || `גליון ${i + 1}`}</div>
                {volumes.length > 1 && <X size={12} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600" onClick={(e) => removeVolume(e, i)} />}
              </div>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
          
          {/* Section 1: Series Data */}
          <section className="bg-white p-3 rounded-xl border shadow-sm shrink-0">
            <h3 className="text-[10px] font-black text-indigo-600 mb-2 border-b pb-1 flex items-center gap-1"><Info size={12}/> נתוני סדרה כלליים</h3>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-10 grid grid-cols-5 gap-3">
                <CompactField label="שם מקדים"><select value={series.prefixName} onChange={e => setSeries({...series, prefixName: e.target.value})} className={inputClass}><option value=""></option><option>ספר זכרון</option><option>קובץ תורני</option><option>ירחון</option></select></CompactField>
                <CompactField label="שם הקובץ" colSpan="col-span-2"><input value={series.fileName} onChange={e => setSeries({...series, fileName: e.target.value})} className={`${inputClass} font-bold`} /></CompactField>
                <CompactField label="שם מזהה"><input value={series.identifierName} onChange={e => setSeries({...series, identifierName: e.target.value})} className={inputClass} /></CompactField>
                <CompactField label="שנות הוצאה (אוטומטי)"><input value={displayYears} readOnly className={`${inputClass} bg-slate-50 font-bold text-indigo-600 cursor-not-allowed`} /></CompactField>
                <CompactField label="עורך"><input value={series.editor} onChange={e => setSeries({...series, editor: e.target.value})} className={inputClass} /></CompactField>
                <CompactField label="מקום הוצאה"><input value={series.publicationPlace} onChange={e => setSeries({...series, publicationPlace: e.target.value})} className={inputClass} /></CompactField>
                <CompactField label="מגזר"><select value={series.sector} onChange={e => setSeries({...series, sector: e.target.value})} className={inputClass}><option value=""></option><option>ליטאי</option><option>חסידי</option><option>ספרדי</option></select></CompactField>
                <CompactField label="סטטוס קטלוג"><input value={series.catalogStatus} onChange={e => setSeries({...series, catalogStatus: e.target.value})} className={inputClass} /></CompactField>
                <CompactField label="הוזן ע״י"><input value={series.enteredBy} onChange={e => setSeries({...series, enteredBy: e.target.value})} className={inputClass} /></CompactField>
                <CompactField label="גליונות חסרים" colSpan="col-span-2"><input value={series.missingVolumesList} onChange={e => setSeries({...series, missingVolumesList: e.target.value})} className={inputClass} /></CompactField>
                <CompactField label="הערות מנהל" colSpan="col-span-2"><input value={series.adminNotes} onChange={e => setSeries({...series, adminNotes: e.target.value})} className={inputClass} /></CompactField>
                <CompactField label="פרטים נוספים"><input value={series.details} onChange={e => setSeries({...series, details: e.target.value})} className={inputClass} /></CompactField>
              </div>
              <div className="col-span-2 flex items-center justify-center border-r pr-3">
                <div onClick={() => fileInputRef.current.click()} className="h-28 w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all overflow-hidden">
                  {series.coverPreview ? <img src={series.coverPreview} className="h-full w-full object-contain" /> : <div className="text-center text-slate-400"><Upload size={20} className="mx-auto" /><span className="text-[9px] block mt-1">העלה כריכה</span></div>}
                  <input type="file" ref={fileInputRef} hidden onChange={(e) => setSeries({...series, coverPreview: URL.createObjectURL(e.target.files[0])})} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Volume Data */}
          <section className="bg-white p-3 rounded-xl border shadow-sm shrink-0 border-r-8 border-r-indigo-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">נתוני גליון פעיל</h3>
                <span className="bg-indigo-600 text-white text-[11px] px-3 py-0.5 rounded-full font-bold">גליון #{activeVolume + 1}</span>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-2">
              <CompactField label="שם גליון" colSpan="col-span-2"><input value={currentVolume.volumeTitle} onChange={e => updateVolume('volumeTitle', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="נושא ראשי" colSpan="col-span-2"><input value={currentVolume.mainTopic} onChange={e => updateVolume('mainTopic', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="יצא לרגל"><input value={currentVolume.publishedFor} onChange={e => updateVolume('publishedFor', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="שנה"><input value={currentVolume.publicationYear} onChange={e => updateVolume('publicationYear', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="תקופה"><input value={currentVolume.publicationPeriod} onChange={e => updateVolume('publicationPeriod', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="סטטוס קטלוג"><select value={currentVolume.articlesCatalogStatus} onChange={e => updateVolume('articlesCatalogStatus', e.target.value)} className={inputClass}><option>ממתין</option><option>בתהליך</option><option>הושלם</option></select></CompactField>
              <CompactField label="כריכה"><select value={currentVolume.coverType} onChange={e => updateVolume('coverType', e.target.value)} className={inputClass}><option value=""></option><option>קשה</option><option>רכה</option></select></CompactField>
              <CompactField label="גודל"><select value={currentVolume.volumeSize} onChange={e => updateVolume('volumeSize', e.target.value)} className={inputClass}><option value=""></option><option>גדול</option><option>בינוני</option><option>קטן</option></select></CompactField>
              <CompactField label="שלמות קובץ"><input value={currentVolume.fileCompleteness} onChange={e => updateVolume('fileCompleteness', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="שלמות סריקה"><input value={currentVolume.scanCompleteness} onChange={e => updateVolume('scanCompleteness', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="קובץ PDF" colSpan="col-span-2">
                <button onClick={() => pdfInputRef.current.click()} className="w-full p-1 border rounded text-[10px] bg-slate-50 font-bold flex items-center gap-2 truncate shadow-inner hover:bg-slate-100 transition-all"><Link2 size={12} className="text-indigo-600" /> {currentVolume.pdfFileName || 'צרף קובץ PDF'}</button>
                <input type="file" ref={pdfInputRef} hidden onChange={(e) => updateVolume('pdfFileName', e.target.files[0]?.name)} />
              </CompactField>
            </div>
          </section>

          {/* Section 3: Articles Table */}
          <section className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col mb-4">
            <div className="p-2.5 border-b bg-slate-900 flex justify-between items-center shrink-0">
              <h4 className="text-white text-[11px] font-bold flex items-center gap-2"><Users size={14} /> מאמרים בתוך הגליון</h4>
              <button onClick={() => {const nv=[...volumes]; nv[activeVolume].articles.push({id: Math.random(), autoId: nv[activeVolume].articles.length+1, authors:[{titlePrefix:'', firstName:'', lastName:'', role:''}], title:'', page:'', generalTopic:'', source:'', linkedArticleId:''}); setVolumes(nv)}} className="px-4 py-1.5 bg-indigo-500 text-white rounded text-[10px] font-bold hover:bg-indigo-400 transition-all shadow-md flex items-center gap-1">
                <Plus size={12} /> הוסף מאמר למערכת
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right text-[11px] table-fixed min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-700">
                    <th className="p-2 w-10 border-l text-center">#</th>
                    <th className="p-2 w-1/3 border-l">פרטי מחברים (ניתן להוסיף מחברים נוספים)</th>
                    <th className="p-2 border-l">שם המאמר</th>
                    <th className="p-2 w-28 border-l">נושא/מקור</th>
                    <th className="p-2 w-12 border-l text-center">עמ'</th>
                    <th className="p-2 w-48 border-l bg-indigo-50/50">קישור למאמר קיים (DB)</th>
                    <th className="p-2 w-20 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentVolume.articles.map((art, aIdx) => (
                    <tr key={art.id} className="align-top hover:bg-slate-50/30 transition-colors">
                      <td className="p-2 text-center font-bold text-slate-400">{art.autoId}</td>
                      <td className="p-1 border-l space-y-1">
                        {art.authors.map((auth, authIdx) => (
                          <div key={authIdx} className="flex gap-1 items-center animate-in fade-in duration-300">
                            <input placeholder="תואר" value={auth.titlePrefix} onChange={e => updateAuthor(activeVolume, aIdx, authIdx, 'titlePrefix', e.target.value)} className="w-14 border rounded p-1 text-[10px]" />
                            <input placeholder="שם פרטי" value={auth.firstName} onChange={e => updateAuthor(activeVolume, aIdx, authIdx, 'firstName', e.target.value)} className="flex-1 border rounded p-1 text-[10px]" />
                            <input placeholder="משפחה" value={auth.lastName} onChange={e => updateAuthor(activeVolume, aIdx, authIdx, 'lastName', e.target.value)} className="flex-1 border rounded p-1 text-[10px] font-bold" />
                            <input placeholder="תפקיד" value={auth.role} onChange={e => updateAuthor(activeVolume, aIdx, authIdx, 'role', e.target.value)} className="flex-1 border rounded p-1 text-[10px] text-indigo-700 bg-indigo-50/30" />
                            {authIdx > 0 && <button onClick={() => {const nv=[...volumes]; nv[activeVolume].articles[aIdx].authors.splice(authIdx, 1); setVolumes(nv)}} className="text-red-400 hover:text-red-600 px-1 font-bold">×</button>}
                          </div>
                        ))}
                      </td>
                      <td className="p-1 border-l">
                        <textarea value={art.title} rows="2" className="w-full border-none bg-transparent font-bold resize-none outline-none text-[11px] leading-tight" placeholder="הקלד כותרת מאמר..." onChange={e => {const nv=[...volumes]; nv[activeVolume].articles[aIdx].title=e.target.value; setVolumes(nv)}} />
                      </td>
                      <td className="p-1 border-l flex flex-col gap-1">
                        <input placeholder="נושא כללי" value={art.generalTopic} className="w-full border rounded p-1 text-[10px]" onChange={e => {const nv=[...volumes]; nv[activeVolume].articles[aIdx].generalTopic=e.target.value; setVolumes(nv)}} />
                        <input placeholder="מקור" value={art.source} className="w-full border rounded p-1 text-[10px]" onChange={e => {const nv=[...volumes]; nv[activeVolume].articles[aIdx].source=e.target.value; setVolumes(nv)}} />
                      </td>
                      <td className="p-1 border-l text-center"><input value={art.page} className="w-full text-center bg-transparent border-none outline-none font-medium" onChange={e => {const nv=[...volumes]; nv[activeVolume].articles[aIdx].page=e.target.value; setVolumes(nv)}} /></td>
                      <td className="p-1 border-l bg-indigo-50/20">
                        <select className="w-full bg-white border border-indigo-100 rounded text-[10px] p-1 font-medium text-indigo-800 focus:ring-1 focus:ring-indigo-400">
                          <option value="">בחר מאמר לקישור...</option>
                          {dbArticles.map(opt => <option key={opt._id}>{opt.subtitleTitle || opt.contentTitle}</option>)}
                        </select>
                      </td>
                      <td className="p-1 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button title="הוסף מחבר נוסף למאמר" onClick={() => addAuthorRow(activeVolume, aIdx)} className="text-indigo-600 hover:bg-indigo-100 p-1.5 rounded-full transition-colors"><UserPlus size={15} /></button>
                          <button title="מחק מאמר" onClick={() => {const nv=[...volumes]; nv[activeVolume].articles.splice(aIdx, 1); nv[activeVolume].articles.forEach((a,i)=>a.autoId=i+1); setVolumes(nv)}} className="text-red-400 hover:bg-red-50 p-1.5 rounded-full transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }`}</style>
    </div>
  )
}