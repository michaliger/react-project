import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { UploadCloud, FileSpreadsheet, ArrowRight, Sparkles, Trash2, Download, AlertCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api';

const PREFIX_OPTIONS = [
  'כתבי עת ותקופונים', 'ספרי זכרון ויובל', 'ספרי קהילות', 'קבצי ישיבות', 'קבצי כוללים',
  'קבצי קהילות ובתי כנסת', 'הספדים ודרשות', 'קבצים משפחתיים', 'גנוזות וכתבי יד', 'קבצים בודדים', 'עלונים'
];

const cellClass = 'w-full border border-slate-300 rounded h-8 px-2 text-[12px]';

export default function AiTocUpload() {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const isAdmin = currentUser && currentUser.role === 'admin';

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [articles, setArticles] = useState(null);
  const [series, setSeries] = useState({
    prefixName: 'כתבי עת ותקופונים',
    fileName: '',
    volumeNumber: '1',
    volumeTitle: '',
    publicationYear: ''
  });

  if (!isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50" dir="rtl">
        <AlertTriangle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-black text-slate-800 mb-2">גישה נדחתה</h1>
        <p className="text-slate-600">אין לך הרשאות מנהל כדי לצפות בעמוד זה.</p>
      </div>
    );
  }

  const addFiles = (e) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    e.target.value = '';
  };

  const handleExtract = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      const res = await api.post('/ai/extract-toc', formData, { timeout: 180000 });
      const data = res.data?.data || {};

      setSeries(prev => ({
        ...prev,
        fileName: data.series?.fileName || prev.fileName,
        volumeNumber: data.volume?.volumeNumber || prev.volumeNumber,
        volumeTitle: data.volume?.volumeTitle || prev.volumeTitle,
        publicationYear: data.volume?.publicationYear || prev.publicationYear
      }));

      setArticles((data.articles || []).map(a => ({
        section: '', contentTitle: '', titlePrefix: '', firstName: '', lastName: '', startPage: '', note: '',
        ...a
      })));
    } catch (err) {
      setError(err.response?.data?.message || 'אירעה שגיאה. נא לנסות שוב.');
    } finally {
      setLoading(false);
    }
  };

  const updateArticle = (i, field, value) => {
    setArticles(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  };

  const removeArticle = (i) => setArticles(prev => prev.filter((_, idx) => idx !== i));

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();

    const headerRows = [{
      'אופי הכותר': series.prefixName,
      'שם הכותר': series.fileName,
      'שם מזהה': '',
      'פרטי הקובץ': '',
      'שם העורך': '',
      'מקום הוצאה': '',
      'מגזר': '',
      'גליונות חסרים': '',
      'הערות מנהל': '',
      'סטטוס': 'ממתין'
    }];

    const volumeRows = [{
      'מ"ס': series.volumeNumber,
      'שם גליון': series.volumeTitle,
      'נושא ראשי': '',
      'יצא לרגל': '',
      'עורך גליון': '',
      'שנה': series.publicationYear,
      'חודש': '',
      'סטטוס': 'ממתין',
      'שלמות קובץ': '',
      'שלמות סריקה': ''
    }];

    const articleRows = articles.map(a => ({
      'מ"ס גליון': series.volumeNumber,
      'כותרת המאמר': a.contentTitle,
      'תואר': a.titlePrefix,
      'פרטי': a.firstName,
      'משפחה': a.lastName,
      'תפקיד': '',
      'מדור': a.section,
      'על מקור': '',
      'נושאים': '',
      "עמ'": a.startPage,
      'הערות': a.note
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(headerRows), 'הכותר');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(volumeRows), 'הגליונות');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(articleRows), 'המאמרים');
    XLSX.writeFile(wb, `${series.fileName || 'תוכן-עניינים'}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
              <Sparkles size={30} color="#755303" />
              חילוץ תוכן עניינים בעזרת AI
            </h1>
            <p className="text-slate-600 text-sm mt-2">מעלים תמונות של תוכן העניינים, ומקבלים קובץ אקסל מוכן לייבוא</p>
          </div>
          <button onClick={() => navigate('/series')} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border shadow-sm font-bold text-slate-700">
            חזרה לספרייה <ArrowRight size={16} />
          </button>
        </div>

        {error && (
          <div className="rounded-lg p-4 flex items-start gap-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5' }}>
            <AlertCircle size={20} color="#dc2626" />
            <p className="text-sm flex-1" style={{ color: '#b91c1c' }}>{error}</p>
          </div>
        )}

        {/* שלב 1: העלאה */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-black text-slate-800 mb-3">1. העלאת תמונות</h2>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-8 cursor-pointer hover:bg-slate-50">
            <UploadCloud size={40} className="text-slate-400 mb-2" />
            <span className="font-bold text-slate-700">לחצי לבחירת תמונות או PDF</span>
            <span className="text-xs text-slate-500 mt-1">JPG, PNG, WebP או PDF. עד 10 קבצים, לפי סדר העמודים</span>
            <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={addFiles} />
          </label>

          {files.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-slate-700">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between bg-slate-50 rounded px-3 py-1.5">
                  <span>{i + 1}. {f.name}</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'transparent', border: 'none', color: '#dc2626' }}>הסר</button>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={handleExtract}
            disabled={loading || files.length === 0}
            className="custom-btn-style mt-4 px-6 py-2.5 rounded-lg font-black flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles size={18} />
            {loading ? 'קורא את התמונות... (עד דקה)' : 'חלץ את תוכן העניינים'}
          </button>
        </div>

        {/* שלב 2: בדיקה ותיקון */}
        {articles && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-black text-slate-800 mb-3">2. פרטי הקובץ והגליון</h2>
              <div className="grid grid-cols-5 gap-3 text-[12px] font-bold text-slate-700">
                <div>אופי הכותר
                  <select className={cellClass} value={series.prefixName} onChange={e => setSeries({ ...series, prefixName: e.target.value })}>
                    {PREFIX_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>שם הכותר<input className={cellClass} value={series.fileName} onChange={e => setSeries({ ...series, fileName: e.target.value })} /></div>
                <div>מספר גליון<input className={cellClass} value={series.volumeNumber} onChange={e => setSeries({ ...series, volumeNumber: e.target.value })} /></div>
                <div>שם גליון<input className={cellClass} value={series.volumeTitle} onChange={e => setSeries({ ...series, volumeTitle: e.target.value })} /></div>
                <div>שנה<input className={cellClass} value={series.publicationYear} onChange={e => setSeries({ ...series, publicationYear: e.target.value })} /></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-black text-slate-800 mb-1">3. בדיקה ותיקון ({articles.length} מאמרים)</h2>
              <p className="text-xs text-slate-500 mb-3">כדאי לעבור על הטבלה לפני ההורדה. אפשר לתקן כל תא ולמחוק שורות.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-slate-50 text-right">
                      <th className="p-2">#</th><th className="p-2">מדור</th><th className="p-2">כותרת המאמר</th>
                      <th className="p-2">תואר</th><th className="p-2">פרטי</th><th className="p-2">משפחה</th>
                      <th className="p-2">עמ'</th><th className="p-2">הערות</th><th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((a, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-1 text-slate-400 font-bold">{i + 1}</td>
                        <td className="p-1"><input className={cellClass} value={a.section} onChange={e => updateArticle(i, 'section', e.target.value)} /></td>
                        <td className="p-1" style={{ minWidth: 260 }}><input className={cellClass} value={a.contentTitle} onChange={e => updateArticle(i, 'contentTitle', e.target.value)} /></td>
                        <td className="p-1" style={{ width: 80 }}><input className={cellClass} value={a.titlePrefix} onChange={e => updateArticle(i, 'titlePrefix', e.target.value)} /></td>
                        <td className="p-1"><input className={cellClass} value={a.firstName} onChange={e => updateArticle(i, 'firstName', e.target.value)} /></td>
                        <td className="p-1"><input className={cellClass} value={a.lastName} onChange={e => updateArticle(i, 'lastName', e.target.value)} /></td>
                        <td className="p-1" style={{ width: 64 }}><input className={cellClass} value={a.startPage} onChange={e => updateArticle(i, 'startPage', e.target.value)} /></td>
                        <td className="p-1"><input className={cellClass} value={a.note} onChange={e => updateArticle(i, 'note', e.target.value)} /></td>
                        <td className="p-1">
                          <button onClick={() => removeArticle(i)} title="מחק שורה" style={{ background: 'transparent', border: 'none' }}>
                            <Trash2 size={16} color="#dc2626" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={downloadExcel} className="custom-btn-style mt-5 px-8 py-3 rounded-xl font-black text-lg flex items-center gap-2">
                <Download size={20} />
                הורדת קובץ אקסל
              </button>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <FileSpreadsheet size={14} /> הקובץ בנוי בדיוק כמו קובץ הייבוא הקיים (הכותר / הגליונות / המאמרים)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
