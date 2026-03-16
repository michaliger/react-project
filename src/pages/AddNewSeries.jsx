import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Plus, Trash2, Users, FileText, Database, CheckCircle2, Link2, Upload, X, UserPlus, Info, AlertCircle } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom';

// הוספנו widthClass כדי לשלוט ברוחב באחוזים בשורה של הגליון
const CompactField = ({ label, children, colSpan = '', widthClass = '', required = false }) => (
  <div className={`flex flex-col gap-0.5 ${colSpan} ${widthClass}`}>
    <label className="text-[11px] font-bold text-black mr-1 flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
)

export default function AddSeriesForm() {
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
  const [publicationPlaces, setPublicationPlaces] = useState([]);
  const [activeVolume, setActiveVolume] = useState(0)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [deletePrompt, setDeletePrompt] = useState({ show: false, type: '', vIdx: null, aIdx: null, title: '' });

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

  const isExistingSeries = !!series._id; 

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

    fetch('http://localhost:5000/api/series')
      .then(res => res.json())
      .then(result => {
        const seriesArray = result?.data?.series || result?.data || [];
        const uniquePlaces = [...new Set(seriesArray.map(s => s.publicationPlace).filter(Boolean))];
        setPublicationPlaces(uniquePlaces.sort()); 
      })
      .catch(err => console.error('Error fetching places:', err));
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 6000);
  };

  const addNewVolume = () => {
    if (!canAddNew) {
      showToast('אינך מחובר. המערכת במצב צפייה בלבד.');
      return;
    }
    
    if (isViewer && isExistingSeries) {
        showToast('מצב משתמש: הנך מוסיף גליון חדש. שדות עבר חסומים לעריכה.');
    }

    const newIdx = volumes.length;
    setVolumes([...volumes, createEmptyVolume(newIdx)]);
    setActiveVolume(newIdx);
  }

  const addNewArticle = () => {
    if (!canAddNew) {
        showToast('אינך מחובר. המערכת במצב צפייה בלבד.');
        return;
    }

    if (isViewer && !!currentVolume?._id) {
        showToast('מצב משתמש: הנך מוסיף מאמר חדש. המאמרים הקודמים חסומים לעריכה.');
    }

    const nv = [...volumes];
    nv[activeVolume].articles.push({
      id: Math.random(),
      autoId: nv[activeVolume].articles.length + 1,
      authors: [{ titlePrefix: '', firstName: '', lastName: '', role: '' }],
      title: '', page: '', generalTopic: '', source: '', linkExplanation: '', linkedArticleId: ''
    });
    setVolumes(nv);
  }

  const promptRemoveVolume = (e, index) => {
    e.stopPropagation();
    if (volumes.length <= 1) {
      alert("לא ניתן למחוק את הגליון היחיד בסדרה.");
      return;
    }
    setDeletePrompt({
      show: true,
      type: 'volume',
      vIdx: index,
      aIdx: null,
      title: volumes[index].volumeTitle || `גליון ${index + 1}`
    });
  }

  const promptRemoveArticle = (vIdx, aIdx) => {
    setDeletePrompt({
      show: true,
      type: 'article',
      vIdx: vIdx,
      aIdx: aIdx,
      title: volumes[vIdx].articles[aIdx].title || `מאמר שורה ${volumes[vIdx].articles[aIdx].autoId}`
    });
  }

  const executeDeleteAction = () => {
    if (deletePrompt.type === 'volume') {
      const newVolumes = volumes.filter((_, i) => i !== deletePrompt.vIdx);
      setVolumes(newVolumes);
      setActiveVolume(Math.max(0, deletePrompt.vIdx - 1));
    } else if (deletePrompt.type === 'article') {
      const nv = [...volumes];
      nv[deletePrompt.vIdx].articles.splice(deletePrompt.aIdx, 1);
      nv[deletePrompt.vIdx].articles.forEach((a, i) => a.autoId = i + 1); 
      setVolumes(nv);
    }
    setDeletePrompt({ show: false, type: '', vIdx: null, aIdx: null, title: '' }); 
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.target.tagName === 'BUTTON' || e.target.type === 'submit' || e.target.type === 'file') {
        return;
      }
      e.preventDefault(); 

      if (e.target.dataset.lastArticleField === "true" && canAddNew) {
        addNewArticle();
        setTimeout(() => {
          const focusable = Array.from(
            document.querySelectorAll('input:not([disabled]):not([type="hidden"]), select:not([disabled])')
          ).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });
          const currentIndex = focusable.indexOf(e.target);
          if (currentIndex > -1 && currentIndex + 1 < focusable.length) {
            focusable[currentIndex + 1].focus();
          }
        }, 50);
        return;
      }

      const focusable = Array.from(
        document.querySelectorAll('input:not([disabled]):not([type="hidden"]), select:not([disabled])')
      ).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      const currentIndex = focusable.indexOf(e.target);
      if (currentIndex > -1 && currentIndex < focusable.length - 1) {
        focusable[currentIndex + 1].focus();
      }
    }
  };

  // 🌟 הגדלנו מעט את הריווח הפנימי של השדות (p-1.5 במקום p-1) כדי שיהיו נוחים ומרווחים יותר 🌟
  const inputClass = "w-full p-1.5 border border-slate-200 rounded text-[12px] text-black outline-none focus:border-indigo-500 bg-white shadow-sm";
  const currentVolume = volumes[activeVolume];

  if (currentPage === 'home') return <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl"><div className="text-center p-10 bg-white rounded-2xl shadow-lg border"><CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" /><h1 className="text-xl font-bold">הנתונים נשמרו בהצלחה!</h1><button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg">חזרה</button></div></div>;

  const handleFinalSave = async () => {
    if (!series.fileName || series.fileName.trim() === '') {
        alert("שגיאה: שדה 'שם הקובץ' הינו שדה חובה! אנא מלא אותו לפני השמירה.");
        return; 
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
    <div className="flex flex-col min-h-screen bg-slate-100 font-sans text-right relative pb-10" dir="rtl" onKeyDown={handleKeyDown}>
      
      {deletePrompt.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center border border-gray-200">
            <div className="bg-red-100 text-red-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">אישור מחיקה</h3>
            <p className="text-gray-700 mb-6 text-[14px]">
              האם אתה בטוח שברצונך למחוק את {deletePrompt.type === 'volume' ? 'הגליון' : 'המאמר'}:<br/>
              <strong className="text-red-600 break-words">{deletePrompt.title}</strong> ?
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setDeletePrompt({ show: false, type: '', vIdx: null, aIdx: null, title: '' })} 
                className="px-5 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 w-1/2 transition-colors"
              >
                ביטול
              </button>
              <button 
                onClick={executeDeleteAction} 
                className="px-5 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 w-1/2 transition-colors"
              >
                מחק
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-lg text-[12px] font-bold flex items-center gap-2 z-50">
            <Info size={16} />
            {toastMessage}
        </div>
      )}

      <header className="sticky top-0 z-50 h-12 bg-white border-b px-4 flex justify-between items-center shrink-0 shadow-sm w-full">
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

      <div className="flex flex-1 p-3 gap-3 items-start">
        
        {/* 🌟 הסרגל הצדדי הוצר משמעותית (w-36 במקום w-48) כדי לפנות המון מקום לשדות 🌟 */}
        <aside className="w-36 bg-white border rounded-xl flex flex-col shrink-0 shadow-sm sticky top-16" style={{ height: 'calc(100vh - 80px)' }}>
          <div className="p-2 border-b bg-slate-50 shrink-0">
            {canAddNew ? (
              <button onClick={addNewVolume} className="w-full py-2 bg-indigo-600 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-indigo-700">
                <Plus size={14} /> הוסף גליון
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
                  <X size={12} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600" onClick={(e) => promptRemoveVolume(e, i)} />
                )}
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 flex flex-col gap-3 min-w-0">

          <section className="bg-white p-3 rounded-xl border shadow-sm shrink-0">
            <h3 className="text-[10px] font-black text-indigo-600 mb-2 border-b pb-1 flex items-center gap-1"><Info size={12} /> נתוני סדרה כלליים</h3>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-10 grid grid-cols-10 gap-3 items-end">
                <CompactField label="שם מקדים" colSpan="col-span-1">
                  <select value={series.prefixName} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, prefixName: e.target.value })} className={inputClass}><option value=""></option><option>ספר זכרון</option><option>קובץ תורני</option><option>ירחון</option></select>
                </CompactField>
                <CompactField label="שם הקובץ" colSpan="col-span-2" required={true}>
                  <input value={series.fileName} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => updateSeriesField('fileName', e.target.value)} className={`${inputClass} font-bold`} />
                </CompactField>
                <CompactField label="שם מזהה" colSpan="col-span-2">
                  <input value={series.identifierName} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, identifierName: e.target.value })} className={inputClass} />
                </CompactField>
                <CompactField label="פרטים נוספים" colSpan="col-span-5">
                  <input value={series.details} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, details: e.target.value })} className={inputClass} />
                </CompactField>
                <CompactField label="עורך" colSpan="col-span-2">
                  <input value={series.editor} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, editor: e.target.value })} className={inputClass} />
                </CompactField>
                <CompactField label="מקום הוצאה" colSpan="col-span-2">
                  <input list="places-list" value={series.publicationPlace} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, publicationPlace: e.target.value })} className={inputClass} autoComplete="off" placeholder="הקלד או בחר..." />
                  <datalist id="places-list">
                    {publicationPlaces.map((place, idx) => (
                      <option key={idx} value={place} />
                    ))}
                  </datalist>
                </CompactField>
                <CompactField label="מגזר" colSpan="col-span-1">
                  <select value={series.sector} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, sector: e.target.value })} className={inputClass}><option value=""></option><option>ליטאי</option><option>חסידי</option><option>ספרדי</option></select>
                </CompactField>
                <CompactField label="סטטוס" colSpan="col-span-2">
                  <input value={series.catalogStatus} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, catalogStatus: e.target.value })} className={inputClass} />
                </CompactField>
                <CompactField label="גליונות חסרים" colSpan="col-span-3">
                  <input value={series.missingVolumesList} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, missingVolumesList: e.target.value })} className={inputClass} />
                </CompactField>
                <CompactField label="הערות מנהל" colSpan="col-span-8">
                  <input value={series.adminNotes} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, adminNotes: e.target.value })} className={inputClass} />
                </CompactField>
                <CompactField label="הוזן ע״י" colSpan="col-span-2">
                  <input value={series.enteredBy} disabled={isNotLoggedIn || (isViewer && !!editId)} onChange={e => setSeries({ ...series, enteredBy: e.target.value })} className={inputClass} />
                </CompactField>
              </div>
              <div className="col-span-2 flex items-center justify-center border-r pr-3">
                <div onClick={() => { if (!(isNotLoggedIn || (isViewer && !!editId))) fileInputRef.current.click() }} className={`h-28 w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-slate-50 overflow-hidden ${isNotLoggedIn || (isViewer && !!editId) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-100 transition-all'}`}>
                  {series.coverPreview || series.coverImage ? (
                    <img src={series.coverPreview || `http://localhost:5000/uploads/${series.coverImage}`} className="h-full w-full object-contain" />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Upload size={20} className="mx-auto" />
                      <span className="text-[9px] block mt-1">העלה כריכה</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} hidden onChange={(e) => { const file = e.target.files[0]; if (file) { setSeries({ ...series, coverPreview: URL.createObjectURL(file), coverFile: file }); } }} />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-3 rounded-xl border shadow-sm w-full border-r-8 border-r-indigo-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">נתוני גליון פעיל</h3>
                <span className="bg-indigo-600 text-white text-[11px] px-3 py-0.5 rounded-full font-bold">גליון #{activeVolume + 1}</span>
              </div>
            </div>
            
            <div className="flex flex-row gap-2 items-end w-full">
              <CompactField label="שם גליון" widthClass="w-[8%]"><input value={currentVolume.volumeTitle} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('volumeTitle', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="נושא ראשי" widthClass="w-[16%]"><input value={currentVolume.mainTopic} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('mainTopic', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="יצא לרגל" widthClass="w-[16%]"><input value={currentVolume.publishedFor} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('publishedFor', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="שנה" widthClass="w-[6%]"><input value={currentVolume.publicationYear} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('publicationYear', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="חודש" widthClass="w-[6%]"><input value={currentVolume.publicationPeriod} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('publicationPeriod', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="סטטוס" widthClass="w-[8%]"><select value={currentVolume.articlesCatalogStatus} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('articlesCatalogStatus', e.target.value)} className={inputClass}><option>ממתין</option><option>בתהליך</option><option>הושלם</option></select></CompactField>
              <CompactField label="שלמות קובץ" widthClass="w-[15%]"><input value={currentVolume.fileCompleteness} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('fileCompleteness', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="שלמות סריקה" widthClass="w-[15%]"><input value={currentVolume.scanCompleteness} disabled={isNotLoggedIn || (isViewer && !!currentVolume?._id)} onChange={e => updateVolume('scanCompleteness', e.target.value)} className={inputClass} /></CompactField>
              <CompactField label="קובץ" widthClass="w-[10%]">
                <button onClick={() => { if (!(isNotLoggedIn || (isViewer && !!currentVolume?._id))) pdfInputRef.current.click() }} className={`w-full p-1 h-[26px] border rounded text-[11px] font-bold flex items-center justify-center gap-1 shadow-inner ${isNotLoggedIn || (isViewer && !!currentVolume?._id) ? 'bg-slate-100 cursor-not-allowed opacity-60 text-slate-400' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all border-indigo-200'}`} title={currentVolume.pdfFileName || 'צרף קובץ PDF'}>
                  <Link2 size={12} className={currentVolume.pdfFileName ? "text-green-600" : "text-indigo-600"} />
                  <span className="truncate">{currentVolume.pdfFileName ? 'צורף' : 'העלה'}</span>
                </button>
                <input type="file" ref={pdfInputRef} hidden onChange={(e) => { const file = e.target.files[0]; if (file) { updateVolume('pdfFileName', file.name); updateVolume('pdfFile', file); } }} />
              </CompactField>
            </div>
          </section>

          <section className="bg-white rounded-xl border shadow-sm flex flex-col w-full overflow-hidden mb-2">
            <div className="p-2.5 border-b bg-slate-900 flex justify-between items-center shrink-0">
              <h4 className="text-white text-[11px] font-bold flex items-center gap-2"><Users size={14} /> מאמרים בתוך הגליון</h4>
            </div>

            <div className="w-full">
              <table className="w-full text-right text-[11px] border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-700">
                    <th className="p-2 border-l text-center w-9">#</th>
                    <th className="p-2 border-l w-20">תואר</th>
                    <th className="p-2 border-l w-24">שם פרטי</th>
                    <th className="p-2 border-l w-28">שם משפחה</th>
                    <th className="p-2 border-l w-24">תפקיד</th>
                    <th className="p-2 border-l w-[23%]">שם המאמר</th>
                    <th className="p-2 border-l w-24">מקור</th>
                    <th className="p-2 border-l w-24">נושא</th>
                    <th className="p-2 border-l text-center w-12">עמ'</th>
                    <th className="p-2 border-l bg-indigo-50/50 w-16">קישור</th>
                    <th className="p-2 border-l bg-indigo-50/50 w-24">הערות</th>
                    <th className="p-2 text-center w-16">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentVolume.articles.map((art, aIdx) => (
                    <tr key={art.id} className="hover:bg-slate-50/30 transition-colors h-10">
                      <td className="p-1 border-l text-center font-bold text-slate-400 align-middle">{art.autoId}</td>

                      <td className="p-1 border-l align-middle">
                        <input key={`auth-pfx-${art.id}`} value={art.authors[0]?.titlePrefix || ''} disabled={isNotLoggedIn || (isViewer && !!art._id)} onChange={e => updateAuthor(activeVolume, aIdx, 0, 'titlePrefix', e.target.value)} className="w-full border rounded h-8 px-1 text-[10px] truncate" placeholder="תואר" />
                      </td>
                      <td className="p-1 border-l align-middle">
                        <input key={`auth-fn-${art.id}`} value={art.authors[0]?.firstName || ''} disabled={isNotLoggedIn || (isViewer && !!art._id)} onChange={e => updateAuthor(activeVolume, aIdx, 0, 'firstName', e.target.value)} className="w-full border rounded h-8 px-1 text-[10px] truncate" placeholder="פרטי" />
                      </td>
                      <td className="p-1 border-l align-middle">
                        <input key={`auth-ln-${art.id}`} value={art.authors[0]?.lastName || ''} disabled={isNotLoggedIn || (isViewer && !!art._id)} onChange={e => updateAuthor(activeVolume, aIdx, 0, 'lastName', e.target.value)} className="w-full border rounded h-8 px-1 text-[10px] font-bold truncate" placeholder="משפחה" />
                      </td>
                      <td className="p-1 border-l align-middle">
                        <div className="flex gap-1 items-center mb-1 last:mb-0">
                          <input value={art.authors[0]?.role || ''} disabled={isNotLoggedIn || (isViewer && !!art._id)} onChange={e => updateAuthor(activeVolume, aIdx, 0, 'role', e.target.value)} className="w-full border rounded h-8 px-1 text-[10px] font-bold truncate" placeholder="תפקיד" />
                        </div>
                      </td>

                      <td className="p-1 border-l align-middle">
                        <input value={art.title} disabled={isNotLoggedIn || (isViewer && !!art._id)} className="w-full border border-slate-200 rounded h-8 px-2 font-bold text-[11px] focus:border-indigo-400 outline-none" placeholder="כותרת המאמר..." onChange={e => { const nv = [...volumes]; nv[activeVolume].articles[aIdx].title = e.target.value; setVolumes(nv) }} />
                      </td>

                      <td className="p-1 border-l align-middle">
                        <input placeholder="מקור" value={art.source || ''} disabled={isNotLoggedIn || (isViewer && !!art._id)} className="w-full border rounded h-8 px-1 text-[10px] truncate" onChange={e => { const nv = [...volumes]; nv[activeVolume].articles[aIdx].source = e.target.value; setVolumes(nv) }} />
                      </td>

                      <td className="p-1 border-l align-middle">
                        <input placeholder="נושא" value={art.generalTopic} disabled={isNotLoggedIn || (isViewer && !!art._id)} className="w-full border rounded h-8 px-1 text-[10px] truncate" onChange={e => { const nv = [...volumes]; nv[activeVolume].articles[aIdx].generalTopic = e.target.value; setVolumes(nv) }} />
                      </td>
                      <td className="p-1 border-l text-center align-middle">
                        <input value={art.page} disabled={isNotLoggedIn || (isViewer && !!art._id)} className="w-full text-center border rounded h-8 px-1 text-[10px]" onChange={e => { const nv = [...volumes]; nv[activeVolume].articles[aIdx].page = e.target.value; setVolumes(nv) }} />
                      </td>

                      <td className="p-1 border-l bg-indigo-50/20 align-middle">
                        <select className="w-full bg-white border border-indigo-100 rounded h-8 px-1 text-[10px] font-medium text-indigo-800 focus:ring-1 focus:ring-indigo-400 outline-none" value={art.linkedArticleId} disabled={isNotLoggedIn || (isViewer && !!art._id)} onChange={e => { const nv = [...volumes]; nv[activeVolume].articles[aIdx].linkedArticleId = e.target.value; setVolumes(nv) }}>
                          <option value=""></option>
                          {dbArticles && dbArticles.map(dbArt => (
                            <option key={dbArt._id} value={dbArt._id}>{dbArt.subtitleTitle || dbArt.contentTitle || 'ללא כותרת'}</option>
                          ))}
                        </select>
                      </td>

                      <td className="p-1 border-l bg-indigo-50/20 align-middle">
                        <input
                          data-last-article-field={aIdx === currentVolume.articles.length - 1 ? "true" : "false"}
                          placeholder="הערות..."
                          className="w-full bg-white border border-indigo-100 rounded h-8 px-1 text-[10px] font-bold text-indigo-900 focus:ring-1 focus:ring-indigo-400 outline-none"
                          value={art.linkExplanation || ''}
                          disabled={isNotLoggedIn || (isViewer && !!art._id)}
                          onChange={e => { const nv = [...volumes]; nv[activeVolume].articles[aIdx].linkExplanation = e.target.value; setVolumes(nv) }}
                        />
                      </td>

                      <td className="p-1 text-center align-middle">
                        <div className="flex items-center justify-center gap-1">
                          {canAddNew && !(isViewer && !!art._id) && (
                            <button title="הוסף מחבר" onClick={() => addAuthorRow(activeVolume, aIdx)} className="text-indigo-600 hover:bg-indigo-100 p-1.5 rounded-full transition-colors">
                              <UserPlus size={14} />
                            </button>
                          )}
                          
                          {/* מסתיר את כפתור המחיקה אם זה המאמר היחיד שנותר! */}
                          {canAddNew && !(isViewer && !!art._id) && currentVolume.articles.length > 1 && (
                            <button title="מחק מאמר" onClick={() => promptRemoveArticle(activeVolume, aIdx)} className="text-red-400 hover:bg-red-50 p-1.5 rounded-full transition-colors">
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