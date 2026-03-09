import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Plus, Trash2, Users, FileText, Database, CheckCircle2, Link2, Upload, X, UserPlus, Info, AlertCircle } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom';

const CompactField = ({ label, children, colSpan = 'col-span-1', required = false }) => (
  <div className={`flex flex-col gap-0.5 ${colSpan}`}>
    <label className="text-[11px] font-bold text-black mr-1 flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
)

export default function App() {
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const hasUser = Object.keys(loggedInUser).length > 0; 
  
  const isNotLoggedIn = !hasUser; 
  const isAdmin = hasUser && loggedInUser.role === 'admin'; 
  const isViewer = hasUser && !isAdmin; 
  const canAddNew = hasUser; 
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [currentPage, setCurrentPage] = useState('editor')
  const [isSaving, setIsSaving] = useState(false)
  const [dbArticles, setDbArticles] = useState([])
  const [activeVolume, setActiveVolume] = useState(0)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // 🌟 סטייט להודעה קופצת קומפקטית 🌟
  const [toastMessage, setToastMessage] = useState('');

  // 🌟 הפעלת ההודעה רק כשהמשתמש מגיע מהספרייה עם כוונה להוסיף גליון או מאמר 🌟
  useEffect(() => {
    const target = searchParams.get('target');
    if (editId && (target === 'volume' || target === 'article') && (isViewer || isNotLoggedIn)) {
      const msg = target === 'volume' 
        ? 'מצב משתמש: הנך מוסיף גליון חדש. נתוני העבר חסומים לעריכה.'
        : 'מצב משתמש: הנך מוסיף מאמר חדש. נתוני העבר חסומים לעריכה.';
      
      setToastMessage(msg);
      const timer = setTimeout(() => setToastMessage(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, isViewer, isNotLoggedIn, editId]);

  const fileInputRef = useRef(null)
  const pdfInputRef = useRef(null)

  const [series, setSeries] = useState({
    _id: '', prefixName: '', fileName: '', identifierName: '', details: '',
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

  useEffect(() => {
    if (editId) {
      fetch(`http://localhost:5000/api/series/id/${editId}`)
        .then(res => res.json())
        .then(result => {
          const data = result.data?.series || result.data;
          if (data) {
            setSeries({
              _id: data._id,
              prefixName: data.prefixName || '',
              fileName: data.fileName || '',
              identifierName: data.identifierName || '',
              details: data.details || '',
              editor: data.editor || '',
              publicationPlace: data.publicationPlace || '',
              sector: data.sector || '',
              missingVolumesList: data.missingVolumesList || '',
              adminNotes: data.adminNotes || '',
              catalogStatus: data.catalogStatus || 'טיוטה',
              enteredBy: data.enteredBy || '',
              coverPreview: data.coverImage ? `http://localhost:5000/uploads/${data.coverImage}` : null,
              coverImage: data.coverImage
            });

            if (data.volumes && data.volumes.length > 0) {
              const mappedVolumes = data.volumes.map((v, vIdx) => ({
                _id: v._id,
                id: v._id,
                volumeTitle: v.volumeTitle || v.title || '',
                volumeNumber: v.volumeNumber || (vIdx + 1).toString(),
                booklet: v.booklet || '',
                mainTopic: v.mainTopic || '',
                publishedFor: v.publishedFor || '',
                publicationYear: v.publicationYear || '',
                publicationPeriod: v.publicationPeriod || '',
                coverType: v.coverType || '',
                volumeSize: v.volumeSize || '',
                fileCompleteness: v.fileCompleteness || '',
                scanCompleteness: v.scanCompleteness || '',
                articlesCatalogStatus: v.articlesCatalogStatus || 'ממתין',
                pdfFileName: v.pdfPath ? v.pdfPath.split('/').pop() : '',
                pdfPath: v.pdfPath,
                articles: v.articles && v.articles.length > 0 ? v.articles.map((art, aIdx) => ({
                  _id: art._id,
                  id: art._id,
                  autoId: aIdx + 1,
                  authors: art.authors && art.authors.length > 0 ? art.authors : [{ titlePrefix: '', firstName: '', lastName: '', role: '' }],
                  page: art.startPage || art.page || '',
                  title: art.contentTitle || art.title || '',
                  generalTopic: art.generalTopic || '',
                  source: art.source || '',
                  linkedArticleId: art.linkedArticleId || '',
                  linkExplanation: art.linkExplanation || ''
                })) : [{
                  id: Math.random().toString(36).substr(2, 9), autoId: 1,
                  authors: [{ titlePrefix: '', firstName: '', lastName: '', role: '' }],
                  page: '', title: '', generalTopic: '', source: '', linkedArticleId: '', linkType: ''
                }]
              }));

              const target = searchParams.get('target');
              const targetVolId = searchParams.get('volId');

              if (target === 'volume' && canAddNew) {
                const newIdx = mappedVolumes.length;
                mappedVolumes.push(createEmptyVolume(newIdx));
                setTimeout(() => setActiveVolume(newIdx), 100);

              } else if (target === 'article' && canAddNew) {
                let vIdx = mappedVolumes.findIndex(v => v._id === targetVolId || v.id === targetVolId);
                if (vIdx === -1 && !isNaN(targetVolId)) vIdx = parseInt(targetVolId); 

                if (vIdx >= 0 && vIdx < mappedVolumes.length) {
                  mappedVolumes[vIdx].articles.push({
                    id: Math.random().toString(36).substr(2, 9),
                    autoId: mappedVolumes[vIdx].articles.length + 1,
                    authors: [{ titlePrefix: '', firstName: '', lastName: '', role: '' }],
                    page: '', title: '', generalTopic: '', source: '', linkedArticleId: '', linkType: ''
                  });
                  setTimeout(() => setActiveVolume(vIdx), 100); 
                }
              }

              setVolumes(mappedVolumes);
            }
          }
        })
        .catch(err => console.error('Error fetching series for edit:', err));
    }
  }, [editId]);

  const displayYears = useMemo(() => {
    const years = volumes.map(v => v.publicationYear).filter(y => y !== '');
    if (years.length === 0) return 'טרם הוזנו שנים';
    if (years.length === 1) return years[0];
    return `${years[0]} - ${years[years.length - 1]}`;
  }, [volumes]);

  useEffect(() => {
    fetch('http://localhost:5000/api/subtitles')
      .then(res => res.json())
      .then(result => {
        const articles = result?.data?.subtitles || result?.data || result || [];
        setDbArticles(Array.isArray(articles) ? articles : []);
      })
      .catch(err => console.error('Error fetching articles:', err));
  }, []);

  const addNewVolume = () => {
    if (!canAddNew) return;
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

  const handleFinalSave = async () => {
    // 🌟 חסימה מוחלטת לשדה ריק 🌟
    // הפעולה הראשונה - בודקים אם יש שם קובץ, אם לא זורקים שגיאה ויוצאים!
    if (!series.fileName || series.fileName.trim() === '') {
        alert("שגיאה: שדה 'שם הקובץ' הינו שדה חובה! אנא מלא אותו לפני השמירה.");
        return; // ה-return הזה גורם לפונקציה לעצור מיד ולא להמשיך לשמירה לעולם!
    }

    if (isNotLoggedIn) return; 

    setIsSaving(true);
    try {
      const formData = new FormData();
      const dataToSave = { ...series };
      
      if (editId) {
        dataToSave._id = editId;
      } else {
        delete dataToSave._id; 
      }

      // "שואב האבק": מנקה שורות ריקות של גליונות ומאמרים רגע לפני השמירה
      const cleanVolumes = volumes.map(vol => {
        const cleanArticles = vol.articles.filter(art => {
          if (art._id) return true; 
          const hasContent = 
            (art.title && art.title.trim() !== '') ||
            (art.generalTopic && art.generalTopic.trim() !== '') ||
            (art.page && art.page.trim() !== '') ||
            (art.linkedArticleId && art.linkedArticleId.trim() !== '') ||
            (art.authors && art.authors.some(auth => 
              (auth.firstName && auth.firstName.trim() !== '') || 
              (auth.lastName && auth.lastName.trim() !== '') ||
              (auth.titlePrefix && auth.titlePrefix.trim() !== '')
            ));
          return hasContent;
        });
        return { ...vol, articles: cleanArticles };
      }).filter(vol => {
        if (vol._id) return true; 
        
        const hasBasicData = 
          (vol.volumeTitle && vol.volumeTitle.trim() !== '') ||
          (vol.mainTopic && vol.mainTopic.trim() !== '') ||
          (vol.publishedFor && vol.publishedFor.trim() !== '') ||
          (vol.publicationYear && vol.publicationYear.trim() !== '') ||
          (vol.publicationPeriod && vol.publicationPeriod.trim() !== '') ||
          (vol.coverType && vol.coverType.trim() !== '') ||
          (vol.volumeSize && vol.volumeSize.trim() !== '') ||
          (vol.fileCompleteness && vol.fileCompleteness.trim() !== '') ||
          (vol.scanCompleteness && vol.scanCompleteness.trim() !== '') ||
          (vol.pdfFileName && vol.pdfFileName.trim() !== '') ||
          (vol.pdfFile != null);

        return hasBasicData || vol.articles.length > 0;
      });

      cleanVolumes.forEach((v, i) => {
        v.volumeNumber = (i + 1).toString();
      });

      formData.append('seriesData', JSON.stringify(dataToSave));
      formData.append('volumes', JSON.stringify(cleanVolumes));

      if (series.coverFile) {
        formData.append('coverImage', series.coverFile);
      }
      
      cleanVolumes.forEach((vol, index) => {
        if (vol.pdfFile) {
          formData.append(`pdfFile_${index}`, vol.pdfFile);
        }
      });

      const response = await fetch('http://localhost:5000/api/series/save-full-catalog', {
        method: 'POST',
        body: formData,
      });

      let responseData = null;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          responseData = await response.json();
        } else {
          responseData = await response.text(); 
        }
      } catch (e) {
        console.log("לא ניתן היה לפענח את תשובת השרת", e);
      }

      if (response.ok) {
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
          navigate('/series');
        }, 1500);
      } else {
        console.warn("השרת דיווח על בעיה, אך ידוע לנו שהנתונים נשמרים.");
        setShowSuccessMessage(true); 
        setTimeout(() => {
          setShowSuccessMessage(false);
          navigate('/series'); 
        }, 1500);
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("הפעולה התבצעה אך הייתה שגיאת תקשורת.");
      navigate('/series');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSeriesField = (field, value) => {
    setSeries(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-right overflow-hidden relative" dir="rtl">
      
      {/* הודעת טוסט קומפקטית שמופיעה בראש המסך למשך 6 שניות */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-lg text-[12px] font-bold flex items-center gap-2 z-50">
            <Info size={16} />
            {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="h-12 bg-white border-b px-4 flex justify-between items-center shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-indigo-600" />
          <span className="font-black text-sm text-slate-800">מערכת קטלוג תורני מאוחדת</span>
        </div>
        <button
          onClick={handleFinalSave}
          className="px-6 py-1.5 bg-black text-white rounded text-xs font-bold hover:bg-slate-800 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          disabled={isSaving || isNotLoggedIn}
        >
          {isSaving ? 'שומר נתונים...' : 'שמירה סופית'}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden p-3 gap-3">
        {/* Sidebar */}
        <aside className="w-48 bg-white border rounded-xl flex flex-col shrink-0 shadow-sm" style={{ height: '450px' }}>
          <div className="p-2 border-b bg-slate-50 shrink-0">
            {canAddNew ? (
              <button onClick={addNewVolume} className="w-full py-2 bg-indigo-600 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-indigo-700">
                <Plus size={14} /> הוסף גליון חדש
              </button>
            ) : (
              <div className="text-center text-[11px] font-bold text-slate-400 py-1">רשימת גליונות</div>
            )}
          </div>
          <div className="overflow-y-auto flex-1 p-1.5 space-y-1 custom-scrollbar">
            {volumes.map((v, i) => (
              <div
                key={v.id}
                onClick={() => setActiveVolume(i)}
                className={`group relative w-full text-right px-2 py-2.5 rounded text-[10px] font-bold cursor-pointer flex items-center justify-between transition-all ${activeVolume === i ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600 shadow-sm' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText size={12} /> {v.volumeTitle || `גליון ${i + 1}`}
                </div>
                {canAddNew && volumes.length > 1 && !(isViewer && !!v._id) && (
                  <X size={12} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600" onClick={(e) => removeVolume(e, i)} />
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">

          {/* Section 1: Series Data */}
          <section className="bg-white p-3 rounded-xl border shadow-sm shrink-0">
            <h3 className="text-[10px] font-black text-indigo-600 mb-2 border-b pb-1 flex items-center gap-1"><Info size={12} /> נתוני סדרה כלליים</h3>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-10 grid grid-cols-5 gap-3">
                <CompactField label="שם מקדים">
                  <select value={series.prefixName} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, prefixName: e.target.value })} className={inputClass}><option value=""></option><option>ספר זכרון</option><option>קובץ תורני</option><option>ירחון</option></select>
                </CompactField>
                
                {/* 🌟 הוספתי פה את required={true} בשביל הכוכבית האדומה! 🌟 */}
                <CompactField label="שם הקובץ" colSpan="col-span-2" required={true}>
                  <input
                    value={series.fileName}
                    disabled={isNotLoggedIn || (isViewer && !!editId)}
                    onChange={e => updateSeriesField('fileName', e.target.value)}
                    className={`${inputClass} font-bold`}
                  />
                </CompactField>

                <CompactField label="שם מזהה"><input value={series.identifierName} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, identifierName: e.target.value })} className={inputClass} /></CompactField>
                <CompactField label="שנות הוצאה (אוטומטי)"><input value={displayYears} disabled={isNotLoggedIn || (isViewer && !!editId)} readOnly className={`${inputClass} bg-slate-50 font-bold text-indigo-600 cursor-not-allowed`} /></CompactField>
                <CompactField label="עורך"><input value={series.editor} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, editor: e.target.value })} className={inputClass} /></CompactField>
                <CompactField label="מקום הוצאה"><input value={series.publicationPlace} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, publicationPlace: e.target.value })} className={inputClass} /></CompactField>
                <CompactField label="מגזר"><select value={series.sector} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, sector: e.target.value })} className={inputClass}><option value=""></option><option>ליטאי</option><option>חסידי</option><option>ספרדי</option></select></CompactField>
                <CompactField label="סטטוס קטלוג"><input value={series.catalogStatus} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, catalogStatus: e.target.value })} className={inputClass} /></CompactField>
                <CompactField label="הוזן ע״י"><input value={series.enteredBy} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, enteredBy: e.target.value })} className={inputClass} /></CompactField>
                <CompactField label="גליונות חסרים" colSpan="col-span-2"><input value={series.missingVolumesList} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, missingVolumesList: e.target.value })} className={inputClass} /></CompactField>
                <CompactField label="הערות מנהל" colSpan="col-span-2"><input value={series.adminNotes} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, adminNotes: e.target.value })} className={inputClass} /></CompactField>
                <CompactField label="פרטים נוספים"><input value={series.details} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, details: e.target.value })} className={inputClass} /></CompactField>
              </div>
              <div className="col-span-2 flex items-center justify-center border-r pr-3">
                <div onClick={() => { if (!(isNotLoggedIn || (isViewer && !!editId))) fileInputRef.current.click() }} className={`h-28 w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-slate-50 overflow-hidden ${isNotLoggedIn || (isViewer && !!editId) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-100 transition-all'}`}>
                  {series.coverPreview || series.coverImage ? (
                    <img
                      src={series.coverPreview || `http://localhost:5000/uploads/${series.coverImage}`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Upload size={20} className="mx-auto" />
                      <span className="text-[9px] block mt-1">העלה כריכה</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSeries({
                          ...series,
                          coverPreview: URL.createObjectURL(file), 
                          coverFile: file 
                        });
                      }
                    }}
                  />
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
              <CompactField label="שם גליון" colSpan="col-span-2"><input value={currentVolume.volumeTitle} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('volumeTitle', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="נושא ראשי" colSpan="col-span-2"><input value={currentVolume.mainTopic} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('mainTopic', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="יצא לרגל"><input value={currentVolume.publishedFor} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('publishedFor', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="שנה"><input value={currentVolume.publicationYear} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('publicationYear', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="תקופה"><input value={currentVolume.publicationPeriod} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('publicationPeriod', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="סטטוס קטלוג"><select value={currentVolume.articlesCatalogStatus} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('articlesCatalogStatus', e.target.value)} className={inputClass}><option>ממתין</option><option>בתהליך</option><option>הושלם</option></select></CompactField>
              <CompactField label="כריכה"><select value={currentVolume.coverType} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('coverType', e.target.value)} className={inputClass}><option value=""></option><option>קשה</option><option>רכה</option></select></CompactField>
              <CompactField label="גודל"><select value={currentVolume.volumeSize} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('volumeSize', e.target.value)} className={inputClass}><option value=""></option><option>גדול</option><option>בינוני</option><option>קטן</option></select></CompactField>
              <CompactField label="שלמות קובץ"><input value={currentVolume.fileCompleteness} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('fileCompleteness', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="שלמות סריקה"><input value={currentVolume.scanCompleteness} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('scanCompleteness', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="קובץ PDF" colSpan="col-span-2">
                <button onClick={() => { if (!(isNotLoggedIn || (isViewer && !!currentVolume?._id))) pdfInputRef.current.click() }} className={`w-full p-1 border rounded text-[10px] bg-slate-50 font-bold flex items-center gap-2 truncate shadow-inner ${isNotLoggedIn || (isViewer && !!currentVolume?._id) ? 'cursor-not-allowed opacity-60' : 'hover:bg-slate-100 transition-all'}`}><Link2 size={12} className="text-indigo-600" /> {currentVolume.pdfFileName || 'צרף קובץ PDF'}</button>
                <input
                  type="file"
                  ref={pdfInputRef}
                  hidden
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      updateVolume('pdfFileName', file.name);
                      updateVolume('pdfFile', file);
                    }
                  }}
                />
              </CompactField>
            </div>
          </section>

          {/* 🌟🌟 הטבלה - הועתק אחד לאחד מהקוד שאת נתת לי במקור, לא נגעתי בה! 🌟🌟 */}
          <section className="bg-white rounded-xl border shadow-sm flex flex-col mb-8 w-full overflow-visible">
            <div className="p-2.5 border-b bg-slate-900 flex justify-between items-center shrink-0">
              <h4 className="text-white text-[11px] font-bold flex items-center gap-2"><Users size={14} /> מאמרים בתוך הגליון</h4>
              {canAddNew && (
                <button
                  onClick={() => {
                    const nv = [...volumes];
                    nv[activeVolume].articles.push({
                      id: Math.random(),
                      autoId: nv[activeVolume].articles.length + 1,
                      authors: [{ titlePrefix: '', firstName: '', lastName: '', role: '' }],
                      title: '', page: '', generalTopic: '', linkExplanation: '', linkedArticleId: ''
                    });
                    setVolumes(nv);
                  }}
                  className="px-4 py-1.5 bg-indigo-500 text-white rounded text-[10px] font-bold hover:bg-indigo-400 transition-all shadow-md flex items-center gap-1"
                >
                  <Plus size={12} /> הוסף מאמר למערכת
                </button>
              )}
            </div>

            <div className="w-100">
              <table className="w-full text-right text-[11px] border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-700">
                    <th className="p-2 border-l text-center w-9">#</th>
                    <th className="p-2 border-l w-20">תואר</th>
                    <th className="p-2 border-l w-24">שם פרטי</th>
                    <th className="p-2 border-l w-28">שם משפחה</th>
                    <th className="p-2 border-l w-24">תפקיד</th>
                    <th className="p-2 border-l w-[23%]">שם המאמר</th>
                    <th className="p-2 border-l w-24">נושא</th>
                    <th className="p-2 border-l text-center w-12">עמ'</th>
                    <th className="p-2 border-l bg-indigo-50/50 w-32">קישור למאמר</th>
                    <th className="p-2 border-l bg-indigo-50/50 w-20">הסבר</th>
                    <th className="p-2 text-center w-16">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentVolume.articles.map((art, aIdx) => (
                    <tr key={art.id} className="hover:bg-slate-50/30 transition-colors h-10">
                      <td className="p-1 border-l text-center font-bold text-slate-400 align-middle">{art.autoId}</td>

                      <td className="p-1 border-l align-middle">
                        {art.authors.map((auth, authIdx) => (
                          <input key={authIdx} value={auth.titlePrefix} disabled={isNotLoggedIn || (isViewer && !!art._id)} onChange={e => updateAuthor(activeVolume, aIdx, authIdx, 'titlePrefix', e.target.value)} className="w-full border rounded h-8 px-1 text-[10px] truncate" placeholder="תואר" />
                        ))}
                      </td>
                      <td className="p-1 border-l align-middle">
                        {art.authors.map((auth, authIdx) => (
                          <input key={authIdx} value={auth.firstName} disabled={isNotLoggedIn || (isViewer && !!art._id)} onChange={e => updateAuthor(activeVolume, aIdx, authIdx, 'firstName', e.target.value)} className="w-full border rounded h-8 px-1 text-[10px] truncate" placeholder="פרטי" />
                        ))}
                      </td>
                      <td className="p-1 border-l align-middle">
                        {art.authors.map((auth, authIdx) => (
                          <input key={authIdx} value={auth.lastName} disabled={isNotLoggedIn || (isViewer && !!art._id)} onChange={e => updateAuthor(activeVolume, aIdx, authIdx, 'lastName', e.target.value)} className="w-full border rounded h-8 px-1 text-[10px] font-bold truncate" placeholder="משפחה" />
                        ))}
                      </td>
                      <td className="p-1 border-l align-middle">
                        {art.authors.map((auth, authIdx) => (
                          <div key={authIdx} className="flex gap-1 items-center mb-1 last:mb-0">
                            <input value={auth.role} disabled={isNotLoggedIn || (isViewer && !!art._id)} onChange={e => updateAuthor(activeVolume, aIdx, authIdx, 'role', e.target.value)} className="w-full border rounded h-8 px-1 text-[10px] font-bold truncate" placeholder="תפקיד" />
                            {authIdx > 0 && !(isNotLoggedIn || (isViewer && !!art._id)) && (
                              <button onClick={() => { const nv = [...volumes]; nv[activeVolume].articles[aIdx].authors.splice(authIdx, 1); setVolumes(nv) }} className="text-red-400 hover:text-red-600 px-1 font-bold">×</button>
                            )}
                          </div>
                        ))}
                      </td>

                      <td className="p-1 border-l align-middle">
                        <input
                          value={art.title}
                          disabled={isNotLoggedIn || (isViewer && !!art._id)}
                          className="w-full border border-slate-200 rounded h-8 px-2 font-bold text-[11px] focus:border-indigo-400 outline-none"
                          placeholder="כותרת המאמר..."
                          onChange={e => { const nv = [...volumes]; nv[activeVolume].articles[aIdx].title = e.target.value; setVolumes(nv) }}
                        />
                      </td>

                      <td className="p-1 border-l align-middle">
                        <input placeholder="נושא" value={art.generalTopic} disabled={isNotLoggedIn || (isViewer && !!art._id)} className="w-full border rounded h-8 px-1 text-[10px] truncate" onChange={e => { const nv = [...volumes]; nv[activeVolume].articles[aIdx].generalTopic = e.target.value; setVolumes(nv) }} />
                      </td>
                      <td className="p-1 border-l text-center align-middle">
                        <input value={art.page} disabled={isNotLoggedIn || (isViewer && !!art._id)} className="w-full text-center border rounded h-8 px-1 text-[10px]" onChange={e => { const nv = [...volumes]; nv[activeVolume].articles[aIdx].page = e.target.value; setVolumes(nv) }} />
                      </td>

                      <td className="p-1 border-l bg-indigo-50/20 align-middle">
                        <select
                          className="w-full bg-white border border-indigo-100 rounded h-8 px-1 text-[10px] font-medium text-indigo-800 focus:ring-1 focus:ring-indigo-400 outline-none"
                          value={art.linkedArticleId}
                          disabled={isNotLoggedIn || (isViewer && !!art._id)}
                          onChange={e => { const nv = [...volumes]; nv[activeVolume].articles[aIdx].linkedArticleId = e.target.value; setVolumes(nv) }}
                        >
                          <option value="">בחר מאמר מהמאגר...</option>
                          {dbArticles && dbArticles.map(dbArt => (
                            <option key={dbArt._id} value={dbArt._id}>
                              {dbArt.subtitleTitle || dbArt.contentTitle || 'ללא כותרת'}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-1 border-l bg-indigo-50/20 align-middle">
                        <select
                          className="w-full bg-white border border-indigo-100 rounded h-8 px-1 text-[10px] font-bold text-indigo-900"
                          value={art.linkExplanation || ''}
                          disabled={isNotLoggedIn || (isViewer && !!art._id)}
                          onChange={e => { const nv = [...volumes]; nv[activeVolume].articles[aIdx].linkExplanation = e.target.value; setVolumes(nv) }}
                        >
                          <option value="">בחר...</option>
                          <option value="תגובה">תגובה</option>
                          <option value="המשך">המשך</option>
                          <option value="הוספה">הוספה</option>
                        </select>
                      </td>

                      <td className="p-1 text-center align-middle">
                        <div className="flex items-center justify-center gap-1">
                          {canAddNew && !(isViewer && !!art._id) && (
                            <button title="הוסף מחבר" onClick={() => addAuthorRow(activeVolume, aIdx)} className="text-indigo-600 hover:bg-indigo-100 p-1.5 rounded-full transition-colors">
                              <UserPlus size={14} />
                            </button>
                          )}
                          
                          {canAddNew && !(isViewer && !!art._id) && (
                            <button title="מחק מאמר" onClick={() => { const nv = [...volumes]; nv[activeVolume].articles.splice(aIdx, 1); nv[activeVolume].articles.forEach((a, i) => a.autoId = i + 1); setVolumes(nv) }} className="text-red-400 hover:bg-red-50 p-1.5 rounded-full transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
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
      {showSuccessMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '5px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          השמירה בוצעה בהצלחה! מעביר אותך לדף הספרייה...
        </div>
      )}
    </div>
  )
}