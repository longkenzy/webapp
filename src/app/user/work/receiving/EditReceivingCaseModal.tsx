'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, Plus, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrentVietnamDateTime, convertISOToLocalInput, convertLocalInputToISO, formatVietnamDateTime } from '@/lib/date-utils';

interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
}

interface Partner {
  id: string;
  shortName: string;
  fullCompanyName: string;
  contactPerson: string;
  contactPhone: string;
}

interface Product {
  id: string;
  name: string;
  code: string | null;
  quantity: number;
  serialNumber: string | null;
}

interface ProductItem {
  id: string;
  name: string;
  code: string;
  quantity: string;
  serialNumber: string;
}

interface ReceivingCase {
  id: string;
  title: string;
  description: string;
  form: string;
  startDate: string;
  endDate: string | null;
  status: string;
  notes: string | null;
  crmReferenceCode: string | null;
  userDifficultyLevel: number | null;
  userEstimatedTime: number | null;
  userImpactLevel: number | null;
  userUrgencyLevel: number | null;
  userFormScore: number | null;
  userAssessmentDate: string | null;
  adminDifficultyLevel: number | null;
  adminEstimatedTime: number | null;
  adminImpactLevel: number | null;
  adminUrgencyLevel: number | null;
  adminAssessmentDate: string | null;
  adminAssessmentNotes: string | null;
  inProgressAt: string | null;
  createdAt: string;
  updatedAt: string;
  requester: Employee;
  handler: Employee;
  supplier: Partner | null;
  products: Product[];
  _count: {
    comments: number;
    worklogs: number;
    products: number;
  };
}

interface EditReceivingCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedCase: ReceivingCase) => void;
  caseData: ReceivingCase | null;
}

export default function EditReceivingCaseModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  caseData 
}: EditReceivingCaseModalProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [formData, setFormData] = useState({
    endDate: '',
    status: 'RECEIVED',
    crmReferenceCode: ''
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && caseData) {
      setFormData({
        endDate: caseData.endDate ? convertISOToLocalInput(caseData.endDate) : '',
        status: caseData.status,
        crmReferenceCode: caseData.crmReferenceCode || ''
      });
      
      // Initialize products from caseData
      if (caseData.products && caseData.products.length > 0) {
        setProducts(caseData.products.map(product => ({
          id: product.id,
          name: product.name,
          code: product.code || '',
          quantity: product.quantity.toString(),
          serialNumber: product.serialNumber || ''
        })));
      } else {
        setProducts([]);
      }
    }
  }, [isOpen, caseData]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Prevent body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-fill endDate when status is set to COMPLETED
      if (field === 'status' && value === 'COMPLETED' && !prev.endDate) {
        newData.endDate = getCurrentVietnamDateTime();
      }
      
      return newData;
    });
  };

  // Product management functions
  const addProduct = () => {
    const newProduct: ProductItem = {
      id: Date.now().toString(),
      name: '',
      code: '',
      quantity: '1',
      serialNumber: ''
    };
    setProducts([...products, newProduct]);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(product => product.id !== id));
  };

  const updateProduct = (id: string, field: keyof ProductItem, value: string) => {
    setProducts(products.map(product => 
      product.id === id ? { ...product, [field]: value } : product
    ));
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'Tiếp nhận';
      case 'IN_PROGRESS':
        return 'Đang xử lý';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Hủy';
      default:
        return status;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!caseData) return;

    // Validate end date
    if (formData.endDate) {
      const startDate = new Date(caseData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate <= startDate) {
        toast.error('Ngày kết thúc phải lớn hơn ngày bắt đầu!', {
          duration: 3000,
          position: 'top-right',
        });
        return;
      }
      

      // Validate end date with case status timeline
      // If case has inProgressAt, end date should be after the time it was set to IN_PROGRESS
      if (caseData.inProgressAt) {
        const inProgressTime = new Date(caseData.inProgressAt);
        if (endDate <= inProgressTime) {
          toast.error('Ngày kết thúc phải lớn hơn thời gian đang xử lý!', {
            duration: 3000,
            position: 'top-right',
          });
          return;
        }
      }
    }

    try {
      setLoading(true);
      
      // Auto-set status to COMPLETED if endDate is provided but status is not COMPLETED
      let finalStatus = formData.status;
      let inProgressAt = caseData.inProgressAt; // Giữ nguyên giá trị hiện tại
      
      if (formData.endDate && formData.status !== 'COMPLETED') {
        finalStatus = 'COMPLETED';
        
        // Show notification about auto-status change
        toast('Trạng thái đã được tự động chuyển thành "Hoàn thành" vì đã có ngày kết thúc', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#F59E0B',
            color: '#fff',
          },
          icon: 'ℹ️',
        });
      }
      
      // Auto-set inProgressAt if status is changed to IN_PROGRESS
      
      if (formData.status === 'IN_PROGRESS' && caseData.status !== 'IN_PROGRESS') {
        inProgressAt = convertLocalInputToISO(getCurrentVietnamDateTime());
        
        // Show notification about auto-time setting
        toast('Thời gian đang xử lý đã được tự động cập nhật', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#3B82F6',
            color: '#fff',
          },
          icon: '🕐',
        });
      } else {
      }
      
      // Prepare data for API
      const updateData = {
        endDate: formData.endDate ? convertLocalInputToISO(formData.endDate) : null,
        status: finalStatus,
        inProgressAt: inProgressAt,
        crmReferenceCode: formData.crmReferenceCode || null,
        products: products.map(product => ({
          id: product.id,
          name: product.name,
          code: product.code,
          quantity: parseInt(product.quantity) || 1,
          serialNumber: product.serialNumber
        }))
      };


      // Send to API
      const response = await fetch(`/api/receiving-cases/${caseData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });


      if (response.ok) {
        const result = await response.json();
        
        // Show success notification
        toast.success('Cập nhật case nhận hàng thành công!', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
        
        // Close modal and pass updated data
        onClose();
        if (onSuccess && result) {
          onSuccess(result);
        }
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        // Show error notification with more details
        const errorMessage = errorData.error || errorData.message || 'Unknown error';
        toast.error(`Có lỗi xảy ra khi cập nhật case: ${errorMessage}`, {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      
      // Show error notification
      toast.error('Có lỗi xảy ra khi cập nhật case. Vui lòng thử lại.', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      endDate: '',
      status: 'RECEIVED',
      crmReferenceCode: ''
    });
    setProducts([]);
    onClose();
  };

  if (!isOpen || !caseData) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ios-input-fix input,
        .ios-input-fix select,
        .ios-input-fix textarea {
          -webkit-text-fill-color: #111827 !important;
          opacity: 1 !important;
          color: #111827 !important;
        }
        .ios-input-fix input::placeholder,
        .ios-input-fix textarea::placeholder {
          -webkit-text-fill-color: #9ca3af !important;
          opacity: 0.6 !important;
          color: #9ca3af !important;
        }
      `}} />
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center md:p-4">
        <div className="ios-input-fix bg-white rounded-t-2xl md:rounded-lg shadow-xl w-full md:max-w-4xl h-[95vh] md:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 md:px-6 py-3 md:py-4 rounded-t-2xl md:rounded-t-lg z-40 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-white/20 rounded-md">
                  <Package className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-semibold">Chỉnh sửa Case Nhận Hàng</h2>
                  <p className="text-blue-100 text-xs hidden sm:block">Cập nhật thông tin case</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 md:p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-3 md:p-6 space-y-4 md:space-y-6 flex-1 overflow-y-auto">
          {/* Case Info Display */}
          <div className="bg-gray-50 rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
            <h3 className="text-sm md:text-base font-medium text-gray-900">Thông tin Case</h3>
            <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              <div>
                <span className="font-medium text-gray-600">Tiêu đề:</span>
                <span className="ml-2 text-gray-900">{caseData.title}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Nhà cung cấp:</span>
                <span className="ml-2 text-gray-900">{caseData.supplier?.shortName || 'Không xác định'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Người nhận:</span>
                <span className="ml-2 text-gray-900">{caseData.requester.fullName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Ngày bắt đầu:</span>
                <span className="ml-2 text-gray-900">
                  {formatVietnamDateTime(caseData.startDate)}
                </span>
              </div>
            </div>
          </div>

          {/* End Date, Status and CRM Code */}
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
            {/* End Date */}
            <div className="min-w-0 overflow-hidden">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ngày kết thúc
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-1.5 md:px-2.5 py-1.5 text-[11px] md:text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                style={{ minWidth: 0, maxWidth: '100%', WebkitAppearance: 'none', opacity: 1, color: '#111827' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Để trống nếu chưa hoàn thành
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="RECEIVED">Tiếp nhận</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Hủy</option>
              </select>
            </div>

            {/* CRM Reference Code */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mã CRM
              </label>
              <input
                type="text"
                value={formData.crmReferenceCode}
                onChange={(e) => handleInputChange('crmReferenceCode', e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Mã CRM"
              />
            </div>
          </div>

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs md:text-sm font-medium text-gray-700">
                <Package className="inline h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                Chi tiết hàng hóa
              </label>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3 w-3 md:h-4 md:w-4" />
                <span>Thêm</span>
              </button>
            </div>
            
            {products.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                {products.map((product, index) => (
                  <div key={product.id} className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <h4 className="text-xs md:text-sm font-medium text-gray-900">Sản phẩm #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        className="text-red-600 hover:text-red-800 transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </button>
                    </div>
                    
                    {/* Desktop Grid */}
                    <div className="hidden md:grid md:grid-cols-4 md:gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Tên sản phẩm *
                        </label>
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nhập tên sản phẩm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Mã sản phẩm
                        </label>
                        <input
                          type="text"
                          value={product.code}
                          onChange={(e) => updateProduct(product.id, 'code', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nhập mã sản phẩm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Số lượng *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={product.quantity}
                          onChange={(e) => updateProduct(product.id, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nhập số lượng"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          S/N
                        </label>
                        <input
                          type="text"
                          value={product.serialNumber}
                          onChange={(e) => updateProduct(product.id, 'serialNumber', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nhập S/N"
                        />
                      </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-2">
                      {/* Tên sản phẩm */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Tên sản phẩm <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="Nhập tên sản phẩm"
                          required
                        />
                      </div>

                      {/* 2 columns: Code & Quantity */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Mã SP</label>
                          <input
                            type="text"
                            value={product.code}
                            onChange={(e) => updateProduct(product.id, 'code', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="Mã"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Số lượng <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={(e) => updateProduct(product.id, 'quantity', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="SL"
                            required
                          />
                        </div>
                      </div>

                      {/* Serial Number */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Serial Number</label>
                        <input
                          type="text"
                          value={product.serialNumber}
                          onChange={(e) => updateProduct(product.id, 'serialNumber', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="S/N (tùy chọn)"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 md:py-8 bg-gray-50 rounded-lg border border-gray-200">
                <Package className="h-8 w-8 md:h-12 md:w-12 text-gray-400 mx-auto mb-2 md:mb-3" />
                <p className="text-xs md:text-sm text-gray-500">Chưa có sản phẩm nào</p>
                <p className="text-xs text-gray-400 mt-1 hidden md:block">Nhấn &quot;Thêm&quot; để bắt đầu</p>
              </div>
            )}
          </div>

          {/* Buttons - Sticky Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-3 md:px-0 py-3 md:py-0 md:relative md:border-t-0 mt-4 md:mt-0 md:pt-4 -mx-3 md:mx-0">
            <div className="flex gap-2 md:gap-3 md:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}