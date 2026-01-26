import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Search, Plus, BookOpen, ChevronLeft, Clock, Bookmark, Layers } from 'lucide-react';

export default function App() {
  const [allSeries, setAllSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchScope, setSearchScope] = useState("all");

  const navigate = (path) => {
    window.location.href = path;
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/series')
      .then(res => res.json())
      .then(result => {
        const seriesArray = result?.data?.series || [];
        setAllSeries(seriesArray);
        setLoading(false);
      })
      .catch(err => {
        console.error('שגיאה:', err);
        setLoading(false);
      });
  }, []);

  const filteredSeries = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return allSeries;

    return allSeries.filter(series => {
      const seriesMatch = 
        series.prefixName?.toLowerCase().includes(term) ||
        series.fileName?.toLowerCase().includes(term) ||
        series.author?.toLowerCase().includes(term) ||
        series.genre?.toLowerCase().includes(term) ||
        series.year?.toString().includes(term) ||
        series.coverType?.toLowerCase().includes(term);

      const volumeMatch = series.volumes?.some(vol => 
        vol.title?.toLowerCase().includes(term) ||
        vol.year?.toString().includes(term)
      );

      const articleMatch = series.volumes?.some(vol => 
        vol.articles?.some(art => art.title?.toLowerCase().includes(term))
      );

      if (searchScope === "series") return seriesMatch;
      if (searchScope === "volume") return volumeMatch;
      if (searchScope === "article") return articleMatch;
      
      return seriesMatch || volumeMatch || articleMatch;
    });
  }, [searchTerm, allSeries, searchScope]);

  const deleteSeries = async (id, name) => {
    if (!window.confirm(`למחוק את "${name}"?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/series/${id}`, { method: 'DELETE' });
      if (res.ok) setAllSeries(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-3 md:p-6 font-sans selection:bg-amber-500/30" dir="rtl">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="text-amber-500" size={20} />
              הספרייה הדיגיטלית
            </h1>
            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
              {filteredSeries.length} פריטים רשומים במערכת
            </p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => navigate('/add-series')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-all text-[12px] font-bold">
              <Plus size={14} /> סדרה
            </button>
            <button onClick={() => navigate('/add-volume')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-all text-[12px] font-bold">
              <Plus size={14} /> כרך
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="sticky top-2 z-10 bg-[#0a0a0a]/80 backdrop-blur-md mb-4">
          <div className="bg-gray-900/40 border border-gray-800/60 p-1.5 rounded-xl shadow-2xl flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
              <input
                type="text"
                placeholder="חפש הכל..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-transparent pr-8 pl-3 py-1.5 outline-none text-sm text-white placeholder:text-gray-700"
              />
            </div>
            <div className="flex bg-black/40 p-0.5 rounded-lg border border-gray-800/40">
              {['all', 'series', 'volume', 'article'].map(opt => (
                <button
                  key={opt}
                  onClick={() => setSearchScope(opt)}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                    searchScope === opt ? 'bg-gray-700 text-amber-400' : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {opt === 'all' ? 'הכל' : opt === 'series' ? 'סדרה' : opt === 'volume' ? 'גיליון' : 'מאמר'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Series List */}
        <div className="space-y-1">
          {filteredSeries.map((s, i) => (
            <div
              key={s._id}
              className="group flex items-center gap-3 p-1.5 bg-gray-900/20 border border-gray-800/40 hover:bg-gray-800/30 hover:border-gray-700 rounded-lg transition-all"
            >
              {/* Thumbnail - FIXED PATH */}
              <div className="w-8 h-10 bg-gray-800 rounded sm:rounded-md overflow-hidden flex-shrink-0 border border-gray-700/50">
                <img
                  src={s.coverImage ? `http://localhost:5000/${s.coverImage}` : "https://via.placeholder.com/50x70?text=No+Cover"}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  alt=""
                  onError={e => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/50x70?text=Error';
                  }}
                />
              </div>

              {/* Info Container */}
              <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-600">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="text-sm font-semibold text-gray-200 truncate group-hover:text-amber-500 transition-colors">
                      {s.prefixName || s.fileName}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-0.5 overflow-hidden">
                    {s.author && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-500 truncate max-w-[100px]">
                        <Bookmark size={10} className="text-amber-800" /> {s.author}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-gray-600">
                      <Clock size={10} /> {s.year || '----'}
                    </span>
                    <span className="hidden md:flex items-center gap-1 text-[10px] text-gray-600">
                      <Layers size={10} /> {s.coverType || 'סטנדרטי'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="hidden sm:flex flex-col items-center">
                    {/* FIXED CALCULATION - אם המערך בשרת נקי, לא צריך לחלק ב-2 */}
                    <span className="text-xs font-bold text-gray-400 leading-none">{s.volumes?.length || 0}</span>
                    <span className="text-[8px] text-gray-600 uppercase font-black">כרכים</span>
                  </div>
                  
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => deleteSeries(s._id, s.prefixName || s.fileName)}
                      className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button className="p-1.5 text-gray-600 hover:text-amber-500 transition-colors">
                      <ChevronLeft size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSeries.length === 0 && (
          <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl mt-4">
            <p className="text-gray-600 text-xs font-medium uppercase tracking-widest">לא נמצאו תוצאות</p>
          </div>
        )}
      </div>
    </div>
  );
}