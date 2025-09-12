import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOptimizedClientOffers } from '@/lib/optimized-client-queries';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // Handle case where user is not authenticated
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // const membership = await prisma.clientMembership.findFirst({
    //   where: { userId: user.id, isActive: true, deletedAt: null },
    //   select: { clientId: true },
    // });


    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '15'), 1), 100);
    const search = (searchParams.get('search') || '').trim();
    const status = (searchParams.get('status') || '').trim();

    const result = await getOptimizedClientOffers({
      userId: user.id,
      page,
      limit,
      search,
      status,
    });

    const cacheHeaders = { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } as const;

    return NextResponse.json(result, { headers: cacheHeaders });
  } catch (error) {
    console.error('Error fetching client offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}