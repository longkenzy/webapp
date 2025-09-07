"use client";

import { useState, useEffect } from "react";
import { Building2, Phone, MapPin, User, Edit, Trash2, Save, X, Search, Plus } from "lucide-react";

interface Partner {
  id: string;
  fullCompanyName: string;
  shortName: string;
  address: string;
  contactPerson: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EditingState {
  [key: string]: {
    isEditing: boolean;
    data: Partial<Partner>;
  };
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingState, setEditingState] = useState<EditingState>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPartnerData, setNewPartnerData] = useState<Partial<Partner>>({
    fullCompanyName: '',
    shortName: '',
    address: '',
    contactPerson: '',
    contactPhone: ''
  });

  // Fetch partners data
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch('/api/partners');
        if (response.ok) {
          const data = await response.json();
          setPartners(data);
          setFilteredPartners(data);
        }
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  // Filter partners based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPartners(partners);
    } else {
      const filtered = partners.filter(partner => 
        partner.fullCompanyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.shortName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPartners(filtered);
    }
  }, [searchTerm, partners]);

  // Start editing a partner
  const startEditing = (partner: Partner) => {
    setEditingState(prev => ({
      ...prev,
      [partner.id]: {
        isEditing: true,
        data: { ...partner }
      }
    }));
  };

  // Cancel editing
  const cancelEditing = (partnerId: string) => {
    setEditingState(prev => {
      const newState = { ...prev };
      delete newState[partnerId];
      return newState;
    });
  };

  // Update editing data
  const updateEditingData = (partnerId: string, field: keyof Partner, value: string) => {
    setEditingState(prev => ({
      ...prev,
      [partnerId]: {
        ...prev[partnerId],
        data: {
          ...prev[partnerId].data,
          [field]: value
        }
      }
    }));
  };

  // Save changes
  const saveChanges = async (partnerId: string) => {
    const editingData = editingState[partnerId];
    if (!editingData) return;

    setSaving(partnerId);
    try {
      const response = await fetch(`/api/partners/${partnerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingData.data),
      });

      if (response.ok) {
        const updatedPartner = await response.json();
        setPartners(prev => 
          prev.map(p => p.id === partnerId ? updatedPartner : p)
        );
        setFilteredPartners(prev => 
          prev.map(p => p.id === partnerId ? updatedPartner : p)
        );
        cancelEditing(partnerId);
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving partner:', error);
      alert('Có lỗi xảy ra khi lưu thay đổi');
    } finally {
      setSaving(null);
    }
  };

  // Delete partner
  const deletePartner = async (partnerId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/partners/${partnerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPartners(prev => prev.filter(p => p.id !== partnerId));
        setFilteredPartners(prev => prev.filter(p => p.id !== partnerId));
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
      alert('Có lỗi xảy ra khi xóa nhà cung cấp');
    }
  };

  // Start adding new partner
  const startAddingNew = () => {
    setIsAddingNew(true);
    setNewPartnerData({
      fullCompanyName: '',
      shortName: '',
      address: '',
      contactPerson: '',
      contactPhone: ''
    });
  };

  // Cancel adding new partner
  const cancelAddingNew = () => {
    setIsAddingNew(false);
    setNewPartnerData({
      fullCompanyName: '',
      shortName: '',
      address: '',
      contactPerson: '',
      contactPhone: ''
    });
  };

  // Update new partner data
  const updateNewPartnerData = (field: keyof Partner, value: string) => {
    setNewPartnerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save new partner
  const saveNewPartner = async () => {
    if (!newPartnerData.fullCompanyName || !newPartnerData.shortName || !newPartnerData.address) {
      alert('Vui lòng điền đầy đủ tên công ty, tên viết tắt và địa chỉ');
      return;
    }

    setSaving('new');
    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPartnerData),
      });

      if (response.ok) {
        const newPartner = await response.json();
        setPartners(prev => [...prev, newPartner]);
        setFilteredPartners(prev => [...prev, newPartner]);
        cancelAddingNew();
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating partner:', error);
      alert('Có lỗi xảy ra khi tạo nhà cung cấp mới');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-1">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Nhà cung cấp</h1>
          </div>
          <p className="text-sm text-gray-600">Quản lý thông tin các nhà cung cấp và đối tác</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên công ty hoặc tên viết tắt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Building2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600">
                  {searchTerm ? 'Kết quả tìm kiếm' : 'Tổng số nhà cung cấp'}
                </p>
                <p className="text-lg font-bold text-gray-900">{filteredPartners.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600">Có người liên hệ</p>
                <p className="text-lg font-bold text-gray-900">
                  {filteredPartners.filter(p => p.contactPerson).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Phone className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-600">Có số điện thoại</p>
                <p className="text-lg font-bold text-gray-900">
                  {filteredPartners.filter(p => p.contactPhone).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Danh sách nhà cung cấp</h3>
            <button
              onClick={startAddingNew}
              disabled={isAddingNew}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-3 w-3 mr-1" />
              Thêm nhà cung cấp
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    STT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Tên công ty đầy đủ
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Tên viết tắt
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Địa chỉ
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Người liên hệ
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    SĐT
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* New Partner Row */}
                {isAddingNew && (
                  <tr className="bg-blue-50 border-2 border-blue-200">
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs font-medium text-blue-600">Mới</span>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={newPartnerData.fullCompanyName || ''}
                        onChange={(e) => updateNewPartnerData('fullCompanyName', e.target.value)}
                        placeholder="Tên công ty đầy đủ *"
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={newPartnerData.shortName || ''}
                        onChange={(e) => updateNewPartnerData('shortName', e.target.value)}
                        placeholder="Tên viết tắt *"
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        value={newPartnerData.address || ''}
                        onChange={(e) => updateNewPartnerData('address', e.target.value)}
                        placeholder="Địa chỉ *"
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        rows={2}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={newPartnerData.contactPerson || ''}
                        onChange={(e) => updateNewPartnerData('contactPerson', e.target.value)}
                        placeholder="Người liên hệ"
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="text"
                        value={newPartnerData.contactPhone || ''}
                        onChange={(e) => updateNewPartnerData('contactPhone', e.target.value)}
                        placeholder="Số điện thoại"
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={saveNewPartner}
                          disabled={saving === 'new'}
                          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                          title="Lưu"
                        >
                          {saving === 'new' ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={cancelAddingNew}
                          disabled={saving === 'new'}
                          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
                          title="Hủy"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                
                {filteredPartners.map((partner, index) => {
                  const isEditing = editingState[partner.id]?.isEditing;
                  const editingData = editingState[partner.id]?.data || partner;
                  
                  return (
                    <tr key={partner.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-center">
                        <span className="text-xs font-medium text-gray-500">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingData.fullCompanyName || ''}
                            onChange={(e) => updateEditingData(partner.id, 'fullCompanyName', e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="text-xs font-medium text-gray-900 leading-tight break-words">
                            {partner.fullCompanyName}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingData.shortName || ''}
                            onChange={(e) => updateEditingData(partner.id, 'shortName', e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {partner.shortName}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <textarea
                            value={editingData.address || ''}
                            onChange={(e) => updateEditingData(partner.id, 'address', e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                            rows={2}
                          />
                        ) : (
                          <div className="flex items-start text-xs text-gray-900">
                            <MapPin className="h-3 w-3 text-gray-400 mr-1.5 flex-shrink-0 mt-0.5" />
                            <span className="leading-tight break-words" title={partner.address}>
                              {partner.address}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingData.contactPerson || ''}
                            onChange={(e) => updateEditingData(partner.id, 'contactPerson', e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Người liên hệ"
                          />
                        ) : (
                          partner.contactPerson ? (
                            <div className="flex items-center text-xs text-gray-900">
                              <User className="h-3 w-3 text-gray-400 mr-1.5" />
                              <span className="truncate max-w-20" title={partner.contactPerson}>
                                {partner.contactPerson}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingData.contactPhone || ''}
                            onChange={(e) => updateEditingData(partner.id, 'contactPhone', e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Số điện thoại"
                          />
                        ) : (
                          partner.contactPhone ? (
                            <div className="flex items-center text-xs text-gray-900">
                              <Phone className="h-3 w-3 text-gray-400 mr-1.5" />
                              <span className="truncate max-w-24" title={partner.contactPhone}>
                                {partner.contactPhone}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveChanges(partner.id)}
                                disabled={saving === partner.id}
                                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                title="Lưu"
                              >
                                {saving === partner.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                                ) : (
                                  <Save className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                onClick={() => cancelEditing(partner.id)}
                                disabled={saving === partner.id}
                                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
                                title="Hủy"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(partner)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                title="Sửa"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => deletePartner(partner.id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredPartners.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có nhà cung cấp'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? `Không có nhà cung cấp nào phù hợp với "${searchTerm}"` : 'Bắt đầu thêm nhà cung cấp đầu tiên.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


