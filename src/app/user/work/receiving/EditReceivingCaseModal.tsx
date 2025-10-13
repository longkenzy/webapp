'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, Plus, Trash2, Package, Save, User, Truck, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrentVietnamDateTime, convertISOToLocalInput, convertLocalInputToISO, formatVietnamDateTime } from '@/lib/date-utils';
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
    endDate: null as Date | null,
    status: 'RECEIVED',
    crmReferenceCode: '',
    notes: ''
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && caseData) {
      setFormData({
        endDate: caseData.endDate ? new Date(caseData.endDate) : null,
        status: caseData.status,
        crmReferenceCode: caseData.crmReferenceCode || '',
        notes: caseData.notes || ''
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

  const handleInputChange = (field: string, value: string | Date | null) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-fill endDate when status is set to COMPLETED
      if (field === 'status' && value === 'COMPLETED' && !prev.endDate) {
        newData.endDate = new Date();
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
      
      if (formData.endDate <= startDate) {
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
        if (formData.endDate <= inProgressTime) {
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
      }
      
      // Validate and convert endDate
      let endDateISO: string | null = null;
      if (formData.endDate) {
        try {
          const endDate = formData.endDate instanceof Date 
            ? formData.endDate 
            : new Date(formData.endDate);
          
          if (isNaN(endDate.getTime())) {
            throw new Error('Invalid date');
          }
          endDateISO = endDate.toISOString();
        } catch (error) {
          toast.error('Ngày giờ kết thúc không hợp lệ', {
            duration: 3000,
            position: 'top-right',
          });
          setLoading(false);
          return;
        }
      }
      
      // Prepare data for API
      const updateData = {
        endDate: endDateISO,
        status: finalStatus,
        inProgressAt: inProgressAt,
        crmReferenceCode: formData.crmReferenceCode || null,
        notes: formData.notes || null,
        products: products.map(product => ({
          id: product.id,
          name: product.name,
          code: product.code,
          quantity: parseInt(product.quantity) || 1,
          serialNumber: product.serialNumber
        }))
      };

      console.log('Update data:', updateData);


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
          console.error('API Error:', errorData);
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          console.error('Parse Error:', parseError);
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
      console.error('Update case error:', error);
      
      // Show error notification
      toast.error(`Có lỗi xảy ra khi cập nhật case. Vui lòng thử lại. ${error instanceof Error ? error.message : ''}`, {
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
      endDate: null,
      status: 'RECEIVED',
      crmReferenceCode: '',
      notes: ''
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="ios-input-fix bg-white rounded shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header - Màu xanh lá cây để phân biệt với Admin */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Chỉnh sửa Case Nhận Hàng</h2>
                <p className="text-emerald-50 text-xs mt-0.5">Cập nhật thông tin case nhận hàng</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
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
                    <span className="font-medium text-gray-600 min-w-[120px]">Nhà cung cấp:</span>
                    <span className="text-gray-900 flex-1">{caseData.supplier?.shortName || 'Không xác định'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[120px]">Người nhận:</span>
                    <span className="text-gray-900 flex-1">{caseData.requester.fullName}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-600 min-w-[120px]">Ngày bắt đầu:</span>
                    <span className="text-gray-900 flex-1">{formatVietnamDateTime(caseData.startDate)}</span>
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
                      Ngày giờ kết thúc
                    </label>
                    <DateTimePicker
                      value={formData.endDate}
                      onChange={(value) => handleInputChange('endDate', value)}
                      placeholder="Chọn ngày giờ kết thúc"
                      locale="vi"
                      valueFormat="DD/MM/YYYY HH:mm"
                      clearable
                      minDate={new Date(caseData.startDate)}
                      withSeconds={false}
                      styles={{
                        input: {
                          fontSize: '0.875rem',
                          padding: '0.375rem 0.625rem',
                          borderColor: '#d1d5db',
                          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                          borderRadius: '0.25rem',
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
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
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
                      value={formData.crmReferenceCode}
                      onChange={(e) => handleInputChange('crmReferenceCode', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-2.5 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="Nhập ghi chú cho case nhận hàng..."
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm sản phẩm</span>
                  </button>
                </div>
                
                <div className="p-3">
                  {products.length > 0 ? (
                    <div className="space-y-3">
                      {products.map((product, index) => (
                        <div key={product.id} className="bg-gray-50 rounded border border-gray-200 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">Sản phẩm #{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeProduct(product.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {/* Desktop Table View */}
                          <div className="hidden md:grid md:grid-cols-4 md:gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Tên sản phẩm *
                        </label>
                        <input
                          type="text"
                          value={product.name}
                              onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="Mã SP"
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
                              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="SL"
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
                              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="S/N"
                        />
                            </div>
                          </div>

                          {/* Mobile Card View */}
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
                              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder="Serial Number"
                        />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Chưa có sản phẩm nào</p>
                      <p className="text-xs text-gray-400 mt-1">Nhấn &quot;Thêm sản phẩm&quot; để bắt đầu</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-300 px-5 py-3 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-sm flex items-center gap-2"
                style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Cập nhật Case</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}