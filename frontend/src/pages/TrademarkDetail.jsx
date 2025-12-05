import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getTrademark } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { ArrowLeft, Calendar, Building, User, FileText, MapPin } from 'lucide-react'
import { format } from 'date-fns'

export default function TrademarkDetail() {
  const { id } = useParams()
  
  const { data: trademark, isLoading, error } = useQuery({
    queryKey: ['trademark', id],
    queryFn: () => getTrademark(id)
  })
  
  if (isLoading) return <LoadingSpinner size="lg" />
  if (error) return <ErrorMessage message={error.message} />
  
  const tm = trademark
  
  return (
    <div className="space-y-6">
      <Link to="/trademarks" className="inline-flex items-center text-primary-600 hover:text-primary-700">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Trademarks
      </Link>
      
      {/* Header */}
      <div className="card bg-primary-50 border border-primary-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {tm.trademark_name || 'Trademark Application'}
        </h1>
        <div className="flex flex-wrap gap-2">
          {tm.class_number && (
            <span className="badge badge-info">Class {tm.class_number}</span>
          )}
          {tm.office_location && (
            <span className="badge">{tm.office_location}</span>
          )}
          {tm.applicant_type && (
            <span className="badge">{tm.applicant_type}</span>
          )}
        </div>
      </div>
      
      {/* Application Details */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Application Details</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tm.application_number && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Application Number</p>
              <p className="text-base font-medium text-gray-900">{tm.application_number}</p>
            </div>
          )}
          
          {tm.filing_date && (
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Filing Date</span>
              </p>
              <p className="text-base font-medium text-gray-900">
                {format(new Date(tm.filing_date), 'dd MMMM yyyy')}
              </p>
            </div>
          )}
          
          {tm.used_since && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Used Since</p>
              <p className="text-base font-medium text-gray-900">{tm.used_since}</p>
            </div>
          )}
          
          {tm.associated_with && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Associated With</p>
              <p className="text-base font-medium text-gray-900">{tm.associated_with}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Applicant Information */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Applicant Information</span>
        </h2>
        
        <div className="space-y-4">
          {tm.applicant_name && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Name</p>
              <p className="text-base font-medium text-gray-900">{tm.applicant_name}</p>
            </div>
          )}
          
          {tm.applicant_address && (
            <div>
              <p className="text-sm text-gray-500 mb-1 flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>Address</span>
              </p>
              <p className="text-base text-gray-900">{tm.applicant_address}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Attorney Information */}
      {(tm.attorney_name || tm.attorney_address) && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Attorney / Agent Information</span>
          </h2>
          
          <div className="space-y-4">
            {tm.attorney_name && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Name</p>
                <p className="text-base font-medium text-gray-900">{tm.attorney_name}</p>
              </div>
            )}
            
            {tm.attorney_address && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Address</p>
                <p className="text-base text-gray-900">{tm.attorney_address}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Goods and Services */}
      {tm.goods_services && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Goods and Services Description
          </h2>
          <p className="text-base text-gray-700 leading-relaxed">
            {tm.goods_services}
          </p>
        </div>
      )}
      
      {/* Raw Data (for debugging) */}
      {tm.raw_text && (
        <details className="card">
          <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
            View Raw Extracted Text
          </summary>
          <pre className="mt-4 p-4 bg-gray-50 rounded text-xs overflow-x-auto whitespace-pre-wrap">
            {tm.raw_text}
          </pre>
        </details>
      )}
    </div>
  )
}
