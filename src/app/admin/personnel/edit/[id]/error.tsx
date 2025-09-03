'use client';

import Link from "next/link";
import { User, ArrowLeft } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div className="text-center">
        <div className="mx-auto h-24 w-24 text-gray-400 mb-6">
          <User className="h-24 w-24" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy nhân sự</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Nhân sự bạn đang tìm kiếm để chỉnh sửa không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Thử lại
          </button>
          <Link
            href="/admin/personnel/list"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    </div>
  );
}
