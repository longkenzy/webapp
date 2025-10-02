import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { atLeast } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { ArrowLeft, Save, User } from "lucide-react";
import Link from "next/link";
import EmployeeEditForm from "./EmployeeEditForm";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EmployeeEditPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!atLeast(session.user.role, Role.IT_STAFF)) redirect("/user/dashboard");

  const { id } = await params;

  // Fetch employee data
  const employee = await db.employee.findUnique({
    where: {
      id: id,
    },
  });

  if (!employee) {
    throw new Error('Không tìm thấy nhân sự');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link
                href="/admin/personnel/list"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-all duration-200 hover:bg-gray-50 px-4 py-2 rounded-xl"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Quay lại danh sách
              </Link>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa nhân sự</h1>
                <p className="text-gray-600 text-lg">Cập nhật thông tin chi tiết của nhân sự</p>
              </div>
            </div>
            
            <Link
              href={`/admin/personnel/view/${id}`}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-medium rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <User className="h-4 w-4 mr-2" />
              Xem thông tin
            </Link>
          </div>
        </div>

        {/* Edit Form */}
        <EmployeeEditForm employee={employee} />
      </div>
    </div>
  );
}
