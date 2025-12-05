import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getJournal, getJournalTrademarks } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import Pagination from '../components/Pagination'
import { format } from 'date-fns'
import { ArrowLeft, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function JournalDetail() {
  const { id } = useParams()
  const [page, setPage] = useState(1)
  
  const { data: journal, isLoading: journalLoading } = useQuery({
    queryKey: ['journal', id],
    queryFn: () => getJournal(id)
  })
  
  const { data: trademarksData, isLoading: trademarksLoading } = useQuery({
    queryKey: ['journal-trademarks', id, page],
    queryFn: () => getJournalTrademarks(id, { page, limit: 50 })
  })
  
  if (journalLoading || trademarksLoading) return <LoadingSpinner size="lg" />
  
  const trademarks = trademarksData?.trademarks || []
  const totalPages = trademarksData?.pages || 1
  
  return (
    <div className="space-y-6">
      <Link to="/journals" className="inline-flex items-center text-primary-600 hover:text-primary-700">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Journals
      </Link>
      
      {/* Journal Info */}
      <div className="card">
        <div className="flex items-start space-x-4">
          <FileText className="h-8 w-8 text-primary-600" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              Journal {journal?.journal_number}
            </h2>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Publication Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {journal && format(new Date(journal.publication_date), 'dd MMM yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">PDF Files</p>
                <p className="text-sm font-medium text-gray-900">{journal?.pdf_count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Trademarks</p>
                <p className="text-sm font-medium text-gray-900">
                  {journal?.total_trademarks?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`badge ${
                  journal?.status === 'completed' ? 'badge-success' : 'badge-warning'
                }`}>
                  {journal?.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trademarks List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Trademark Applications ({trademarksData?.total || 0})
        </h3>
        
        <div className="space-y-4">
          {trademarks.map((tm) => (
            <div key={tm.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">
                      {tm.trademark_name || 'Unnamed Trademark'}
                    </h4>
                    {tm.class_number && (
                      <span className="badge badge-info">Class {tm.class_number}</span>
                    )}
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    {tm.application_number && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Application:</span> {tm.application_number}
                      </p>
                    )}
                    {tm.applicant_name && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Applicant:</span> {tm.applicant_name}
                      </p>
                    )}
                    {tm.goods_services && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <span className="font-medium">Goods/Services:</span> {tm.goods_services}
                      </p>
                    )}
                  </div>
                </div>
                
                <Link
                  to={`/trademarks/${tm.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {trademarks.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No trademarks found for this journal</p>
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
