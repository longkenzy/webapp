'use client';

import { 
  FileText, 
  Package, 
  Truck, 
  Wrench,
  Download,
  ArrowRight
} from 'lucide-react';

interface PrintOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  bgColor: string;
}

const printOptions: PrintOption[] = [
  {
    id: 'maintenance',
    title: 'In biên bản bảo trì',
    description: 'Tạo biên bản bảo trì thiết bị với thông tin chi tiết',
    icon: Wrench,
    href: '/user/print/maintenance',
    color: 'blue',
    bgColor: 'blue'
  },
  {
    id: 'receiving',
    title: 'In biên bản nhận thiết bị',
    description: 'Tạo biên bản nhận thiết bị từ đối tác',
    icon: Package,
    href: '/user/print/receiving',
    color: 'green',
    bgColor: 'green'
  },
  {
    id: 'delivery',
    title: 'In biên bản giao thiết bị',
    description: 'Tạo biên bản giao thiết bị cho khách hàng',
    icon: Truck,
    href: '/user/print/delivery',
    color: 'orange',
    bgColor: 'orange'
  }
];

export default function PrintPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">In phiếu</h1>
              <p className="text-gray-600 text-sm">Tạo và in các loại biên bản theo yêu cầu</p>
            </div>
          </div>
        </div>

        {/* Print Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {printOptions.map((option) => {
            const Icon = option.icon;
            const colorClasses = {
              blue: {
                bg: 'bg-blue-100',
                icon: 'text-blue-600',
                hover: 'group-hover:bg-blue-100',
                border: 'hover:border-blue-300',
                text: 'group-hover:text-blue-700',
                action: 'text-blue-600 group-hover:text-blue-700'
              },
              green: {
                bg: 'bg-green-100',
                icon: 'text-green-600',
                hover: 'group-hover:bg-green-100',
                border: 'hover:border-green-300',
                text: 'group-hover:text-green-700',
                action: 'text-green-600 group-hover:text-green-700'
              },
              orange: {
                bg: 'bg-orange-100',
                icon: 'text-orange-600',
                hover: 'group-hover:bg-orange-100',
                border: 'hover:border-orange-300',
                text: 'group-hover:text-orange-700',
                action: 'text-orange-600 group-hover:text-orange-700'
              }
            };
            
            const colors = colorClasses[option.color as keyof typeof colorClasses];
            
            return (
              <div
                key={option.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${colors.border} group cursor-pointer`}
                onClick={() => window.location.href = option.href}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 bg-gray-100 rounded-lg ${colors.hover} transition-colors duration-200`}>
                      <Icon className={`h-5 w-5 text-gray-600 ${colors.icon} transition-colors duration-200`} />
                    </div>
                    <Download className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                  </div>
                  
                  <h3 className={`text-lg font-semibold text-gray-900 mb-2 ${colors.text} transition-colors duration-200`}>
                    {option.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    {option.description}
                  </p>
                </div>
                
                <div className="px-4 pb-4">
                  <div className={`flex items-center ${colors.action} text-sm font-medium transition-colors duration-200`}>
                    <span>Tạo biên bản</span>
                    <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
