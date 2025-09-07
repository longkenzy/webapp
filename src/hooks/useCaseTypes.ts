"use client";

import { useState, useCallback } from 'react';

interface CaseType {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseCaseTypesProps {
  initialCaseTypes?: CaseType[];
}

export function useCaseTypes({ initialCaseTypes = [] }: UseCaseTypesProps = {}) {
  const [caseTypes, setCaseTypes] = useState<CaseType[]>(initialCaseTypes);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCaseType, setEditingCaseType] = useState<CaseType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true
  });

  // Fetch case types
  const fetchCaseTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/case-types', {
        method: 'GET',
        headers: {
          'Cache-Control': 'max-age=300',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCaseTypes(data.data || []);
      } else {
        console.error('Failed to fetch case types');
      }
    } catch (error) {
      console.error('Error fetching case types:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new case type
  const createCaseType = useCallback(async (caseTypeData: Omit<CaseType, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/case-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseTypeData),
      });

      if (response.ok) {
        const responseData = await response.json();
        const newCaseType = responseData.data;
        
        if (newCaseType && newCaseType.id) {
          setCaseTypes(prev => [...prev, newCaseType]);
          return newCaseType;
        } else {
          // Fallback to refetching
          await fetchCaseTypes();
          return null;
        }
      } else {
        throw new Error('Failed to create case type');
      }
    } catch (error) {
      console.error('Error creating case type:', error);
      throw error;
    }
  }, [fetchCaseTypes]);

  // Update case type
  const updateCaseType = useCallback(async (id: string, caseTypeData: Partial<CaseType>) => {
    try {
      const response = await fetch(`/api/case-types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseTypeData),
      });

      if (response.ok) {
        const responseData = await response.json();
        const updatedCaseType = responseData.data;
        
        if (updatedCaseType && updatedCaseType.id) {
          setCaseTypes(prev => prev.map(ct => ct.id === id ? updatedCaseType : ct));
          return updatedCaseType;
        } else {
          // Fallback to refetching
          await fetchCaseTypes();
          return null;
        }
      } else {
        throw new Error('Failed to update case type');
      }
    } catch (error) {
      console.error('Error updating case type:', error);
      throw error;
    }
  }, [fetchCaseTypes]);

  // Delete case type
  const deleteCaseType = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/case-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Optimistically remove from state
        setCaseTypes(prev => prev.filter(ct => ct.id !== id));
      } else {
        throw new Error('Failed to delete case type');
      }
    } catch (error) {
      console.error('Error deleting case type:', error);
      throw error;
    }
  }, []);

  // Toggle case type status
  const toggleCaseTypeStatus = useCallback(async (caseType: CaseType) => {
    try {
      const updatedCaseType = await updateCaseType(caseType.id, {
        ...caseType,
        isActive: !caseType.isActive
      });
      
      if (!updatedCaseType) {
        // Fallback to refetching
        await fetchCaseTypes();
      }
    } catch (error) {
      console.error('Error toggling case type status:', error);
      throw error;
    }
  }, [updateCaseType, fetchCaseTypes]);

  // Modal management
  const openCreateModal = useCallback(() => {
    setEditingCaseType(null);
    setFormData({ name: '', isActive: true });
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((caseType: CaseType) => {
    setEditingCaseType(caseType);
    setFormData({ name: caseType.name, isActive: caseType.isActive });
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingCaseType(null);
    setFormData({ name: '', isActive: true });
  }, []);

  // Form submission
  const submitForm = useCallback(async () => {
    try {
      if (editingCaseType) {
        await updateCaseType(editingCaseType.id, formData);
      } else {
        await createCaseType(formData);
      }
      closeModal();
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  }, [editingCaseType, formData, updateCaseType, createCaseType, closeModal]);

  return {
    // State
    caseTypes,
    loading,
    showModal,
    editingCaseType,
    formData,
    
    // Actions
    setFormData,
    fetchCaseTypes,
    createCaseType,
    updateCaseType,
    deleteCaseType,
    toggleCaseTypeStatus,
    openCreateModal,
    openEditModal,
    closeModal,
    submitForm,
  };
}
