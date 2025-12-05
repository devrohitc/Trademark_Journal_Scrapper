import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getJournals, deleteJournal } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import Pagination from '../components/Pagination'
import ExportButton from '../components/ExportButton'
import { format } from 'date-fns'
import { Eye, Trash2 } from 'lucide-react'

export default function Journals() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const queryClient = useQueryClient()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['journals', page, status],
    queryFn: () => getJournals({ page, limit: 20, status: status || undefined })
  })
  
  const deleteMutation = useMutation({
    mutationFn: deleteJournal,
    onSuccess: () => {
      queryClient.invalidateQueries(['journals'])
      queryClient.invalidateQueries(['dashboard'])
      setDeleteConfirm(null)
    }
  })
  
  const handleDelete = (journal) => {
    if (window.confirm(
      `Are you sure you want to delete Journal ${journal.journal_number}?\n\n` +
      `This will permanently delete:\n` +
      `- ${journal.pdf_count} PDF files\n` +
      `- ${journal.total_trademarks || 0} trademark records\n` +
      `- Journal data from database\n\n` +
      `This action cannot be undone!`
    )) {
      deleteMutation.mutate(journal.id)
    }
  }
  
  if (isLoading) return <LoadingSpinner size="lg" />
  if (error) return <ErrorMessage message={error.message} />
  
  const journals = data?.journals || []
  const totalPages = data?.pages || 1
  
  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge badge-warning',
      processing: 'badge badge-info',
      completed: 'badge badge-success',
      error: 'badge badge-error'
    }
    return badges[status] || 'badge'
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Trademark Journals</h2>
        <div className="flex items-center space-x-3">
          <ExportButton 
            type="by-journal" 
            journalIds={journals.map(j => j.id)}
          />
        </div>
      </div>
      
      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="input-field"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="error">Error</option>
          </select>
          <span className="text-sm text-gray-500">
            Total: {data?.total || 0} journals
          </span>
        </div>
      </div>
      
      {/* Journals Table */}
      <div className="table-container">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Journal No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Publication Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PDFs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trademarks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {journals.map((journal, index) => (
              <motion.tr 
                key={journal.id} 
                className="hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.01 }}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {journal.journal_number}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {format(new Date(journal.publication_date), 'dd MMM yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{journal.pdf_count}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {journal.total_trademarks?.toLocaleString() || 0}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(journal.status)}>
                    {journal.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/journals/${journal.id}`}
                      className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(journal)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-900 flex items-center space-x-1 disabled:opacity-50"
                      title="Delete journal and all data"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {journals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No journals found</p>
        </div>
      )}
      
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
