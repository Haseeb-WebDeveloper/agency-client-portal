import { NextRequest, NextResponse } from 'next/server';
import { getClientDashboardStats } from '@/lib/client-queries';
import { getCurrentUser } from '@/lib/auth';

// Helper function to convert BigInt values to strings
function convertBigIntToString(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToString(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = convertBigIntToString(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

export async function GET(request: NextRequest) {
  try {
    // Check client authentication
    const user = await getCurrentUser();
    if (!user || (user.role !== 'CLIENT' && user.role !== 'AGENCY_MEMBER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get dashboard data
    const dashboardData = await getClientDashboardStats(user.id);
    
    // Convert any BigInt values to strings to avoid serialization errors
    const serializedData = convertBigIntToString(dashboardData);

    return NextResponse.json(serializedData);
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    const errorMessage = error.message || 'Failed to fetch dashboard stats';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}