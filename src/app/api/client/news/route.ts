// src/app/api/client/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check client authentication
    const user = await getCurrentUser();
    if (!user || (user.role !== 'CLIENT' && user.role !== 'AGENCY_MEMBER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch news data for the client
    const newsData = await prisma.news.findMany({
      where: {
        OR: [
          { sendToAll: true },
          { sendTo: { has: user.id } }
        ],
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        description: true,
        featuredImage: true,
        content: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json(newsData);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}