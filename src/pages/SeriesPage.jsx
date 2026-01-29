import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Search, Plus, BookOpen, FileText, ExternalLink, Edit3, Eye, User, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LibraryApp() {
  const [allSeries, setAllSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [activeVolIdx, setActiveVolIdx] = useState(0);
  
  const navigate = useNavigate();

  // שליפת הנתונים מהשרת
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

  // פונקציית מחיקה
  const handleDeleteSeries = async (id) => {
    if (window.confirm("האם את בטוחה שברצונך למחוק את כל הסדרה וכל תוכן הכרכים שלה? פעולה זו אינה הפיכה.")) {
      try {
        const response = await fetch(`http://localhost:5000/api/series/id/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setAllSeries(prev => prev.filter(s => s._id !== id));
          setSelectedSeries(null);
          alert("הסדרה נמחקה בהצלחה");
        } else {
          throw new Error();
        }
      } catch (err) {
        alert("שגיאה במחיקת הסדרה. וודאי שהשרת פועל.");
      }
    }
  };

  // איפוס הכרך הנבחר כשמחליפים סדרה
  useEffect(() => { setActiveVolIdx(0); }, [selectedSeries]);

  // פילטר חיפוש
  const filteredSeries = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return allSeries.filter(s => 
      (s.prefixName + s.fileName + (s.author || "")).toLowerCase().includes(term)
    );
  }, [searchTerm, allSeries]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-500 font-medium italic">טוען את הספרייה התורנית...</p>
    </div>
  );

  const currentVol = selectedSeries?.volumes?.[activeVolIdx];

  return (
    <div className="h-screen bg-gray-100 text-gray-800 font-sans flex overflow-hidden" dir="rtl">
      
      {/* --- סרגל ימני: רשימת סדרות --- */}
      <aside className="w-80 border-l border-gray-200 flex flex-col bg-white shrink-0 shadow-xl z-10">
        <div className="p-5 border-b border-gray-100 bg-white">
          <button 
            onClick={() => navigate('/add-series')}
            className="w-full mb-5 flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            הוספת סדרה חדשה
          </button>
          
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="חיפוש מהיר בספרייה..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full bg-gray-50 border border-gray-200 pr-10 pl-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {filteredSeries.map((s) => (
            <button 
              key={s._id} 
              onClick={() => setSelectedSeries(s)} 
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border-2 ${
                selectedSeries?._id === s._id 
                ? 'bg-blue-50 border-blue-500 shadow-md transform scale-[1.02]' 
                : 'border-transparent bg-gray-50/50 hover:bg-gray-100'
              }`}
            >
              <div className="w-12 h-16 bg-white rounded-lg shadow-sm border border-gray-200 shrink-0 overflow-hidden">
                <img 
                  src={s.coverImage ? `http://localhost:5000/${s.coverImage}` : "https://via.placeholder.com/50x70?text=No+Cover"} 
                  className="w-full h-full object-cover" 
                  alt="" 
                />
              </div>
              <div className="text-right overflow-hidden">
                <h3 className={`font-black text-sm truncate ${selectedSeries?._id === s._id ? 'text-blue-700' : 'text-gray-800'}`}>
                  {s.prefixName} {s.fileName}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 italic">
                  <User size={10} /> {s.editor || 'עורך לא צוין'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* --- אזור תצוגה מרכזי --- */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedSeries ? (
          <>
            {/* כותרת עליונה */}
            <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100">
                   <BookOpen size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{selectedSeries.prefixName} {selectedSeries.fileName}</h2>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{selectedSeries.sector}</span>
                    <span className="text-xs text-gray-400 font-medium">עורך: {selectedSeries.editor} | {selectedSeries.publicationPlace}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => navigate(`/add-series?edit=${selectedSeries._id}`)} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                >
                  <Edit3 size={18} />
                  עדכון פרטי סדרה
                </button>
                <button 
                  onClick={() => handleDeleteSeries(selectedSeries._id)}
                  className="p-2.5 text-gray-300 hover:text-red-500 transition-colors"
                >
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
                    <button 
                      key={idx} 
                      onClick={() => setActiveVolIdx(idx)} 
                      className={`w-full text-right p-5 border-b border-gray-100 transition-all relative ${
                        activeVolIdx === idx 
                        ? 'bg-white text-blue-600 font-black shadow-sm' 
                        : 'text-gray-500 hover:bg-gray-100/50'
                      }`}
                    >
                      {activeVolIdx === idx && <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-blue-600" />}
                      <div className="text-sm leading-tight">{v.volumeTitle || v.title || `גליון ${v.volumeNumber || idx + 1}`}</div>
                      <div className="text-[10px] opacity-60 mt-1 font-medium italic">לחץ לצפייה במאמרים</div>
                    </button>
                  ))}
                </div>
                {/* כפתור הוספת כרך חדש */}
                <div className="p-4 bg-white border-t border-gray-100">
                  <button 
                    onClick={() => navigate(`/add-series?edit=${selectedSeries._id}&target=volume`)}
                    className="w-full py-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-black hover:bg-blue-100 transition-all flex items-center justify-center gap-2 border border-blue-200"
                  >
                    <Plus size={14} /> הוספת כרך לסדרה
                  </button>
                </div>
              </div>

              {/* גוף התוכן */}
              <div className="flex-1 flex overflow-hidden">
                {currentVol ? (
                  <div className="flex-1 flex">
                    {/* מאמרים */}
                    <div className="w-[45%] border-l border-gray-100 flex flex-col bg-white">
                       <div className="p-6 pb-4 border-b border-gray-50 flex justify-between items-end bg-white">
                         <h3 className="text-xl font-black text-gray-800">מאמרי הכרך</h3>
                         <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                           {currentVol.articles?.length || 0} מאמרים
                         </span>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                        {currentVol.articles && currentVol.articles.length > 0 ? (
                          currentVol.articles.map((art, aIdx) => (
                            <div key={aIdx} className="group p-5 rounded-2xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="text-sm font-black text-gray-800 group-hover:text-blue-600 transition-colors flex-1 ml-4 leading-relaxed">
                                  {art.contentTitle || art.title}
                                </h4>
                                <div className="bg-white border border-gray-100 text-gray-400 text-[10px] px-2 py-1 rounded-lg font-mono font-bold shadow-sm shrink-0">
                                  עמ' {art.startPage || art.page}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                                <User size={12} className="opacity-50" />
                                {art.authors?.[0]?.firstName} {art.authors?.[0]?.lastName || 'מחבר לא צוין'}
                                {art.generalTopic && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <span className="text-blue-500/70"># {art.generalTopic}</span>
                                  </>
                                )}
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
                       
                       {/* כפתור הוספת מאמר חדש */}
                       <div className="p-4 bg-gray-50 border-t border-gray-100">
                         <button 
                           onClick={() => navigate(`/add-series?edit=${selectedSeries._id}&target=article&volId=${currentVol._id || activeVolIdx}`)}
                           className="w-full py-3 bg-white border-2 border-dashed border-blue-400 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                         >
                           <Plus size={18} /> הוספת מאמרים לכרך זה
                         </button>
                       </div>
                    </div>

                    {/* תצוגת PDF */}
                    <div className="flex-1 bg-gray-200 relative shadow-inner overflow-hidden">
                      {currentVol.pdfPath ? (
                        <div className="h-full flex flex-col">
                          <div className="bg-gray-800 p-2 flex justify-between items-center text-white px-4">
                            <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">תצוגת קובץ PDF</span>
                            <a 
                              href={`http://localhost:5000/${currentVol.pdfPath}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[10px] bg-white/10 hover:bg-white/20 p-1.5 px-3 rounded-lg transition-all flex items-center gap-2"
                            >
                              <ExternalLink size={12} /> פתח בחלון מלא
                            </a>
                          </div>
                          <iframe 
                            src={`http://localhost:5000/${currentVol.pdfPath}#view=FitH&toolbar=0`} 
                            className="w-full h-full border-none shadow-2xl"
                            title="Preview"
                          />
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12 text-center">
                          <div className="bg-white/50 p-6 rounded-full mb-4">
                            <Eye size={48} className="opacity-20" />
                          </div>
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
                <div className="absolute inset-0 flex items-center justify-center">
                    <Plus size={32} className="opacity-10" />
                </div>
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