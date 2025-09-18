"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

interface InternalCase {
  id: string;
  title: string;
  description: string;
  requester: Employee;
  handler: Employee;
  caseType: string;
  form: string;
  status: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  userDifficultyLevel?: number;
  userEstimatedTime?: number;
  userImpactLevel?: number;
  userUrgencyLevel?: number;
  userFormScore?: number;
  userAssessmentDate?: string;
  adminDifficultyLevel?: number;
  adminEstimatedTime?: number;
  adminImpactLevel?: number;
  adminUrgencyLevel?: number;
  adminAssessmentDate?: string;
  adminAssessmentNotes?: string;
}

interface UseInternalCasesProps {
  initialCases?: InternalCase[];
}

export function useInternalCases({ initialCases = [] }: UseInternalCasesProps = {}) {
  const [internalCases, setInternalCases] = useState<InternalCase[]>(initialCases);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHandler, setSelectedHandler] = useState<string>('');
  const [selectedRequester, setSelectedRequester] = useState<string>('');
  const [selectedCaseType, setSelectedCaseType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const casesPerPage = 10;

  // Memoized filtered cases
  const filteredCases = useMemo(() => {
    return internalCases.filter(case_ => {
      const matchesSearch = !searchTerm || 
        case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.requester.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.handler.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.caseType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesHandler = !selectedHandler || case_.handler.id === selectedHandler;
      const matchesRequester = !selectedRequester || case_.requester.id === selectedRequester;
      const matchesCaseType = !selectedCaseType || case_.caseType === selectedCaseType;
      const matchesStatus = !selectedStatus || case_.status === selectedStatus;
      
      const matchesDateFrom = !dateFrom || new Date(case_.startDate) >= new Date(dateFrom);
      const matchesDateTo = !dateTo || new Date(case_.startDate) <= new Date(dateTo);

      return matchesSearch && matchesHandler && matchesRequester && matchesCaseType && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [internalCases, searchTerm, selectedHandler, selectedRequester, selectedCaseType, selectedStatus, dateFrom, dateTo]);

  // Client-side pagination
  const paginatedCases = useMemo(() => {
    const startIndex = (currentPage - 1) * casesPerPage;
    const endIndex = startIndex + casesPerPage;
    return filteredCases.slice(startIndex, endIndex);
  }, [filteredCases, currentPage, casesPerPage]);

  // Update total pages and total cases based on filtered results
  const totalCasesFiltered = filteredCases.length;
  const totalPagesFiltered = Math.ceil(totalCasesFiltered / casesPerPage);

  // Memoized unique handlers, requesters and statuses for filter options
  const uniqueHandlers = useMemo(() => {
    const handlers = new Map();
    internalCases.forEach(case_ => {
      handlers.set(case_.handler.id, case_.handler);
    });
    return Array.from(handlers.values());
  }, [internalCases]);

  const uniqueRequesters = useMemo(() => {
    const requesters = new Map();
    internalCases.forEach(case_ => {
      requesters.set(case_.requester.id, case_.requester);
    });
    return Array.from(requesters.values());
  }, [internalCases]);

  const uniqueCaseTypes = useMemo(() => {
    return [...new Set(internalCases.map(case_ => case_.caseType))];
  }, [internalCases]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(internalCases.map(case_ => case_.status))];
  }, [internalCases]);

  // Fetch cases with optimized parameters - only fetch all data once, then use client-side filtering
  const fetchInternalCases = useCallback(async (retryCount = 0, showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Build query parameters - fetch all data without client-side filters
      const params = new URLSearchParams();
      params.append('page', '1'); // Always fetch from page 1
      params.append('limit', '1000'); // Fetch a large number to get all data
      // Remove client-side filters from API call
      // if (searchTerm) params.append('search', searchTerm);
      // if (selectedHandler) params.append('handlerId', selectedHandler);
      // if (selectedRequester) params.append('requesterId', selectedRequester);
      // if (selectedCaseType) params.append('caseType', selectedCaseType);
      // if (selectedStatus) params.append('status', selectedStatus);
      
      const response = await fetch(`/api/internal-cases?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache', // Disable cache for fresh data
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setInternalCases(data.data || []);
        
        // Update pagination info
        if (data.pagination) {
          setTotalCases(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      } else {
        console.error('Failed to fetch internal cases:', response.status, response.statusText);
        if (retryCount < 1) { // Reduced retries for faster failure
          console.log(`Retrying fetch internal cases... (${retryCount + 1}/1)`);
          setTimeout(() => fetchInternalCases(retryCount + 1, showLoading), 500); // Faster retry
        } else {
          setInternalCases([]);
        }
      }
    } catch (error) {
      console.error('Error fetching internal cases:', error);
      if (retryCount < 1) {
        console.log(`Retrying fetch internal cases... (${retryCount + 1}/1)`);
        setTimeout(() => fetchInternalCases(retryCount + 1, showLoading), 500);
      } else {
        setInternalCases([]);
      }
    } finally {
      if (showLoading && retryCount === 0) {
        setLoading(false);
      }
    }
  }, []); // Remove all dependencies - only fetch once when component mounts

  // Refresh cases
  const refreshInternalCases = useCallback(async () => {
    setRefreshing(true);
    await fetchInternalCases();
    setRefreshing(false);
  }, [fetchInternalCases]);

  // Pagination functions
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPagesFiltered) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPagesFiltered]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  // Fetch data on mount
  useEffect(() => {
    fetchInternalCases();
  }, [fetchInternalCases]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedHandler, selectedRequester, selectedCaseType, selectedStatus]);

  // Toggle row expansion
  const toggleRowExpansion = useCallback((id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedHandler('');
    setSelectedStatus('');
    setDateFrom('');
    setDateTo('');
  }, []);

  // Delete case with optimistic update
  const deleteCase = useCallback(async (caseToDelete: InternalCase) => {
    // Optimistically remove from state
    setInternalCases(prev => prev.filter(c => c.id !== caseToDelete.id));
    
    try {
      const response = await fetch(`/api/internal-cases/${caseToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert on failure
        setInternalCases(prev => [...prev, caseToDelete]);
        throw new Error('Failed to delete case');
      }
    } catch (error) {
      console.error('Error deleting case:', error);
      // Revert on error
      setInternalCases(prev => [...prev, caseToDelete]);
      throw error;
    }
  }, []);

  // Update case with optimistic update
  const updateCase = useCallback(async (updatedCase: InternalCase) => {
    // Optimistically update in state
    setInternalCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
    
    try {
      const response = await fetch(`/api/internal-cases/${updatedCase.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCase),
      });

      if (!response.ok) {
        // Revert on failure - refetch to get correct state
        await fetchInternalCases();
        throw new Error('Failed to update case');
      }
    } catch (error) {
      console.error('Error updating case:', error);
      // Revert on error - refetch to get correct state
      await fetchInternalCases();
      throw error;
    }
  }, [fetchInternalCases]);

  return {
    // State
    internalCases,
    filteredCases,
    loading,
    refreshing,
    searchTerm,
    selectedHandler,
    selectedRequester,
    selectedCaseType,
    selectedStatus,
    dateFrom,
    dateTo,
    expandedRows,
    uniqueHandlers,
    uniqueRequesters,
    uniqueCaseTypes,
    uniqueStatuses,
    
    // Pagination state
    currentPage,
    totalPages: totalPagesFiltered,
    totalCases: totalCasesFiltered,
    casesPerPage,
    paginatedCases,
    
    // Actions
    setInternalCases,
    setSearchTerm,
    setSelectedHandler,
    setSelectedRequester,
    setSelectedCaseType,
    setSelectedStatus,
    setDateFrom,
    setDateTo,
    fetchInternalCases,
    refreshInternalCases,
    toggleRowExpansion,
    clearFilters,
    deleteCase,
    updateCase,
    
    // Pagination actions
    goToPage,
    goToNextPage,
    goToPrevPage,
  };
}
