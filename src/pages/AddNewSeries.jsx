import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Plus, Trash2, Users, FileText, Database, CheckCircle2, Link2, Upload, X, UserPlus, Info } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useSelector } from 'react-redux';

const CompactField = ({ label, children, colSpan = '', widthClass = '', required = false }) => (
  <div className={`flex flex-col gap-0.5 ${colSpan} ${widthClass}`}>
    <label className="text-[11px] font-bold text-black mr-1 flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
)

const SERVER_BASE_URL = (import.meta.env.VITE_API_URL || 'https://node-project-cvek.onrender.com/api').replace(/\/api\/?$/, '');

export default function AddNewSeries() {
  const { currentUser } = useSelector((state) => state.user);
  const loggedInUser = currentUser || {};
  const hasUser = Object.keys(loggedInUser).length > 0;

  const isNotLoggedIn = !hasUser;
  const isAdmin = hasUser && loggedInUser.role === 'admin';
  const isViewer = hasUser && !isAdmin;
  const canAddNew = hasUser;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [seriesData, setSeriesData] = useState({
    name: '',
    fileName: '',
    type: 'כתב עת',
    publisher: '',
    editor: '',
    publicationPlace: '',
    startYear: '',
    endYear: '',
    frequency: '',
    description: '',
    coverImage: ''
  });

  const [volumes, setVolumes] = useState([]);
  const [activeVolume, setActiveVolume] = useState(0);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessageText, setSuccessMessageText] = useState('הנתונים נשמרו בהצלחה!');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editId) {
      api.get(`/series/id/${editId}`)
        .then(res => {
          if (res.data?.status === 'success' && res.data?.data?.series) {
            const s = res.data.data.series;
            setSeriesData({
              _id: s._id,
              name: s.name || '',
              fileName: s.fileName || '',
              type: s.type || 'כתב עת',
              publisher: s.publisher || '',
              editor: s.editor || '',
              publicationPlace: s.publicationPlace || '',
              startYear: s.startYear || '',
              endYear: s.endYear || '',
              frequency: s.frequency || '',
              description: s.description || '',
              coverImage: s.coverImage || ''
            });

            if (s.volumes && s.volumes.length > 0) {
              const formattedVolumes = s.volumes.map(v => ({
                _id: v._id,
                volumeNumber: v.volumeNumber || '',
                volumeTitle: v.title || '',
                formattedDate: v.formattedDate || '',
                hebrewDate: v.hebrewDate || '',
                pdfPath: v.pdfPath || '',
                articles: (v.articles || []).map(art => ({
                  _id: art._id,
                  autoId: art.serialNumber || '',
                  section: art.section || '',
                  title: art.contentTitle || '',
                  source: art.source || '',
                  page: art.startPage || '',
                  generalTopic: art.generalTopic || '',
                  linkedArticleId: art.linkedArticleId || '',
                  continuationInNextVolume: art.continuationInNextVolume || '',
                  authors: (art.authors || []).map(a => ({
                    titlePrefix: a.titlePrefix || '',
                    firstName: a.firstName || '',
                    lastName: a.lastName || '',
                    role: a.role || 'מחבר'
                  }))
                }))
              }));
              setVolumes(formattedVolumes);
            } else {
              setVolumes([{ volumeNumber: '1', volumeTitle: '', formattedDate: '', hebrewDate: '', pdfPath: '', articles: [] }]);
            }
          }
        })
        .catch(err => console.error('שגיאה בטעינת סדרה לעריכה', err));
    } else {
      setVolumes([{ volumeNumber: '1', volumeTitle: '', formattedDate: '', hebrewDate: '', pdfPath: '', articles: [] }]);
    }
  }, [editId]);

  const handleSeriesChange = (e) => {
    const { name, value } = e.target;
    setSeriesData(prev => ({ ...prev, [name]: value }));
  };

  const handleVolumeFieldChange = (vIdx, field, value) => {
    setVolumes(prev => prev.map((v, idx) => idx === vIdx ? { ...v, [field]: value } : v));
  };

  const handlePdfFileChange = (vIdx, e) => {
    const file = e.target.files[0];
    if (file) {
      setVolumes(prev => prev.map((v, idx) => idx === vIdx ? { ...v, pdfFile: file, pdfPath: file.name } : v));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const removeCoverImage = () => {
    setCoverFile(null);
    setCoverPreview('');
    setSeriesData(prev => ({ ...prev, coverImage: '' }));
  };

  const addVolumeBlock = () => {
    setVolumes(prev => {
      const nextNum = prev.length + 1;
      return [...prev, { volumeNumber: nextNum.toString(), volumeTitle: '', formattedDate: '', hebrewDate: '', pdfPath: '', articles: [] }];
    });
    setActiveVolume(volumes.length);
  };

  const promptRemoveVolume = (vIdx) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את כל הגליון הזה על כל מאמריו?')) {
      setVolumes(prev => prev.filter((_, idx) => idx !== vIdx));
      setActiveVolume(prev => (prev >= volumes.length - 1 ? Math.max(0, volumes.length - 2) : prev));
    }
  };

  const handleArticleFieldChange = (vIdx, aIdx, field, value) => {
    setVolumes(prev => prev.map((v, idx) => {
      if (idx !== vIdx) return v;
      const newArticles = v.articles.map((art, artIdx) => artIdx === aIdx ? { ...art, [field]: value } : art);
      return { ...v, articles: newArticles };
    }));
  };

  const addNewArticleRow = (vIdx) => {
    setVolumes(prev => prev.map((v, idx) => {
      if (idx !== vIdx) return v;
      const newArt = { autoId: '', section: '', title: '', source: '', page: '', generalTopic: '', linkedArticleId: '', continuationInNextVolume: '', authors: [{ titlePrefix: '', firstName: '', lastName: '', role: 'מחבר' }] };
      return { ...v, articles: [...v.articles, newArt] };
    }));
  };

  const promptRemoveArticle = (vIdx, aIdx) => {
    if (window.confirm('האם למחוק את שורת המאמר הזו?')) {
      setVolumes(prev => prev.map((v, idx) => {
        if (idx !== vIdx) return v;
        return { ...v, articles: v.articles.filter((_, artIdx) => artIdx !== aIdx) };
      }));
    }
  };

  const handleAuthorFieldChange = (vIdx, aIdx, authIdx, field, value) => {
    setVolumes(prev => prev.map((v, idx) => {
      if (idx !== vIdx) return v;
      const newArticles = v.articles.map((art, artIdx) => {
        if (artIdx !== aIdx) return art;
        const newAuthors = art.authors.map((auth, aRowIdx) => aRowIdx === authIdx ? { ...auth, [field]: value } : auth);
        return { ...art, authors: newAuthors };
      });
      return { ...v, articles: newArticles };
    }));
  };

  const addAuthorRow = (vIdx, aIdx) => {
    setVolumes(prev => prev.map((v, idx) => {
      if (idx !== vIdx) return v;
      const newArticles = v.articles.map((art, artIdx) => {
        if (artIdx !== aIdx) return art;
        return { ...art, authors: [...art.authors, { titlePrefix: '', firstName: '', lastName: '', role: 'מחבר' }] };
      });
      return { ...v, articles: newArticles };
    }));
  };

  const removeAuthorRow = (vIdx, aIdx, authIdx) => {
    setVolumes(prev => prev.map((v, idx) => {
      if (idx !== vIdx) return v;
      const newArticles = v.articles.map((art, artIdx) => {
        if (artIdx !== aIdx) return art;
        return { ...art, authors: art.authors.filter((_, aRowIdx) => aRowIdx !== authIdx) };
      });
      return { ...v, articles: newArticles };
    }));
  };

  const handleSaveAll = async () => {
    if (!seriesData.name.trim()) {
      alert('חובה להזין שם סדרה/כתב עת');
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      const payloadSeries = { ...seriesData, createdBy: loggedInUser._id };
      formData.append('seriesData', JSON.stringify(payloadSeries));

      const payloadVolumes = volumes.map(v => ({
        _id: v._id,
        volumeNumber: v.volumeNumber,
        volumeTitle: v.volumeTitle,
        formattedDate: v.formattedDate,
        hebrewDate: v.hebrewDate,
        pdfPath: v.pdfPath,
        articles: v.articles
      }));
      formData.append('volumes', JSON.stringify(payloadVolumes));

      if (coverFile) {
        formData.append('coverImage', coverFile);
      }

      volumes.forEach((v, index) => {
        if (v.pdfFile) {
          formData.append(`pdfFile_${index}`, v.pdfFile);
        }
      });

      const response = await api.post('/series/save-full-catalog', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.status === 'success') {
        setSuccessMessageText(editId ? 'הקטלוג עודכן בהצלחה!' : 'הקטלוג החדש נוצר ונשמר בהצלחה במערכת!');
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
          navigate('/series');
        }, 2500);
      }
    } catch (error) {
      console.error('שגיאה בשמירת הקטלוג המלא', error);
      alert('אירעה שגיאה בשמירת הנתונים.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentVolumeData = volumes[activeVolume] || { volumeNumber: '', volumeTitle: '', formattedDate: '', hebrewDate: '', articles: [] };
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-3 md:p-6 select-none font-sans max-w-[1600px] mx-auto" dir="rtl">
      <header className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {editId ? 'עריכת סדרה וניהול קטלוג מלא' : 'הוספת סדרה וניהול קטלוג מובנה'}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">ממשק אחיד להזנת סדרות, כרכים ומאמרים</p>
          </div>
        </div>
        
        {canAddNew && (
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all transform active:scale-95 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <CheckCircle2 size={16} />
            {isSubmitting ? 'שומר נתונים...' : 'שמור קטלוג מלא'}
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <div className="xl:col-span-1 space-y-5">
          <section className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <Info size={16} className="text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-sm">מאפייני הסדרה / האוסף</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CompactField label="שם הסדרה / כתב העת" colSpan="col-span-2" required>
                <input type="text" name="name" value={seriesData.name} onChange={handleSeriesChange} disabled={isViewer && !!editId} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:border-indigo-500 transition-colors font-medium" />
              </CompactField>

              <CompactField label="שם ייחודי באנגלית (Slug)" colSpan="col-span-2">
                <input type="text" name="fileName" value={seriesData.fileName} onChange={handleSeriesChange} disabled={isViewer && !!editId} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:border-indigo-500 transition-colors font-medium text-left" dir="ltr" />
              </CompactField>

              <CompactField label="סוג הכותר">
                <select name="type" value={seriesData.type} onChange={handleSeriesChange} disabled={isViewer && !!editId} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:border-indigo-500 transition-colors font-medium">
                  <option value="כתב עת">כתב עת</option>
                  <option value="סדרת ספרים">סדרת ספרים</option>
                  <option value="קובץ תורני">קובץ תורני</option>
                  <option value="אנציקלופדיה">אנציקלופדיה</option>
                </select>
              </CompactField>

              <CompactField label="תדירות יציאה">
                <input type="text" name="frequency" value={seriesData.frequency} onChange={handleSeriesChange} disabled={isViewer && !!editId} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:border-indigo-500 transition-colors font-medium" />
              </CompactField>

              <CompactField label="מוציא לאור / מכון">
                <input type="text" name="publisher" value={seriesData.publisher} onChange={handleSeriesChange} disabled={isViewer && !!editId} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:border-indigo-500 transition-colors font-medium" />
              </CompactField>

              <CompactField label="עורך ראשי / מערכת">
                <input type="text" name="editor" value={seriesData.editor} onChange={handleSeriesChange} disabled={isViewer && !!editId} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:border-indigo-500 transition-colors font-medium" />
              </CompactField>

              <CompactField label="שנת תחילת הופעה">
                <input type="text" name="startYear" value={seriesData.startYear} onChange={handleSeriesChange} disabled={isViewer && !!editId} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-center" />
              </CompactField>

              <CompactField label="שנת סיום">
                <input type="text" name="endYear" value={seriesData.endYear} onChange={handleSeriesChange} disabled={isViewer && !!editId} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-center" />
              </CompactField>

              <CompactField label="מקום הוצאה" colSpan="col-span-2">
                <input type="text" name="publicationPlace" value={seriesData.publicationPlace} onChange={handleSeriesChange} disabled={isViewer && !!editId} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium" />
              </CompactField>

              <CompactField label="תיאור כללי / רקע" colSpan="col-span-2">
                <textarea name="description" value={seriesData.description} onChange={handleSeriesChange} disabled={isViewer && !!editId} rows={3} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:border-indigo-500 transition-colors font-medium resize-none" />
              </CompactField>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <Upload size={16} className="text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-sm">כריכת הסדרה / לוגו</h2>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors group relative min-h-[220px]">
              {coverPreview || seriesData.coverImage ? (
                <div className="relative w-full h-[180px] flex items-center justify-center">
                  <img 
                    src={coverPreview || (seriesData.coverImage?.startsWith('http') ? seriesData.coverImage : `${SERVER_BASE_URL}/uploads/${seriesData.coverImage}`)} 
                    className="h-full w-full object-contain" 
                    alt="כריכה" 
                  />
                  {canAddNew && !(isViewer && !!editId) && (
                    <button type="button" onClick={removeCoverImage} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full py-8">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-400 group-hover:text-indigo-500 transition-all">
                    <Upload size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">לחץ להעלאת תמונה</span>
                  <input type="file" accept="image/*" onChange={handleCoverChange} disabled={isViewer && !!editId} className="hidden" />
                </label>
              )}
            </div>
          </section>
        </div>

        <div className="xl:col-span-2 space-y-5">
          <section className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-sm">כרכים / גליונות בסדרה</h2>
              </div>
              {canAddNew && !(isViewer && !!editId) && (
                <button type="button" onClick={addVolumeBlock} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-xs font-bold transition-colors">
                  <Plus size={14} />
                  הוסף גליון חדש
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-1 bg-slate-50 border border-slate-100 rounded-lg">
              {volumes.map((v, idx) => (
                <div key={idx} className={`group flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold border transition-all cursor-pointer ${activeVolume === idx ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600'}`} onClick={() => setActiveVolume(idx)}>
                  <span>גליון {v.volumeNumber || (idx + 1)}</span>
                  {v.volumeTitle && <span className="opacity-60 max-w-[80px] truncate">- {v.volumeTitle}</span>}
                  {canAddNew && volumes.length > 1 && !(isViewer && !!editId) && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); promptRemoveVolume(idx); }} className="p-0.5 rounded text-slate-400 hover:text-red-500 mr-1">
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {volumes.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-4 p-3 bg-slate-50/50 border border-slate-100 rounded-xl items-end">
                <CompactField label="מספר גליון / כרך">
                  <input type="text" value={currentVolumeData.volumeNumber} onChange={(e) => handleVolumeFieldChange(activeVolume, 'volumeNumber', e.target.value)} disabled={isViewer && !!currentVolumeData._id} className="w-full text-center py-1 border border-slate-200 rounded text-xs font-bold bg-slate-50/50" />
                </CompactField>

                <CompactField label="כותרת ספציפית לגליון" colSpan="col-span-2">
                  <input type="text" value={currentVolumeData.volumeTitle} onChange={(e) => handleVolumeFieldChange(activeVolume, 'volumeTitle', e.target.value)} disabled={isViewer && !!currentVolumeData._id} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium" />
                </CompactField>

                <CompactField label="שנה לועזית / תאריך">
                  <input type="text" value={currentVolumeData.formattedDate} onChange={(e) => handleVolumeFieldChange(activeVolume, 'formattedDate', e.target.value)} disabled={isViewer && !!currentVolumeData._id} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-center" />
                </CompactField>

                <CompactField label="תאריך עברי">
                  <input type="text" value={currentVolumeData.hebrewDate} onChange={(e) => handleVolumeFieldChange(activeVolume, 'hebrewDate', e.target.value)} disabled={isViewer && !!currentVolumeData._id} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-center" />
                </CompactField>

                <div className="col-span-3 flex items-center gap-3 bg-white p-2 border border-slate-200/80 rounded-lg shadow-sm h-[34px]">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold truncate flex-1">
                    <Link2 size={14} className="text-indigo-500 shrink-0" />
                    {currentVolumeData.pdfPath ? (
                      <span className="text-slate-700 truncate">{currentVolumeData.pdfPath}</span>
                    ) : (
                      <span className="text-slate-400 font-medium">טרם הועלה קובץ PDF לגליון זה</span>
                    )}
                  </div>
                  {canAddNew && !(isViewer && !!currentVolumeData._id) && (
                    <label className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-md text-[11px] font-bold cursor-pointer transition-colors shrink-0">
                      בחר קובץ PDF
                      <input type="file" accept="application/pdf" onChange={(e) => handlePdfFileChange(activeVolume, e)} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-sm">
                  מפתח מאמרים ומחברים - <span className="text-indigo-600 font-black">גליון {currentVolumeData.volumeNumber || (activeVolume + 1)}</span>
                </h2>
              </div>
              {canAddNew && volumes.length > 0 && !(isViewer && !!currentVolumeData._id) && (
                <button type="button" onClick={() => addNewArticleRow(activeVolume)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold transition-colors">
                  <Plus size={14} />
                  הוסף שורת מאמר
                </button>
              )}
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl bg-slate-50/20">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                    <th className="p-2.5 w-[55px] text-center">מזהה</th>
                    <th className="p-2.5 w-[90px]">מדור</th>
                    <th className="p-2.5 min-w-[200px]">כותרת המאמר / התוכן</th>
                    <th className="p-2.5 min-w-[280px]">מחברים ותפקיד</th>
                    <th className="p-2.5 w-[65px] text-center">עמ'</th>
                    <th className="p-2.5 w-[100px]">נושא כללי</th>
                    <th className="p-2.5 w-[45px] text-center">פעולה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(!currentVolumeData.articles || currentVolumeData.articles.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium bg-white">
                        אין מאמרים רשומים בגליון זה.
                      </td>
                    </tr>
                  ) : currentVolumeData.articles.map((art, aIdx) => (
                    <tr key={aIdx} className="bg-white hover:bg-slate-50/70 transition-colors align-top group">
                      <td className="p-2 text-center">
                        <input type="text" value={art.autoId} onChange={(e) => handleArticleFieldChange(activeVolume, aIdx, 'autoId', e.target.value)} disabled={isViewer && !!art._id} className="w-full text-center py-1 border border-slate-200 rounded text-xs font-bold bg-slate-50/50" />
                      </td>

                      <td className="p-2">
                        <input type="text" value={art.section} onChange={(e) => handleArticleFieldChange(activeVolume, aIdx, 'section', e.target.value)} disabled={isViewer && !!art._id} className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs" />
                      </td>

                      <td className="p-2">
                        <textarea value={art.title} onChange={(e) => handleArticleFieldChange(activeVolume, aIdx, 'title', e.target.value)} disabled={isViewer && !!art._id} rows={1} className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs font-bold resize-y min-h-[28px] max-h-[80px]" />
                      </td>

                      <td className="p-2 bg-slate-50/30">
                        <div className="space-y-1.5">
                          {art.authors.map((auth, authIdx) => (
                            <div key={authIdx} className="flex items-center gap-1 bg-white p-1 rounded border border-slate-100 shadow-2xs">
                              <input type="text" value={auth.titlePrefix} onChange={(e) => handleAuthorFieldChange(activeVolume, aIdx, authIdx, 'titlePrefix', e.target.value)} disabled={isViewer && !!art._id} className="w-[40px] text-center py-0.5 border border-slate-200 rounded text-[11px]" placeholder="תואר" />
                              <input type="text" value={auth.firstName} onChange={(e) => handleAuthorFieldChange(activeVolume, aIdx, authIdx, 'firstName', e.target.value)} disabled={isViewer && !!art._id} className="w-full min-w-[55px] px-1 py-0.5 border border-slate-200 rounded text-[11px]" placeholder="שם" />
                              <input type="text" value={auth.lastName} onChange={(e) => handleAuthorFieldChange(activeVolume, aIdx, authIdx, 'lastName', e.target.value)} disabled={isViewer && !!art._id} className="w-full min-w-[65px] px-1 py-0.5 border border-slate-200 rounded text-[11px]" placeholder="משפחה" />
                              
                              <select value={auth.role} onChange={(e) => handleAuthorFieldChange(activeVolume, aIdx, authIdx, 'role', e.target.value)} disabled={isViewer && !!art._id} className="w-[70px] py-0.5 border border-slate-200 rounded text-[11px] bg-slate-50 font-bold">
                                <option value="מחבר">מחבר</option>
                                <option value="מגיב">מגיב</option>
                                <option value="מתרגם">מתרגם</option>
                                <option value="עורך">עורך</option>
                              </select>

                              {canAddNew && art.authors.length > 1 && !(isViewer && !!art._id) && (
                                <button type="button" onClick={() => removeAuthorRow(activeVolume, aIdx, authIdx)} className="text-red-400 hover:text-red-600 p-0.5 transition-colors">
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-2 text-center">
                        <input type="number" min={1} value={art.page} onChange={(e) => handleArticleFieldChange(activeVolume, aIdx, 'page', e.target.value)} disabled={isViewer && !!art._id} className="w-full text-center py-1 border border-slate-200 rounded text-xs text-indigo-600 font-bold" />
                      </td>

                      <td className="p-2">
                        <input type="text" value={art.generalTopic} onChange={(e) => handleArticleFieldChange(activeVolume, aIdx, 'generalTopic', e.target.value)} disabled={isViewer && !!art._id} className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs" />
                      </td>

                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1 h-full min-h-[28px]">
                          {canAddNew && !(isViewer && !!art._id) && (
                            <button type="button" title="הוסף מחבר" onClick={() => addAuthorRow(activeVolume, aIdx)} className="text-indigo-600 hover:bg-indigo-100 p-1.5 rounded-full transition-colors">
                              <UserPlus size={14} />
                            </button>
                          )}
                          {canAddNew && !(isViewer && !!art._id) && (
                            <button type="button" title="מחק מאמר" onClick={() => promptRemoveArticle(activeVolume, aIdx)} className="text-red-400 hover:bg-red-50 p-1.5 rounded-full transition-colors">
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
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {successMessageText}
        </div>
      )}
    </div>
  )
}