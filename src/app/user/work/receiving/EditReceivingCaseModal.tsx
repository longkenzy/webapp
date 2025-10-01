'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, Plus, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';

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
        endDate: caseData.endDate ? new Date(caseData.endDate).toISOString().slice(0, 16) : '',
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        inProgressAt = new Date().toISOString();
        
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
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa Case Nhận Hàng</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Case Info Display */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-gray-900">Thông tin Case</h3>
            <div className="space-y-2 text-sm">
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
                  {new Date(caseData.startDate).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                </span>
              </div>
            </div>
          </div>

          {/* End Date, Status and CRM Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Ngày kết thúc
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Để trống nếu chưa hoàn thành
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                Trạng thái
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="RECEIVED">Tiếp nhận</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Hủy</option>
              </select>
            </div>

            {/* CRM Reference Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                  Mã CRM
                </span>
              </label>
              <input
                type="text"
                value={formData.crmReferenceCode}
                onChange={(e) => handleInputChange('crmReferenceCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mã CRM (tùy chọn)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mã tham chiếu từ hệ thống CRM
              </p>
            </div>
          </div>

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <Package className="inline h-4 w-4 mr-1" />
                Chi tiết hàng hóa
              </label>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm sản phẩm</span>
              </button>
            </div>
            
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.map((product, index) => (
                  <div key={product.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">Sản phẩm {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3">
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Chưa có sản phẩm nào</p>
                <p className="text-xs text-gray-400 mt-1">Nhấn &quot;Thêm sản phẩm&quot; để bắt đầu</p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}