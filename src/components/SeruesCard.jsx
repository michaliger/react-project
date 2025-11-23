export default function SeriesCard({ series }) {
  const cover = series.coverImage
    ? `http://localhost:5000/images/series-covers/${series.coverImage}`
    : 'http://localhost:5000/images/series-covers/default-series.jpg'

  return (
    <div className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2">
      <div className="relative overflow-hidden">
        <img
          src={cover}
          alt={series.fileName}
          className="w-full h-96 object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => (e.target.src = 'http://localhost:5000/images/series-covers/default-series.jpg')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>

      <div className="p-7 text-center">
        <h3 className="text-2xl font-bold text-amber-900 mb-3">
          {series.prefixName} {series.fileName.replace(/-/g, ' ')}
        </h3>
        
        {series.details && (
          <p className="text-gray-600 leading-relaxed mb-5">{series.details}</p>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          {series.genre && (
            <span className="px-5 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 rounded-full text-sm font-medium border border-amber-300">
              {series.genre}
            </span>
          )}
          {series.rarity && (
            <span className="px-5 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-medium border border-purple-300">
              {series.rarity}
            </span>
          )}
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
    </div>
  )
}