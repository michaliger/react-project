// src/pages/HomePage.jsx
import { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, Users, Sparkles, ChevronDown } from "lucide-react";
import SeriesCard from '../components/SeriesCard';
import seriesData from '../data/series.json'; // תוודאי שיש לך את הקובץ הזה

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSeries, setFilteredSeries] = useState(seriesData);

  const searchInputRef = useRef(null);

  useEffect(() => {
    // פוקוס אוטומטי בחיפוש כשנכנסים לדף
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSeries(seriesData);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = seriesData.filter(s => 
      s.title.toLowerCase().includes(term) ||
      s.author.toLowerCase().includes(term) ||
      s.seriesName.toLowerCase().includes(term) ||
      s.tags.some(tag => tag.toLowerCase().includes(term)) ||
      s.volumes.some(v => v.volumeNumber.toString().includes(term) || v.title.toLowerCase().includes(term))
    );
    setFilteredSeries(filtered);
  }, [searchTerm]);

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero עם רקע אנימציה של ספרים מרחפים */}
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        {/* אנימציית ספרים מרחפים ברקע */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-24 h-32 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg shadow-2xl opacity-10 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${15 + Math.random() * 20}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            >
              <div className="absolute inset-2 bg-amber-700 rounded"></div>
            </div>
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
          {/* תמונה ראשית מדהימה של ספרים פתוחים */}
          <div className="mb-10 relative">
            <div className="w-80 h-80 mx-auto relative animate-pulse-slow">
              <img 
                src="https://i.imgur.com/5e9kG8L.jpg" 
                alt="ספרי קודש פתוחים"
                className="w-full h-full object-cover rounded-full shadow-3xl border-8 border-amber-200"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute -inset-4 bg-amber-400/20 rounded-full blur-3xl animate-pulse"></div>
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-amber-900 mb-6 leading-tight">
            ספריית הקודש
            <span className="block text-4xl md:text-6xl font-light text-amber-700 mt-4">הדיגיטלית</span>
          </h1>

          <p className="text-xl md:text-2xl text-amber-800 mb-10 max-w-3xl font-medium">
            אלפי כרכים • מאות סדרות • חיפוש חכם • גישה מיידית
          </p>

          {/* חיפוש חכם גדול ויפה */}
          <div className="relative w-full max-w-3xl mb-8">
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <Search className="w-8 h-8 text-amber-600" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חפשו רב, סדרה, כותרת, כרך..."
              className="w-full px-16 py-8 pr-16 text-2xl font-heebo bg-white/95 backdrop-blur-lg border-4 border-amber-300 rounded-3xl shadow-2xl focus:outline-none focus:border-amber-500 transition-all duration-300 text-right"
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2">
              <Sparkles className="w-10 h-10 text-amber-500 animate-spin-slow" />
            </div>
          </div>

          <button 
            onClick={scrollToContent}
            className="animate-bounce mt-16"
          >
            <ChevronDown className="w-12 h-12 text-amber-700" />
          </button>
        </div>
      </div>

      {/* תוכן אחרי הגלילה */}
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-amber-100 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-amber-900 mb-6">מה מחכה לכם כאן?</h2>
            <p className="text-2xl text-amber-700">הספרייה הדיגיטלית הכי שלמה ברשת</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 mb-20">
            <div className="bg-white/90 backdrop-blur p-10 rounded-3xl shadow-2xl text-center hover:scale-105 transition-transform">
              <BookOpen className="w-20 h-20 text-amber-600 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-amber-900 mb-4">אלפי כרכים</h3>
              <p className="text-lg text-gray-700">כל ספרי הקודש במקום אחד – מהתנ"ך ועד הפוסקים האחרונים</p>
            </div>

            <div className="bg-white/90 backdrop-blur p-10 rounded-3xl shadow-2xl text-center hover:scale-105 transition-transform">
              <Search className="w-20 h-20 text-amber-600 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-amber-900 mb-4">חיפוש חכם</h3>
              <p className="text-lg text-gray-700">מצאו בדיוק מה שאתם מחפשים – לפי רב, סדרה, כותרת או כרך</p>
            </div>

            <div className="bg-white/90 backdrop-blur p-10 rounded-3xl shadow-2xl text-center hover:scale-105 transition-transform">
              <Users className="w-20 h-20 text-amber-600 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-amber-900 mb-4">לכולם</h3>
              <p className="text-lg text-gray-700">תלמידי ישיבות, אברכים, בעלי בתים – כולם מוזמנים</p>
            </div>
          </div>

          {/* תוצאות החיפוש או כל הסדרות */}
          <div className="mt-20">
            <h2 className="text-4xl font-black text-amber-900 text-center mb-12">
              {searchTerm ? `נמצאו ${filteredSeries.length} תוצאות עבור "${searchTerm}"` : 'כל הסדרות'}
            </h2>

            {filteredSeries.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-3xl text-amber-700">לא נמצאו תוצאות... 😔</p>
                <p className="text-xl text-gray-600 mt-4">נסו לחפש משהו אחר</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredSeries.map(series => (
                  <SeriesCard key={series.id} series={series} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-100px) rotate(15deg); }
        }
        .animate-float { animation: float linear infinite; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        .animate-pulse-slow { animation: pulse 4s ease-in-out infinite; }
      `}</style>
    </>
  );
}