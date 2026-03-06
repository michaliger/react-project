import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <>
      {/* ========= חלק 1 – פתיחה עם תמונה על כל המסך ========= */}
      <section className="relative h-screen w-full relative overflow-hidden">
        <img
          src="books.jpg"
          alt="ספרי קודש"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />

        {/* כפתורים למעלה ימין */}
        <div className="absolute top-8 right-8 z-30 flex gap-4">
          <Link to="/login" className="px-8 py-4 bg-white/20 backdrop-blur-lg hover:bg-white/30 text-white font-medium rounded-full border border-white/40 transition-all hover:scale-105 shadow-2xl">
            התחברות
          </Link>
          <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-full transition-all hover:scale-105 shadow-2xl shadow-amber-600/60">
            הרשמה
          </Link>
        </div>

        {/* כיתוב ראשי באמצע */}
        <div className="relative h-full flex items-center justify-center text-center px-6">
          <div className="animate-fadeIn">
            <h1
              className="text-6xl md:text-8xl lg:text-9xl font-black text-white drop-shadow-3xl leading-tight"
              style={{ fontFamily: 'Frank Ruhl Libre, serif' }}
            >
              קבצים תורניים
            </h1>
          </div>
        </div>

        {/* חץ למטה עם אנימציה */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ========= חלק 2 – פירוט יפהפה על האוסף ========= */}
      <section className="py-24 px-6 bg-gradient-to-b from-slate-950 via-black to-slate-950">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-16 animate-fadeInUp">
            אוסף נדיר שנבנה באהבה ובקדושה
          </h2>

          <div className="grid md:grid-cols-3 gap-12 mb-20">
            {/* קלף 1 */}
            <div className="group transform transition-all duration-500 hover:-translate-y-6">
              <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/50 backdrop-blur-md rounded-3xl p-10 border border-amber-700/30 shadow-2xl">
                <div className="text-7xl font-black text-amber-400 mb- mb-6">150+</div>
                <h3 className="text-3xl font-bold text-white mb-4">סדרות קלאסיות</h3>
                <p className="text-amber-200 text-lg leading-relaxed">
                  תניא • ליקוטי מוהר״ן • משנה ברורה • אור החיים • חזון איש • שפת אמת • אגרות משה • ועוד ענקים
                </p>
              </div>
            </div>

            {/* קלף 2 */}
            <div className="group transform transition-all duration-500 hover:-translate-y-6">
              <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/50 backdrop-blur-md rounded-3xl p-10 border border-amber-700/30 shadow-2xl">
                <div className="text-7xl font-black text-amber-400 mb-6">10,000+</div>
                <h3 className="text-3xl font-bold text-white mb-4">כרכים דיגיטליים</h3>
                <p className="text-amber-200 text-lg leading-relaxed">
                  כל כרך סרוק באיכות גבוהה, נקי, עם סימניות וחיפוש פנימי
                </p>
              </div>
            </div>

            {/* קלף 3 */}
            <div className="group transform transition-all duration-500 hover:-translate-y-6">
              <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/50 backdrop-blur-md rounded-3xl p-10 border border-amber-700/30 shadow-2xl">
                <div className="text-7xl font-black text-amber-400 mb-6">בחינם</div>
                <h3 className="text-3xl font-bold text-white mb-4">לכל עם ישראל</h3>
                <p className="text-amber-200 text-lg leading-relaxed">
                  נבנה מתוך אהבת התורה והרצון להפיץ אור לכל בית יהודי
                </p>
              </div>
            </div>
          </div>

          {/* כפתור כניסה גדול */}
          <Link
            to="/series"
            className="inline-flex items-center gap-6 px-24 py-8 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-700 hover:via-amber-600 hover:to-yellow-700 text-white text-4xl font-black rounded-full shadow-2xl transition-all transform hover:scale-110 hover:shadow-amber-500/70"
          >
            כניסה לאוסף המלא
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ========= Footer קטן ומרגש ========= */}
      <footer className="py-12 px-6 bg-white border-t border-amber-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl text-amber-300 italic mb-4" style={{ fontFamily: 'Frank Ruhl Libre, serif' }}>
            "כי מציון תצא תורה ודבר ה' מירושלים"
          </p>
          <p className="text-amber-100 text-lg">
            בברכה ובאהבה גדולה • מיכלי
          </p>
          <p className="text-amber-200/60 text-sm mt-6">
            © {new Date().getFullYear()} קבצים תורניים • כל הזכויות שמורות בקדושה
          </p>
        </div>
      </footer>

      {/* אנימציות קטנות ויפות */}
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 1.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}