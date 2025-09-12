import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: User not found' }, { status: 401 });
    }
    if (user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: User is not an admin' }, { status: 403 });
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
  } catch (error: any) {
    console.error('Error fetching user data:', error);
    const errorMessage = error.message || 'Failed to fetch user data';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}