import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { InternalCaseStatus } from "@prisma/client";
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current month date range
    const now = dayjs().tz('Asia/Ho_Chi_Minh').toDate();
    const startOfMonth = dayjs().tz('Asia/Ho_Chi_Minh').startOf('month').toDate();
    const endOfMonth = dayjs().tz('Asia/Ho_Chi_Minh').endOf('month').toDate();

    // Use groupBy for better performance - fetch counts directly from DB
    const [monthlyStats, totalStats] = await Promise.all([
      db.internalCase.groupBy({
        by: ['status'],
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _count: {
          status: true
        }
      }),
      db.internalCase.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      })
    ]);

    // Process monthly status counts from groupBy result
    const monthlyStatusCounts = {
      [InternalCaseStatus.RECEIVED]: 0,
      [InternalCaseStatus.IN_PROGRESS]: 0,
      [InternalCaseStatus.COMPLETED]: 0,
      [InternalCaseStatus.CANCELLED]: 0
    };

    monthlyStats.forEach(stat => {
      monthlyStatusCounts[stat.status as keyof typeof monthlyStatusCounts] = stat._count.status;
    });

    // Process total status counts from groupBy result
    const totalStatusCounts = {
      [InternalCaseStatus.RECEIVED]: 0,
      [InternalCaseStatus.IN_PROGRESS]: 0,
      [InternalCaseStatus.COMPLETED]: 0,
      [InternalCaseStatus.CANCELLED]: 0
    };

    totalStats.forEach(stat => {
      totalStatusCounts[stat.status as keyof typeof totalStatusCounts] = stat._count.status;
    });

    // Calculate completion rates
    const monthlyTotalCases = Object.values(monthlyStatusCounts).reduce((sum, count) => sum + count, 0);
    const monthlyCompletedCases = monthlyStatusCounts[InternalCaseStatus.COMPLETED];
    const monthlyCompletionRate = monthlyTotalCases > 0 ? (monthlyCompletedCases / monthlyTotalCases) * 100 : 0;

    const totalCases = Object.values(totalStatusCounts).reduce((sum, count) => sum + count, 0);
    const totalCompletedCases = totalStatusCounts[InternalCaseStatus.COMPLETED];
    const totalCompletionRate = totalCases > 0 ? (totalCompletedCases / totalCases) * 100 : 0;

    // Prepare data for monthly pie chart
    const monthlyChartData = [
      {
        label: 'Hoàn thành',
        value: monthlyCompletedCases,
        color: '#10B981', // green-500
        percentage: monthlyTotalCases > 0 ? ((monthlyCompletedCases / monthlyTotalCases) * 100).toFixed(1) : '0'
      },
      {
        label: 'Đang xử lý',
        value: monthlyStatusCounts[InternalCaseStatus.IN_PROGRESS],
        color: '#F59E0B', // yellow-500
        percentage: monthlyTotalCases > 0 ? ((monthlyStatusCounts[InternalCaseStatus.IN_PROGRESS] / monthlyTotalCases) * 100).toFixed(1) : '0'
      },
      {
        label: 'Tiếp nhận',
        value: monthlyStatusCounts[InternalCaseStatus.RECEIVED],
        color: '#3B82F6', // blue-500
        percentage: monthlyTotalCases > 0 ? ((monthlyStatusCounts[InternalCaseStatus.RECEIVED] / monthlyTotalCases) * 100).toFixed(1) : '0'
      },
      {
        label: 'Hủy',
        value: monthlyStatusCounts[InternalCaseStatus.CANCELLED],
        color: '#EF4444', // red-500
        percentage: monthlyTotalCases > 0 ? ((monthlyStatusCounts[InternalCaseStatus.CANCELLED] / monthlyTotalCases) * 100).toFixed(1) : '0'
      }
    ].filter(item => item.value > 0); // Only show categories with data

    // Prepare data for total pie chart
    const totalChartData = [
      {
        label: 'Hoàn thành',
        value: totalCompletedCases,
        color: '#10B981', // green-500
        percentage: totalCases > 0 ? ((totalCompletedCases / totalCases) * 100).toFixed(1) : '0'
      },
      {
        label: 'Đang xử lý',
        value: totalStatusCounts[InternalCaseStatus.IN_PROGRESS],
        color: '#F59E0B', // yellow-500
        percentage: totalCases > 0 ? ((totalStatusCounts[InternalCaseStatus.IN_PROGRESS] / totalCases) * 100).toFixed(1) : '0'
      },
      {
        label: 'Tiếp nhận',
        value: totalStatusCounts[InternalCaseStatus.RECEIVED],
        color: '#3B82F6', // blue-500
        percentage: totalCases > 0 ? ((totalStatusCounts[InternalCaseStatus.RECEIVED] / totalCases) * 100).toFixed(1) : '0'
      },
      {
        label: 'Hủy',
        value: totalStatusCounts[InternalCaseStatus.CANCELLED],
        color: '#EF4444', // red-500
        percentage: totalCases > 0 ? ((totalStatusCounts[InternalCaseStatus.CANCELLED] / totalCases) * 100).toFixed(1) : '0'
      }
    ].filter(item => item.value > 0); // Only show categories with data

    return NextResponse.json({
      success: true,
      data: {
        monthly: {
          totalCases: monthlyTotalCases,
          completedCases: monthlyCompletedCases,
          completionRate: monthlyCompletionRate.toFixed(1),
          chartData: monthlyChartData,
          month: now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
        },
        total: {
          totalCases,
          completedCases: totalCompletedCases,
          completionRate: totalCompletionRate.toFixed(1),
          chartData: totalChartData
        }
      }
    });

  } catch (error) {
    console.error("Error fetching cases stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
