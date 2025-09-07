"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Eye, Edit, Trash, AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

interface InternalCase {
  id: string;
  title: string;
  description: string;
  requester: Employee;
  handler: Employee;
  caseType: string;
  form: string;
  status: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
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
  adminAssessmentDate?: string;
  adminAssessmentNotes?: string;
}

interface InternalCaseTableProps {
  cases: InternalCase[];
  loading: boolean;
  expandedRows: Set<string>;
  onToggleExpand: (id: string) => void;
  onView: (case_: InternalCase) => void;
  onEdit: (case_: InternalCase) => void;
  onDelete: (case_: InternalCase) => void;
  onEvaluate: (case_: InternalCase) => void;
}

// Memoized row component to prevent unnecessary re-renders
const CaseRow = React.memo(({ 
  case_, 
  isExpanded, 
  onToggleExpand, 
  onView, 
  onEdit, 
  onDelete, 
  onEvaluate 
}: {
  case_: InternalCase;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onView: (case_: InternalCase) => void;
  onEdit: (case_: InternalCase) => void;
  onDelete: (case_: InternalCase) => void;
  onEvaluate: (case_: InternalCase) => void;
}) => {
  const userTotalScore = useMemo(() => 
    (case_.userDifficultyLevel || 0) + 
    (case_.userEstimatedTime || 0) + 
    (case_.userImpactLevel || 0) + 
    (case_.userUrgencyLevel || 0) + 
    (case_.userFormScore || 0), 
    [case_.userDifficultyLevel, case_.userEstimatedTime, case_.userImpactLevel, case_.userUrgencyLevel, case_.userFormScore]
  );

  const adminTotalScore = useMemo(() => 
    (case_.adminDifficultyLevel || 0) + 
    (case_.adminEstimatedTime || 0) + 
    (case_.adminImpactLevel || 0) + 
    (case_.adminUrgencyLevel || 0), 
    [case_.adminDifficultyLevel, case_.adminEstimatedTime, case_.adminImpactLevel, case_.adminUrgencyLevel]
  );

  const grandTotal = useMemo(() => 
    ((userTotalScore * 0.4) + (adminTotalScore * 0.6)).toFixed(2), 
    [userTotalScore, adminTotalScore]
  );

  const isEvaluated = useMemo(() => 
    case_.adminDifficultyLevel !== null && 
    case_.adminDifficultyLevel !== undefined &&
    case_.adminEstimatedTime !== null && 
    case_.adminEstimatedTime !== undefined &&
    case_.adminImpactLevel !== null && 
    case_.adminImpactLevel !== undefined &&
    case_.adminUrgencyLevel !== null && 
    case_.adminUrgencyLevel !== undefined,
    [case_.adminDifficultyLevel, case_.adminEstimatedTime, case_.adminImpactLevel, case_.adminUrgencyLevel]
  );

  const statusColor = useMemo(() => {
    switch (case_.status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, [case_.status]);

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-3 py-4 whitespace-nowrap">
          <button
            onClick={() => onToggleExpand(case_.id)}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>
        <td className="px-3 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">{case_.title}</div>
          <div className="text-sm text-gray-500">{case_.caseType}</div>
        </td>
        <td className="px-3 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{case_.requester.fullName}</div>
          <div className="text-sm text-gray-500">{case_.requester.department}</div>
        </td>
        <td className="px-3 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{case_.handler.fullName}</div>
          <div className="text-sm text-gray-500">{case_.handler.department}</div>
        </td>
        <td className="px-3 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
            {case_.status}
          </span>
        </td>
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
          {new Date(case_.startDate).toLocaleDateString('vi-VN')}
        </td>
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
          {grandTotal}
        </td>
        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
          {isEvaluated ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          )}
        </td>
        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onView(case_)}
              className="text-blue-600 hover:text-blue-900"
              title="Xem chi tiết"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(case_)}
              className="text-indigo-600 hover:text-indigo-900"
              title="Chỉnh sửa"
            >
              <Edit className="h-4 w-4" />
            </button>
            {!isEvaluated && (
              <button
                onClick={() => onEvaluate(case_)}
                className="text-green-600 hover:text-green-900"
                title="Đánh giá"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(case_)}
              className="text-red-600 hover:text-red-900"
              title="Xóa"
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={9} className="px-3 py-4 bg-gray-50">
            <div className="space-y-2">
              <div>
                <strong>Mô tả:</strong> {case_.description}
              </div>
              {case_.notes && (
                <div>
                  <strong>Ghi chú:</strong> {case_.notes}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Đánh giá người dùng</h4>
                  <div className="text-xs space-y-1">
                    <div>Độ khó: {case_.userDifficultyLevel || 'N/A'}</div>
                    <div>Thời gian ước tính: {case_.userEstimatedTime || 'N/A'}</div>
                    <div>Tác động: {case_.userImpactLevel || 'N/A'}</div>
                    <div>Độ khẩn cấp: {case_.userUrgencyLevel || 'N/A'}</div>
                    <div>Điểm form: {case_.userFormScore || 'N/A'}</div>
                    <div>Tổng điểm: {userTotalScore}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Đánh giá admin</h4>
                  <div className="text-xs space-y-1">
                    <div>Độ khó: {case_.adminDifficultyLevel || 'N/A'}</div>
                    <div>Thời gian ước tính: {case_.adminEstimatedTime || 'N/A'}</div>
                    <div>Tác động: {case_.adminImpactLevel || 'N/A'}</div>
                    <div>Độ khẩn cấp: {case_.adminUrgencyLevel || 'N/A'}</div>
                    <div>Tổng điểm: {adminTotalScore}</div>
                    {case_.adminAssessmentNotes && (
                      <div>Ghi chú: {case_.adminAssessmentNotes}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

CaseRow.displayName = 'CaseRow';

export default function InternalCaseTable({
  cases,
  loading,
  expandedRows,
  onToggleExpand,
  onView,
  onEdit,
  onDelete,
  onEvaluate
}: InternalCaseTableProps) {
  const memoizedCases = useMemo(() => cases, [cases]);

  if (loading) {
    return (
      <div className="px-3 py-8 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Đang tải danh sách case...</span>
        </div>
      </div>
    );
  }

  if (memoizedCases.length === 0) {
    return (
      <div className="px-3 py-8 text-center text-gray-500">
        Không có case nào được tìm thấy.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
              {/* Expand column */}
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Case
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Người yêu cầu
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Người xử lý
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ngày bắt đầu
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tổng điểm
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Đánh giá
            </th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {memoizedCases.map((case_) => (
            <CaseRow
              key={case_.id}
              case_={case_}
              isExpanded={expandedRows.has(case_.id)}
              onToggleExpand={onToggleExpand}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onEvaluate={onEvaluate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
