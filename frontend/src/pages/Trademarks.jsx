import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getTrademarks } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import Pagination from '../components/Pagination'
import ExportButton from '../components/ExportButton'
import { Filter, X } from 'lucide-react'

export default function Trademarks() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    class_number: '',
    applicant: '',
    journal_number: '',
    proprietor_name: '',
    application_type: '',
    office_location: ''
  })
  const [debouncedFilters, setDebouncedFilters] = useState(filters)
  const [showFilters, setShowFilters] = useState(false)
  
  // Debounce search to prevent API call on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters)
    }, 500) // Wait 500ms after user stops typing
    
    return () => clearTimeout(timer)
  }, [filters])
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['trademarks', page, debouncedFilters],
    queryFn: () => getTrademarks({
      page,
      limit: 50,
      search: debouncedFilters.search || undefined,
      class_number: debouncedFilters.class_number || undefined,
      applicant: debouncedFilters.applicant || undefined,
      proprietor_name: debouncedFilters.proprietor_name || undefined,
      journal_number: debouncedFilters.journal_number || undefined,
      application_type: debouncedFilters.application_type || undefined,
      office_location: debouncedFilters.office_location || undefined
    })
  })
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }
  
  const clearFilters = () => {
    setFilters({ 
      search: '', 
      class_number: '', 
      applicant: '',
      journal_number: '',
      proprietor_name: '',
      application_type: '',
      office_location: ''
    })
    setPage(1)
  }
  
  if (isLoading) return <LoadingSpinner size="lg" />
  if (error) return <ErrorMessage message={error.message} />
  
  const trademarks = data?.trademarks || []
  const totalPages = data?.pages || 1
  
  const activeFiltersCount = Object.values(filters).filter(v => v).length
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Trademarks</h2>
        <div className="flex items-center space-x-3">
          <ExportButton type="all" filters={debouncedFilters} />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="badge badge-info">{activeFiltersCount}</span>
            )}
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="card overflow-hidden">
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.1 }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
              >
                <X className="h-4 w-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Trademark name, applicant..."
                className="input-field w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Number
              </label>
              <input
                type="number"
                value={filters.class_number}
                onChange={(e) => handleFilterChange('class_number', e.target.value)}
                placeholder="1-45"
                min="1"
                max="45"
                className="input-field w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicant Name
              </label>
              <input
                type="text"
                value={filters.applicant}
                onChange={(e) => handleFilterChange('applicant', e.target.value)}
                placeholder="Applicant name..."
                className="input-field w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proprietor Name
              </label>
              <input
                type="text"
                value={filters.proprietor_name}
                onChange={(e) => handleFilterChange('proprietor_name', e.target.value)}
                placeholder="Proprietor name..."
                className="input-field w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Journal Number
              </label>
              <input
                type="text"
                value={filters.journal_number}
                onChange={(e) => handleFilterChange('journal_number', e.target.value)}
                placeholder="e.g. 2237"
                className="input-field w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Type
              </label>
              <select
                value={filters.application_type}
                onChange={(e) => handleFilterChange('application_type', e.target.value)}
                className="input-field w-full"
              >
                <option value="">All Types</option>
                <option value="Word">Word</option>
                <option value="Device">Device</option>
                <option value="Label">Label</option>
                <option value="3D">3D</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Office Location
              </label>
              <select
                value={filters.office_location}
                onChange={(e) => handleFilterChange('office_location', e.target.value)}
                className="input-field w-full"
              >
                <option value="">All Offices</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Chennai">Chennai</option>
                <option value="Ahmedabad">Ahmedabad</option>
              </select>
            </div>
          </div>
          
            <div className="mt-4 text-sm text-gray-600">
              Found {data?.total?.toLocaleString() || 0} trademarks
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Trademarks List */}
      <motion.div 
        className="space-y-3"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}>
        {trademarks.map((tm, index) => (
          <motion.div
            key={tm.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ duration: 0.3 }}
            className="card hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {tm.trademark_name || 'Unnamed Trademark'}
                  </h3>
                  {tm.class_number && (
                    <span className="badge badge-info">Class {tm.class_number}</span>
                  )}
                  {tm.office_location && (
                    <span className="badge">{tm.office_location}</span>
                  )}
                </div>
                
                <div className="space-y-1 text-sm">
                  {tm.application_number && (
                    <p className="text-gray-600">
                      <span className="font-medium">Application No:</span> {tm.application_number}
                    </p>
                  )}
                  {tm.applicant_name && (
                    <p className="text-gray-600">
                      <span className="font-medium">Applicant:</span> {tm.applicant_name}
                    </p>
                  )}
                  {tm.applicant_type && (
                    <p className="text-gray-600">
                      <span className="font-medium">Type:</span> {tm.applicant_type}
                    </p>
                  )}
                  {tm.goods_services && (
                    <p className="text-gray-600 line-clamp-2">
                      <span className="font-medium">Goods/Services:</span> {tm.goods_services}
                    </p>
                  )}
                </div>
              </div>
              
              <Link
                to={`/trademarks/${tm.id}`}
                className="btn-primary ml-4"
              >
                View Details
              </Link>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {trademarks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No trademarks found matching your criteria</p>
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
