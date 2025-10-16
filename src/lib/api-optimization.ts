import { NextResponse } from "next/server";

/**
 * API Optimization Utilities
 * Các helper functions để tối ưu hóa API performance
 */

// Response caching configuration
interface CacheConfig {
  maxAge: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  mustRevalidate?: boolean;
}

export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Static data (thay đổi ít)
  STATIC: {
    maxAge: 3600, // 1 hour
    sMaxAge: 7200, // 2 hours for CDN
    staleWhileRevalidate: 86400 // 24 hours
  },
  // Dynamic data (thay đổi thường xuyên)
  DYNAMIC: {
    maxAge: 60, // 1 minute
    sMaxAge: 120, // 2 minutes for CDN
    staleWhileRevalidate: 300 // 5 minutes
  },
  // Real-time data (cần fresh data)
  REALTIME: {
    maxAge: 0,
    sMaxAge: 0,
    staleWhileRevalidate: 30 // 30 seconds
  },
  // No cache
  NO_CACHE: {
    maxAge: 0,
    sMaxAge: 0,
    mustRevalidate: true
  }
};

/**
 * Set cache headers based on configuration
 */
export function setCacheHeaders(
  response: NextResponse,
  config: keyof typeof CACHE_CONFIGS | CacheConfig
): NextResponse {
  const cacheConfig = typeof config === 'string' ? CACHE_CONFIGS[config] : config;
  
  if ('mustRevalidate' in cacheConfig && cacheConfig.mustRevalidate) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  } else {
    const { maxAge, sMaxAge, staleWhileRevalidate } = cacheConfig;
    const cacheControl = [];
    
    if (maxAge > 0) {
      cacheControl.push(`max-age=${maxAge}`);
    }
    if (sMaxAge) {
      cacheControl.push(`s-maxage=${sMaxAge}`);
    }
    if (staleWhileRevalidate) {
      cacheControl.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }
    if (maxAge > 0) {
      cacheControl.push('public');
    } else {
      cacheControl.push('private');
    }
    
    response.headers.set('Cache-Control', cacheControl.join(', '));
  }
  
  return response;
}

/**
 * Set compression hints
 */
export function setCompressionHeaders(response: NextResponse): NextResponse {
  response.headers.set('Content-Encoding', 'gzip');
  return response;
}

/**
 * Set security headers
 */
export function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  return response;
}

/**
 * Create optimized response with proper headers
 */
export function createOptimizedResponse(
  data: any,
  options: {
    cache?: keyof typeof CACHE_CONFIGS | CacheConfig;
    security?: boolean;
    status?: number;
  } = {}
): NextResponse {
  const {
    cache = 'DYNAMIC',
    security = true,
    status = 200
  } = options;
  
  let response = NextResponse.json(data, { status });
  
  // Apply cache headers
  response = setCacheHeaders(response, cache);
  
  // Apply security headers
  if (security) {
    response = setSecurityHeaders(response);
  }
  
  return response;
}

/**
 * Common select fields for entities to reduce payload size
 */
export const SELECT_FIELDS = {
  employee: {
    id: true,
    fullName: true,
    position: true,
    department: true,
    companyEmail: true,
    avatar: true
  },
  employeeBasic: {
    id: true,
    fullName: true,
    position: true,
    department: true
  },
  partner: {
    id: true,
    fullCompanyName: true,
    shortName: true,
    contactPerson: true,
    contactPhone: true
  },
  partnerBasic: {
    id: true,
    fullCompanyName: true,
    shortName: true
  },
  caseType: {
    id: true,
    name: true
  }
};

/**
 * Common include patterns to prevent N+1 queries
 * NOTE: These patterns are for cases with "reporter" field (DeploymentCase, Incident, MaintenanceCase, Warranty)
 * For InternalCase, ReceivingCase, DeliveryCase: use "requester" instead of "reporter"
 */
export const INCLUDE_PATTERNS = {
  // For DeploymentCase, Incident, MaintenanceCase, Warranty (have reporter + customer)
  caseWithReporterAndCustomer: {
    reporter: { select: SELECT_FIELDS.employee },
    handler: { select: SELECT_FIELDS.employee },
    customer: { select: SELECT_FIELDS.partner }
  },
  caseWithReporterAndCustomerBasic: {
    reporter: { select: SELECT_FIELDS.employeeBasic },
    handler: { select: SELECT_FIELDS.employeeBasic },
    customer: { select: SELECT_FIELDS.partnerBasic }
  },
  // For InternalCase, ReceivingCase, DeliveryCase (have requester + customer/supplier)
  caseWithRequesterAndPartner: {
    requester: { select: SELECT_FIELDS.employee },
    handler: { select: SELECT_FIELDS.employee },
    customer: { select: SELECT_FIELDS.partner }
  },
  caseWithRequesterAndPartnerBasic: {
    requester: { select: SELECT_FIELDS.employeeBasic },
    handler: { select: SELECT_FIELDS.employeeBasic },
    customer: { select: SELECT_FIELDS.partnerBasic }
  }
};

/**
 * Pagination helper
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  
  return { page, limit, sortBy, sortOrder };
}

export function calculatePagination(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const take = limit;
  
  return { skip, take };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
}

/**
 * Error response helper
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details })
    },
    { status }
  );
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  options?: {
    cache?: keyof typeof CACHE_CONFIGS;
  }
) {
  const response = NextResponse.json({
    success: true,
    ...(message && { message }),
    data
  });
  
  if (options?.cache) {
    return setCacheHeaders(response, options.cache);
  }
  
  return response;
}

/**
 * Batch request helper to prevent N+1 queries
 */
export async function batchFetch<T, K>(
  items: T[],
  getKey: (item: T) => K,
  fetcher: (keys: K[]) => Promise<Map<K, any>>
): Promise<Map<T, any>> {
  const keys = items.map(getKey);
  const uniqueKeys = Array.from(new Set(keys));
  const results = await fetcher(uniqueKeys);
  
  const map = new Map<T, any>();
  items.forEach(item => {
    const key = getKey(item);
    map.set(item, results.get(key));
  });
  
  return map;
}

/**
 * Measure query performance
 */
export async function measureQuery<T>(
  name: string,
  query: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await query();
    const duration = performance.now() - start;
    
    if (duration > 1000) {
      console.warn(`⚠️ Slow query detected: ${name} took ${duration.toFixed(2)}ms`);
    } else if (duration > 100) {
      console.log(`📊 Query ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ Query ${name} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

