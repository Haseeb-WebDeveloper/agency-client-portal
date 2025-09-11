import { NextRequest, NextResponse } from 'next/server';
import { getClientNews } from '@/lib/cached-client';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    const cacheHeaders = { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=600' } as const;
    
    const news = await getClientNews(user.id);
    
    return NextResponse.json(news, { headers: cacheHeaders });
  } catch (error) {
    console.error('Error fetching client news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
