import { useState, useEffect, useCallback } from 'react';

interface DeploymentCase {
  id: string;
  title: string;
  description: string;
  reporterId: string;
  handlerId: string;
  deploymentTypeId: string;
  customerName: string;
  customerId?: string;
  startDate: string;
  endDate?: string;
  status: string;
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
  adminFormScore?: number;
  adminAssessmentDate?: string;
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: string;
    fullName: string;
    position: string;
    department: string;
    companyEmail: string;
  };
  handler: {
    id: string;
    fullName: string;
    position: string;
    department: string;
    companyEmail: string;
  };
  deploymentType: {
    id: string;
    name: string;
  };
}

interface UseDeploymentCasesReturn {
  deploymentCases: DeploymentCase[];
  loading: boolean;
  error: string | null;
  fetchCases: () => Promise<void>;
  createCase: (caseData: Partial<DeploymentCase>) => Promise<DeploymentCase | null>;
  updateCase: (id: string, caseData: Partial<DeploymentCase>) => Promise<DeploymentCase | null>;
  deleteCase: (id: string) => Promise<boolean>;
  refreshCases: () => Promise<void>;
}

export function useDeploymentCases(): UseDeploymentCasesReturn {
  const [deploymentCases, setDeploymentCases] = useState<DeploymentCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/deployment-cases', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=60',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDeploymentCases(data.data || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch deployment cases');
        console.error('Failed to fetch cases:', response.status, response.statusText);
      }
    } catch (err) {
      setError('Network error while fetching deployment cases');
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCase = useCallback(async (caseData: Partial<DeploymentCase>): Promise<DeploymentCase | null> => {
    try {
      setError(null);
      
      const response = await fetch('/api/deployment-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
      });
      
      if (response.ok) {
        const result = await response.json();
        const newCase = result.data;
        
        // Add the new case to the list
        setDeploymentCases(prev => [newCase, ...prev]);
        
        return newCase;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create deployment case');
        console.error('Failed to create case:', response.status, response.statusText);
        return null;
      }
    } catch (err) {
      setError('Network error while creating deployment case');
      console.error('Error creating case:', err);
      return null;
    }
  }, []);

  const updateCase = useCallback(async (id: string, caseData: Partial<DeploymentCase>): Promise<DeploymentCase | null> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/deployment-cases/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
      });
      
      if (response.ok) {
        const result = await response.json();
        const updatedCase = result.data;
        
        // Update the case in the list
        setDeploymentCases(prev => 
          prev.map(caseItem => caseItem.id === id ? updatedCase : caseItem)
        );
        
        return updatedCase;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update deployment case');
        console.error('Failed to update case:', response.status, response.statusText);
        return null;
      }
    } catch (err) {
      setError('Network error while updating deployment case');
      console.error('Error updating case:', err);
      return null;
    }
  }, []);

  const deleteCase = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/deployment-cases/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the case from the list
        setDeploymentCases(prev => prev.filter(caseItem => caseItem.id !== id));
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete deployment case');
        console.error('Failed to delete case:', response.status, response.statusText);
        return false;
      }
    } catch (err) {
      setError('Network error while deleting deployment case');
      console.error('Error deleting case:', err);
      return false;
    }
  }, []);

  const refreshCases = useCallback(async () => {
    await fetchCases();
  }, [fetchCases]);

  // Fetch cases on mount
  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  return {
    deploymentCases,
    loading,
    error,
    fetchCases,
    createCase,
    updateCase,
    deleteCase,
    refreshCases,
  };
}
