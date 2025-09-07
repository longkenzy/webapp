'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EvaluationType, EvaluationCategory } from '@prisma/client';

// Re-export enums for easier importing
export { EvaluationType, EvaluationCategory };

export interface EvaluationOption {
  id: string;
  label: string;
  points: number;
  order: number;
  isActive: boolean;
}

export interface EvaluationConfig {
  id: string;
  type: EvaluationType;
  category: EvaluationCategory;
  isActive: boolean;
  options: EvaluationOption[];
  createdAt: string;
  updatedAt: string;
}

interface EvaluationContextType {
  configs: EvaluationConfig[];
  loading: boolean;
  error: string | null;
  fetchConfigs: () => Promise<void>;
  getConfig: (type: EvaluationType, category: EvaluationCategory) => EvaluationConfig | null;
  getConfigOptions: (type: EvaluationType, category: EvaluationCategory) => EvaluationOption[];
  updateConfig: (configId: string, options: Omit<EvaluationOption, 'id' | 'configId' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  createConfig: (type: EvaluationType, category: EvaluationCategory, options: Omit<EvaluationOption, 'id' | 'configId' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  deleteConfig: (configId: string) => Promise<void>;
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (context === undefined) {
    throw new Error('useEvaluation must be used within an EvaluationProvider');
  }
  return context;
};

interface EvaluationProviderProps {
  children: ReactNode;
}

export const EvaluationProvider: React.FC<EvaluationProviderProps> = ({ children }) => {
  const [configs, setConfigs] = useState<EvaluationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/evaluation-configs');
      const result = await response.json();
      
      if (result.success) {
        setConfigs(result.data);
      } else {
        setError(result.error || 'Failed to fetch evaluation configurations');
      }
    } catch (err) {
      setError('Network error while fetching evaluation configurations');
      console.error('Error fetching configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConfig = (type: EvaluationType, category: EvaluationCategory): EvaluationConfig | null => {
    return configs.find(config => 
      config.type === type && 
      config.category === category && 
      config.isActive
    ) || null;
  };

  const getConfigOptions = (type: EvaluationType, category: EvaluationCategory): EvaluationOption[] => {
    const config = getConfig(type, category);
    return config ? config.options.filter(option => option.isActive) : [];
  };

  const updateConfig = async (
    configId: string, 
    options: Omit<EvaluationOption, 'id' | 'configId' | 'createdAt' | 'updatedAt'>[]
  ) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/evaluation-configs/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ options }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setConfigs(prevConfigs => 
          prevConfigs.map(config => 
            config.id === configId ? result.data : config
          )
        );
      } else {
        setError(result.error || 'Failed to update evaluation configuration');
      }
    } catch (err) {
      setError('Network error while updating evaluation configuration');
      console.error('Error updating config:', err);
    }
  };

  const createConfig = async (
    type: EvaluationType, 
    category: EvaluationCategory, 
    options: Omit<EvaluationOption, 'id' | 'configId' | 'createdAt' | 'updatedAt'>[]
  ) => {
    try {
      setError(null);
      
      const response = await fetch('/api/evaluation-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, category, options }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Add to local state
        setConfigs(prevConfigs => [...prevConfigs, result.data]);
      } else {
        setError(result.error || 'Failed to create evaluation configuration');
      }
    } catch (err) {
      setError('Network error while creating evaluation configuration');
      console.error('Error creating config:', err);
    }
  };

  const deleteConfig = async (configId: string) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/evaluation-configs/${configId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove from local state
        setConfigs(prevConfigs => 
          prevConfigs.map(config => 
            config.id === configId 
              ? { ...config, isActive: false }
              : config
          )
        );
      } else {
        setError(result.error || 'Failed to delete evaluation configuration');
      }
    } catch (err) {
      setError('Network error while deleting evaluation configuration');
      console.error('Error deleting config:', err);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const value: EvaluationContextType = {
    configs,
    loading,
    error,
    fetchConfigs,
    getConfig,
    getConfigOptions,
    updateConfig,
    createConfig,
    deleteConfig,
  };

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
};
