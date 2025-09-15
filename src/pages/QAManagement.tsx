import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Clock, User, ChevronLeft, ChevronRight, Loader2, AlertCircle, Filter } from 'lucide-react';
import api from '../services/api';

interface QAItem {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  question: string;
  answer: string;
  question_created_at: string;
  answer_created_at: string;
  conversation_id: string;
  conversation_title: string;
  response_time_seconds: number | null;
  tokens_used: number | null;
  model_used: string | null;
}

interface QAResponse {
  success: boolean;
  data: QAItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  error?: string;
}

const QAManagement: React.FC = () => {
  const [qaData, setQaData] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  useEffect(() => {
    fetchQAData();
  }, [currentPage, searchTerm, dateFilter, userFilter]);

  const fetchQAData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (dateFilter) {
        params.append('date_from', dateFilter);
      }
      if (userFilter) {
        params.append('user', userFilter);
      }

      const response = await api.get<QAResponse>(`/analytics/qa-data/?${params.toString()}`);
      
      if (response.data.success) {
        setQaData(response.data.data);
        setTotalCount(response.data.pagination.total_count);
      } else {
        setError('Failed to fetch Q/A data');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch Q/A data');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDateFilter = (value: string) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  const handleUserFilter = (value: string) => {
    setUserFilter(value);
    setCurrentPage(1);
  };

  if (loading && qaData.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error && qaData.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Occurred</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchQAData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Q/A Management</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage user questions and answers</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center">
          <div className="p-2 sm:p-3 rounded-full bg-blue-100">
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div className="ml-3 sm:ml-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Q/A Pairs</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <input
              type="text"
              placeholder="Search questions or answers..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => handleDateFilter(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <input
              type="text"
              placeholder="Username..."
              value={userFilter}
              onChange={(e) => handleUserFilter(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Q/A Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Answer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {qaData && qaData.length > 0 ? qaData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.user.first_name && item.user.last_name 
                            ? `${item.user.first_name} ${item.user.last_name}` 
                            : item.user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{item.user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      <p title={item.question}>
                        {truncateText(item.question)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      <p title={item.answer || 'No answer yet'}>
                        {item.answer ? truncateText(item.answer) : 'No answer yet'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDateTime(item.question_created_at)}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    {loading ? 'Loading...' : 'No Q&A data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        )}
      </div>

      {/* Q/A Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {qaData && qaData.length > 0 ? qaData.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4">
            {/* User Info */}
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0 h-8 w-8">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {item.user.first_name && item.user.last_name 
                    ? `${item.user.first_name} ${item.user.last_name}` 
                    : item.user.username}
                </div>
                <div className="text-xs text-gray-500">
                  @{item.user.username}
                </div>
              </div>
              <div className="text-xs text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatDateTime(item.question_created_at)}
              </div>
            </div>

            {/* Question */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Question
              </div>
              <p className="text-sm text-gray-900 leading-relaxed">
                {item.question}
              </p>
            </div>

            {/* Answer */}
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Answer
              </div>
              <p className="text-sm text-gray-900 leading-relaxed">
                {item.answer || 'No answer yet'}
              </p>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            {loading ? (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : (
              <>
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">No Q/A data found</h3>
                <p className="text-sm text-gray-500">
                  {searchTerm || dateFilter || userFilter 
                    ? 'No data matches the current filters.' 
                    : 'No Q/A data available yet.'}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Empty state - Desktop only (mobile handled above) */}
      <div className="hidden md:block">
        {qaData && qaData.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm border text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Q/A data found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || dateFilter || userFilter 
                ? 'No data matches the current filters.' 
                : 'No Q/A data available yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 sm:mt-6 rounded-lg shadow-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs text-gray-700 flex items-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                {' '} to {' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalCount)}
                </span>
                {' '} of {' '}
                <span className="font-medium">{totalCount}</span>
                {' '} results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAManagement;