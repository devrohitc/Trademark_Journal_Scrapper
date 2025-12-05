import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileCheck, Loader2, CheckCircle2, XCircle, Activity } from 'lucide-react'

export default function ProgressTracker({ endpoint, onComplete, onError }) {
  const [progress, setProgress] = useState(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!endpoint || !isActive) return

    const eventSource = new EventSource(`http://localhost:8000${endpoint}`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setProgress(data)

        if (data.type === 'complete') {
          eventSource.close()
          setIsActive(false)
          if (onComplete) onComplete(data)
        } else if (data.type === 'error') {
          eventSource.close()
          setIsActive(false)
          if (onError) onError(data.message)
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error)
      eventSource.close()
      setIsActive(false)
      if (onError) onError('Connection error')
    }

    return () => {
      eventSource.close()
    }
  }, [endpoint, isActive, onComplete, onError])

  const start = () => {
    setIsActive(true)
    setProgress(null)
  }

  const getIcon = () => {
    if (!progress) return <Activity className="h-5 w-5 animate-pulse" />
    
    switch (progress.type) {
      case 'start':
        return <Loader2 className="h-5 w-5 animate-spin" />
      case 'progress':
        return endpoint.includes('download') 
          ? <Download className="h-5 w-5 animate-pulse" />
          : <FileCheck className="h-5 w-5 animate-pulse" />
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const getProgressColor = () => {
    if (!progress) return 'bg-blue-500'
    
    switch (progress.type) {
      case 'complete':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'progress':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      {/* Control Button */}
      {!isActive && (
        <button
          onClick={start}
          className="btn-primary w-full"
        >
          {endpoint?.includes('download') ? '📥 Start Download' : '🔍 Start Extraction'}
        </button>
      )}

      {/* Progress Card */}
      <AnimatePresence>
        {isActive && progress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card"
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${progress.type === 'complete' ? 'bg-green-100' : progress.type === 'error' ? 'bg-red-100' : 'bg-blue-100'}`}>
                {getIcon()}
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {progress.type === 'start' && 'Starting...'}
                  {progress.type === 'progress' && 'In Progress'}
                  {progress.type === 'complete' && 'Completed!'}
                  {progress.type === 'error' && 'Error'}
                </h4>
                
                <p className="text-sm text-gray-600 mb-2">
                  {progress.message}
                </p>

                {/* Progress Stats */}
                {progress.type === 'progress' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {progress.journals_found !== undefined && (
                      <div className="text-sm">
                        <span className="font-medium">Journals:</span> {progress.journals_found}
                      </div>
                    )}
                    {progress.pdfs_downloaded !== undefined && (
                      <div className="text-sm">
                        <span className="font-medium">PDFs:</span> {progress.pdfs_downloaded}
                      </div>
                    )}
                    {progress.pending_pdfs !== undefined && (
                      <div className="text-sm">
                        <span className="font-medium">Pending:</span> {progress.pending_pdfs}
                      </div>
                    )}
                  </div>
                )}

                {/* Completion Stats */}
                {progress.type === 'complete' && (
                  <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-green-50 rounded-lg">
                    {progress.journals !== undefined && (
                      <div className="text-sm">
                        <span className="font-medium text-green-800">Journals:</span> 
                        <span className="text-green-900 ml-1">{progress.journals}</span>
                      </div>
                    )}
                    {progress.pdfs !== undefined && (
                      <div className="text-sm">
                        <span className="font-medium text-green-800">PDFs:</span> 
                        <span className="text-green-900 ml-1">{progress.pdfs}</span>
                      </div>
                    )}
                    {progress.records !== undefined && (
                      <div className="text-sm">
                        <span className="font-medium text-green-800">Records:</span> 
                        <span className="text-green-900 ml-1">{progress.records}</span>
                      </div>
                    )}
                    {progress.pdfs_processed !== undefined && (
                      <div className="text-sm">
                        <span className="font-medium text-green-800">Processed:</span> 
                        <span className="text-green-900 ml-1">{progress.pdfs_processed}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${getProgressColor()}`}
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: progress.type === 'complete' ? '100%' : 
                             progress.type === 'progress' ? '60%' : 
                             progress.type === 'start' ? '10%' : '0%'
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Console Link */}
      {isActive && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-500 text-center"
        >
          💡 Check backend terminal for detailed progress
        </motion.p>
      )}
    </div>
  )
}
