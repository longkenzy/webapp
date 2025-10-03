"use client";

import { useState, useEffect } from "react";
import { Building2, Phone, MapPin, User, Edit, Trash2, Save, X, Search, Plus, ChevronDown } from "lucide-react";
import toast from 'react-hot-toast';

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
        toast.error(`Lỗi: ${error.error}`, {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error saving partner:', error);
      toast.error('Có lỗi xảy ra khi lưu thay đổi', {
        duration: 4000,
        position: 'top-right',
      });
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
        toast.error(`Lỗi: ${error.error}`, {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast.error('Có lỗi xảy ra khi xóa nhà cung cấp', {
        duration: 4000,
        position: 'top-right',
      });
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
      toast.error('Vui lòng điền đầy đủ tên công ty, tên viết tắt và địa chỉ', {
        duration: 3000,
        position: 'top-right',
      });
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
        toast.error(`Lỗi: ${error.error}`, {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Error creating partner:', error);
      toast.error('Có lỗi xảy ra khi tạo nhà cung cấp mới', {
        duration: 4000,
        position: 'top-right',
      });
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
    <div className="min-h-screen bg-gray-50 p-3 md:p-4">
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
      ` }} />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-3 md:mb-4">
          <div className="flex items-center space-x-2 mb-1">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Building2 className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">Nhà cung cấp</h1>
          </div>
          <p className="text-xs md:text-sm text-gray-600">Quản lý thông tin các nhà cung cấp và đối tác</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-3 md:p-4 mb-3 md:mb-4">
          <div className="relative flex items-center">
            <div className="absolute left-2.5 md:left-3 flex items-center justify-center pointer-events-none">
              <Search className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên công ty hoặc tên viết tắt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 md:pl-10 pr-3 py-1.5 md:py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm"
              style={{ WebkitAppearance: 'none', lineHeight: 'normal' }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-2 md:p-3">
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-0">
              <div className="p-1 md:p-1.5 bg-green-100 rounded-md w-fit">
                <Building2 className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
              </div>
              <div className="md:ml-2">
                <p className="text-[9px] md:text-xs font-medium text-gray-600 leading-tight">
                  {searchTerm ? 'Kết quả' : 'Tổng'}
                </p>
                <p className="text-sm md:text-lg font-bold text-gray-900">{filteredPartners.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-2 md:p-3">
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-0">
              <div className="p-1 md:p-1.5 bg-blue-100 rounded-md w-fit">
                <User className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
              </div>
              <div className="md:ml-2">
                <p className="text-[9px] md:text-xs font-medium text-gray-600 leading-tight">Liên hệ</p>
                <p className="text-sm md:text-lg font-bold text-gray-900">
                  {filteredPartners.filter(p => p.contactPerson).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-2 md:p-3">
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-0">
              <div className="p-1 md:p-1.5 bg-purple-100 rounded-md w-fit">
                <Phone className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
              </div>
              <div className="md:ml-2">
                <p className="text-[9px] md:text-xs font-medium text-gray-600 leading-tight">Có SĐT</p>
                <p className="text-sm md:text-lg font-bold text-gray-900">
                  {filteredPartners.filter(p => p.contactPhone).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Partners List */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-3 md:px-4 py-2.5 md:py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm md:text-base font-semibold text-gray-900">Danh sách nhà cung cấp</h3>
            <button
              onClick={startAddingNew}
              disabled={isAddingNew}
              className="inline-flex items-center px-2.5 md:px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-3 w-3 md:mr-1" />
              <span className="hidden md:inline">Thêm nhà cung cấp</span>
            </button>
          </div>
          
          {/* Mobile: Card View */}
          <div className="md:hidden">
            {/* Add New Partner Card (Mobile) */}
            {isAddingNew && (
              <div className="p-2.5 bg-blue-50 border-b-2 border-blue-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-blue-700">Thêm mới</span>
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-medium text-gray-700 mb-0.5">
                      Tên công ty <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPartnerData.fullCompanyName || ''}
                      onChange={(e) => updateNewPartnerData('fullCompanyName', e.target.value)}
                      placeholder="Tên công ty đầy đủ"
                      className="w-full text-[11px] border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      style={{ WebkitAppearance: 'none' }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-medium text-gray-700 mb-0.5">
                        Viết tắt <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newPartnerData.shortName || ''}
                        onChange={(e) => updateNewPartnerData('shortName', e.target.value)}
                        placeholder="Viết tắt"
                        className="w-full text-[11px] border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        style={{ WebkitAppearance: 'none' }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[9px] font-medium text-gray-700 mb-0.5">
                        SĐT
                      </label>
                      <input
                        type="text"
                        value={newPartnerData.contactPhone || ''}
                        onChange={(e) => updateNewPartnerData('contactPhone', e.target.value)}
                        placeholder="SĐT"
                        className="w-full text-[11px] border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        style={{ WebkitAppearance: 'none' }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-medium text-gray-700 mb-0.5">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newPartnerData.address || ''}
                      onChange={(e) => updateNewPartnerData('address', e.target.value)}
                      placeholder="Địa chỉ"
                      className="w-full text-[11px] border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white resize-none"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-medium text-gray-700 mb-0.5">
                      Người liên hệ
                    </label>
                    <input
                      type="text"
                      value={newPartnerData.contactPerson || ''}
                      onChange={(e) => updateNewPartnerData('contactPerson', e.target.value)}
                      placeholder="Người liên hệ"
                      className="w-full text-[11px] border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      style={{ WebkitAppearance: 'none' }}
                    />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={saveNewPartner}
                      disabled={saving === 'new'}
                      className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-green-600 text-white text-[10px] font-medium rounded hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 transition-colors"
                    >
                      {saving === 'new' ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <>
                          <Save className="h-3 w-3 mr-1" />
                          Lưu
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelAddingNew}
                      disabled={saving === 'new'}
                      className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-gray-600 text-white text-[10px] font-medium rounded hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Partner Cards */}
            <div className="divide-y divide-gray-100">
              {filteredPartners.map((partner, index) => {
                const isEditing = editingState[partner.id]?.isEditing;
                const editingData = editingState[partner.id]?.data || partner;
                
                return (
                  <div key={partner.id} className="p-2.5 hover:bg-gray-50 transition-colors">
                    {isEditing ? (
                      // Edit Mode
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold text-blue-700">Chỉnh sửa</span>
                          <span className="text-[9px] font-medium text-gray-500">#{index + 1}</span>
                        </div>
                        
                        <div>
                          <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Tên công ty</label>
                          <input
                            type="text"
                            value={editingData.fullCompanyName || ''}
                            onChange={(e) => updateEditingData(partner.id, 'fullCompanyName', e.target.value)}
                            className="w-full text-[11px] border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            style={{ WebkitAppearance: 'none' }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Viết tắt</label>
                            <input
                              type="text"
                              value={editingData.shortName || ''}
                              onChange={(e) => updateEditingData(partner.id, 'shortName', e.target.value)}
                              className="w-full text-[11px] border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              style={{ WebkitAppearance: 'none' }}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-[9px] font-medium text-gray-700 mb-0.5">SĐT</label>
                            <input
                              type="text"
                              value={editingData.contactPhone || ''}
                              onChange={(e) => updateEditingData(partner.id, 'contactPhone', e.target.value)}
                              placeholder="SĐT"
                              className="w-full text-[11px] border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              style={{ WebkitAppearance: 'none' }}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Địa chỉ</label>
                          <textarea
                            value={editingData.address || ''}
                            onChange={(e) => updateEditingData(partner.id, 'address', e.target.value)}
                            className="w-full text-[11px] border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white resize-none"
                            rows={2}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Người liên hệ</label>
                          <input
                            type="text"
                            value={editingData.contactPerson || ''}
                            onChange={(e) => updateEditingData(partner.id, 'contactPerson', e.target.value)}
                            placeholder="Người liên hệ"
                            className="w-full text-[11px] border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            style={{ WebkitAppearance: 'none' }}
                          />
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-1.5 pt-1">
                          <button
                            onClick={() => saveChanges(partner.id)}
                            disabled={saving === partner.id}
                            className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-green-600 text-white text-[10px] font-medium rounded hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 transition-colors"
                          >
                            {saving === partner.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <>
                                <Save className="h-3 w-3 mr-1" />
                                Lưu
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => cancelEditing(partner.id)}
                            disabled={saving === partner.id}
                            className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-gray-600 text-white text-[10px] font-medium rounded hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="space-y-1.5">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h4 className="text-xs font-semibold text-gray-900 line-clamp-1 leading-tight">
                                {partner.fullCompanyName}
                              </h4>
                            </div>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-100 text-blue-800">
                              {partner.shortName}
                            </span>
                          </div>
                          <span className="text-[9px] font-medium text-gray-500">#{index + 1}</span>
                        </div>
                        
                        {/* Address */}
                        <div className="flex items-start gap-1.5">
                          <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                          <p className="text-[10px] text-gray-600 leading-snug line-clamp-2">{partner.address}</p>
                        </div>
                        
                        {/* Contact Info */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-[10px] text-gray-600 truncate">
                              {partner.contactPerson || '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-[10px] text-gray-600 truncate">
                              {partner.contactPhone || '-'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-1.5 pt-1.5">
                          <button
                            onClick={() => startEditing(partner)}
                            className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-blue-600 text-white text-[10px] font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Sửa
                          </button>
                          <button
                            onClick={() => deletePartner(partner.id)}
                            className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-red-600 text-white text-[10px] font-medium rounded hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Xóa
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block overflow-x-auto">
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
          
          {/* Empty State */}
          {filteredPartners.length === 0 && (
            <div className="text-center py-8 md:py-12 px-4">
              <Building2 className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400" />
              <h3 className="mt-2 text-xs md:text-sm font-medium text-gray-900">
                {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có nhà cung cấp'}
              </h3>
              <p className="mt-1 text-xs md:text-sm text-gray-500">
                {searchTerm ? `Không có nhà cung cấp nào phù hợp với "${searchTerm}"` : 'Bắt đầu thêm nhà cung cấp đầu tiên.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


