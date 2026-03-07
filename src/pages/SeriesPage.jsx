import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Search, Plus, BookOpen, FileText, ExternalLink, Edit3, Eye, User, Layers, Book, LogOut, LogIn, ShieldAlert, ShieldCheck, UserCircle } from 'lucide-react';
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
  // 🌟 מנגנון ההרשאות החכם 🌟
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const hasUser = Object.keys(loggedInUser).length > 0;
  
  const isNotLoggedIn = !hasUser; 
  const isAdmin = hasUser && loggedInUser.role === 'admin'; 
  const isViewer = hasUser && !isAdmin; 
  const canAddNew = hasUser; 
  
  const navigate = useNavigate();
  const [allSeries, setAllSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [activeVolIdx, setActiveVolIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('series');
  
  // 🌟 שמירת המאמר הספציפי שנבחר לצורך הדגשה וגלילה 🌟
  const [activeArticleId, setActiveArticleId] = useState(null);

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

  // 🌟 גלילה אוטומטית למאמר ברגע שנבחר 🌟
  useEffect(() => {
    if (activeArticleId) {
      setTimeout(() => {
        const el = document.getElementById(`art-${activeArticleId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [activeArticleId, activeVolIdx]);

  const handleDeleteSeries = async (id) => {
    if (window.confirm("האם את בטוחה שברצונך למחוק את כל הסדרה וכל תוכן הגליונות שלה? פעולה זו אינה הפיכה.")) {
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

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

  // 🌟 הפונקציה שמעדכנת את התצוגה המרכזית בלחיצה 🌟
  const handleResultClick = (item) => {
    setSelectedSeries(item.originalSeries || item);
    setActiveVolIdx(item.volIndex || 0);
    
    // אם נלחץ מאמר - שומרים אותו כדי שהתצוגה תדגיש אותו
    if (item.type === 'article') {
      setActiveArticleId(item._id || item.id);
    } else {
      setActiveArticleId(null);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-700 mb-4"></div>
      <p className="text-gray-700 text-lg font-bold">טוען נתונים למערכת...</p>
    </div>
  );

  const currentVol = selectedSeries?.volumes?.[activeVolIdx];

  // 🌟 קפיצה חכמה לעמוד ב-PDF אם נבחר מאמר ספציפי 🌟
  let pdfFinalUrl = '';
  if (currentVol && currentVol.pdfPath) {
    let pageParam = '#';
    if (activeArticleId && currentVol.articles) {
      const activeArt = currentVol.articles.find(a => (a._id || a.id) === activeArticleId);
      if (activeArt && activeArt.startPage) {
        const pageNum = String(activeArt.startPage).match(/\d+/);
        if (pageNum) {
          pageParam = `#page=${pageNum[0]}&`;
        }
      }
    }
    pdfFinalUrl = `http://localhost:5000/uploads/${currentVol.pdfPath}${pageParam}view=FitH&toolbar=0`;
  }

  return (
    <div className="h-screen bg-gray-200 text-gray-900 font-sans flex flex-col overflow-hidden selection:bg-blue-200" dir="rtl">
      
      {/* 🌟🌟 שורת משתמש עליונה (User Bar) 🌟🌟 */}
      <div className="h-12 bg-gray-900 text-white flex items-center justify-between px-5 shrink-0 shadow-lg z-20">
        <div className="flex items-center gap-5">
          {isAdmin && (
            <span className="flex items-center gap-1.5 text-[12px] font-black bg-blue-600 px-3 py-1 rounded text-white shadow-md border border-blue-500">
              <ShieldCheck size={14} /> מנהל מערכת ראשי
            </span>
          )}
          {isViewer && (
            <span className="flex items-center gap-1.5 text-[12px] font-black bg-teal-600 px-3 py-1 rounded text-white shadow-md border border-teal-500">
              <UserCircle size={14} /> משתמש רשום (צפייה והוספה)
            </span>
          )}
          {isNotLoggedIn && (
            <span className="flex items-center gap-1.5 text-[12px] font-black bg-red-600 px-3 py-1 rounded text-white shadow-md border border-red-500">
              <ShieldAlert size={14} /> אורח מנותק (צפייה בלבד)
            </span>
          )}

          {hasUser && (
            <div className="text-[13px] text-gray-300 border-r border-gray-700 pr-5 flex items-center gap-2">
              <span className="font-bold text-white">{loggedInUser.name || 'משתמש'}</span>
              <span className="opacity-40">|</span>
              <span className="opacity-80">{loggedInUser.email}</span>
            </div>
          )}
        </div>

        <div>
          {hasUser ? (
            <button onClick={handleLogout} className="flex items-center gap-2 text-[12px] font-bold text-gray-200 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-1.5 rounded-lg transition-colors border border-gray-700">
              <LogOut size={14} /> התנתקות
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-[12px] font-black text-gray-900 bg-white hover:bg-blue-100 px-5 py-1.5 rounded-lg transition-colors shadow-md">
              <LogIn size={14} /> התחברות למערכת
            </button>
          )}
        </div>
      </div>

      {/* גוף האפליקציה המרכזי */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* עמודה 1: סרגל ימני נעול בברזל ל-320px לעולם לא ישתנה */}
        <aside className="border-l border-gray-300 flex flex-col bg-gray-50 shrink-0 overflow-hidden shadow-lg z-10" style={{ width: '320px', minWidth: '320px', maxWidth: '320px' }}>
          <div className="p-3 border-b border-gray-300 bg-gray-100 shrink-0">
            {canAddNew && (
              <button
                onClick={() => navigate('/add-series')}
                className="w-full mb-3 flex items-center justify-center gap-2 py-2 bg-blue-700 hover:bg-blue-800 text-white text-[13px] font-black rounded-lg transition-colors shadow-md border border-blue-800"
              >
                <Plus size={16} /> הוספת סדרה חדשה
              </button>
            )}

            <div className="flex bg-gray-300 p-1 rounded-lg mb-3">
              <button onClick={() => { setActiveTab('series'); setSearchTerm(""); }} className={`flex-1 py-1.5 text-[12px] font-bold rounded flex justify-center items-center gap-1.5 ${activeTab === 'series' ? 'bg-white text-blue-800 shadow border border-gray-200' : 'text-gray-700 hover:bg-gray-200'}`}><Book size={14}/> סדרות</button>
              <button onClick={() => { setActiveTab('volume'); setSearchTerm(""); }} className={`flex-1 py-1.5 text-[12px] font-bold rounded flex justify-center items-center gap-1.5 ${activeTab === 'volume' ? 'bg-white text-blue-800 shadow border border-gray-200' : 'text-gray-700 hover:bg-gray-200'}`}><Layers size={14}/> גליונות</button>
              <button onClick={() => { setActiveTab('article'); setSearchTerm(""); }} className={`flex-1 py-1.5 text-[12px] font-bold rounded flex justify-center items-center gap-1.5 ${activeTab === 'article' ? 'bg-white text-blue-800 shadow border border-gray-200' : 'text-gray-700 hover:bg-gray-200'}`}><FileText size={14}/> מאמרים</button>
            </div>

            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input type="text" placeholder="הקלד לחיפוש חכם..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-400 pr-9 pl-3 py-2 rounded-lg text-[13px] font-medium outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-inner" />
            </div>
          </div>

          {/* הוספת overflow-y-scroll כדי למנוע קפיצות כשהגלילה מופיעה או נעלמת */}
          <div className="flex-1 overflow-y-scroll overflow-x-hidden custom-scrollbar bg-white min-w-0">
            {filteredData.length > 0 ? filteredData.map((item, idx) => {
              if (item.type === 'series') {
                const isActive = selectedSeries?._id === item._id;
                return (
                  <button key={item._id} onClick={() => handleResultClick(item)} className={`w-full flex items-center gap-3 p-3 border-b transition-colors ${isActive ? 'bg-blue-100 border-blue-400 shadow-inner' : 'border-gray-200 hover:bg-blue-50'}`}>
                    <div className="w-8 h-12 bg-white rounded border border-gray-300 shrink-0 overflow-hidden shadow-sm">
                      <img src={item.coverImage ? `http://localhost:5000/uploads/${item.coverImage}` : "/books.jpg"} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.onerror = null; e.target.src = "/books.jpg"; }} />
                    </div>
                    <div className="text-right flex-1 min-w-0">
                      <h3 className={`font-bold text-[14px] truncate leading-tight w-full ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>{item.prefixName} {item.fileName}</h3>
                      <p className="text-[11px] text-gray-600 mt-1 flex items-center gap-1 font-medium truncate w-full"><User size={11} className="shrink-0" /> {item.editor || 'ללא עורך'}</p>
                    </div>
                  </button>
                );
              } else if (item.type === 'volume') {
                  const isActive = selectedSeries?._id === item.seriesId && activeVolIdx === item.volIndex;
                  return (
                    <button key={`${item.seriesId}-${idx}`} onClick={() => handleResultClick(item)} className={`w-full text-right p-3 border-b flex flex-col min-w-0 transition-colors ${isActive ? 'bg-blue-100 border-blue-400 shadow-inner' : 'border-gray-200 hover:bg-blue-50'}`}>
                      <div className="text-[11px] text-blue-700 font-bold mb-1 truncate w-full">{item.seriesName}</div>
                      <div className="font-bold text-[13px] text-gray-900 truncate w-full">{item.volumeTitle || item.title || `גליון ${item.volumeNumber}`}</div>
                    </button>
                  )
              } else if (item.type === 'article') {
                   const isActive = activeArticleId === (item._id || item.id);
                   return (
                    <button key={`${item.seriesId}-${idx}`} onClick={() => handleResultClick(item)} className={`w-full text-right p-3 border-b flex flex-col min-w-0 transition-colors ${isActive ? 'bg-yellow-100 border-yellow-400 shadow-inner' : 'border-gray-200 hover:bg-blue-50'}`}>
                      <div className="flex justify-between items-start mb-1 w-full">
                        <div className="text-[10px] text-gray-600 font-bold truncate flex-1 min-w-0">{item.seriesName} / {item.volTitle}</div>
                        {item.startPage && <div className="text-[10px] bg-gray-200 px-1.5 rounded text-gray-700 shrink-0 mr-2 font-mono">עמ' {item.startPage}</div>}
                      </div>
                      <div className={`font-bold text-[13px] truncate leading-tight w-full ${isActive ? 'text-yellow-900' : 'text-blue-900'}`}>{item.contentTitle || item.title}</div>
                    </button>
                  )
              }
              return null;
            }) : (
              <div className="text-center p-8 text-gray-500 font-medium text-[13px]">לא נמצאו תוצאות לחיפוש זה.</div>
            )}
          </div>
        </aside>

        {/* תצוגה מרכזית */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-100 overflow-hidden">
          {selectedSeries ? (
            <>
              {/* כותרת הסדרה */}
              <header className="h-16 bg-white border-b border-gray-300 px-6 flex items-center justify-between shrink-0 shadow-sm z-0">
                <div className="flex items-center gap-4 truncate min-w-0">
                  <div className="bg-blue-800 p-2.5 rounded-lg text-white shadow shrink-0"><BookOpen size={22} /></div>
                  <div className="truncate min-w-0">
                    <h2 className="text-[18px] font-black text-gray-900 leading-none truncate">{selectedSeries.prefixName} {selectedSeries.fileName}</h2>
                    <div className="flex gap-3 mt-1.5 truncate">
                      {selectedSeries.sector && <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2 rounded border border-blue-200 shrink-0">{selectedSeries.sector}</span>}
                      <span className="text-[12px] text-gray-600 font-bold truncate">עורך: <span className="text-gray-900">{selectedSeries.editor || 'לא צויין'}</span> | {selectedSeries.publicationPlace}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 shrink-0">
                  {isAdmin && (
                    <>
                      <button onClick={() => navigate(`/add-series?edit=${selectedSeries._id}`)} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-400 text-gray-800 rounded-lg text-[13px] font-bold hover:bg-gray-100 transition-colors shadow-sm">
                        <Edit3 size={16} className="text-gray-600" /> עריכת סדרה
                      </button>
                      <button onClick={() => handleDeleteSeries(selectedSeries._id)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-red-300 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors shadow-sm">
                        <Trash2 size={16} /> מחיקה
                      </button>
                    </>
                  )}
                </div>
              </header>

              <div className="flex-1 flex overflow-hidden">
                
                {/* עמודה 2: רשימת גליונות קבועה ונוקשה ל-220px לעולם לא משתנה */}
                <div className="border-l border-gray-300 bg-white flex flex-col shrink-0 shadow-sm z-0" style={{ width: '220px', minWidth: '220px', maxWidth: '220px' }}>
                  <div className="p-3 text-[12px] font-black text-gray-700 uppercase border-b border-gray-300 flex items-center gap-2 bg-gray-100 shrink-0">
                    <Layers size={14} className="text-gray-500" /> רשימת גליונות
                  </div>
                  <div className="flex-1 overflow-y-scroll overflow-x-hidden custom-scrollbar">
                    {selectedSeries.volumes?.map((v, idx) => (
                      <button key={idx} onClick={() => { setActiveVolIdx(idx); setActiveArticleId(null); }} className={`w-full text-right px-4 py-3 border-b border-gray-200 transition-colors flex items-center justify-between min-w-0 ${activeVolIdx === idx ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-900'}`}>
                        <div className="text-[13px] truncate pr-1 flex-1 min-w-0">{v.volumeTitle || v.title || `גליון ${v.volumeNumber || idx + 1}`}</div>
                        <div className={`text-[10px] shrink-0 font-bold ml-1 ${activeVolIdx === idx ? 'text-blue-200' : 'text-gray-400 bg-gray-100 px-1.5 rounded'}`}>{v.articles?.length || 0}</div>
                      </button>
                    ))}
                  </div>

                  {canAddNew && (
                    <div className="p-3 border-t border-gray-300 bg-gray-50 shrink-0">
                      <button onClick={() => navigate(`/add-series?edit=${selectedSeries._id}&target=volume`)} className="w-full py-2 bg-white border border-blue-400 text-blue-800 rounded-lg text-[13px] font-black hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                        <Plus size={14} /> הוספת גליון לסדרה
                      </button>
                    </div>
                  )}
                </div>

                {/* עמודה 3: מאמרים (360px נוקשה) וה-PDF שלוקח את השאר */}
                <div className="flex-1 flex overflow-hidden min-w-0">
                  {currentVol ? (
                    <>
                      {/* רשימת המאמרים נעולה ל-360px */}
                      <div className="border-l border-gray-300 flex flex-col bg-gray-50 shrink-0 shadow-sm z-0" style={{ width: '360px', minWidth: '360px', maxWidth: '360px' }}>
                        <div className="p-4 pb-3 border-b border-gray-300 flex justify-between items-center bg-white shrink-0">
                          <h3 className="text-[16px] font-black text-gray-900">מאמרי הגליון</h3>
                          <span className="text-[11px] font-bold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded border border-blue-200 shadow-sm">{currentVol.articles?.length || 0} מאמרים</span>
                        </div>
                        <div className="flex-1 overflow-y-scroll overflow-x-hidden p-3 space-y-2 custom-scrollbar bg-gray-100 min-w-0">
                          {currentVol.articles && currentVol.articles.length > 0 ? (
                            currentVol.articles.map((art, aIdx) => {
                              const isHighlighted = activeArticleId === (art._id || art.id);
                              return (
                                // 🌟 כאן קורה הקסם של ההדגשה הצהובה של המאמר שנבחר! 🌟
                                <div id={`art-${art._id || art.id}`} key={aIdx} className={`p-3.5 rounded-xl border transition-all shadow-sm ${isHighlighted ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-200 scale-[1.02] shadow-md z-10 relative' : 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-md'}`}>
                                  <div className="flex justify-between items-start mb-1.5 w-full min-w-0">
                                    <h4 className={`text-[14px] font-black leading-snug flex-1 ml-3 truncate whitespace-normal ${isHighlighted ? 'text-yellow-900' : 'text-gray-900'}`}>{art.contentTitle || art.title}</h4>
                                    <div className="bg-gray-100 border border-gray-300 text-gray-600 text-[11px] px-2 py-0.5 rounded font-mono font-bold shrink-0 shadow-inner">עמ' {art.startPage || art.page || '-'}</div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 font-medium">
                                    <span className="flex items-center gap-1.5"><User size={12} className="text-gray-400 shrink-0" /> {art.authors?.[0]?.firstName} {art.authors?.[0]?.lastName || 'מחבר לא צוין'}</span>
                                    {art.generalTopic && <><span className="text-gray-300 shrink-0">•</span><span className="text-blue-700 bg-blue-50 px-1 rounded truncate">{art.generalTopic}</span></>}
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <div className="h-40 flex flex-col items-center justify-center text-gray-500 italic border-2 border-dashed border-gray-300 rounded-xl m-2 bg-white">
                              <p className="text-[13px] font-bold">אין מאמרים רשומים לגליון זה</p>
                            </div>
                          )}
                        </div>

                        {canAddNew && (
                          <div className="p-3 bg-white border-t border-gray-300 shrink-0">
                            <button onClick={() => navigate(`/add-series?edit=${selectedSeries._id}&target=article&volId=${currentVol._id || activeVolIdx}`)} className="w-full py-2 bg-blue-100 border border-blue-300 text-blue-900 rounded-lg text-[13px] font-black hover:bg-blue-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                              <Plus size={16} /> הוספת מאמר לגליון
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* ה-PDF שתופס את שארית המסך במלואו */}
                      <div className="flex-1 bg-gray-400 relative shadow-inner overflow-hidden min-w-[300px]">
                        {currentVol.pdfPath ? (
                          <div className="h-full flex flex-col">
                            <div className="bg-gray-900 h-10 flex justify-between items-center text-white px-4 shrink-0 shadow-md">
                              <span className="text-[12px] font-bold tracking-wide flex items-center gap-2"><Eye size={14}/> תצוגת מסמך מלאה</span>
                              <a href={`http://localhost:5000/${currentVol.pdfPath}`} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-gray-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 border border-gray-700">
                                <ExternalLink size={12} /> פתיחה בחלון נפרד
                              </a>
                            </div>
                            {/* 🌟 טעינת ה-PDF ביחד עם מספר העמוד המדויק של המאמר! 🌟 */}
                            <iframe src={pdfFinalUrl} className="w-full h-full border-none bg-gray-300" title="Preview" />
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center bg-gray-100 border-l border-gray-300">
                            <Eye size={48} className="text-gray-300 mb-4" />
                            <h4 className="font-black text-gray-700 text-[16px]">קובץ ה-PDF לא נמצא</h4>
                            <p className="text-[13px] mt-1.5 text-gray-500 max-w-[250px] leading-relaxed">הסדרה רשומה במערכת אך טרם הועלה קובץ סרוק לגליון זה.</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-500 text-[15px] font-bold bg-white">אנא בחר גליון מהרשימה</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
              <BookOpen size={80} className="mb-5 text-gray-300" strokeWidth={1} />
              <p className="text-2xl font-black text-gray-700">בחר סדרה מהספרייה כדי להתחיל</p>
              <p className="text-[14px] mt-2 font-medium">השתמש בתיבת החיפוש או בחר מהסרגל הימני</p>
            </div>
          )}
        </main>

      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>
    </div>
  );
}