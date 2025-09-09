import { NextRequest, NextResponse } from 'next/server';
import { getAdminDashboardStats } from '@/lib/admin-queries';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();

    // Get dashboard data
    const dashboardData = await getAdminDashboardStats();

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
