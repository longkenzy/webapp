'use client';

import { memo, useState } from 'react';
import { Edit, Check } from 'lucide-react';
import toast from 'react-hot-toast';

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

interface InternalCaseRowProps {
  case_: InternalCase;
  index: number;
  onEdit: (caseData: InternalCase) => void;
  onClose: (caseId: string) => Promise<void>;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  formatDate: (dateString: string) => string;
  formatCaseType: (caseType: string) => string;
}

const InternalCaseRow = memo(function InternalCaseRow({
  case_,
  index,
  onEdit,
  onClose,
  getStatusColor,
  getStatusText,
  formatDate,
  formatCaseType,
}: InternalCaseRowProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleCloseCase = async () => {
    if (case_.status === 'COMPLETED') {
      toast.error('Case này đã được đóng rồi!', {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn đóng case "${case_.title}"?`)) {
      return;
    }

    try {
      setIsClosing(true);
      await onClose(case_.id);
      toast.success('Case đã được đóng thành công!', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Error closing case:', error);
      toast.error('Có lỗi xảy ra khi đóng case. Vui lòng thử lại!', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setIsClosing(false);
    }
  };
  return (
    <tr className="hover:bg-slate-50/50 transition-colors duration-150">
      <td className="px-2 sm:px-3 py-2 text-center">
        <span className="text-sm font-medium text-slate-600">
          {index}
        </span>
      </td>
      <td className="px-2 sm:px-3 py-2">
        <div className="max-w-[250px]">
          <div className="text-sm font-medium text-slate-900 mb-1 whitespace-pre-wrap break-words">
            {case_.title}
          </div>
          <div className="text-xs text-slate-500 mb-1 whitespace-pre-wrap break-words">
            {case_.description}
          </div>
          <div className="text-xs text-slate-500">
            Tạo: {formatDate(case_.createdAt)}
          </div>
        </div>
      </td>
      <td className="px-2 sm:px-3 py-2">
        <div className="max-w-[200px]">
          {case_.notes ? (
            <div className="text-xs text-slate-600 whitespace-pre-wrap break-words">
              {case_.notes.length > 50 ? `${case_.notes.substring(0, 50)}...` : case_.notes}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">
              -
            </div>
          )}
        </div>
      </td>
      <td className="px-2 sm:px-3 py-2">
        <div>
          <div className="text-sm text-slate-900">{case_.requester.fullName}</div>
          <div className="text-xs text-slate-500">{case_.requester.position}</div>
        </div>
      </td>
      <td className="px-2 sm:px-3 py-2">
        <div>
          <div className="text-sm text-slate-900">{case_.handler.fullName}</div>
          <div className="text-xs text-slate-500">{case_.handler.position}</div>
        </div>
      </td>
      <td className="px-2 sm:px-3 py-2">
        <div className="text-sm text-slate-700">{formatCaseType(case_.caseType)}</div>
      </td>
      <td className="px-2 sm:px-3 py-2">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(case_.status)}`}>
          {getStatusText(case_.status)}
        </span>
      </td>
      <td className="px-2 sm:px-3 py-2">
        <div className="text-xs space-y-1">
          <div className="flex items-center">
            <span className="text-green-600 font-medium">Bắt đầu:</span>
            <span className="text-green-600 ml-1">{formatDate(case_.startDate)}</span>
          </div>
          {case_.endDate && (
            <div className="flex items-center">
              <span className="text-red-600 font-medium">Kết thúc:</span>
              <span className="text-red-600 ml-1">{formatDate(case_.endDate)}</span>
            </div>
          )}
        </div>
      </td>
      <td className="px-2 sm:px-3 py-2 text-center">
        <div className="flex items-center justify-center space-x-1">
          {case_.status !== 'COMPLETED' && (
            <button 
              onClick={() => onEdit(case_)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200 cursor-pointer"
              title="Chỉnh sửa"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          
          {case_.status !== 'COMPLETED' && (
            <button 
              onClick={handleCloseCase}
              disabled={isClosing}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Đóng case"
            >
              <Check className={`h-4 w-4 ${isClosing ? 'animate-pulse' : ''}`} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

export default InternalCaseRow;
