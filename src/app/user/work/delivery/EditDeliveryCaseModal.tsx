'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, Plus, Trash2, Package, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrentVietnamDateTime, convertISOToLocalInput, convertLocalInputToISO } from '@/lib/date-utils';

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

interface DeliveryCase {
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
  customer: Partner | null;
  products: Product[];
  _count: {
    comments: number;
    worklogs: number;
    products: number;
  };
}

interface EditDeliveryCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCase: DeliveryCase) => void;
  caseData: DeliveryCase | null;
}

export default function EditDeliveryCaseModal({ isOpen, onClose, onSuccess, caseData }: EditDeliveryCaseModalProps) {
  const [formData, setFormData] = useState({
    status: '',
    endDate: '',
    crmReferenceCode: ''
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when caseData changes
  useEffect(() => {
    if (caseData && isOpen) {
      setFormData({
        status: caseData.status || '',
        endDate: caseData.endDate ? convertISOToLocalInput(caseData.endDate) : '',
        crmReferenceCode: caseData.crmReferenceCode || ''
      });

      // Load products from case data
      if (caseData.products && caseData.products.length > 0) {
        const productItems: ProductItem[] = caseData.products.map(product => ({
          id: product.id,
          name: product.name,
          code: product.code || '',
          quantity: product.quantity.toString(),
          serialNumber: product.serialNumber || ''
        }));
        setProducts(productItems);
      } else {
        // Try to parse from description if no products table data
        try {
          const parsedProducts = JSON.parse(caseData.description || '[]');
          if (Array.isArray(parsedProducts)) {
            const productItems: ProductItem[] = parsedProducts.map((product: any, index: number) => ({
              id: product.id || `temp-${index}`,
              name: product.name || '',
              code: product.code || '',
              quantity: (product.quantity || 1).toString(),
              serialNumber: product.serialNumber || product.notes || ''
            }));
            setProducts(productItems);
          } else {
            setProducts([{ id: '1', name: '', code: '', quantity: '1', serialNumber: '' }]);
          }
        } catch (e) {
          setProducts([{ id: '1', name: '', code: '', quantity: '1', serialNumber: '' }]);
        }
      }
    }
  }, [caseData, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Auto-fill endDate when status is set to COMPLETED
      if (name === 'status' && value === 'COMPLETED' && !prev.endDate) {
        newData.endDate = getCurrentVietnamDateTime();
      }
      
      return newData;
    });
  };

  const handleProductChange = (index: number, field: keyof ProductItem, value: string) => {
    const updatedProducts = products.map((product, i) => 
      i === index ? { ...product, [field]: value } : product
    );
    setProducts(updatedProducts);
  };

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

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;

    setLoading(true);
    setError(null);

    try {
      // Validate end date
      if (formData.endDate) {
        const startDate = new Date(caseData.startDate);
        const endDate = new Date(formData.endDate);
        
        if (endDate <= startDate) {
          toast.error('Ngày kết thúc phải lớn hơn ngày bắt đầu!', {
            duration: 3000,
            position: 'top-right',
          });
          setLoading(false);
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
            setLoading(false);
            return;
          }
        }
      }

      // Validate required fields
      if (products.some(p => !p.name.trim())) {
        setError('Vui lòng nhập tên sản phẩm cho tất cả các sản phẩm');
        setLoading(false);
        return;
      }

      // Prepare product data
      const productData = products.map(product => ({
        name: product.name.trim(),
        code: product.code.trim() || null,
        quantity: parseInt(product.quantity) || 1,
        serialNumber: product.serialNumber.trim() || null
      }));

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
      }
      
      // Prepare update data
      const updateData = {
        status: finalStatus,
        endDate: formData.endDate || null,
        inProgressAt: inProgressAt,
        crmReferenceCode: formData.crmReferenceCode || null,
        description: JSON.stringify(productData),
        products: productData
      };

      const response = await fetch(`/api/delivery-cases/${caseData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedCase = await response.json();
        
        // Show success notification
        toast.success('Cập nhật case giao hàng thành công!', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
        
        onSuccess(updatedCase);
        onClose();
      } else {
        const errorData = await response.json();
        
        // Show error notification
        toast.error('Có lỗi xảy ra khi cập nhật case. Vui lòng thử lại.', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        });
        
        setError(errorData.error || 'Có lỗi xảy ra khi cập nhật case giao hàng');
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
      
      setError('Có lỗi xảy ra khi cập nhật case giao hàng');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !caseData) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ios-input-fix input, .ios-input-fix select, .ios-input-fix textarea {
          -webkit-text-fill-color: #111827 !important;
          opacity: 1 !important;
          color: #111827 !important;
        }
        .ios-input-fix input::placeholder, .ios-input-fix textarea::placeholder {
          -webkit-text-fill-color: #9ca3af !important;
          opacity: 0.6 !important;
          color: #9ca3af !important;
        }
      `}} />
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center md:p-4">
        <div className="ios-input-fix bg-white rounded-t-2xl md:rounded-lg shadow-xl w-full md:max-w-4xl h-[95vh] md:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 md:px-6 py-3 md:py-4 rounded-t-2xl md:rounded-t-lg z-40 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-white/20 rounded-md">
                  <Truck className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-semibold">Chỉnh sửa Case Giao Hàng</h2>
                  <p className="text-green-100 text-xs hidden sm:block">Cập nhật thông tin case</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 md:p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-3 md:p-6 space-y-4 md:space-y-6 flex-1 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <X className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          {/* Case Info Display */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-gray-900">Thông tin Case</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-600">Tiêu đề:</span>
                <span className="ml-2 text-gray-900">{caseData.title}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Khách hàng:</span>
                <span className="ml-2 text-gray-900">{caseData.customer?.shortName || 'Không xác định'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Người giao hàng:</span>
                <span className="ml-2 text-gray-900">{caseData.handler.fullName}</span>
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
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
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
                name="status"
                value={formData.status}
                onChange={handleInputChange}
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
                name="crmReferenceCode"
                value={formData.crmReferenceCode || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mã CRM (tùy chọn)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mã tham chiếu từ hệ thống CRM
              </p>
            </div>
          </div>

          {/* Products */}
          <div className="bg-gray-50 rounded-md p-3 md:p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1 md:p-1.5 bg-blue-100 rounded-md">
                  <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                </div>
                <h3 className="text-xs md:text-sm font-semibold text-gray-700">Chi tiết hàng hóa</h3>
              </div>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Thêm</span>
              </button>
            </div>
            
            {products.length === 0 ? (
              <div className="text-center py-6 md:py-8 text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-xs md:text-sm">Chưa có sản phẩm nào</p>
                <p className="text-xs hidden md:block">Nhấn &quot;Thêm&quot; để bắt đầu</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-md">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Tên sản phẩm *
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Mã sản phẩm
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Số lượng *
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          S/N
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product, index) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={product.name}
                              onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Nhập tên sản phẩm"
                              required
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={product.code}
                              onChange={(e) => handleProductChange(index, 'code', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Mã sản phẩm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="1"
                              required
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={product.serialNumber}
                              onChange={(e) => handleProductChange(index, 'serialNumber', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Số serial"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeProduct(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-2">
                  {products.map((product, index) => (
                    <div key={product.id} className="bg-white border border-gray-200 rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700">Sản phẩm #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeProduct(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Tên sản phẩm */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Tên sản phẩm <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => handleProductChange(index, 'name', e.target.value)}
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
                              onChange={(e) => handleProductChange(index, 'code', e.target.value)}
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
                              value={product.quantity}
                              onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              placeholder="SL"
                              min="1"
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
                            onChange={(e) => handleProductChange(index, 'serialNumber', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="S/N (tùy chọn)"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>




          {/* Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-3 md:px-0 py-3 md:py-0 md:relative md:border-t-0 mt-4 md:mt-0 md:pt-4 -mx-3 md:mx-0">
            <div className="flex gap-2 md:gap-3 md:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
