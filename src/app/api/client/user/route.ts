import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check client authentication
    const user = await getCurrentUser();
    if (!user || (user.role !== 'CLIENT' && user.role !== 'AGENCY_MEMBER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return user data
    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}