'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, Plus, Trash2, Package } from 'lucide-react';

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
  supplier: Partner | null;
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
    notes: '',
    difficultyLevel: '',
    estimatedTime: '',
    impactLevel: '',
    urgencyLevel: '',
    formScore: '',
    assessmentNotes: ''
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
        notes: caseData.notes || '',
        difficultyLevel: caseData.userDifficultyLevel?.toString() || '',
        estimatedTime: caseData.userEstimatedTime?.toString() || '',
        impactLevel: caseData.userImpactLevel?.toString() || '',
        urgencyLevel: caseData.userUrgencyLevel?.toString() || '',
        formScore: caseData.userFormScore?.toString() || '',
        assessmentNotes: caseData.adminAssessmentNotes || ''
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
        notes: formData.notes || null,
        userDifficultyLevel: formData.difficultyLevel ? parseInt(formData.difficultyLevel) : null,
        userEstimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
        userImpactLevel: formData.impactLevel ? parseInt(formData.impactLevel) : null,
        userUrgencyLevel: formData.urgencyLevel ? parseInt(formData.urgencyLevel) : null,
        userFormScore: formData.formScore ? parseInt(formData.formScore) : null,
        userAssessmentDate: new Date().toISOString(),
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
        onSuccess(updatedCase);
        onClose();
      } else {
        const errorData = await response.json();
        console.error('Error updating delivery case:', errorData);
        setError(errorData.error || 'Có lỗi xảy ra khi cập nhật case giao hàng');
      }
    } catch (error) {
      console.error('Error updating delivery case:', error);
      setError('Có lỗi xảy ra khi cập nhật case giao hàng');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !caseData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa Case Giao Hàng</h2>
              <p className="text-sm text-gray-500">Cập nhật thông tin case giao hàng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
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

          {/* Case Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Thông tin Case</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Tiêu đề:</span>
                <span className="ml-2 text-gray-900">{caseData.title}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Người tạo:</span>
                <span className="ml-2 text-gray-900">{caseData.requester.fullName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Người giao hàng:</span>
                <span className="ml-2 text-gray-900">{caseData.handler.fullName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Khách hàng:</span>
                <span className="ml-2 text-gray-900">{caseData.supplier?.shortName || 'Không xác định'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Ngày tạo:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(caseData.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Thời gian bắt đầu:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(caseData.startDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Chi tiết sản phẩm giao hàng
              </label>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm sản phẩm</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {products.map((product, index) => (
                <div key={product.id} className="grid grid-cols-12 gap-3 items-end p-4 bg-gray-50 rounded-lg">
                  <div className="col-span-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tên sản phẩm</label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                      placeholder="Nhập tên sản phẩm"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mã sản phẩm</label>
                    <input
                      type="text"
                      value={product.code}
                      onChange={(e) => handleProductChange(index, 'code', e.target.value)}
                      placeholder="Mã SP"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Số lượng</label>
                    <input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">S/N</label>
                    <input
                      type="text"
                      value={product.serialNumber}
                      onChange={(e) => handleProductChange(index, 'serialNumber', e.target.value)}
                      placeholder="Số serial"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status and End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="RECEIVED">Tiếp nhận</option>
                <option value="IN_PROGRESS">Đang xử lý</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Hủy</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Thời gian hoàn thành
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Nhập ghi chú về case giao hàng..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* User Self-Assessment */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Đánh giá cá nhân</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Mức độ khó khăn</label>
                <select
                  name="difficultyLevel"
                  value={formData.difficultyLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Chọn mức độ</option>
                  <option value="1">Rất dễ</option>
                  <option value="2">Dễ</option>
                  <option value="3">Trung bình</option>
                  <option value="4">Khó</option>
                  <option value="5">Rất khó</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Thời gian ước tính (phút)</label>
                <input
                  type="number"
                  name="estimatedTime"
                  value={formData.estimatedTime}
                  onChange={handleInputChange}
                  placeholder="Nhập thời gian ước tính"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Mức độ tác động</label>
                <select
                  name="impactLevel"
                  value={formData.impactLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Chọn mức độ</option>
                  <option value="1">Rất thấp</option>
                  <option value="2">Thấp</option>
                  <option value="3">Trung bình</option>
                  <option value="4">Cao</option>
                  <option value="5">Rất cao</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Mức độ khẩn cấp</label>
                <select
                  name="urgencyLevel"
                  value={formData.urgencyLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Chọn mức độ</option>
                  <option value="1">Rất thấp</option>
                  <option value="2">Thấp</option>
                  <option value="3">Trung bình</option>
                  <option value="4">Cao</option>
                  <option value="5">Rất cao</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Calendar className="h-4 w-4 animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Cập nhật Case Giao Hàng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
