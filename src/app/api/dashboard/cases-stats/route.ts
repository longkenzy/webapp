import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Fetch cases for current month
    const monthlyCases = await db.internalCase.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      select: {
        status: true,
        createdAt: true
      }
    });

    // Fetch all cases for total stats
    const allCases = await db.internalCase.findMany({
      select: {
        status: true,
        createdAt: true
      }
    });

    // Count monthly cases by status
    const monthlyStatusCounts = {
      RECEIVED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };

    monthlyCases.forEach(case_ => {
      if (case_.status in monthlyStatusCounts) {
        monthlyStatusCounts[case_.status as keyof typeof monthlyStatusCounts]++;
      }
    });

    // Count all cases by status
    const totalStatusCounts = {
      RECEIVED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };

    allCases.forEach(case_ => {
      if (case_.status in totalStatusCounts) {
        totalStatusCounts[case_.status as keyof typeof totalStatusCounts]++;
      }
    });

    // Calculate completion rates
    const monthlyTotalCases = monthlyCases.length;
    const monthlyCompletedCases = monthlyStatusCounts.COMPLETED;
    const monthlyCompletionRate = monthlyTotalCases > 0 ? (monthlyCompletedCases / monthlyTotalCases) * 100 : 0;

    const totalCases = allCases.length;
    const totalCompletedCases = totalStatusCounts.COMPLETED;
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
        value: monthlyStatusCounts.IN_PROGRESS,
        color: '#F59E0B', // yellow-500
        percentage: monthlyTotalCases > 0 ? ((monthlyStatusCounts.IN_PROGRESS / monthlyTotalCases) * 100).toFixed(1) : '0'
      },
      {
        label: 'Tiếp nhận',
        value: monthlyStatusCounts.RECEIVED,
        color: '#3B82F6', // blue-500
        percentage: monthlyTotalCases > 0 ? ((monthlyStatusCounts.RECEIVED / monthlyTotalCases) * 100).toFixed(1) : '0'
      },
      {
        label: 'Hủy',
        value: monthlyStatusCounts.CANCELLED,
        color: '#EF4444', // red-500
        percentage: monthlyTotalCases > 0 ? ((monthlyStatusCounts.CANCELLED / monthlyTotalCases) * 100).toFixed(1) : '0'
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
        value: totalStatusCounts.IN_PROGRESS,
        color: '#F59E0B', // yellow-500
        percentage: totalCases > 0 ? ((totalStatusCounts.IN_PROGRESS / totalCases) * 100).toFixed(1) : '0'
      },
      {
        label: 'Tiếp nhận',
        value: totalStatusCounts.RECEIVED,
        color: '#3B82F6', // blue-500
        percentage: totalCases > 0 ? ((totalStatusCounts.RECEIVED / totalCases) * 100).toFixed(1) : '0'
      },
      {
        label: 'Hủy',
        value: totalStatusCounts.CANCELLED,
        color: '#EF4444', // red-500
        percentage: totalCases > 0 ? ((totalStatusCounts.CANCELLED / totalCases) * 100).toFixed(1) : '0'
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
