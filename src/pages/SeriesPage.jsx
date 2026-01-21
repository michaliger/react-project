import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  FileText, 
  ArrowRight, 
  Download, 
  Eye, 
  ChevronDown, 
  Printer, 
  Maximize2,
  ZoomIn,
  ZoomOut,
  List,
  Grid,
  Trash2,
  PlusCircle,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [allSeries, setAllSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState('home'); 
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:5000/api/series';

  // טעינת נתונים מהשרת (MongoDB Atlas דרך ה-API שלך)
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(result => {
        const seriesArray = result?.data?.series || [];
        setAllSeries(seriesArray);
        setLoading(false);
      })
      .catch(err => {
        console.error('שגיאה בטעינת נתונים:', err);
        setError('לא ניתן להתחבר לשרת. וודא ש-Server ה-Node.js שלך רץ בפורט 5000.');
        setLoading(false);
      });
  }, []);

  // מחיקת סדרה
  const deleteSeries = async (e, id, name) => {
    e.stopPropagation(); // מניעת פתיחת הספר בלחיצה על מחיקה
    
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את "${name}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('שגיאה במחיקה מהשרת');

      setAllSeries(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // מנגנון חיפוש מובנה (במקום Fuse.js שלא זמין בסביבה זו)
  const filteredSeries = useMemo(() => {
    if (!searchTerm.trim()) return allSeries;
    
    const term = searchTerm.toLowerCase();
    return allSeries.filter(s => {
      const title = (s.prefixName || s.fileName || "").toLowerCase();
      const author = (s.author || "").toLowerCase();
      const genre = (s.genre || "").toLowerCase();
      const volumesMatch = s.volumes?.some(v => v.title?.toLowerCase().includes(term));
      
      return title.includes(term) || author.includes(term) || genre.includes(term) || volumesMatch;
    });
  }, [searchTerm, allSeries]);

  const openSeries = (series) => {
    setSelectedSeries(series);
    setSelectedIssue(series.volumes?.[0] || null);
    setCurrentPage('series-detail');
  };

  const goBack = () => {
    setCurrentPage('home');
    setSelectedSeries(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] flex flex-col items-center justify-center font-sans" dir="rtl">
        <div className="w-16 h-16 border-4 border-[#5c4033] border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-2xl font-bold text-[#5c4033]">מתחבר למאגר MongoDB Atlas...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] font-sans text-slate-900 select-none" dir="rtl">
      
      {/* דף הבית */}
      {currentPage === 'home' && (
        <div className="flex flex-col h-screen">
          <header className="bg-[#e8e4d9] border-b border-[#d1cdbc] px-4 py-2 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-[#5c4033] ml-4">אוצר הספרים הדיגיטלי</h1>
              
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="חיפוש ב-MongoDB..."
                  className="w-80 bg-white border border-[#d1cdbc] rounded px-8 py-1.5 text-sm focus:outline-none focus:border-[#5c4033]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>

              <div className="flex gap-2 mr-4">
                <button className="flex items-center gap-1 px-3 py-1 bg-[#5c4033] text-white rounded text-xs font-bold hover:bg-[#4a3329]">
                  <PlusCircle size={14} /> סדרה חדשה
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#5c4033] bg-white/50 px-2 py-1 rounded border border-[#d1cdbc]">
                {allSeries.length} סדרות במאגר
              </span>
              <div className="w-px h-6 bg-[#d1cdbc] mx-2"></div>
              <button className="p-1.5 hover:bg-white/50 rounded transition-colors" onClick={() => setViewMode('list')}><List size={18} className={viewMode === 'list' ? 'text-[#5c4033]' : 'text-slate-400'} /></button>
              <button className="p-1.5 hover:bg-white/50 rounded transition-colors" onClick={() => setViewMode('grid')}><Grid size={18} className={viewMode === 'grid' ? 'text-[#5c4033]' : 'text-slate-400'} /></button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4">
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            )}

            <div className="bg-white border border-[#d1cdbc] rounded shadow-sm">
              <div className="grid grid-cols-12 bg-[#f9f7f2] border-b border-[#d1cdbc] px-4 py-2 text-xs font-bold text-[#5c4033] sticky top-0 z-10">
                <div className="col-span-1 text-center border-l border-[#d1cdbc]/50 pr-2">כריכה</div>
                <div className="col-span-4 border-l border-[#d1cdbc]/50 pr-2">שם הספר / סדרה</div>
                <div className="col-span-3 border-l border-[#d1cdbc]/50 pr-2">מחבר</div>
                <div className="col-span-2 border-l border-[#d1cdbc]/50 pr-2">ז'אנר</div>
                <div className="col-span-1 border-l border-[#d1cdbc]/50 pr-2 text-center">כרכים</div>
                <div className="col-span-1 text-center">פעולות</div>
              </div>

              <div className="divide-y divide-[#eee]">
                {filteredSeries.map((s, idx) => (
                  <div 
                    key={s._id}
                    onClick={() => openSeries(s)}
                    className={`grid grid-cols-12 px-4 py-3 text-sm hover:bg-[#fff9e6] cursor-pointer transition-colors items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}
                  >
                    <div className="col-span-1 flex justify-center">
                      <img 
                        src={s.coverImage || "https://placehold.co/40x60/f4f1ea/5c4033?text=Book"} 
                        alt="כריכה" 
                        className="w-10 h-14 object-cover rounded shadow-sm border border-slate-200"
                        onError={(e) => e.target.src = "https://placehold.co/40x60/f4f1ea/5c4033?text=Book"}
                      />
                    </div>
                    <div className="col-span-4 font-bold text-[#2d1e17] flex items-center gap-2 pr-2">
                      <BookOpen size={14} className="text-amber-700" />
                      {s.prefixName || s.fileName}
                    </div>
                    <div className="col-span-3 text-slate-600 flex items-center pr-2">{s.author || 'לא צוין'}</div>
                    <div className="col-span-2 text-slate-500 text-xs flex items-center pr-2">{s.genre || 'כללי'}</div>
                    <div className="col-span-1 text-center text-[#5c4033] font-bold text-xs flex items-center justify-center">
                      {s.volumes?.length || 0}
                    </div>
                    <div className="col-span-1 flex justify-center items-center gap-3">
                      <button 
                        onClick={(e) => deleteSeries(e, s._id, s.prefixName || s.fileName)}
                        className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors"
                        title="מחק מסד הנתונים"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button className="p-1.5 hover:bg-amber-100 rounded text-amber-700">
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredSeries.length === 0 && !loading && (
                  <div className="p-20 text-center text-slate-400 italic bg-white">
                    לא נמצאו תוצאות התואמות לחיפוש שלך ב-MongoDB.
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      )}

      {/* דף קריאה */}
      {currentPage === 'series-detail' && selectedSeries && (
        <div className="flex flex-col h-screen overflow-hidden">
          <header className="bg-[#2d1e17] text-white px-4 py-2 flex items-center justify-between shadow-lg z-50">
            <div className="flex items-center gap-4">
              <button onClick={goBack} className="p-1.5 hover:bg-white/10 rounded transition-colors">
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="h-6 w-px bg-white/20"></div>
              <div>
                <h2 className="text-sm font-bold leading-none">{selectedSeries.prefixName || selectedSeries.fileName}</h2>
                <p className="text-[10px] text-white/60 mt-1">{selectedIssue?.title || 'טוען כרך...'}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white/10 p-1 rounded border border-white/20">
              <button className="p-1 hover:bg-white/20 rounded"><ZoomOut size={16}/></button>
              <span className="px-2 text-xs font-mono">100%</span>
              <button className="p-1 hover:bg-white/20 rounded"><ZoomIn size={16}/></button>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-1.5 hover:bg-white/10 rounded"><Printer size={18} /></button>
              <button className="p-1.5 hover:bg-white/10 rounded"><Maximize2 size={18} /></button>
              <button className="p-1.5 hover:bg-white/10 rounded"><Download size={18} /></button>
              <div className="h-6 w-px bg-white/20"></div>
              <button className="bg-amber-600 hover:bg-amber-700 px-4 py-1 rounded text-xs font-bold transition-colors">חיפוש בטקסט</button>
            </div>
          </header>

          <main className="flex-1 flex overflow-hidden">
            <aside className="w-72 bg-[#e8e4d9] border-l border-[#d1cdbc] flex flex-col shadow-inner overflow-y-auto">
              <div className="p-4 border-b border-[#d1cdbc]">
                <h3 className="text-xs font-bold text-[#5c4033] mb-3 uppercase tracking-wider">רשימת כרכים</h3>
                <div className="space-y-1">
                  {selectedSeries.volumes?.map((vol, vIdx) => (
                    <button
                      key={vIdx}
                      onClick={() => setSelectedIssue(vol)}
                      className={`w-full text-right px-3 py-2.5 rounded text-sm flex items-center justify-between border transition-all ${selectedIssue === vol ? 'bg-[#5c4033] text-white border-[#5c4033] shadow-md' : 'bg-white/50 border-transparent hover:border-[#d1cdbc] text-[#2d1e17]'}`}
                    >
                      <span className="truncate">{vol.title || `כרך ${vIdx + 1}`}</span>
                      <FileText size={14} className={selectedIssue === vol ? 'text-amber-400' : 'text-slate-400'} />
                    </button>
                  ))}
                  {(!selectedSeries.volumes || selectedSeries.volumes.length === 0) && (
                    <div className="text-xs italic text-slate-500 p-2">אין כרכים להצגה</div>
                  )}
                </div>
              </div>
            </aside>

            <section className="flex-1 bg-[#8a867a] p-8 overflow-y-auto flex justify-center">
              <div className="w-[800px] h-[1100px] bg-[#fdfdfd] shadow-2xl flex flex-col relative p-16 border-x border-slate-300">
                <div className="w-full border-b-2 border-[#5c4033] pb-4 mb-12 flex justify-between items-end">
                  <span className="text-xs font-serif text-[#5c4033]">דף א'</span>
                  <span className="text-lg font-bold text-[#5c4033] font-serif">{selectedSeries.prefixName || selectedSeries.fileName}</span>
                  <span className="text-xs font-serif text-[#5c4033]">{selectedSeries.author}</span>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                  <BookOpen size={120} className="text-[#5c4033] mb-6" />
                  <p className="text-2xl font-serif text-[#5c4033]">כאן יוצג תוכן הספר מה-Storage</p>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                   <div className="bg-[#5c4033] text-white px-8 py-4 rounded-lg shadow-2xl flex flex-col items-center gap-2">
                     <div className="flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-bold">טוען קובץ PDF מהשרת...</span>
                     </div>
                     <span className="text-[10px] opacity-70">מתחבר ל-MongoDB Atlas לשליפת נתיבי קבצים</span>
                   </div>
                </div>
              </div>
            </section>
          </main>

          <footer className="bg-[#e8e4d9] border-t border-[#d1cdbc] px-6 py-2 flex items-center gap-6">
            <span className="text-xs font-bold text-[#5c4033]">ניווט:</span>
            <input type="range" className="flex-1 accent-[#5c4033]" min="1" max="100" />
            <div className="flex items-center gap-2 bg-white px-3 py-1 border border-[#d1cdbc] rounded shadow-sm text-sm">
              <span className="text-slate-400">עמוד:</span>
              <input type="text" className="w-10 text-center font-bold outline-none" defaultValue="1" />
              <span className="text-slate-400">/ {selectedIssue?.pages || '...'}</span>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}