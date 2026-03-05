import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Search, Plus, BookOpen, FileText, ExternalLink, Edit3, Eye, User, Layers, Book } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ==========================================
// 1. אלגוריתם למציאת שגיאות כתיב (מחושב בעדינות לעברית)
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
// 2. פונקציית החיפוש החכמה (סולחת, אבל לא מדי)
// ==========================================
const isSmartMatch = (textArray, query) => {
  if (!query) return true;
  
  // מחברים רק את השדות שקיימים למחרוזת אחת ארוכה
  const text = textArray.filter(Boolean).join(' ').toLowerCase();
  const q = query.toString().toLowerCase().trim();
  
  if (!text) return false;
  
  // התאמה מהירה: אם מה שהוקלד נמצא בדיוק כמו שהוא בטקסט
  if (text.includes(q)) return true;
  
  const textWords = text.split(/\s+/);
  const queryWords = q.split(/\s+/);
  
  // אנחנו רוצים שכל מילה בחיפוש תימצא (איכשהו) בטקסט
  return queryWords.every(qWord => {
    return textWords.some(tWord => {
      // אם המילה מכילה את מילת החיפוש (למשל "בראשית" מכיל "בראש")
      if (tWord.includes(qWord)) return true;
      
      // אישור של שגיאת כתיב אחת בלבד, ורק למילים של 5 אותיות ומעלה
      if (qWord.length >= 5) {
        return getEditDistance(tWord, qWord) <= 1;
      }
      return false;
    });
  });
};

export default function LibraryApp() {
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

  // פילטר חיפוש מחובר לאלגוריתם המדויק
// פילטר חיפוש מחובר לאלגוריתם המדויק וסורק *את כל השדות*
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
             
             // מחפש בכל שדות הכרך (כולל שנה, נושא, גודל, כריכה וכו')
             if (isSmartMatch([
               volTitle, v.volumeNumber, v.booklet, v.mainTopic, 
               v.publishedFor, v.publicationYear, v.publicationPeriod, 
               v.coverType, v.volumeSize, v.fileCompleteness, 
               v.scanCompleteness, v.articlesCatalogStatus
             ], term)) {
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
                // חיבור כל פרטי המחברים (שם פרטי, משפחה, תואר, תפקיד)
                const authorNames = art.authors ? art.authors.map(a => `${a.titlePrefix || ''} ${a.firstName || ''} ${a.lastName || ''} ${a.role || ''}`).join(' ') : '';
                
                // מחפש בכל שדות המאמר (כולל עמוד, מקור, הערות קישור וכו')
                if (isSmartMatch([
                  artTitle, authorNames, art.generalTopic, 
                  art.source, art.startPage, art.page, art.linkExplanation
                ], term)) {
                   articlesList.push({ 
                     ...art, 
                     seriesId: s._id, 
                     seriesName: `${s.prefixName || ''} ${s.fileName || ''}`, 
                     volTitle: v.volumeTitle || v.title || `גליון ${v.volumeNumber || vIdx + 1}`,
                     originalSeries: s,
                     volIndex: vIdx,
                     type: 'article' 
                   });
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

// --- מכאן ממשיך הקוד שלך כרגיל עם const handleResultClick... ---
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
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-500 font-medium italic">טוען את הספרייה התורנית...</p>
    </div>
  );

  const currentVol = selectedSeries?.volumes?.[activeVolIdx];

  return (
    <div className="h-screen bg-gray-100 text-gray-800 font-sans flex overflow-hidden" dir="rtl">
      {/* סרגל צדדי */}
      <aside className="w-80 border-l border-gray-200 flex flex-col bg-white shrink-0 shadow-xl z-10">
        <div className="p-5 border-b border-gray-100 bg-white">
          <button
            onClick={() => navigate('/add-series')}
            className="w-full mb-5 flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            הוספת סדרה חדשה
          </button>

          <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
            <button 
              onClick={() => { setActiveTab('series'); setSearchTerm(""); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md flex justify-center items-center gap-1 transition-all ${activeTab === 'series' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Book size={14} /> סדרות
            </button>
            <button 
              onClick={() => { setActiveTab('volume'); setSearchTerm(""); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md flex justify-center items-center gap-1 transition-all ${activeTab === 'volume' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Layers size={14} /> כרכים
            </button>
            <button 
              onClick={() => { setActiveTab('article'); setSearchTerm(""); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md flex justify-center items-center gap-1 transition-all ${activeTab === 'article' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FileText size={14} /> מאמרים
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder={activeTab === 'series' ? "חיפוש סדרה חכם..." : activeTab === 'volume' ? "חיפוש כרך חכם..." : "חיפוש מאמר חכם..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 pr-10 pl-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {filteredData.length > 0 ? filteredData.map((item, idx) => {
            if (item.type === 'series') {
              return (
                <button key={item._id} onClick={() => handleResultClick(item)} className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border-2 ${selectedSeries?._id === item._id ? 'bg-blue-50 border-blue-500 shadow-md transform scale-[1.02]' : 'border-transparent bg-gray-50/50 hover:bg-gray-100'}`}>
                  <div className="w-12 h-16 bg-white rounded-lg shadow-sm border border-gray-200 shrink-0 overflow-hidden">
                    <img src={item.coverImage ? `http://localhost:5000/uploads/${item.coverImage}` : "/books.jpg"} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.onerror = null; e.target.src = "/books.jpg"; }} />
                  </div>
                  <div className="text-right overflow-hidden">
                    <h3 className={`font-black text-sm truncate ${selectedSeries?._id === item._id ? 'text-blue-700' : 'text-gray-800'}`}>{item.prefixName} {item.fileName}</h3>
                    <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 italic"><User size={10} /> {item.editor || 'עורך לא צוין'}</p>
                  </div>
                </button>
              );
            } else if (item.type === 'volume') {
                return (
                  <button key={`${item.seriesId}-${idx}`} onClick={() => handleResultClick(item)} className="w-full text-right p-3 rounded-xl border border-gray-100 bg-white hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="text-xs text-blue-500 font-bold mb-1 opacity-80 group-hover:opacity-100">{item.seriesName}</div>
                    <div className="font-black text-sm text-gray-800">{item.volumeTitle || item.title || `גליון ${item.volumeNumber}`}</div>
                    {item.mainTopic && <div className="text-[11px] text-gray-500 mt-1 truncate">{item.mainTopic}</div>}
                  </button>
                )
            } else if (item.type === 'article') {
                 return (
                  <button key={`${item.seriesId}-${idx}`} onClick={() => handleResultClick(item)} className="w-full text-right p-3 rounded-xl border border-gray-100 bg-white hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-[10px] text-gray-400 font-bold truncate flex-1">{item.seriesName} / {item.volTitle}</div>
                      {item.startPage && <div className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 shrink-0 mr-2">עמ' {item.startPage}</div>}
                    </div>
                    <div className="font-black text-sm text-gray-800 text-blue-600 group-hover:text-blue-700 leading-snug">{item.contentTitle || item.title}</div>
                    {item.authors && item.authors.length > 0 && item.authors[0].lastName && (
                      <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                        <User size={10} /> {item.authors[0].firstName} {item.authors[0].lastName}
                      </div>
                    )}
                  </button>
                )
            }
            return null;
          }) : (
            <div className="text-center p-6 text-gray-400 italic text-sm">לא נמצאו תוצאות</div>
          )}
        </div>
      </aside>

      {/* אזור מרכזי */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedSeries ? (
          <>
            <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100"><BookOpen size={24} /></div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{selectedSeries.prefixName} {selectedSeries.fileName}</h2>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{selectedSeries.sector}</span>
                    <span className="text-xs text-gray-400 font-medium">עורך: {selectedSeries.editor} | {selectedSeries.publicationPlace}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate(`/add-series?edit=${selectedSeries._id}`)} className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg active:scale-95">
                  <Edit3 size={18} /> עדכון פרטי סדרה
                </button>
                <button onClick={() => handleDeleteSeries(selectedSeries._id)} className="p-2.5 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={22} />
                </button>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* רשימת כרכים */}
              <div className="w-64 border-l border-gray-100 bg-gray-50/30 flex flex-col">
                <div className="p-5 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 flex items-center gap-2">
                  <Layers size={14} /> כרכים זמינים
                </div>
                <div className="flex-1 overflow-y-auto">
                  {selectedSeries.volumes?.map((v, idx) => (
                    <button key={idx} onClick={() => setActiveVolIdx(idx)} className={`w-full text-right p-5 border-b border-gray-100 transition-all relative ${activeVolIdx === idx ? 'bg-white text-blue-600 font-black shadow-sm' : 'text-gray-500 hover:bg-gray-100/50'}`}>
                      {activeVolIdx === idx && <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-blue-600" />}
                      <div className="text-sm leading-tight">{v.volumeTitle || v.title || `גליון ${v.volumeNumber || idx + 1}`}</div>
                      <div className="text-[10px] opacity-60 mt-1 font-medium italic">לחץ לצפייה במאמרים</div>
                    </button>
                  ))}
                </div>
                <div className="p-4 bg-white border-t border-gray-100">
                  <button onClick={() => navigate(`/add-series?edit=${selectedSeries._id}&target=volume`)} className="w-full py-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-black hover:bg-blue-100 transition-all flex items-center justify-center gap-2 border border-blue-200">
                    <Plus size={14} /> הוספת כרך לסדרה
                  </button>
                </div>
              </div>

              {/* מאמרים ותצוגת קובץ */}
              <div className="flex-1 flex overflow-hidden">
                {currentVol ? (
                  <div className="flex-1 flex">
                    <div className="w-[45%] border-l border-gray-100 flex flex-col bg-white">
                      <div className="p-6 pb-4 border-b border-gray-50 flex justify-between items-end bg-white">
                        <h3 className="text-xl font-black text-gray-800">מאמרי הכרך</h3>
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{currentVol.articles?.length || 0} מאמרים</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                        {currentVol.articles && currentVol.articles.length > 0 ? (
                          currentVol.articles.map((art, aIdx) => (
                            <div key={aIdx} className="group p-5 rounded-2xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="text-sm font-black text-gray-800 group-hover:text-blue-600 transition-colors flex-1 ml-4 leading-relaxed">{art.contentTitle || art.title}</h4>
                                <div className="bg-white border border-gray-100 text-gray-400 text-[10px] px-2 py-1 rounded-lg font-mono font-bold shadow-sm shrink-0">עמ' {art.startPage || art.page || '-'}</div>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                                <User size={12} className="opacity-50" />
                                {art.authors?.[0]?.firstName} {art.authors?.[0]?.lastName || 'מחבר לא צוין'}
                                {art.generalTopic && <><span className="mx-1">•</span><span className="text-blue-500/70"># {art.generalTopic}</span></>}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="h-64 flex flex-col items-center justify-center text-gray-300 italic border-2 border-dashed border-gray-50 rounded-3xl">
                            <FileText size={40} className="mb-2 opacity-10" />
                            <p className="text-sm">אין מאמרים רשומים לכרך זה</p>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <button onClick={() => navigate(`/add-series?edit=${selectedSeries._id}&target=article&volId=${currentVol._id || activeVolIdx}`)} className="w-full py-3 bg-white border-2 border-dashed border-blue-400 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                          <Plus size={18} /> הוספת מאמרים לכרך זה
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-200 relative shadow-inner overflow-hidden">
                      {currentVol.pdfPath ? (
                        <div className="h-full flex flex-col">
                          <div className="bg-gray-800 p-2 flex justify-between items-center text-white px-4">
                            <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">תצוגת קובץ PDF</span>
                            <a href={`http://localhost:5000/${currentVol.pdfPath}`} target="_blank" rel="noreferrer" className="text-[10px] bg-white/10 hover:bg-white/20 p-1.5 px-3 rounded-lg transition-all flex items-center gap-2">
                              <ExternalLink size={12} /> פתח בחלון מלא
                            </a>
                          </div>
                          <iframe src={`http://localhost:5000/uploads/${currentVol.pdfPath}#view=FitH&toolbar=0`} className="w-full h-full border-none shadow-2xl" title="Preview" />
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12 text-center">
                          <div className="bg-white/50 p-6 rounded-full mb-4"><Eye size={48} className="opacity-20" /></div>
                          <h4 className="font-bold text-gray-500">קובץ ה-PDF לא נמצא</h4>
                          <p className="text-xs mt-2 max-w-[200px] leading-relaxed opacity-60">הסדרה רשומה במערכת אך טרם הועלה קובץ סרוק לכרך זה.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 italic">אנא בחר כרך מהרשימה</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50/50 text-gray-300">
            <div className="relative mb-8">
              <BookOpen size={100} className="opacity-5" />
              <div className="absolute inset-0 flex items-center justify-center"><Plus size={32} className="opacity-10" /></div>
            </div>
            <p className="text-xl font-black text-gray-400 tracking-tight">בחר סדרה מהספרייה כדי להתחיל</p>
            <p className="text-sm mt-2 opacity-50">ניתן לחפש לפי שם סדרה, עורך או מגזר</p>
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}