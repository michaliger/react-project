import { Link, useNavigate } from 'react-router-dom';
import { UserCircle, LogOut } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://node-project-cvek.onrender.com/api';
  const SERVER_BASE_URL = API_URL.replace('/api', '');

  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const hasUser = Object.keys(loggedInUser).length > 0;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload(); 
  };

  const bgImageSource = "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000";

  return (
    <>
      <section className="relative h-screen w-full overflow-hidden" dir="rtl">
        
        {/* תמונת רקע חכמה - בודקת אם מדובר בכתובת מלאה או מקומית */}
        <img
          src={bgImageSource.startsWith('http') ? bgImageSource : `${SERVER_BASE_URL}/uploads/${bgImageSource}`}
          alt="רקע ספריה תורנית"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none filter brightness-[0.25] transform scale-105 animate-subtleZoom"
        />

        <header className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent">
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-xl font-black text-white tracking-wide drop-shadow-md font-serif">
              אוצר הספרות <span className="text-amber-400">התורנית</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {hasUser ? (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-inner">
                <div className="flex items-center gap-2 text-slate-200 text-sm font-bold">
                  <UserCircle className="w-4 h-4 text-amber-400" />
                  <span>שלום, {loggedInUser.name || 'משתמש'}</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-black tracking-wider transition-colors uppercase cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  יציאה
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-bold border border-white/20 shadow-sm hover:bg-white hover:text-slate-900 hover:scale-105 hover:shadow-lg transition-all transform"
              >
                כניסת מנהל
              </Link>
            )}
          </div>

        </header>

        <div className="relative h-full flex flex-col justify-center items-center text-center px-4 z-10 select-none">
          
          <div className="mb-6 animate-fadeInUp">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm text-amber-300 text-xs md:text-sm font-black tracking-widest uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              מערכת קטלוג ומפתוח דינמי
            </span>
          </div>

          <div className="max-w-4xl space-y-4 mb-10 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-tight drop-shadow-xl font-serif">
              פתח לנו שער <br className="md:hidden" />
              למפתחות <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 drop-shadow-none">החכמה</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-2xl mt-4 font-medium drop-shadow-md">
              סדרות, גליונות ומאמרים
            </p>
          </div>

          <div className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <Link
              to="/series"
              className="inline-flex items-center gap-4 px-10 py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-700 hover:via-amber-600 hover:to-yellow-700 text-white text-xl md:text-2xl font-black rounded-full shadow-[0_10px_25px_rgba(217,119,6,0.4)] transition-all transform hover:scale-105"
            >
              כניסה לאוסף המלא
              <svg className="w-7 h-7 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

        </div>
      </section>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtleZoom {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-subtleZoom {
          animation: subtleZoom 20s ease-in-out infinite alternate;
        }
      `}</style>
    </>
  );
}