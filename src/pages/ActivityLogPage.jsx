import ActivityLog from '../components/ActivityLog'

export default function ActivityLogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-white p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 glass-effect rounded-2xl shadow-glow p-4 sm:p-6 animate-fadeIn">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-700 mb-2">
            היסטוריית פעילות
          </h1>
          <p className="text-gray-600 text-sm sm:text-base font-medium">
            צפה בכל הפעילויות והשינויים במערכת
          </p>
        </div>
        <ActivityLog limitCount={100} />
      </div>
    </div>
  )
}

