'use client';

import React, { useState } from 'react';
import { EvaluationType, EvaluationCategory } from '@prisma/client';
import { EvaluationForm } from './EvaluationForm';
import { EvaluationComparison } from './EvaluationComparison';

const CaseEvaluationDemo: React.FC = () => {
  const [userEvaluation, setUserEvaluation] = useState<Record<string, number>>({});
  const [adminEvaluation, setAdminEvaluation] = useState<Record<string, number>>({});
  const [showComparison, setShowComparison] = useState(false);

  const userCategories = [
    EvaluationCategory.DIFFICULTY,
    EvaluationCategory.TIME,
    EvaluationCategory.IMPACT,
    EvaluationCategory.URGENCY,
    EvaluationCategory.FORM,
  ];

  const adminCategories = [
    EvaluationCategory.DIFFICULTY,
    EvaluationCategory.TIME,
    EvaluationCategory.IMPACT,
    EvaluationCategory.URGENCY,
  ];

  const handleUserSubmit = (values: Record<string, number>) => {
    setUserEvaluation(values);
    console.log('User Evaluation:', values);
  };

  const handleAdminSubmit = (values: Record<string, number>) => {
    setAdminEvaluation(values);
    console.log('Admin Evaluation:', values);
    setShowComparison(true);
  };

  const getTotalScore = (values: Record<string, number>): number => {
    return Object.values(values).reduce((sum, value) => sum + (value || 0), 0);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo Hệ Thống Đánh Giá</h1>
        <p className="text-gray-600">Minh họa cách sử dụng evaluation system trong case creation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Evaluation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-blue-800 mb-2">Đánh giá của User</h2>
            <p className="text-sm text-gray-600">Người dùng tự đánh giá case của mình</p>
          </div>

          <EvaluationForm
            type={EvaluationType.USER}
            categories={userCategories}
            initialValues={userEvaluation}
            onSubmit={handleUserSubmit}
            submitLabel="Lưu đánh giá User"
          />

          {Object.keys(userEvaluation).length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">Kết quả đánh giá User:</div>
              <div className="text-2xl font-bold text-blue-600">{getTotalScore(userEvaluation)} điểm</div>
            </div>
          )}
        </div>

        {/* Admin Evaluation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-green-800 mb-2">Đánh giá của Admin</h2>
            <p className="text-sm text-gray-600">Quản trị viên đánh giá lại case</p>
          </div>

          <EvaluationForm
            type={EvaluationType.ADMIN}
            categories={adminCategories}
            initialValues={adminEvaluation}
            onSubmit={handleAdminSubmit}
            submitLabel="Lưu đánh giá Admin"
            disabled={Object.keys(userEvaluation).length === 0}
          />

          {Object.keys(adminEvaluation).length > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800 mb-2">Kết quả đánh giá Admin:</div>
              <div className="text-2xl font-bold text-green-600">{getTotalScore(adminEvaluation)} điểm</div>
            </div>
          )}
        </div>
      </div>

      {/* Comparison */}
      {showComparison && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">So sánh đánh giá</h2>
            <p className="text-sm text-gray-600">So sánh giữa đánh giá của User và Admin</p>
          </div>

          <EvaluationComparison
            categories={adminCategories}
            userValues={userEvaluation}
            adminValues={adminEvaluation}
          />
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hướng dẫn sử dụng</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">1. Đánh giá User</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• User tự đánh giá case của mình</li>
              <li>• Bao gồm: Mức độ khó, Thời gian, Ảnh hưởng, Khẩn cấp, Hình thức</li>
              <li>• Điểm từ 1-5 (Hình thức: 1-2)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">2. Đánh giá Admin</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Admin đánh giá lại case</li>
              <li>• Chỉ bao gồm: Mức độ khó, Thời gian, Ảnh hưởng, Khẩn cấp</li>
              <li>• So sánh với đánh giá của User</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseEvaluationDemo;
