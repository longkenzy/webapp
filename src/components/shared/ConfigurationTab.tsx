import React, { useState } from 'react';
import { FileText, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ConfigurationItem {
  id: string;
  name: string;
  description?: string;
}

interface ConfigurationTabProps {
  title: string;
  items: ConfigurationItem[];
  onAdd: (name: string) => Promise<void>;
  onEdit: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  iconColor?: 'blue' | 'orange' | 'green' | 'red' | 'purple';
  placeholder?: string;
}

const ConfigurationTab: React.FC<ConfigurationTabProps> = ({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
  iconColor = 'blue',
  placeholder = 'Nhập tên loại...'
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error('Vui lòng nhập tên loại');
      return;
    }

    try {
      await onAdd(newName.trim());
      setNewName('');
      setNewDescription('');
      setIsAdding(false);
      // Don't show toast here - let parent component handle it
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thêm');
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Vui lòng nhập tên loại');
      return;
    }

    try {
      await onEdit(id, editName.trim());
      setEditingId(null);
      setEditName('');
      setEditDescription('');
      // Don't show toast here - let parent component handle it
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa loại này?')) {
      try {
        await onDelete(id);
        // Don't show toast here - let parent component handle it
      } catch (error) {
        toast.error('Có lỗi xảy ra khi xóa');
      }
    }
  };

  const startEdit = (item: ConfigurationItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDescription(item.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewName('');
    setNewDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Configuration Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-md ${colorClasses[iconColor]}`}>
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm mới</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại case
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Add new row */}
              {isAdding && (
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={handleAdd}
                        className="text-green-600 hover:text-green-900 cursor-pointer"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelAdd}
                        className="text-gray-600 hover:text-gray-900 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Existing items */}
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={() => handleEdit(item.id)}
                            className="text-green-600 hover:text-green-900 cursor-pointer"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(item)}
                            className="text-blue-600 hover:text-blue-900 cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                    Chưa có loại nào được tạo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationTab;
