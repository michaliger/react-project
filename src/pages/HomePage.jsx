import { useEffect, useState } from 'react'
import SeriesCard from "../components/SeriesCard"
import LoadingSpinner from "../components/LoadingSpinner"
import { getAllSeries } from '../services/api'

export default function HomePage() {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllSeries()
      .then(setSeries)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        {series.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-4xl font-light text-amber-700">
              הספרייה עוד ריקה... אבל זה רק עניין של זמן עד שתתמלא באוצרות ♡
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-12">
            {series.map(s => (
              <SeriesCard key={s._id} series={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}