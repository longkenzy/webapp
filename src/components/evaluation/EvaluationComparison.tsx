'use client';

import React from 'react';
import { EvaluationCategory } from '@prisma/client';
import { useEvaluationComparison } from '@/hooks/useEvaluation';
import { EvaluationFieldDisplay } from './EvaluationField';

interface EvaluationComparisonProps {
  categories: EvaluationCategory[];
  userValues: Record<string, number>;
  adminValues: Record<string, number>;
  className?: string;
}

export const EvaluationComparison: React.FC<EvaluationComparisonProps> = ({
  categories,
  userValues,
  adminValues,
  className = '',
}) => {
  const { comparisonData } = useEvaluationComparison(categories);

  const getCategoryLabel = (category: EvaluationCategory): string => {
    switch (category) {
      case EvaluationCategory.DIFFICULTY:
        return 'Mức độ khó';
      case EvaluationCategory.TIME:
        return 'Thời gian ước tính';
      case EvaluationCategory.IMPACT:
        return 'Mức độ ảnh hưởng';
      case EvaluationCategory.URGENCY:
        return 'Mức độ khẩn cấp';
      case EvaluationCategory.FORM:
        return 'Hình thức';
      default:
        return category;
    }
  };

  const getTotalScore = (values: Record<string, number>): number => {
    return Object.values(values).reduce((sum, value) => sum + (value || 0), 0);
  };

  const getScoreDifference = (): number => {
    const userTotal = getTotalScore(userValues);
    const adminTotal = getTotalScore(adminValues);
    return adminTotal - userTotal;
  };

  const getScoreDifferenceColor = (): string => {
    const diff = getScoreDifference();
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getScoreDifferenceText = (): string => {
    const diff = getScoreDifference();
    if (diff > 0) return `+${diff}`;
    if (diff < 0) return `${diff}`;
    return '0';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">So sánh đánh giá</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{getTotalScore(userValues)}</div>
            <div className="text-gray-600">Tổng điểm User</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{getTotalScore(adminValues)}</div>
            <div className="text-gray-600">Tổng điểm Admin</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreDifferenceColor()}`}>
              {getScoreDifferenceText()}
            </div>
            <div className="text-gray-600">Chênh lệch</div>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Evaluation */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-md font-semibold text-blue-800 mb-4 flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            Đánh giá của User
          </h4>
          <div className="space-y-3">
            {categories.map((category) => {
              const categoryKey = category.toLowerCase();
              const options = comparisonData[categoryKey]?.user || [];
              const value = userValues[categoryKey];
              
              return (
                <EvaluationFieldDisplay
                  key={category}
                  label={getCategoryLabel(category)}
                  value={value}
                  options={options}
                />
              );
            })}
          </div>
        </div>

        {/* Admin Evaluation */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="text-md font-semibold text-green-800 mb-4 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Đánh giá của Admin
          </h4>
          <div className="space-y-3">
            {categories.map((category) => {
              const categoryKey = category.toLowerCase();
              const options = comparisonData[categoryKey]?.admin || [];
              const value = adminValues[categoryKey];
              
              return (
                <EvaluationFieldDisplay
                  key={category}
                  label={getCategoryLabel(category)}
                  value={value}
                  options={options}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Comparison */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900">Chi tiết so sánh</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiêu chí
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chênh lệch
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => {
                const categoryKey = category.toLowerCase();
                const userValue = userValues[categoryKey] || 0;
                const adminValue = adminValues[categoryKey] || 0;
                const difference = adminValue - userValue;
                
                return (
                  <tr key={category}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {getCategoryLabel(category)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-blue-600">
                      {userValue || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-green-600">
                      {adminValue || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className={`font-medium ${
                        difference > 0 ? 'text-green-600' : 
                        difference < 0 ? 'text-red-600' : 
                        'text-gray-600'
                      }`}>
                        {difference > 0 ? `+${difference}` : difference}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
