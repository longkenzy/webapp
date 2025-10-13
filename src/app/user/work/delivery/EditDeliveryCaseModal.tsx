'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, Plus, Trash2, Package, Truck, Save, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrentVietnamDateTime, convertISOToLocalInput, convertLocalInputToISO } from '@/lib/date-utils';
import { DateTimePicker } from '@mantine/dates';
import 'dayjs/locale/vi';

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
    endDate: null as Date | null,
    crmReferenceCode: '',
    notes: ''
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when caseData changes
  useEffect(() => {
    if (caseData && isOpen) {
      setFormData({
        status: caseData.status || '',
        endDate: caseData.endDate ? new Date(caseData.endDate) : null,
        crmReferenceCode: caseData.crmReferenceCode || '',
        notes: caseData.notes || ''
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
        newData.endDate = new Date();
      }
      
      return newData;
    });
  };

  const handleEndDateChange = (value: Date | null) => {
    setFormData(prev => ({
      ...prev,
      endDate: value
    }));
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
        endDate: formData.endDate ? (formData.endDate instanceof Date ? formData.endDate.toISOString() : new Date(formData.endDate).toISOString()) : null,
        inProgressAt: inProgressAt,
        crmReferenceCode: formData.crmReferenceCode || null,
        notes: formData.notes || null,
        description: JSON.stringify(productData),
        products: productData
      };

      console.log('Updating delivery case with data:', updateData);

      const response = await fetch(`/api/delivery-cases/${caseData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log('Response status:', response.status);

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
        let errorData;
        try {
          errorData = await response.json();
          console.error('API Error Response:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        // Show error notification with details
        const errorMessage = errorData.details || errorData.error || 'Có lỗi xảy ra khi cập nhật case';
        toast.error(`Lỗi: ${errorMessage}`, {
          duration: 5000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        });
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error updating delivery case:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      
      // Show error notification
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật case';
      toast.error(`Lỗi: ${errorMessage}`, {
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="ios-input-fix bg-white rounded shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header - Màu xanh lá cây để phân biệt với Admin */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Chỉnh sửa Case Giao Hàng</h2>
                <p className="text-emerald-50 text-xs mt-0.5">Cập nhật thông tin case giao hàng</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/90 hover:text-white hover:bg-white/20 rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-5 space-y-4">
              {/* Section 1: Thông tin Case */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Thông tin Case</h3>
                </div>
                
                <div className="p-3 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[120px]">Tiêu đề:</span>
                    <span className="text-gray-900 flex-1">{caseData.title}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[120px]">Khách hàng:</span>
                    <span className="text-gray-900 flex-1">{caseData.customer?.shortName || 'Không xác định'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[120px]">Người giao:</span>
                    <span className="text-gray-900 flex-1">{caseData.handler.fullName}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[120px]">Ngày bắt đầu:</span>
                    <span className="text-gray-900 flex-1">{new Date(caseData.startDate).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Thời gian & Trạng thái */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Thời gian & Trạng thái</h3>
                </div>
                
                <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Ngày kết thúc
                    </label>
                    <DateTimePicker
                      value={formData.endDate}
                      onChange={handleEndDateChange}
                      placeholder="Chọn ngày kết thúc"
                      locale="vi"
                      valueFormat="DD/MM/YYYY HH:mm"
                      clearable
                      styles={{
                        input: {
                          fontSize: '0.875rem',
                          padding: '0.375rem 0.625rem',
                          minHeight: '34px',
                          height: '34px',
                          borderColor: '#d1d5db',
                          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Để trống nếu chưa hoàn thành
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Trạng thái
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    >
                      <option value="RECEIVED">Tiếp nhận</option>
                      <option value="IN_PROGRESS">Đang xử lý</option>
                      <option value="COMPLETED">Hoàn thành</option>
                      <option value="CANCELLED">Hủy</option>
                    </select>
                  </div>

                  {/* CRM Reference Code */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Mã CRM
                    </label>
                    <input
                      type="text"
                      name="crmReferenceCode"
                      value={formData.crmReferenceCode || ''}
                      onChange={handleInputChange}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Nhập mã CRM"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Ghi chú */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Ghi chú</h3>
                </div>
                
                <div className="p-3">
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="Nhập ghi chú cho case giao hàng..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Section 4: Chi tiết hàng hóa */}
              <div className="bg-white rounded border border-gray-200">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Chi tiết hàng hóa</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addProduct}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm sản phẩm</span>
                  </button>
                </div>
                
                <div className="p-3">
            
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
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
