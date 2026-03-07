import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Search, Plus, BookOpen, FileText, ExternalLink, Edit3, Eye, User, Layers, Book } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ==========================================
// 1. אלגוריתם למציאת שגיאות כתיב
// ==========================================
const getEditDistance = (a, b) => {
  if (!a) return b?.length || 0;
  if (!b) return a?.length || 0;
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[b.length][a.length];
};

// ==========================================
// 2. פונקציית החיפוש החכמה
// ==========================================
const isSmartMatch = (textArray, query) => {
  if (!query) return true;
  const text = textArray.filter(Boolean).join(' ').toLowerCase();
  const q = query.toString().toLowerCase().trim();
  if (!text) return false;
  if (text.includes(q)) return true;
  
  const textWords = text.split(/\s+/);
  const queryWords = q.split(/\s+/);
  
  return queryWords.every(qWord => {
    return textWords.some(tWord => {
      if (tWord.includes(qWord)) return true;
      if (qWord.length >= 5) {
        return getEditDistance(tWord, qWord) <= 1;
      }
      return false;
    });
  });
};

export default function LibraryApp() {
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isGuest = loggedInUser.role === 'viewer';
  const [allSeries, setAllSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [activeVolIdx, setActiveVolIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('series');

  const navigate = useNavigate();

  const fetchSeries = () => {
    setLoading(true);
    fetch('http://localhost:5000/api/series')
      .then(res => res.json())
      .then(result => {
        const seriesArray = result?.data?.series || [];
        setAllSeries(seriesArray);
        if (seriesArray.length > 0 && !selectedSeries) setSelectedSeries(seriesArray[0]);
        setLoading(false);
      }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  const handleDeleteSeries = async (id) => {
    if (window.confirm("האם את בטוחה שברצונך למחוק את כל הסדרה וכל תוכן הכרכים שלה? פעולה זו אינה הפיכה.")) {
      try {
        const response = await fetch(`http://localhost:5000/api/series/id/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setAllSeries(prev => prev.filter(s => s._id !== id));
          setSelectedSeries(null);
          alert("הסדרה נמחקה בהצלחה");
        } else throw new Error();
      } catch (err) { alert("שגיאה במחיקת הסדרה. וודאי שהשרת פועל."); }
    }
  };

  useEffect(() => { setActiveVolIdx(0); }, [selectedSeries]);

  const filteredData = useMemo(() => {
    const term = searchTerm;

    if (activeTab === 'series') {
      return allSeries.filter(s =>
        isSmartMatch([
          s.prefixName, s.fileName, s.identifierName, s.details, 
          s.editor, s.publicationPlace, s.sector, s.adminNotes, 
          s.missingVolumesList, s.catalogStatus, s.enteredBy
        ], term)
      ).map(s => ({ ...s, type: 'series' }));

    } else if (activeTab === 'volume') {
      const volumesList = [];
      allSeries.forEach(s => {
        if (s.volumes && s.volumes.length > 0) {
          s.volumes.forEach((v, vIdx) => {
             const volTitle = v.volumeTitle || v.title || `גליון ${v.volumeNumber || vIdx + 1}`;
             if (isSmartMatch([volTitle, v.volumeNumber, v.booklet, v.mainTopic, v.publishedFor, v.publicationYear, v.publicationPeriod, v.coverType, v.volumeSize, v.fileCompleteness, v.scanCompleteness, v.articlesCatalogStatus], term)) {
               volumesList.push({ ...v, seriesId: s._id, seriesName: `${s.prefixName || ''} ${s.fileName || ''}`, originalSeries: s, volIndex: vIdx, type: 'volume' });
             }
          });
        }
      });
      return volumesList;

    } else if (activeTab === 'article') {
      const articlesList = [];
      allSeries.forEach(s => {
        if (s.volumes && s.volumes.length > 0) {
          s.volumes.forEach((v, vIdx) => {
            if (v.articles && v.articles.length > 0) {
              v.articles.forEach(art => {
                const artTitle = art.contentTitle || art.title || '';
                const authorNames = art.authors ? art.authors.map(a => `${a.titlePrefix || ''} ${a.firstName || ''} ${a.lastName || ''} ${a.role || ''}`).join(' ') : '';
                if (isSmartMatch([artTitle, authorNames, art.generalTopic, art.source, art.startPage, art.page, art.linkExplanation], term)) {
                   articlesList.push({ ...art, seriesId: s._id, seriesName: `${s.prefixName || ''} ${s.fileName || ''}`, volTitle: v.volumeTitle || v.title || `גליון ${v.volumeNumber || vIdx + 1}`, originalSeries: s, volIndex: vIdx, type: 'article' });
                }
              });
            }
          });
        }
      });
      return articlesList;
    }
    return [];
  }, [searchTerm, allSeries, activeTab]);

  const handleResultClick = (item) => {
    if (item.type === 'series') {
      setSelectedSeries(item);
      setActiveVolIdx(0);
    } else if (item.type === 'volume' || item.type === 'article') {
      setSelectedSeries(item.originalSeries);
      setActiveVolIdx(item.volIndex);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 mb-2"></div>
      <p className="text-gray-600 text-sm font-medium">טוען נתונים...</p>
    </div>
  );

  const currentVol = selectedSeries?.volumes?.[activeVolIdx];

  return (
    <div className="h-screen bg-gray-200 text-gray-800 font-sans flex overflow-hidden selection:bg-blue-200" dir="rtl">
      
      <aside className="w-[300px] border-l border-gray-300 flex flex-col bg-white shrink-0 shadow-sm z-10">
        <div className="p-2 border-b border-gray-300 bg-gray-50">
          
          {/* כפתור הוספת סדרה גלוי לכולם */}
          <button
            onClick={() => navigate('/add-series')}
            className="w-full mb-2 flex items-center justify-center gap-1.5 py-1.5 bg-blue-800 hover:bg-blue-900 text-white text-[12px] font-bold rounded transition-colors"
          >
            <Plus size={14} /> הוספת סדרה חדשה
          </button>

          <div className="flex bg-gray-200 p-0.5 rounded mb-2">
            <button onClick={() => { setActiveTab('series'); setSearchTerm(""); }} className={`flex-1 py-1 text-[11px] font-bold rounded-sm flex justify-center items-center gap-1 ${activeTab === 'series' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>סדרות</button>
            <button onClick={() => { setActiveTab('volume'); setSearchTerm(""); }} className={`flex-1 py-1 text-[11px] font-bold rounded-sm flex justify-center items-center gap-1 ${activeTab === 'volume' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>כרכים</button>
            <button onClick={() => { setActiveTab('article'); setSearchTerm(""); }} className={`flex-1 py-1 text-[11px] font-bold rounded-sm flex justify-center items-center gap-1 ${activeTab === 'article' ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>מאמרים</button>
          </div>

          <div className="relative">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input type="text" placeholder="חיפוש..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-300 pr-7 pl-2 py-1.5 rounded text-[12px] outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {filteredData.length > 0 ? filteredData.map((item, idx) => {
            if (item.type === 'series') {
              const isActive = selectedSeries?._id === item._id;
              return (
                <button key={item._id} onClick={() => handleResultClick(item)} className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all border ${isActive ? 'bg-[#f0f4f8] border-[#93c5fd]' : 'border-transparent bg-white hover:bg-slate-50 border-slate-100 shadow-sm'}`}>
                  <div className="w-7 h-10 bg-white rounded border border-slate-200 shrink-0 overflow-hidden">
                    <img src={item.coverImage ? `http://localhost:5000/uploads/${item.coverImage}` : "/books.jpg"} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.onerror = null; e.target.src = "/books.jpg"; }} />
                  </div>
                  <div className="text-right overflow-hidden flex-1">
                    <h3 className={`font-bold text-[12px] truncate leading-tight ${isActive ? 'text-[#1e3a8a]' : 'text-slate-800'}`}>{item.prefixName} {item.fileName}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><User size={9} /> {item.editor || 'עורך לא צוין'}</p>
                  </div>
                </button>
              );
            } else if (item.type === 'volume') {
                return (
                  <button key={`${item.seriesId}-${idx}`} onClick={() => handleResultClick(item)} className="w-full text-right p-2.5 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors shadow-sm group">
                    <div className="text-[10px] text-[#1e3a8a] font-bold mb-0.5 truncate">{item.seriesName}</div>
                    <div className="font-bold text-[12px] text-slate-800 truncate">{item.volumeTitle || item.title || `גליון ${item.volumeNumber}`}</div>
                  </button>
                )
            } else if (item.type === 'article') {
                 return (
                  <button key={`${item.seriesId}-${idx}`} onClick={() => handleResultClick(item)} className="w-full text-right p-2.5 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors shadow-sm group">
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="text-[9px] text-slate-400 font-bold truncate flex-1">{item.seriesName} / {item.volTitle}</div>
                      {item.startPage && <div className="text-[9px] bg-slate-100 px-1 rounded text-slate-500 shrink-0 mr-1">עמ' {item.startPage}</div>}
                    </div>
                    <div className="font-bold text-[12px] text-slate-800 group-hover:text-[#1e3a8a] leading-tight truncate">{item.contentTitle || item.title}</div>
                  </button>
                )
            }
            return null;
          }) : (
            <div className="text-center p-6 text-slate-400 text-[12px]">לא נמצאו תוצאות</div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedSeries ? (
          <>
            <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-[#1e3a8a] p-2 rounded-lg text-white shadow-sm"><BookOpen size={20} /></div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">{selectedSeries.prefixName} {selectedSeries.fileName}</h2>
                  <div className="flex gap-3 mt-0.5">
                    {selectedSeries.sector && <span className="text-[10px] font-bold text-[#1e3a8a] bg-blue-50 px-1.5 rounded">{selectedSeries.sector}</span>}
                    <span className="text-[11px] text-slate-500 font-medium">עורך: {selectedSeries.editor} | {selectedSeries.publicationPlace}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {/* מוסתר לאורח: עריכה ומחיקה של סדרה */}
                {!isGuest && (
                  <>
                    <button onClick={() => navigate(`/add-series?edit=${selectedSeries._id}`)} className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-[12px] font-bold hover:bg-slate-50 transition-colors shadow-sm">
                      <Edit3 size={14} /> עדכון פרטי סדרה
                    </button>
                    <button onClick={() => handleDeleteSeries(selectedSeries._id)} className="p-1.5 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors shadow-sm">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-56 border-l border-slate-200 bg-[#fdfdfd] flex flex-col">
                <div className="p-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 flex items-center gap-1.5 bg-slate-50">
                  <Layers size={12} /> כרכים זמינים
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {selectedSeries.volumes?.map((v, idx) => (
                    <button key={idx} onClick={() => setActiveVolIdx(idx)} className={`w-full text-right px-3 py-2.5 border-b border-slate-100 transition-colors relative flex items-center justify-between ${activeVolIdx === idx ? 'bg-white text-[#1e3a8a] font-bold shadow-[inset_3px_0_0_#1e3a8a]' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <div className="text-[12px] truncate pr-1">{v.volumeTitle || v.title || `גליון ${v.volumeNumber || idx + 1}`}</div>
                      <div className="text-[9px] text-slate-400 shrink-0">{v.articles?.length || 0} מאמ'</div>
                    </button>
                  ))}
                </div>

                {/* כפתור הוספת כרך גלוי לכולם. מעביר לעריכה עם פרמטרים. */}
                <div className="p-2 border-t border-slate-200 bg-white">
                  <button onClick={() => navigate(`/add-series?edit=${selectedSeries._id}&target=volume`)} className="w-full py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded text-[11px] font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1">
                    <Plus size={12} /> הוספת כרך לסדרה
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {currentVol ? (
                  <div className="flex-1 flex">
                    <div className="w-[45%] border-l border-slate-200 flex flex-col bg-white">
                      <div className="p-4 pb-3 border-b border-slate-100 flex justify-between items-center bg-white">
                        <h3 className="text-[15px] font-bold text-slate-800">מאמרי הכרך</h3>
                        <span className="text-[10px] font-bold text-[#1e3a8a] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">{currentVol.articles?.length || 0} מאמרים</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-slate-50/50">
                        {currentVol.articles && currentVol.articles.length > 0 ? (
                          currentVol.articles.map((art, aIdx) => (
                            <div key={aIdx} className="p-3 rounded-lg border border-slate-200 bg-white hover:border-[#1e3a8a]/30 transition-colors shadow-sm">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="text-[13px] font-bold text-slate-800 leading-snug flex-1 ml-2">{art.contentTitle || art.title}</h4>
                                <div className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0">עמ' {art.startPage || art.page || '-'}</div>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span className="flex items-center gap-1"><User size={10} className="opacity-70" /> {art.authors?.[0]?.firstName} {art.authors?.[0]?.lastName || 'מחבר לא צוין'}</span>
                                {art.generalTopic && <><span className="text-slate-300">•</span><span className="text-slate-400">{art.generalTopic}</span></>}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="h-32 flex flex-col items-center justify-center text-slate-400 italic border border-dashed border-slate-200 rounded-lg m-2">
                            <p className="text-[12px]">אין מאמרים רשומים לכרך זה</p>
                          </div>
                        )}
                      </div>

                      {/* כפתור הוספת מאמר גלוי לכולם. מעביר לעריכה עם פרמטרים. */}
                      <div className="p-3 bg-white border-t border-slate-100">
                        <button onClick={() => navigate(`/add-series?edit=${selectedSeries._id}&target=article&volId=${currentVol._id || activeVolIdx}`)} className="w-full py-2 bg-blue-50 border border-blue-200 text-[#1e3a8a] rounded text-[12px] font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
                          <Plus size={14} /> הוספת מאמרים לכרך זה
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 bg-slate-200 relative shadow-inner overflow-hidden">
                      {currentVol.pdfPath ? (
                        <div className="h-full flex flex-col">
                          <div className="bg-slate-800 p-1.5 flex justify-between items-center text-white px-3 shrink-0">
                            <span className="text-[10px] font-medium tracking-wide flex items-center gap-1.5"><Eye size={12}/> תצוגת מסמך</span>
                            <a href={`http://localhost:5000/${currentVol.pdfPath}`} target="_blank" rel="noreferrer" className="text-[10px] text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors flex items-center gap-1">
                              <ExternalLink size={10} /> פתח בחלון מלא
                            </a>
                          </div>
                          <iframe src={`http://localhost:5000/uploads/${currentVol.pdfPath}#view=FitH&toolbar=0`} className="w-full h-full border-none" title="Preview" />
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50">
                          <Eye size={36} className="text-slate-300 mb-3" />
                          <h4 className="font-bold text-slate-600 text-[13px]">קובץ ה-PDF לא נמצא</h4>
                          <p className="text-[11px] mt-1 max-w-[200px] text-slate-400">הסדרה רשומה במערכת אך טרם הועלה קובץ סרוק לכרך זה.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-[13px] font-medium">אנא בחר כרך מהרשימה</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-[#f8f9fc] text-slate-400">
            <BookOpen size={60} className="mb-4 text-slate-200" strokeWidth={1.5} />
            <p className="text-lg font-bold text-slate-600">בחר סדרה מהספרייה כדי להתחיל</p>
            <p className="text-[12px] mt-1">ניתן לחפש לפי שם סדרה, עורך או מגזר</p>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}