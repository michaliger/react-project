import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { UploadCloud, FileSpreadsheet, ArrowRight, Sparkles, Trash2, Download, AlertCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api';

// ===BUILD_START=== (פונקציות עזר - בלי React)

const PREFIX_OPTIONS = [
  'כתבי עת ותקופונים', 'ספרי זכרון ויובל', 'ספרי קהילות', 'קבצי ישיבות', 'קבצי כוללים',
  'קבצי קהילות ובתי כנסת', 'הספדים ודרשות', 'קבצים משפחתיים', 'גנוזות וכתבי יד', 'קבצים בודדים', 'עלונים'
];

// המבנה זהה לקובץ "אור ישראל (מאנסי)": אותם טאבים, אותן עמודות ובאותו סדר
const HEADER_COLS = ['מ"ס', 'אופי הכותר', 'שם הכותר', 'שם מזהה', 'פרטי הקובץ', 'שם העורך', 'מקום הוצאה', 'השתייכות', 'סטטוס', 'גליונות חסרים', 'הערות מנהל', 'הוזן ע"י'];
const VOLUME_COLS = ['מ"ס', 'שם גליון', 'נושא ראשי', 'יצא לרגל', 'עורך גליון', 'שנה', 'חודש', 'הערות מערכת'];
const ARTICLE_COLS = ['מ"ס', 'תואר', 'משפחה', 'פרטי', 'תפקיד', 'מדור', 'כותרת המאמר', 'על מקור', 'נושאים', 'מ"ס גליון', "עמ'", 'קישור', 'הערות'];

const safeName = (s) => (s || '').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();

const volumeNumberValue = (v) => {
  const s = String(v ?? '').trim() || '1';
  return /^\d+$/.test(s) ? Number(s) : s;
};

// שם הקובץ להורדה: "שם הכותר - כרך"
const buildFileName = (series) => {
  const vt = (series.volumeTitle || '').trim();
  const label = vt ? (vt.length <= 4 ? `כרך ${vt}` : vt) : `כרך ${series.volumeNumber || 1}`;
  return `${[safeName(series.fileName), safeName(label)].filter(Boolean).join(' - ') || 'תוכן-עניינים'}.xlsx`;
};

const buildWorkbook = (series, articles) => {
  const volNum = volumeNumberValue(series.volumeNumber);

  const headerRows = [{
    'אופי הכותר': series.prefixName,
    'שם הכותר': series.fileName,
    'שם מזהה': series.identifierName
  }];

  const volumeRows = [{
    'מ"ס': volNum,
    'שם גליון': series.volumeTitle,
    'שנה': series.publicationYear
  }];

  const articleRows = articles.map(a => ({
    'תואר': a.titlePrefix,
    'משפחה': a.lastName,   // תחת "משפחה" - שם משפחה
    'פרטי': a.firstName,   // תחת "פרטי" - שם פרטי
    'מדור': a.section,
    'כותרת המאמר': a.contentTitle,
    'מ"ס גליון': volNum,
    "עמ'": a.startPage,
    'הערות': a.note
  }));

  const wb = XLSX.utils.book_new();
  const add = (rows, cols, name, widths) => {
    const ws = XLSX.utils.json_to_sheet(rows, { header: cols }); // header = כופה את סדר העמודות
    ws['!cols'] = widths.map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  };
  add(headerRows, HEADER_COLS, 'הכותר', [8, 20, 24, 18, 30, 16, 14, 14, 10, 14, 14, 12]);
  add(volumeRows, VOLUME_COLS, 'הגליונות', [8, 18, 14, 12, 24, 10, 10, 16]);
  add(articleRows, ARTICLE_COLS, 'המאמרים', [8, 10, 16, 18, 10, 18, 60, 14, 14, 10, 8, 10, 24]);

  wb.Workbook = { Views: [{ RTL: true }] }; // גליון מימין לשמאל, כמו בקובץ אור ישראל
  return wb;
};

const normalizeArticle = (a) => ({
  section: '', contentTitle: '', titlePrefix: '', firstName: '', lastName: '', startPage: '', note: '',
  ...a
});

// מאחד תוצאות של כמה עמודים (לפי הסדר). מאמרים בתחילת עמוד שאין להם מדור
// ממשיכים את המדור האחרון של העמוד הקודם.
const mergePages = (results) => {
  const merged = [];
  let carry = '';
  let series = {};
  let volume = {};
  results.forEach((r) => {
    if (!r) return;
    series = { ...series, ...Object.fromEntries(Object.entries(r.series || {}).filter(([, v]) => v)) };
    volume = { ...volume, ...Object.fromEntries(Object.entries(r.volume || {}).filter(([, v]) => v)) };
    const arts = (r.articles || []).map(normalizeArticle);
    for (let i = 0; i < arts.length && !arts[i].section; i++) arts[i].section = carry;
    if (arts.length) carry = arts[arts.length - 1].section || carry;
    merged.push(...arts);
  });
  return { series, volume, articles: merged };
};

// ===BUILD_END===

// מקטין תמונות גדולות לפני ההעלאה (מהיר יותר, והקריאה לא נפגעת)
async function shrinkImage(file) {
  if (!file.type.startsWith('image/') || file.size < 400 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

const requestOnce = async (file) => {
  const fd = new FormData();
  fd.append('files', file);
  const res = await api.post('/ai/extract-toc', fd, { timeout: 150000 });
  return res.data?.data || {};
};

const requestWithRetry = async (file) => {
  try {
    return await requestOnce(file);
  } catch (err) {
    const status = err.response?.status;
    if (!err.response || status === 429 || status === 500 || status === 504) {
      await new Promise(r => setTimeout(r, 5000));
      return await requestOnce(file);
    }
    throw err;
  }
};

const cellClass = 'w-full border border-slate-300 rounded h-8 px-2 text-[12px]';

export default function AiTocUpload() {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const isAdmin = currentUser && currentUser.role === 'admin';

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, done: 0, total: 0, seconds: 0 });
  const [error, setError] = useState(null);
  const [articles, setArticles] = useState(null);
  const [series, setSeries] = useState({
    prefixName: 'כתבי עת ותקופונים',
    fileName: '',
    identifierName: '',
    volumeNumber: '1',
    volumeTitle: '',
    publicationYear: ''
  });
  const timerRef = useRef(null);
  useEffect(() => () => clearInterval(timerRef.current), []);

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
    if (files.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    setArticles(null);

    const total = files.length;
    const t0 = Date.now();
    const startedAt = new Array(total).fill(null);
    const finished = new Array(total).fill(false);
    const results = new Array(total).fill(null);
    const failed = [];

    // אחוזים: עמוד שהסתיים = 100%, עמוד שבתהליך מתקדם לאט עד 90%
    const tick = () => {
      const now = Date.now();
      let sum = 0;
      let done = 0;
      for (let i = 0; i < total; i++) {
        if (finished[i]) { sum += 1; done++; }
        else if (startedAt[i]) sum += 0.9 * (1 - Math.exp(-(now - startedAt[i]) / 20000));
      }
      setProgress({ percent: Math.round((sum / total) * 100), done, total, seconds: Math.round((now - t0) / 1000) });
    };
    tick();
    timerRef.current = setInterval(tick, 400);

    let next = 0;
    const worker = async () => {
      while (next < total) {
        const i = next++;
        startedAt[i] = Date.now();
        try {
          const small = await shrinkImage(files[i]);
          results[i] = await requestWithRetry(small);
        } catch (err) {
          failed.push({ name: files[i].name, message: err.response?.data?.message || 'שגיאה בקריאת הקובץ' });
        }
        finished[i] = true;
        tick();
      }
    };

    try {
      await Promise.all(Array.from({ length: Math.min(3, total) }, worker));
    } finally {
      clearInterval(timerRef.current);
      setLoading(false);
    }

    const merged = mergePages(results);
    if (merged.articles.length === 0 && failed.length > 0) {
      setError(failed[0].message);
      return;
    }

    setSeries(prev => ({
      ...prev,
      fileName: merged.series.fileName || prev.fileName,
      volumeNumber: merged.volume.volumeNumber || prev.volumeNumber,
      volumeTitle: merged.volume.volumeTitle || prev.volumeTitle,
      publicationYear: merged.volume.publicationYear || prev.publicationYear
    }));
    setArticles(merged.articles);
    if (failed.length > 0) {
      setError(`לא הצלחנו לקרוא: ${failed.map(f => f.name).join(', ')}. אפשר להעלות אותם שוב בנפרד. (${failed[0].message})`);
    }
  };

  const updateArticle = (i, field, value) => {
    setArticles(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  };

  const removeArticle = (i) => setArticles(prev => prev.filter((_, idx) => idx !== i));

  const canDownload = series.fileName.trim() !== '';

  const downloadExcel = () => {
    if (!canDownload) return;
    XLSX.writeFile(buildWorkbook(series, articles), buildFileName(series));
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
            <span className="text-xs text-slate-500 mt-1">JPG, PNG, WebP או PDF. עד 10 קבצים, לפי סדר העמודים. כל עמוד נקרא בנפרד, במקביל</span>
            <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={addFiles} />
          </label>

          {files.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-slate-700">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between bg-slate-50 rounded px-3 py-1.5">
                  <span>{i + 1}. {f.name}</span>
                  <button disabled={loading} onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'transparent', border: 'none', color: '#dc2626' }}>הסר</button>
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
            {loading ? 'קורא את העמודים...' : 'חלץ את תוכן העניינים'}
          </button>

          {loading && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm font-bold mb-1" style={{ color: '#4a3402' }}>
                <span>הושלמו {progress.done} מתוך {progress.total} עמודים</span>
                <span>{progress.percent}%</span>
              </div>
              <div style={{ height: 12, backgroundColor: '#e7dcc0', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${progress.percent}%`, height: '100%', backgroundColor: '#755303', transition: 'width 0.4s ease' }} />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                התוכנה עובדת, אין צורך ללחוץ שוב. עברו {progress.seconds} שניות. בדרך כלל זה לוקח חצי דקה עד דקה לכל עמוד.
              </p>
            </div>
          )}
        </div>

        {/* שלב 2: בדיקה ותיקון */}
        {articles && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-black text-slate-800 mb-3">2. פרטי הקובץ והגליון</h2>
              <div className="grid grid-cols-6 gap-3 text-[12px] font-bold text-slate-700">
                <div>אופי הכותר
                  <select className={cellClass} value={series.prefixName} onChange={e => setSeries({ ...series, prefixName: e.target.value })}>
                    {PREFIX_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>שם הכותר (חובה)<input className={cellClass} style={!canDownload ? { borderColor: '#dc2626' } : {}} value={series.fileName} onChange={e => setSeries({ ...series, fileName: e.target.value })} /></div>
                <div>שם מזהה<input className={cellClass} value={series.identifierName} onChange={e => setSeries({ ...series, identifierName: e.target.value })} /></div>
                <div>מ"ס גליון<input className={cellClass} value={series.volumeNumber} onChange={e => setSeries({ ...series, volumeNumber: e.target.value })} /></div>
                <div>שם גליון<input className={cellClass} value={series.volumeTitle} onChange={e => setSeries({ ...series, volumeTitle: e.target.value })} /></div>
                <div>שנה<input className={cellClass} value={series.publicationYear} onChange={e => setSeries({ ...series, publicationYear: e.target.value })} /></div>
              </div>
              {!canDownload && (
                <p className="text-xs mt-2" style={{ color: '#b91c1c' }}>יש למלא את שם הכותר כדי שאפשר יהיה להוריד את הקובץ.</p>
              )}
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

              <button
                onClick={downloadExcel}
                disabled={!canDownload}
                className="custom-btn-style mt-5 px-8 py-3 rounded-xl font-black text-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Download size={20} />
                הורדת קובץ אקסל
              </button>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <FileSpreadsheet size={14} /> שם הקובץ שיורד: {buildFileName(series)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
