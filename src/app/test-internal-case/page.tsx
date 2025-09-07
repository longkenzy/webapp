'use client';

import { useState } from 'react';
import CreateInternalCaseModal from '../user/work/internal/CreateInternalCaseModal';

export default function TestInternalCasePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Test Internal Case Modal</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-4">
            Trang này để test modal tạo case nội bộ. Click nút bên dưới để mở modal.
          </p>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Mở Modal Tạo Case
          </button>
        </div>

        <CreateInternalCaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}
