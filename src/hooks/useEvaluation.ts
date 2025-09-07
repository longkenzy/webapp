import { useCallback } from 'react';
import { useEvaluation as useEvaluationContext } from '@/contexts/EvaluationContext';
import { EvaluationType, EvaluationCategory } from '@prisma/client';
import { EvaluationOption } from '@/contexts/EvaluationContext';

export const useEvaluationConfig = (type: EvaluationType, category: EvaluationCategory) => {
  const { getConfig, getConfigOptions, updateConfig, createConfig, deleteConfig } = useEvaluationContext();

  const config = getConfig(type, category);
  const options = getConfigOptions(type, category);

  const updateOptions = useCallback(async (newOptions: Omit<EvaluationOption, 'id' | 'configId' | 'createdAt' | 'updatedAt'>[]) => {
    if (config) {
      await updateConfig(config.id, newOptions);
    } else {
      await createConfig(type, category, newOptions);
    }
  }, [config, type, category, updateConfig, createConfig]);

  const deleteConfigById = useCallback(async () => {
    if (config) {
      await deleteConfig(config.id);
    }
  }, [config, deleteConfig]);

  return {
    config,
    options,
    updateOptions,
    deleteConfig: deleteConfigById,
    hasConfig: !!config,
  };
};

export const useEvaluationForm = (type: EvaluationType, categories: EvaluationCategory[]) => {
  const { getConfigOptions } = useEvaluationContext();

  const getFormData = useCallback(() => {
    const formData: Record<string, EvaluationOption[]> = {};
    
    categories.forEach(category => {
      formData[category.toLowerCase()] = getConfigOptions(type, category);
    });

    return formData;
  }, [type, categories, getConfigOptions]);

  const getFieldOptions = useCallback((category: EvaluationCategory) => {
    return getConfigOptions(type, category);
  }, [type, getConfigOptions]);

  return {
    formData: getFormData(),
    getFieldOptions,
  };
};

export const useEvaluationComparison = (categories: EvaluationCategory[]) => {
  const { getConfigOptions } = useEvaluationContext();

  const getComparisonData = useCallback(() => {
    const comparisonData: Record<string, {
      user: EvaluationOption[];
      admin: EvaluationOption[];
    }> = {};

    categories.forEach(category => {
      const userOptions = getConfigOptions(EvaluationType.USER, category);
      const adminOptions = getConfigOptions(EvaluationType.ADMIN, category);
      
      comparisonData[category.toLowerCase()] = {
        user: userOptions,
        admin: adminOptions,
      };
    });

    return comparisonData;
  }, [categories, getConfigOptions]);

  return {
    comparisonData: getComparisonData(),
  };
};
