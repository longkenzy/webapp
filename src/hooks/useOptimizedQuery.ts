/**
 * Optimized React Query hooks with caching and deduplication
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

/**
 * Default stale time configurations
 */
export const STALE_TIME = {
  STATIC: 1000 * 60 * 60, // 1 hour - for data that rarely changes
  DYNAMIC: 1000 * 60 * 5, // 5 minutes - for frequently changing data
  REALTIME: 1000 * 30,    // 30 seconds - for real-time data
  FRESH: 0                // Always fresh
};

/**
 * Optimized query for static data (employees, partners, types)
 */
export function useStaticQuery<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
): UseQueryResult<T> {
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: STALE_TIME.STATIC,
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (replaced cacheTime with gcTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options
  });
}

/**
 * Optimized query for dynamic data (cases, notifications)
 */
export function useDynamicQuery<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
): UseQueryResult<T> {
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: STALE_TIME.DYNAMIC,
    gcTime: 1000 * 60 * 30, // 30 minutes (replaced cacheTime with gcTime)
    refetchOnWindowFocus: true,
    ...options
  });
}

/**
 * Optimized query for realtime data (dashboard stats)
 */
export function useRealtimeQuery<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
): UseQueryResult<T> {
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: STALE_TIME.REALTIME,
    gcTime: 1000 * 60 * 5, // 5 minutes (replaced cacheTime with gcTime)
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Auto-refresh every 30s
    ...options
  });
}

/**
 * Prefetch helper for optimistic loading
 */
export function usePrefetch() {
  const queryClient = useQueryClient();
  
  const prefetchStaticData = useCallback(async (
    key: string[],
    fetcher: () => Promise<any>
  ) => {
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: fetcher,
      staleTime: STALE_TIME.STATIC
    });
  }, [queryClient]);
  
  const prefetchDynamicData = useCallback(async (
    key: string[],
    fetcher: () => Promise<any>
  ) => {
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: fetcher,
      staleTime: STALE_TIME.DYNAMIC
    });
  }, [queryClient]);
  
  return { prefetchStaticData, prefetchDynamicData };
}

/**
 * Optimized list query with pagination
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function usePaginatedQuery<T>(
  key: string[],
  fetcher: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  page: number = 1,
  limit: number = 50,
  options?: Omit<UseQueryOptions<PaginatedResponse<T>>, 'queryKey' | 'queryFn'>
) {
  const queryKey = useMemo(() => [...key, page, limit], [key, page, limit]);
  
  return useQuery({
    queryKey,
    queryFn: () => fetcher(page, limit),
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: (previousData: any) => previousData, // Smooth pagination UX (replaced keepPreviousData)
    ...options
  });
}

/**
 * Debounced search query
 */
export function useSearchQuery<T>(
  key: string[],
  fetcher: (query: string) => Promise<T>,
  searchQuery: string,
  debounceMs: number = 300,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const debouncedQuery = useDebounce(searchQuery, debounceMs);
  const queryKey = useMemo(() => [...key, debouncedQuery], [key, debouncedQuery]);
  
  return useQuery({
    queryKey,
    queryFn: () => fetcher(debouncedQuery),
    staleTime: STALE_TIME.DYNAMIC,
    enabled: debouncedQuery.length >= 2, // Only search with 2+ characters
    ...options
  });
}

/**
 * Debounce hook
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Query client import
 */
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

