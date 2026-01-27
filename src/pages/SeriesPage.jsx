import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Search, Plus, BookOpen, ChevronLeft, FileText, ExternalLink, Calendar, User, Hash, Edit3, ChevronDown, List } from 'lucide-react';

export default function App() {
  const [allSeries, setAllSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [activeVolIdx, setActiveVolIdx] = useState(0); // שליטה על איזה כרך פתוח כרגע

  const navigate = (path) => { window.location.href = path; };

  useEffect(() => {
    fetch('http://localhost:5000/api/series')
      .then(res => res.json())
      .then(result => {
        const seriesArray = result?.data?.series || [];
        setAllSeries(seriesArray);
        if (seriesArray.length > 0) setSelectedSeries(seriesArray[0]);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  // כשמחליפים סדרה, מאפסים את הכרך המוצג לראשון
  useEffect(() => { setActiveVolIdx(0); }, [selectedSeries]);

  const filteredSeries = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return allSeries.filter(s => (s.prefixName + s.fileName + (s.author || "")).toLowerCase().includes(term));
  }, [searchTerm, allSeries]);

  if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500"></div></div>;

  const currentVol = selectedSeries?.volumes?.[activeVolIdx];

  return (
    <div className="h-screen bg-[#050505] text-gray-300 font-sans flex overflow-hidden selection:bg-amber-500/30" dir="rtl">
      
      {/* --- Sidebar קומפקטי --- */}
      <aside className="w-72 border-l border-white/5 flex flex-col bg-[#0a0a0a] shrink-0 z-20">
        <div className="p-4 border-b border-white/5 bg-[#0d0d0d] flex items-center justify-between">
          <h1 className="text-sm font-black text-white flex items-center gap-2"><BookOpen size={16} className="text-amber-500" /> הספרייה</h1>
          <button onClick={() => navigate('/add-series')} className="p-1.5 bg-amber-500 hover:bg-amber-600 text-black rounded-md transition-all"><Plus size={16} /></button>
        </div>
        <div className="p-3 border-b border-white/5">
          <div className="relative">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600" size={12} />
            <input type="text" placeholder="חיפוש..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 pr-7 pl-2 py-1.5 rounded-lg text-[11px] outline-none focus:border-amber-500/50" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredSeries.map((s) => (
            <button key={s._id} onClick={() => setSelectedSeries(s)} className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all border ${selectedSeries?._id === s._id ? 'bg-amber-500/10 border-amber-500/20' : 'border-transparent hover:bg-white/5'}`}>
              <div className="w-8 h-10 bg-gray-800 rounded border border-white/10 shrink-0 overflow-hidden">
                <img src={s.coverImage ? `http://localhost:5000/${s.coverImage}` : "https://via.placeholder.com/50x70"} className="w-full h-full object-cover" />
              </div>
              <div className="text-right min-w-0"><h3 className={`text-[11px] font-bold truncate ${selectedSeries?._id === s._id ? 'text-amber-500' : 'text-gray-300'}`}>{s.prefixName} {s.fileName}</h3></div>
            </button>
          ))}
        </div>
      </aside>

      {/* --- אזור תצוגה מרכזי חסכוני --- */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#050505]">
        {selectedSeries ? (
          <>
            {/* Header קומפקטי */}
            <header className="h-16 bg-[#0d0d0d] border-b border-white/5 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-black text-white">{selectedSeries.prefixName} {selectedSeries.fileName}</h2>
                <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-500 border border-white/10">{selectedSeries.author} | {selectedSeries.year}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/add-series?edit=${selectedSeries._id}`)} className="flex items-center gap-2 px-3 py-1.5 bg-white text-black rounded-lg text-[11px] font-black hover:bg-amber-500 transition-all"><Edit3 size={14} /> עדכון נתונים</button>
                <button className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              {/* רשימת כרכים בצד (Sub-Sidebar) */}
              <div className="w-56 border-l border-white/5 bg-[#080808] overflow-y-auto custom-scrollbar">
                <div className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 flex items-center gap-2"><List size={12}/> כרכים בסדרה</div>
                {selectedSeries.volumes?.map((v, idx) => (
                  <button key={idx} onClick={() => setActiveVolIdx(idx)} className={`w-full text-right p-3 border-b border-white/5 transition-all ${activeVolIdx === idx ? 'bg-amber-500/5 text-amber-500 border-r-2 border-r-amber-500' : 'hover:bg-white/5 text-gray-400'}`}>
                    <div className="text-[11px] font-bold">{v.volumeTitle || `כרך ${idx + 1}`}</div>
                    <div className="text-[9px] opacity-60 mt-1">{v.articles?.length || 0} מאמרים</div>
                  </button>
                ))}
              </div>

              {/* תוכן הכרך הפתוח - המאמרים */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505] p-6">
                {currentVol ? (
                  <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-2xl font-black text-white">{currentVol.volumeTitle}</h3>
                        <p className="text-sm text-amber-500/70 font-medium">{currentVol.mainTopic}</p>
                      </div>
                      {currentVol.pdfFileName && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20"><ExternalLink size={14}/> פתח PDF</button>
                      )}
                    </div>

                    <div className="grid gap-3">
                      <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-black text-gray-600 uppercase border-b border-white/5">
                        <div className="col-span-1">#</div>
                        <div className="col-span-7">שם המאמר ומחבר</div>
                        <div className="col-span-2 text-center">עמוד</div>
                        <div className="col-span-2">נושא</div>
                      </div>
                      {currentVol.articles?.map((art, aIdx) => (
                        <div key={aIdx} className="grid grid-cols-12 items-center bg-[#0d0d0d] border border-white/5 p-4 rounded-xl hover:border-white/20 transition-all group">
                          <div className="col-span-1 text-xs font-mono text-gray-600">{(aIdx + 1).toString().padStart(2, '0')}</div>
                          <div className="col-span-7">
                            <div className="text-sm font-bold text-gray-200 group-hover:text-amber-500 transition-colors">{art.title}</div>
                            <div className="text-[10px] text-gray-500 mt-1">{art.authors?.[0]?.firstName} {art.authors?.[0]?.lastName}</div>
                          </div>
                          <div className="col-span-2 text-center text-xs font-bold text-gray-400 bg-white/5 py-1 rounded-md">עמ' {art.page}</div>
                          <div className="col-span-2 text-[10px] text-gray-500 pr-2">{art.generalTopic || '---'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-600 italic">אין נתוני כרכים להצגה</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-700">
             <BookOpen size={40} className="mb-4 opacity-10" />
             <p className="text-sm">בחר סדרה מהרשימה בצד</p>
          </div>
        )}
      </main>
    </div>
  );
}