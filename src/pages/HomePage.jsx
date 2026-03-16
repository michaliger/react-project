import { Link, useNavigate } from 'react-router-dom';
import { UserCircle, LogOut } from 'lucide-react'; // הוספנו אייקונים למראה מקצועי

export default function HomePage() {
  const navigate = useNavigate();
  
  // שולפים את נתוני המשתמש מהזיכרון
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const hasUser = Object.keys(loggedInUser).length > 0;

  // פונקציית התנתקות
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload(); // רענון העמוד כדי לעדכן את התצוגה
  };

  return (
    <>
      {/* Container ראשי שעוטף הכל בגובה המסך בדיוק */}
      <section className="relative h-screen w-full overflow-hidden" dir="rtl">
        
        {/* תמונת רקע */}
        <img
          src="books.jpg"
          alt="ספרי קודש"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />

        {/* שורת משתמש עליונה (Header) */}
        <div className="absolute top-6 right-6 left-6 z-30 flex justify-between items-center">
          <div className="flex gap-4 items-center">
            {hasUser ? (
              // תצוגה למשתמש מחובר
              <>
                <div className="flex items-center gap-2 text-white bg-white/10 px-5 py-2.5 rounded-full border border-white/20 backdrop-blur-md shadow-lg">
                  <UserCircle size={20} className="text-amber-400" />
                  <span className="font-medium text-sm md:text-base">שלום, {loggedInUser.name || 'משתמש'}</span>
                  {loggedInUser.role === 'admin' && (
                    <span className="bg-blue-600 text-[10px] px-2 py-0.5 rounded font-bold ml-1">מנהל</span>
                  )}
                </div>
                <button 
                  onClick={handleLogout} 
                  className="px-5 py-2.5 bg-red-500/80 hover:bg-red-600/90 text-white text-sm md:text-base font-medium rounded-full backdrop-blur-md transition-all shadow-lg flex items-center gap-1.5"
                >
                  <LogOut size={16} /> התנתקות
                </button>
              </>
            ) : (
              // תצוגה לאורח
              <>
                <Link to="/login" className="px-6 py-2.5 bg-white/20 backdrop-blur-lg hover:bg-white/30 text-white text-sm md:text-base font-medium rounded-full border border-white/40 transition-all shadow-lg">
                  התחברות
                </Link>
                <Link to="/register" className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-sm md:text-base font-bold rounded-full transition-all shadow-lg shadow-amber-600/50">
                  הרשמה
                </Link>
              </>
            )}
          </div>
        </div>

        {/* כיתוב ראשי וכפתור כניסה (הכל יחד באמצע) */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 z-20">
          
          <div className="animate-fadeIn mb-10">
            <h1
              className="text-6xl md:text-7xl lg:text-9xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] leading-tight"
              style={{ fontFamily: 'Frank Ruhl Libre, serif' }}
            >
              קבצים תורניים
            </h1>
            <p className="text-white text-amber-400 text-lg md:text-2xl mt-4 font-medium drop-shadow-md">
              מאגר סדרות, גליונות ומאמרים תורניים
            </p>
          </div>

          {/* כפתור כניסה בפרופורציה נכונה בתוך הדף */}
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

      {/* אנימציות */}
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          opacity: 0;
          animation: fadeInUp 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 1.2s ease-out;
        }
      `}</style>
    </>
  )
}