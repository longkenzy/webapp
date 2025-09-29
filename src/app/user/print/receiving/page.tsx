'use client';

import { useState, useEffect } from 'react';
import { 
  Package,
  Calendar,
  Building2,
  User,
  Phone,
  MapPin,
  FileText,
  Search,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Partner {
  id: string;
  fullCompanyName: string;
  shortName: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
}

interface CurrentUser {
  id: string;
  name: string;
  phone: string;
  department: string;
  employee?: {
    fullName: string;
    position: string;
    primaryPhone: string;
  };
}

export default function ReceivingPrintPage() {
  const { data: session } = useSession();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [selectedPartnerData, setSelectedPartnerData] = useState<Partner | null>(null);
  const [receivingPerson, setReceivingPerson] = useState<string>('');
  const [partnerAddress, setPartnerAddress] = useState<string>('');
  const [receivingDate, setReceivingDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Load data on component mount
  useEffect(() => {
    loadPartners();
    loadCurrentUser();
    // Set current date as default
    const today = new Date().toISOString().split('T')[0];
    setReceivingDate(today);
  }, [session]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showDropdown && !target.closest('.partner-search-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const loadPartners = async () => {
    try {
      const response = await fetch('/api/user/partners');
      if (response.ok) {
        const data = await response.json();
        setPartners(data);
      } else {
        console.error('Failed to load partners');
      }
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  const loadCurrentUser = async () => {
    if (session?.user?.id) {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser({
            id: session.user.id,
            name: data.name || '',
            phone: data.phone || '',
            department: data.department || '',
            employee: data.employee ? {
              fullName: data.employee.fullName || data.name || '',
              position: data.employee.position || data.department || '',
              primaryPhone: data.employee.primaryPhone || data.phone || ''
            } : undefined
          });
        } else {
          console.error('Failed to load current user');
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    }
  };

  // Handle partner selection
  const handlePartnerChange = (partnerId: string) => {
    setSelectedPartner(partnerId);
    const partner = partners.find(p => p.id === partnerId);
    setSelectedPartnerData(partner || null);
    setSearchQuery(partner?.fullCompanyName || '');
    setShowDropdown(false);
    // Auto-fill receiving person and address
    if (partner?.contactPerson) {
      setReceivingPerson(partner.contactPerson);
    }
    if (partner?.address) {
      setPartnerAddress(partner.address);
    }
  };

  // Filter partners based on search query
  const filteredPartners = partners.filter(partner =>
    partner.fullCompanyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.shortName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowDropdown(true);
    if (!value) {
      setSelectedPartner('');
      setSelectedPartnerData(null);
      setReceivingPerson('');
      setPartnerAddress('');
    }
  };

  const handleGenerateDocument = async () => {
    if (!selectedPartner || !currentUser || !receivingDate || !partnerAddress) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        // Partner info (bên giao thiết bị)
        partnerName: selectedPartnerData?.fullCompanyName || '',
        partnerAddress: partnerAddress,
        receivingPerson: receivingPerson || selectedPartnerData?.contactPerson || '',
        
        // Employee info (bên nhận thiết bị)
        receivingCompanyName: 'CÔNG TY TNHH CÔNG NGHỆ - DỊCH VỤ SMART SERVICES',
        receivingCompanyAddress: 'Tòa nhà MIOS, 121 Hoàng Hoa Thám, Phường Gia Định, TP. Hồ Chí Minh',
        receivingPersonName: currentUser.employee?.fullName || currentUser.name || '',
        receivingPersonPosition: currentUser.employee?.position || currentUser.department || '',
        receivingPersonPhone: currentUser.employee?.primaryPhone || currentUser.phone || '',
        
        // Receiving details
        formattedDate: new Date(receivingDate).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      };

      const response = await fetch('/api/print/receiving', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Direct download
        const a = document.createElement('a');
        a.href = url;
        a.download = `bien-ban-nhan-thiet-bi-${new Date().toISOString().split('T')[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Có lỗi xảy ra khi tạo tài liệu');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Có lỗi xảy ra khi tạo tài liệu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/user/print"
            className="inline-flex items-center text-gray-600 hover:text-green-600 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại In phiếu
          </Link>
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tạo biên bản nhận thiết bị</h1>
              <p className="text-gray-600 text-sm">Điền thông tin để tạo biên bản Word tự động</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-green-600" />
              Thông tin biên bản nhận thiết bị
            </h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Chọn công ty giao thiết bị */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <div className="p-0.5 bg-blue-100 rounded mr-1.5">
                    <Building2 className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  Chọn công ty giao thiết bị *
                </label>
                <div className="relative partner-search-container">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full px-3 py-2 pl-9 pr-8 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                      placeholder="Tìm kiếm công ty..."
                      required
                    />
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <ChevronDown className={`absolute right-2.5 top-2.5 h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {/* Dropdown */}
                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredPartners.length > 0 ? (
                        filteredPartners.map((partner) => (
                          <div
                            key={partner.id}
                            onClick={() => handlePartnerChange(partner.id)}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-gray-900">{partner.fullCompanyName}</div>
                              {partner.shortName && (
                                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  {partner.shortName}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{partner.address}</div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          Không tìm thấy công ty nào
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Địa chỉ (có thể chỉnh sửa) */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <div className="p-0.5 bg-green-100 rounded mr-1.5">
                    <MapPin className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  Địa chỉ *
                </label>
                <input
                  type="text"
                  value={partnerAddress}
                  onChange={(e) => setPartnerAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white text-sm"
                  placeholder="Nhập địa chỉ công ty..."
                  required
                />
              </div>

              {/* Ngày nhận thiết bị */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <div className="p-0.5 bg-purple-100 rounded mr-1.5">
                    <Calendar className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  Ngày nhận thiết bị *
                </label>
                <input
                  type="date"
                  value={receivingDate}
                  onChange={(e) => setReceivingDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-sm"
                  required
                />
              </div>

              {/* Người giao thiết bị */}
              <div className="space-y-1">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <div className="p-0.5 bg-orange-100 rounded mr-1.5">
                    <User className="h-3.5 w-3.5 text-orange-600" />
                  </div>
                  Người giao thiết bị
                </label>
                <input
                  type="text"
                  value={receivingPerson}
                  onChange={(e) => setReceivingPerson(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white text-sm"
                  placeholder="Nhập tên người giao thiết bị..."
                />
              </div>
            </div>

            {/* Thông tin nhân viên nhận thiết bị */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-4 w-4 mr-2 text-green-600" />
                Thông tin nhân viên nhận thiết bị
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Nhân viên nhận thiết bị */}
                <div className="space-y-1">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <div className="p-0.5 bg-blue-100 rounded mr-1.5">
                      <User className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    Nhân viên nhận thiết bị
                  </label>
                  <input
                    type="text"
                    value={currentUser?.employee?.fullName || currentUser?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
                    readOnly
                  />
                </div>

                {/* Chức vụ phòng ban */}
                <div className="space-y-1">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <div className="p-0.5 bg-green-100 rounded mr-1.5">
                      <Building2 className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    Chức vụ/Phòng ban
                  </label>
                  <input
                    type="text"
                    value={currentUser?.employee?.position || currentUser?.department || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
                    readOnly
                  />
                </div>

                {/* Số điện thoại */}
                <div className="space-y-1">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <div className="p-0.5 bg-purple-100 rounded mr-1.5">
                      <Phone className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={currentUser?.employee?.primaryPhone || currentUser?.phone || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleGenerateDocument}
                disabled={isLoading}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-md hover:from-green-700 hover:to-emerald-700 focus:ring-1 focus:ring-green-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md text-sm"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2"></div>
                    <span>Đang tạo biên bản...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    <span>Tạo biên bản Word</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
