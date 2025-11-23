export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="animate-spin rounded-full h-24 w-24 border-t-8 border-b-8 border-amber-600 mb-8"></div>
      <p className="text-3xl font-medium text-amber-800 animate-pulse">
        טוענת את האוסף היפה של מיכלי...
      </p>
    </div>
  )
}