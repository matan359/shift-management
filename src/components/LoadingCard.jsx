export default function LoadingCard({ count = 3 }) {
  return (
    <div className="glass-effect rounded-2xl shadow-glow p-4 sm:p-6 animate-pulse">
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

