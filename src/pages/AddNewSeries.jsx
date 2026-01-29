import React, { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Users, Save, FileText, Database, Upload } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'

const CompactField = ({ label, children, colSpan = 'col-span-1', required = false }) => (
  <div className={`flex flex-col gap-0.5 ${colSpan}`}>
    <label className="text-[11px] font-bold text-black mr-1 flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
)

export default function App() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');
  const target = searchParams.get('target');

  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' })
  const [dbArticles, setDbArticles] = useState([])
  const [activeVolume, setActiveVolume] = useState(0)

  const fileInputRef = useRef(null)
  const pdfInputRef = useRef(null)

  const [series, setSeries] = useState({
    id: null, prefixName: '', fileName: '', identifierName: '', details: '',
    editor: '', publicationPlace: '', publicationYears: [], sector: '',
    missingVolumesList: '', userNotes: '', adminNotes: '', fileDescription: '',
    coverImage: null, coverPreview: null, enteredBy: '', catalogStatus: 'טיוטה'
  })

  const createEmptyVolume = (index) => ({
    id: Math.random().toString(36).substr(2, 9),
    volumeTitle: '', volumeNumber: (index + 1).toString(), booklet: '',
    showOptionalFields: false, mainTopic: '', publishedFor: '', publicationYear: '',
    publicationPeriod: '', coverType: '', volumeSize: '',
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

  // טעינת נתונים לעריכה
  useEffect(() => {
    if (editId) {
      fetch(`http://localhost:5000/api/series/id/${editId}`)
        .then(res => res.json())
        .then(result => {
          if (result.status === 'success') {
            const s = result.data.series;
            setSeries({
              ...s,
              coverPreview: s.coverImage ? `http://localhost:5000/${s.coverImage.replace(/\\/g, '/')}` : null
            });
            
            if (s.volumes && s.volumes.length > 0) {
              setVolumes(s.volumes.map((v, vIdx) => ({
                ...v,
                id: v._id || Math.random().toString(36).substr(2, 9),
                volumeTitle: v.title || '',
                pdfFileName: v.pdfPath ? 'קובץ קיים' : '',
                articles: v.articles.map((art, aIdx) => ({
                  ...art,
                  id: art._id || Math.random().toString(36).substr(2, 9),
                  autoId: aIdx + 1,
                  title: art.contentTitle,
                  page: art.startPage,
                  authors: art.authors && art.authors.length > 0 ? [art.authors[0]] : [{ titlePrefix: '', firstName: '', lastName: '', role: '' }],
                  additionalAuthors: art.authors ? art.authors.slice(1) : []
                }))
              })));
            }
          }
        }).catch(err => console.error("Error loading series:", err));
    }
  }, [editId]);

  const updateSeries = (field, value) => setSeries(prev => ({ ...prev, [field]: value }))
  
  const updateVolumeField = (vIdx, field, value) => {
    const newVolumes = [...volumes]
    newVolumes[vIdx][field] = value
    setVolumes(newVolumes)
  }

  const handleFinalSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      const seriesData = {
        ...series,
        volumes: volumes.map(v => ({
          ...v,
          title: v.volumeTitle,
          articles: v.articles.filter(art => art.title?.trim() !== '').map((art, aIdx) => ({
            ...art,
            contentTitle: art.title,
            startPage: parseInt(art.page) || 0,
            authors: [...art.authors, ...art.additionalAuthors]
          }))
        }))
      };

      delete seriesData.coverImage;
      delete seriesData.coverPreview;

      formData.append('seriesData', JSON.stringify(seriesData));
      if (series.coverImage instanceof File) formData.append('coverImage', series.coverImage);
      volumes.forEach((v, i) => { if (v.pdfFile) formData.append(`pdf_vol_${i}`, v.pdfFile); });

      const url = editId ? `http://localhost:5000/api/series/id/${editId}` : 'http://localhost:5000/api/series';
      const method = editId ? 'PATCH' : 'POST';

      const response = await fetch(url, { method, body: formData });
      const result = await response.json();
      if (result.status === 'success') {
        setSaveMessage({ text: 'נשמר בהצלחה!', type: 'success' });
        setTimeout(() => navigate('/'), 1500);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setSaveMessage({ text: 'שגיאה: ' + error.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = () => `w-full p-1.5 bg-white border border-slate-200 rounded text-sm text-black outline-none focus:ring-1 focus:ring-indigo-100 transition-all`;

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-right text-black overflow-hidden" dir="rtl">
      <header className="h-11 bg-white border-b border-slate-200 px-4 flex justify-between items-center shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-indigo-600" />
          <h1 className="text-sm font-black">{editId ? `עריכה: ${series.fileName}` : 'מערכת קטלוג תורני'}</h1>
          {saveMessage.text && <span className={`mr-4 px-2 py-0.5 rounded text-[10px] font-bold ${saveMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{saveMessage.text}</span>}
        </div>
        <button onClick={handleFinalSave} disabled={isSaving} className="px-5 py-1 bg-black text-white rounded text-xs font-bold flex items-center gap-1.5">
          <Save size={14} /> {isSaving ? 'שומר...' : 'שמירה סופית'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {(!target) && (
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
                <div onClick={() => fileInputRef.current.click()} className="h-full min-h-[110px] border border-dashed border-slate-300 rounded flex items-center justify-center cursor-pointer bg-slate-50 overflow-hidden relative">
                  {series.coverPreview ? <img src={series.coverPreview} className="h-full w-full object-contain" alt="" /> : <Upload size={20} className="text-slate-300" />}
                  <input type="file" ref={fileInputRef} hidden onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setSeries(prev => ({ ...prev, coverImage: file, coverPreview: URL.createObjectURL(file) }));
                  }} accept="image/*" />
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="flex gap-3 items-start">
          {target !== 'article' && (
            <aside className="w-44 bg-white border border-slate-200 rounded-xl flex flex-col shrink-0 shadow-sm overflow-hidden">
              <div className="p-1.5 bg-slate-50 border-b border-slate-200">
                <button onClick={() => { setVolumes([...volumes, createEmptyVolume(volumes.length)]); setActiveVolume(volumes.length); }} className="w-full py-1 bg-indigo-600 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1"><Plus size={12} /> הוסף גליון</button>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
                {volumes.map((v, i) => (
                  <button key={v.id} onClick={() => setActiveVolume(i)} className={`w-full text-right px-2 py-1.5 rounded text-[10px] font-bold truncate flex items-center gap-2 ${activeVolume === i ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600' : 'text-black hover:bg-slate-50'}`}><FileText size={12} /> {v.volumeTitle || `גליון ${i + 1}`}</button>
                ))}
              </div>
            </aside>
          )}

          <div className="flex-1 space-y-3">
            <section className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-[10px] font-black text-black mb-2">נתוני גליון פעיל</h3>
              <div className="grid grid-cols-8 gap-x-2 gap-y-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                <CompactField label="שם גליון" colSpan="col-span-2"><input value={volumes[activeVolume]?.volumeTitle} onChange={e => updateVolumeField(activeVolume, 'volumeTitle', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="נושא ראשי" colSpan="col-span-2"><input value={volumes[activeVolume]?.mainTopic} onChange={e => updateVolumeField(activeVolume, 'mainTopic', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="יצא לרגל" colSpan="col-span-2"><input value={volumes[activeVolume]?.publishedFor} onChange={e => updateVolumeField(activeVolume, 'publishedFor', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="שנה"><input value={volumes[activeVolume]?.publicationYear} onChange={e => updateVolumeField(activeVolume, 'publicationYear', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="תקופה"><input value={volumes[activeVolume]?.publicationPeriod} onChange={e => updateVolumeField(activeVolume, 'publicationPeriod', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="כריכה"><select value={volumes[activeVolume]?.coverType} onChange={e => updateVolumeField(activeVolume, 'coverType', e.target.value)} className={inputClass()}><option></option><option>קשה</option><option>רכה</option></select></CompactField>
                <CompactField label="גודל"><select value={volumes[activeVolume]?.volumeSize} onChange={e => updateVolumeField(activeVolume, 'volumeSize', e.target.value)} className={inputClass()}><option></option><option>גדול</option><option>בינוני</option><option>קטן</option></select></CompactField>
                <CompactField label="שלמות קובץ"><input value={volumes[activeVolume]?.fileCompleteness} onChange={e => updateVolumeField(activeVolume, 'fileCompleteness', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="שלמות סריקה"><input value={volumes[activeVolume]?.scanCompleteness} onChange={e => updateVolumeField(activeVolume, 'scanCompleteness', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="סטטוס מאמרים" colSpan="col-span-2"><input value={volumes[activeVolume]?.articlesCatalogStatus} onChange={e => updateVolumeField(activeVolume, 'articlesCatalogStatus', e.target.value)} className={inputClass()} /></CompactField>
                <CompactField label="PDF" colSpan="col-span-2">
                  <button onClick={() => pdfInputRef.current.click()} className="w-full p-1.5 border rounded text-[10px] bg-white font-bold text-black truncate flex items-center gap-1"><FileText size={12} /> {volumes[activeVolume]?.pdfFileName || 'צרף PDF'}</button>
                  <input type="file" ref={pdfInputRef} hidden onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const newVols = [...volumes];
                      newVols[activeVolume].pdfFile = file;
                      newVols[activeVolume].pdfFileName = file.name;
                      setVolumes(newVols);
                    }
                  }} accept=".pdf" />
                </CompactField>
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 w-full">
              <div className="flex items-center justify-between mb-2 px-1">
                <h4 className="font-black text-black text-[11px] flex items-center gap-1"><Users size={14} /> רשימת מאמרים ({volumes[activeVolume]?.articles.length})</h4>
                <button onClick={() => {
                  const newVols = [...volumes];
                  newVols[activeVolume].articles.push({
                    id: Math.random().toString(36).substr(2, 9), autoId: newVols[activeVolume].articles.length + 1,
                    authors: [{ titlePrefix: '', firstName: '', lastName: '', role: '' }],
                    additionalAuthors: [], page: '', title: '', generalTopic: '', source: '', linkedArticleId: '', linkType: ''
                  });
                  setVolumes(newVols);
                }} className="px-3 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-700 transition-all"><Plus size={12} /> הוסף מאמר למערכת</button>
              </div>

              <div className="w-full overflow-x-auto border border-slate-100 rounded-lg">
                <table className="w-full text-right text-[11px] table-fixed min-w-[1100px]">
                  <thead>
                    <tr className="bg-black text-white font-bold">
                      <th className="p-2 w-8 text-center border-l border-slate-800">#</th>
                      <th className="p-2 w-14 border-l border-slate-800">תואר</th>
                      <th className="p-2 w-24 border-l border-slate-800">שם פרטי</th>
                      <th className="p-2 w-24 border-l border-slate-800">משפחה</th>
                      <th className="p-2 w-24 border-l border-slate-800">תפקיד</th>
                      <th className="p-2 border-l border-slate-800">שם המאמר</th>
                      <th className="p-2 w-10 border-l border-slate-800 text-center">עמ'</th>
                      <th className="p-2 w-32 border-l border-slate-800">נושא</th>
                      <th className="p-2 w-16 text-center">פעולה</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {volumes[activeVolume]?.articles.map((art, aIdx) => (
                      <tr key={art.id} className="hover:bg-slate-50 group">
                        <td className="p-1.5 text-center font-bold text-black bg-slate-50/30">{aIdx + 1}</td>
                        <td className="p-1"><input value={art.authors[0]?.titlePrefix} onChange={e => {
                          const newVols = [...volumes];
                          newVols[activeVolume].articles[aIdx].authors[0].titlePrefix = e.target.value;
                          setVolumes(newVols);
                        }} className="w-full bg-transparent border-none text-center outline-none" /></td>
                        <td className="p-1"><input value={art.authors[0]?.firstName} onChange={e => {
                          const newVols = [...volumes];
                          newVols[activeVolume].articles[aIdx].authors[0].firstName = e.target.value;
                          setVolumes(newVols);
                        }} className="w-full bg-transparent border-none outline-none" /></td>
                        <td className="p-1"><input value={art.authors[0]?.lastName} onChange={e => {
                          const newVols = [...volumes];
                          newVols[activeVolume].articles[aIdx].authors[0].lastName = e.target.value;
                          setVolumes(newVols);
                        }} className="w-full bg-transparent border-none outline-none" /></td>
                        <td className="p-1"><input value={art.authors[0]?.role} onChange={e => {
                          const newVols = [...volumes];
                          newVols[activeVolume].articles[aIdx].authors[0].role = e.target.value;
                          setVolumes(newVols);
                        }} className="w-full bg-transparent border-none italic outline-none" /></td>
                        <td className="p-1"><input value={art.title} onChange={e => {
                          const newVols = [...volumes];
                          newVols[activeVolume].articles[aIdx].title = e.target.value;
                          setVolumes(newVols);
                        }} className="w-full bg-transparent border-none font-bold outline-none" /></td>
                        <td className="p-1"><input value={art.page} onChange={e => {
                          const newVols = [...volumes];
                          newVols[activeVolume].articles[aIdx].page = e.target.value;
                          setVolumes(newVols);
                        }} className="w-full bg-transparent border-none text-center outline-none" /></td>
                        <td className="p-1"><input value={art.generalTopic} onChange={e => {
                          const newVols = [...volumes];
                          newVols[activeVolume].articles[aIdx].generalTopic = e.target.value;
                          setVolumes(newVols);
                        }} className="w-full bg-transparent border-none outline-none" /></td>
                        <td className="p-1 text-center">
                           <button onClick={() => {
                             const newVols = [...volumes];
                             newVols[activeVolume].articles.splice(aIdx, 1);
                             setVolumes(newVols);
                           }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 5px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }`}</style>
    </div>
  )
}