'use client';

import React from 'react';
import { EvaluationOption } from '@/contexts/EvaluationContext';

interface EvaluationFieldProps {
  label: string;
  options: EvaluationOption[];
  value?: number;
  onChange: (value: number) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const EvaluationField: React.FC<EvaluationFieldProps> = ({
  label,
  options,
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <select
        value={value || ''}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">Chọn {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.id} value={option.points}>
            {option.points} - {option.label}
          </option>
        ))}
      </select>
      
      {value && (
        <div className="text-xs text-gray-500">
          Điểm: {value}
        </div>
      )}
    </div>
  );
};

interface EvaluationFieldDisplayProps {
  label: string;
  value?: number;
  options: EvaluationOption[];
  className?: string;
}

export const EvaluationFieldDisplay: React.FC<EvaluationFieldDisplayProps> = ({
  label,
  value,
  options,
  className = '',
}) => {
  const selectedOption = options.find(option => option.points === value);
  
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="text-sm text-gray-900">
        {selectedOption ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {selectedOption.points} - {selectedOption.label}
          </span>
        ) : (
          <span className="text-gray-400">Chưa đánh giá</span>
        )}
      </div>
    </div>
  );
};
