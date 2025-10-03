'use client';

import React, { useState } from 'react';
import { BarChart3, Settings, Plus, Edit, Trash, Save, X, RefreshCw, Database } from 'lucide-react';
import { useEvaluation } from '@/contexts/EvaluationContext';
import { useEvaluationConfig } from '@/hooks/useEvaluation';
import { EvaluationType, EvaluationCategory } from '@prisma/client';
import toast from 'react-hot-toast';

interface EvaluationOption {
  id: string;
  label: string;
  points: number;
  order: number;
  isActive: boolean;
}

interface EvaluationConfig {
  options: EvaluationOption[];
  updateOptions: (options: EvaluationOption[]) => Promise<void>;
}

const KPIContent: React.FC = () => {
  const [activeUserTab, setActiveUserTab] = useState<'difficulty' | 'time' | 'impact' | 'urgency' | 'form'>('difficulty');
  const [activeAdminTab, setActiveAdminTab] = useState<'difficulty' | 'time' | 'impact' | 'urgency'>('difficulty');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{ label: string; points: number }>({ label: '', points: 0 });
  const [isSeeding, setIsSeeding] = useState(false);

  const { loading, error, fetchConfigs } = useEvaluation();

  // User evaluation configs
  const userDifficulty = useEvaluationConfig(EvaluationType.USER, EvaluationCategory.DIFFICULTY);
  const userTime = useEvaluationConfig(EvaluationType.USER, EvaluationCategory.TIME);
  const userImpact = useEvaluationConfig(EvaluationType.USER, EvaluationCategory.IMPACT);
  const userUrgency = useEvaluationConfig(EvaluationType.USER, EvaluationCategory.URGENCY);
  const userForm = useEvaluationConfig(EvaluationType.USER, EvaluationCategory.FORM);

  // Admin evaluation configs
  const adminDifficulty = useEvaluationConfig(EvaluationType.ADMIN, EvaluationCategory.DIFFICULTY);
  const adminTime = useEvaluationConfig(EvaluationType.ADMIN, EvaluationCategory.TIME);
  const adminImpact = useEvaluationConfig(EvaluationType.ADMIN, EvaluationCategory.IMPACT);
  const adminUrgency = useEvaluationConfig(EvaluationType.ADMIN, EvaluationCategory.URGENCY);

  const getCurrentConfig = () => {
    switch (activeUserTab) {
      case 'difficulty': return userDifficulty;
      case 'time': return userTime;
      case 'impact': return userImpact;
      case 'urgency': return userUrgency;
      case 'form': return userForm;
      default: return null;
    }
  };

  const getCurrentAdminConfig = () => {
    switch (activeAdminTab) {
      case 'difficulty': return adminDifficulty;
      case 'time': return adminTime;
      case 'impact': return adminImpact;
      case 'urgency': return adminUrgency;
      default: return null;
    }
  };

  const handleEdit = (item: { id: string; label: string; points: number }) => {
    setEditingItem(item.id);
    setEditingValues({ label: item.label, points: item.points });
  };

  const handleSave = async (config: EvaluationConfig) => {
    if (!config) return;

    const currentOptions = config.options || [];
    const updatedOptions = currentOptions.map((item: EvaluationOption) => 
      item.id === editingItem 
        ? { ...item, ...editingValues }
        : item
    );

    await config.updateOptions(updatedOptions);
    setEditingItem(null);
    setEditingValues({ label: '', points: 0 });
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditingValues({ label: '', points: 0 });
  };

  const handleDelete = async (id: string, config: EvaluationConfig) => {
    if (confirm('Bạn có chắc chắn muốn xóa mục này?')) {
      const currentOptions = config.options || [];
      const updatedOptions = currentOptions.filter((item: EvaluationOption) => item.id !== id);
      await config.updateOptions(updatedOptions);
    }
  };

  const handleAddNew = async (config: EvaluationConfig) => {
    const currentOptions = config.options || [];
    const newId = `temp-${Date.now()}`;
    const newOption = { 
      id: newId, 
      label: 'Mới', 
      points: 1, 
      order: currentOptions.length,
      isActive: true 
    };
    
    const updatedOptions = [...currentOptions, newOption];
    await config.updateOptions(updatedOptions);
    
    setEditingItem(newId);
    setEditingValues({ label: 'Mới', points: 1 });
  };

  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      const response = await fetch('/api/evaluation-configs/seed', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Dữ liệu mẫu đã được tạo thành công!', {
          duration: 3000,
          position: 'top-right',
        });
        await fetchConfigs();
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi tạo dữ liệu mẫu', {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Có lỗi xảy ra khi tạo dữ liệu mẫu', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const renderEvaluationTable = (
    config: EvaluationConfig | null,
    isForm: boolean = false
  ) => {
    if (!config) return null;

    const options = config.options || [];

    return (
      <div className="p-3 md:p-6">
        {/* Desktop: Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {isForm ? 'Hình thức' : 'Mức độ'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {options.map((item: EvaluationOption) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem === item.id ? (
                      <input
                        type="text"
                        value={editingValues.label}
                        onChange={(e) => setEditingValues(prev => ({ ...prev, label: e.target.value }))}
                        className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{ WebkitAppearance: 'none' }}
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{item.label}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingItem === item.id ? (
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editingValues.points}
                        onChange={(e) => setEditingValues(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{ WebkitAppearance: 'none' }}
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{item.points}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingItem === item.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSave(config)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Lưu"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Hủy"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, config)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Xóa"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: Card View */}
        <div className="md:hidden space-y-2">
          {options.map((item: EvaluationOption) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-md p-2.5">
              {editingItem === item.id ? (
                // Edit Mode
                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] font-medium text-gray-700 mb-0.5">
                      {isForm ? 'Hình thức' : 'Mức độ'}
                    </label>
                    <input
                      type="text"
                      value={editingValues.label}
                      onChange={(e) => setEditingValues(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full text-[11px] px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      style={{ WebkitAppearance: 'none' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Điểm</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editingValues.points}
                      onChange={(e) => setEditingValues(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                      className="w-full text-[11px] px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      style={{ WebkitAppearance: 'none' }}
                    />
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() => handleSave(config)}
                      className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-green-600 text-white text-[10px] font-medium rounded hover:bg-green-700 transition-colors"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Lưu
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-gray-600 text-white text-[10px] font-medium rounded hover:bg-gray-700 transition-colors"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-900">{item.label}</div>
                    <div className="text-[10px] text-gray-600 mt-0.5">Điểm: <span className="font-medium text-gray-900">{item.points}</span></div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, config)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Xóa"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add New Button */}
        <div className="mt-3 md:mt-4 flex justify-start">
          <button
            onClick={() => handleAddNew(config)}
            className="flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white text-xs md:text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span>Thêm mới</span>
          </button>
        </div>

        {options.length === 0 && (
          <div className="text-center py-6 md:py-8">
            <BarChart3 className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-3 md:mb-4" />
            <h3 className="text-sm md:text-lg font-medium text-gray-900 mb-1 md:mb-2">Chưa có dữ liệu</h3>
            <p className="text-xs md:text-sm text-gray-500">Nhấn &quot;Thêm mới&quot; để tạo mục đầu tiên</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 md:h-12 md:w-12 animate-spin text-blue-600 mx-auto mb-3 md:mb-4" />
          <p className="text-sm md:text-base text-gray-600">Đang tải cấu hình đánh giá...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-3 md:p-4">
        <div className="text-center w-full max-w-md">
          <div className="bg-red-50 rounded-md p-4 md:p-6">
            <BarChart3 className="h-10 w-10 md:h-12 md:w-12 text-red-500 mx-auto mb-3 md:mb-4" />
            <h3 className="text-sm md:text-lg font-medium text-red-900 mb-2">Lỗi tải dữ liệu</h3>
            <p className="text-xs md:text-sm text-red-600 mb-3 md:mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={fetchConfigs}
                className="w-full px-3 md:px-4 py-1.5 md:py-2 bg-red-600 text-white text-xs md:text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
              >
                Thử lại
              </button>
              <button
                onClick={handleSeedData}
                disabled={isSeeding}
                className="w-full px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white text-xs md:text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Database className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>{isSeeding ? 'Đang tạo...' : 'Tạo dữ liệu mẫu'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* iOS Safari input fix */}
      <style dangerouslySetInnerHTML={{ __html: `
        input, select, textarea {
          -webkit-text-fill-color: #111827 !important;
          opacity: 1 !important;
          color: #111827 !important;
        }
        input::placeholder, select::placeholder, textarea::placeholder {
          -webkit-text-fill-color: #9CA3AF !important;
          opacity: 1 !important;
          color: #9CA3AF !important;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      ` }} />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8">
          <div className="py-3 md:py-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="p-1.5 md:p-2 bg-blue-100 rounded-md">
                  <Settings className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-base md:text-2xl font-bold text-gray-900">Điểm KPI</h1>
                  <p className="text-[10px] md:text-sm text-gray-600 hidden sm:block">Cấu hình các tùy chọn đánh giá</p>
                </div>
              </div>
              <button
                onClick={fetchConfigs}
                className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-1.5 md:py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="h-3 w-3 md:h-4 md:w-4" />
                <span className="text-xs md:text-sm hidden sm:inline">Làm mới</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8 py-3 md:py-8">
        {/* User Evaluation Section */}
        <div className="mb-4 md:mb-8">
          <div className="bg-blue-50 rounded-md p-2.5 md:p-4 mb-3 md:mb-4">
            <h2 className="text-sm md:text-xl font-bold text-blue-800">Đánh giá của User</h2>
            <p className="text-[10px] md:text-sm text-blue-600">Cấu hình tùy chọn đánh giá cho người dùng</p>
          </div>
          
          <div className="bg-white rounded-md shadow-sm border border-gray-200">
            {/* User Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
              <nav className="-mb-px flex space-x-3 md:space-x-8 px-3 md:px-6 min-w-max">
                {[
                  { id: 'difficulty', label: 'Mức độ khó', shortLabel: 'Khó', icon: '⚡' },
                  { id: 'time', label: 'Thời gian ước tính', shortLabel: 'Thời gian', icon: '⏱️' },
                  { id: 'impact', label: 'Mức độ ảnh hưởng', shortLabel: 'Ảnh hưởng', icon: '📊' },
                  { id: 'urgency', label: 'Mức độ khẩn cấp', shortLabel: 'Khẩn cấp', icon: '🚨' },
                  { id: 'form', label: 'Hình thức', shortLabel: 'Hình thức', icon: '💼' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveUserTab(tab.id as 'difficulty' | 'time' | 'impact' | 'urgency' | 'form')}
                    className={`py-2 md:py-4 px-1 border-b-2 font-medium text-[10px] md:text-sm flex items-center space-x-1 md:space-x-2 whitespace-nowrap ${
                      activeUserTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm md:text-lg">{tab.icon}</span>
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">{tab.shortLabel}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* User Tab Content */}
            {renderEvaluationTable(getCurrentConfig(), activeUserTab === 'form')}
          </div>
        </div>

        {/* Admin Evaluation Section */}
        <div>
          <div className="bg-green-50 rounded-md p-2.5 md:p-4 mb-3 md:mb-4">
            <h2 className="text-sm md:text-xl font-bold text-green-800">Đánh giá của Admin</h2>
            <p className="text-[10px] md:text-sm text-green-600">Cấu hình tùy chọn đánh giá cho quản trị viên</p>
          </div>
          
          <div className="bg-white rounded-md shadow-sm border border-gray-200">
            {/* Admin Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
              <nav className="-mb-px flex space-x-3 md:space-x-8 px-3 md:px-6 min-w-max">
                {[
                  { id: 'difficulty', label: 'Mức độ khó', shortLabel: 'Khó', icon: '⚡' },
                  { id: 'time', label: 'Thời gian ước tính', shortLabel: 'Thời gian', icon: '⏱️' },
                  { id: 'impact', label: 'Mức độ ảnh hưởng', shortLabel: 'Ảnh hưởng', icon: '📊' },
                  { id: 'urgency', label: 'Mức độ khẩn cấp', shortLabel: 'Khẩn cấp', icon: '🚨' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAdminTab(tab.id as 'difficulty' | 'time' | 'impact' | 'urgency')}
                    className={`py-2 md:py-4 px-1 border-b-2 font-medium text-[10px] md:text-sm flex items-center space-x-1 md:space-x-2 whitespace-nowrap ${
                      activeAdminTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm md:text-lg">{tab.icon}</span>
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">{tab.shortLabel}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Admin Tab Content */}
            {renderEvaluationTable(getCurrentAdminConfig(), false)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIContent;
