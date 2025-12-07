import { useState } from 'react'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('יוצרת חשבון...')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('נרשמת בהצלחה! מועברת להתחברות ❤')
        setTimeout(() => window.location.href = '/login', 2000)
      } else {
        setMessage(data.message || 'שגיאה בהרשמה')
      }
    } catch (err) {
      setMessage('אין חיבור לשרת – בדקי שה-node רץ')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl p-10 border border-amber-600/30 shadow-2xl">
        <h2 className="text-5xl font-bold text-white text-center mb-10">הרשמה</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="שם מלא" required className="w-full px-6 py-5 bg-white/20 border border-white/30 rounded-full text-black placeholder-white/60 focus:outline-none focus:border-amber-400 transition-all text-lg" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="דוא״ל" required className="w-full px-6 py-5 bg-white/20 border border-white/30 rounded-full text-white placeholder-white/60 focus:outline-none focus:border-amber-400 transition-all text-lg" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="סיסמה" required className="w-full px-6 py-5 bg-white/20 border border-white/30 rounded-full text-white placeholder-white/60 focus:outline-none focus:border-amber-400 transition-all text-lg" />
          
          <button type="submit" className="w-full py-5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xl font-bold rounded-full shadow-xl transition-all hover:scale-105">
            צרי חשבון
          </button>
        </form>

        {message && <p className={`text-center mt-8 text-xl font-medium ${message.includes('הצלחה') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
        
        <p className="text-center text-amber-300 mt-8 text-lg">
          כבר רשומה? <a href="/login" className="underline hover:text-white font-bold">התחברי</a>
        </p>
      </div>
    </div>
  )
}