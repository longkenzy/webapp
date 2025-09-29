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
        endDate: caseData.endDate ? new Date(caseData.endDate).toISOString().slice(0, 16) : '',
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
    setFormData(prev => ({
      ...prev,
      [name]: value
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

      // Prepare update data
      const updateData = {
        status: formData.status,
        endDate: formData.endDate || null,
        crmReferenceCode: formData.crmReferenceCode || null,
        description: JSON.stringify(productData),
        products: productData
      };

      console.log('Updating delivery case:', updateData);

      const response = await fetch(`/api/delivery-cases/${caseData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedCase = await response.json();
        console.log('Delivery case updated successfully:', updatedCase);
        
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
        console.error('Error updating delivery case:', errorData);
        
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
      console.error('Error updating delivery case:', error);
      
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa Case Giao Hàng</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  {new Date(caseData.startDate).toLocaleString('vi-VN')}
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
                        onClick={() => removeProduct(index)}
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
                          onChange={(e) => handleProductChange(index, 'name', e.target.value)}
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
                          onChange={(e) => handleProductChange(index, 'code', e.target.value)}
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
                          onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
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
                          onChange={(e) => handleProductChange(index, 'serialNumber', e.target.value)}
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
              onClick={onClose}
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
