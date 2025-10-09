// API client utilities for handling standardized responses

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Helper function to handle API responses with new format
export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Handle both old format (direct array/object) and new format (with success/data)
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }
    return data.data;
  }
  
  // Fallback to old format
  return data;
}

// Specific API client functions
export const apiClient = {
  // Employees
  async getEmployeesList() {
    return fetchApi<Array<{
      id: string;
      fullName: string;
      position: string;
      department: string;
      companyEmail: string;
    }>>('/api/employees/list');
  },

  // Partners
  async getPartnersList() {
    return fetchApi<Array<{
      id: string;
      shortName: string;
      fullCompanyName: string;
      contactPerson: string;
    }>>('/api/partners/list');
  },

  // Cases
  async getInternalCases(params?: Record<string, string>) {
    const searchParams = params ? new URLSearchParams(params).toString() : '';
    const url = `/api/internal-cases${searchParams ? `?${searchParams}` : ''}`;
    return fetchApi(url);
  },

  async getDeploymentCases(params?: Record<string, string>) {
    const searchParams = params ? new URLSearchParams(params).toString() : '';
    const url = `/api/deployment-cases${searchParams ? `?${searchParams}` : ''}`;
    return fetchApi(url);
  },

  async getMaintenanceCases(params?: Record<string, string>) {
    const searchParams = params ? new URLSearchParams(params).toString() : '';
    const url = `/api/maintenance-cases${searchParams ? `?${searchParams}` : ''}`;
    return fetchApi(url);
  }
};

// Legacy compatibility - for gradual migration
export async function fetchEmployeesList() {
  return apiClient.getEmployeesList();
}

export async function fetchPartnersList() {
  return apiClient.getPartnersList();
}