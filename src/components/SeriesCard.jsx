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
          onError={(e) => (e.target.src = '../default-series.jpg')}
        />
      </div>

      <div className="p-7 text-center">
        <h3 className="text-2xl font-bold text-amber-900 mb-3">
          {series.prefixName} {series.fileName.replace(/-/g, ' ')}
        </h3>
        {series.details && (
          <p className="text-gray-600 leading-relaxed mb-5">{series.details}</p>
        )}
      </div>
    </div>
  )
}