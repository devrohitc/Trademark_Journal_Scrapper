import { useQuery } from '@tanstack/react-query'
import { getStatistics, triggerScraper, cleanupAllData } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { FileText, Scale, Database, Calendar, Play, TrendingUp, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false)
  const [scraperMessage, setScraperMessage] = useState('')
  
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['statistics'],
    queryFn: getStatistics,
    refetchInterval: scraperMessage ? 5000 : false, // Auto-refresh every 5s when scraper running
  })
  
  const handleRunScraper = async () => {
    try {
      await triggerScraper()
      setScraperMessage('🚀 Scraper started! Downloading and extracting PDFs...')
      
      // Auto-clear message and refresh after 2 minutes
      setTimeout(() => {
        setScraperMessage('')
        refetch()
      }, 120000) // 2 minutes
    } catch (err) {
      setScraperMessage('❌ Error: ' + err.message)
      setTimeout(() => setScraperMessage(''), 5000)
    }
  }
  
  const handleCleanup = async () => {
    if (!showCleanupConfirm) {
      setShowCleanupConfirm(true)
      return
    }
    
    try {
      const result = await cleanupAllData()
      alert(`✅ Cleanup successful!\n\nDeleted:\n- ${result.deleted.journals} journals\n- ${result.deleted.pdfs} PDF records\n- ${result.deleted.trademarks} trademarks\n- ${result.deleted.files} PDF files\n- ${result.deleted.logs} logs`)
      setShowCleanupConfirm(false)
      refetch()
    } catch (err) {
      alert('Error during cleanup: ' + err.message)
      setShowCleanupConfirm(false)
    }
  }
  
  if (isLoading) return <LoadingSpinner size="lg" />
  if (error) return <ErrorMessage message={error.message} />
  
  const summary = stats?.summary || {}
  const latestJournal = stats?.latest_journal || {}
  
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex space-x-3">
          <button
            onClick={handleRunScraper}
            disabled={!!scraperMessage}
            className={`btn-primary flex items-center space-x-2 ${scraperMessage ? 'opacity-75 cursor-not-allowed' : ''}`}>
            <Play className="h-4 w-4" />
            <span>{scraperMessage ? 'Running...' : 'Run Scraper'}</span>
          </button>
          
          <button
            onClick={handleCleanup}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showCleanupConfirm 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onMouseLeave={() => setTimeout(() => setShowCleanupConfirm(false), 3000)}
          >
            <Trash2 className="h-4 w-4" />
            <span>{showCleanupConfirm ? 'Click Again to Confirm' : 'Delete All Data'}</span>
          </button>
        </div>
      </div>
      
      {/* Scraper Status Message */}
      {scraperMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="card bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
            <p className="text-sm font-medium text-blue-900">{scraperMessage}</p>
            <button
              onClick={() => setScraperMessage('')}
              className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium">
              Dismiss
            </button>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Page will auto-refresh in 2 minutes. Check backend terminal for detailed progress.
          </p>
        </motion.div>
      )}
      
      {/* Summary Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}>
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          className="card cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Journals</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.total_journals?.toLocaleString() || 0}
              </p>
            </div>
            <FileText className="h-12 w-12 text-primary-600 opacity-75" />
          </div>
        </motion.div>
        
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          className="card cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total PDFs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.total_pdfs?.toLocaleString() || 0}
              </p>
            </div>
            <Database className="h-12 w-12 text-green-600 opacity-75" />
          </div>
        </motion.div>
        
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          className="card cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Trademarks</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.total_trademarks?.toLocaleString() || 0}
              </p>
            </div>
            <Scale className="h-12 w-12 text-blue-600 opacity-75" />
          </div>
        </motion.div>
      </motion.div>
      
      {/* Latest Journal */}
      {latestJournal && latestJournal.journal_number && (
        <div className="card bg-primary-50 border border-primary-200">
          <div className="flex items-start space-x-4">
            <Calendar className="h-8 w-8 text-primary-600" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Latest Journal
              </h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Journal Number:</span> {latestJournal.journal_number}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Publication Date:</span>{' '}
                  {latestJournal.publication_date && format(new Date(latestJournal.publication_date), 'dd MMM yyyy')}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Trademarks:</span> {latestJournal.trademark_count?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Class Distribution Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Class Distribution</span>
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {stats?.class_distribution?.map((item) => (
            <div key={item.class} className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700 w-16">
                Class {item.class}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-6">
                <div
                  className="bg-primary-600 h-6 rounded-full flex items-center justify-end px-2"
                  style={{
                    width: `${Math.min(100, (item.count / Math.max(...(stats?.class_distribution?.map(d => d.count) || [1]))) * 100)}%`
                  }}
                >
                  <span className="text-xs text-white font-medium">
                    {item.count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Journals */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Journals</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Journal No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Publication Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trademarks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.recent_journals?.map((journal) => (
                <tr key={journal.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {journal.journal_number}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(journal.publication_date), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {journal.trademark_count?.toLocaleString() || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
