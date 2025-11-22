import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">שגיאה בטעינת האפליקציה</h2>
            <p className="text-gray-600 mb-4">{this.state.error?.message || 'אירעה שגיאה לא צפויה'}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              רענן דף
            </button>
            <details className="mt-4 text-right">
              <summary className="cursor-pointer text-gray-500">פרטי שגיאה</summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

