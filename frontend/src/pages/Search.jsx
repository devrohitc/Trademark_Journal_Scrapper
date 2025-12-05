import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { searchTrademarks } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { Search as SearchIcon } from 'lucide-react'

export default function Search() {
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => searchTrademarks(searchQuery),
    enabled: searchQuery.length >= 3
  })
  
  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim().length >= 3) {
      setSearchQuery(query.trim())
    }
  }
  
  const results = data?.trademarks || []
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Search Trademarks</h2>
      
      {/* Search Form */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by trademark name, applicant, or goods/services..."
              className="input-field w-full"
              minLength={3}
            />
          </div>
          <button
            type="submit"
            disabled={query.length < 3}
            className="btn-primary flex items-center space-x-2"
          >
            <SearchIcon className="h-4 w-4" />
            <span>Search</span>
          </button>
        </form>
        <p className="mt-2 text-sm text-gray-500">
          Enter at least 3 characters to search
        </p>
      </div>
      
      {/* Results */}
      {isLoading && <LoadingSpinner size="lg" />}
      
      {error && (
        <div className="card bg-red-50 border border-red-200">
          <p className="text-red-800">{error.message}</p>
        </div>
      )}
      
      {searchQuery && !isLoading && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results for "{searchQuery}"
            </h3>
            <span className="text-sm text-gray-500">
              {data?.total || 0} results found
            </span>
          </div>
          
          {results.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-500">No results found. Try different keywords.</p>
            </div>
          )}
          
          {results.map((tm) => (
            <div key={tm.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tm.trademark_name || 'Unnamed Trademark'}
                    </h3>
                    {tm.class_number && (
                      <span className="badge badge-info">Class {tm.class_number}</span>
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
            </div>
          ))}
        </div>
      )}
      
      {!searchQuery && (
        <div className="card text-center py-12">
          <SearchIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Enter a search query to find trademarks
          </p>
        </div>
      )}
    </div>
  )
}
