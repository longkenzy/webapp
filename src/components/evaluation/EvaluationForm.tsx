'use client';

import React, { useState, useEffect } from 'react';
import { EvaluationType, EvaluationCategory } from '@prisma/client';
import { useEvaluationForm } from '@/hooks/useEvaluation';
import { EvaluationField } from './EvaluationField';

interface EvaluationFormProps {
  type: EvaluationType;
  categories: EvaluationCategory[];
  initialValues?: Record<string, number>;
  onSubmit: (values: Record<string, number>) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
  className?: string;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  type,
  categories,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = 'Lưu đánh giá',
  cancelLabel = 'Hủy',
  disabled = false,
  className = '',
}) => {
  const { getFieldOptions } = useEvaluationForm(type, categories);
  const [values, setValues] = useState<Record<string, number>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleFieldChange = (category: string, value: number) => {
    setValues(prev => ({
      ...prev,
      [category]: value,
    }));
    
    // Clear error when user makes a selection
    if (errors[category]) {
      setErrors(prev => ({
        ...prev,
        [category]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    categories.forEach(category => {
      const categoryKey = category.toLowerCase();
      if (!values[categoryKey]) {
        newErrors[categoryKey] = `Vui lòng chọn ${getCategoryLabel(category)}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCategoryLabel = (category: EvaluationCategory): string => {
    switch (category) {
      case EvaluationCategory.DIFFICULTY:
        return 'mức độ khó';
      case EvaluationCategory.TIME:
        return 'thời gian ước tính';
      case EvaluationCategory.IMPACT:
        return 'mức độ ảnh hưởng';
      case EvaluationCategory.URGENCY:
        return 'mức độ khẩn cấp';
      case EvaluationCategory.FORM:
        return 'hình thức';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(values);
    }
  };

  const getTotalScore = (): number => {
    return Object.values(values).reduce((sum, value) => sum + (value || 0), 0);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => {
          const categoryKey = category.toLowerCase();
          const options = getFieldOptions(category);
          const label = getCategoryLabel(category);
          
          return (
            <div key={category}>
              <EvaluationField
                label={label}
                options={options}
                value={values[categoryKey]}
                onChange={(value) => handleFieldChange(categoryKey, value)}
                required
                disabled={disabled}
              />
              {errors[categoryKey] && (
                <p className="mt-1 text-sm text-red-600">{errors[categoryKey]}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Total Score Display */}
      {Object.keys(values).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Tổng điểm:</span>
            <span className="text-lg font-bold text-blue-600">{getTotalScore()}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="submit"
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
};
