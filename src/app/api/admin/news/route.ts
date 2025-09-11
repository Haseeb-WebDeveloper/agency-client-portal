// src/app/api/admin/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Fetch paginated news items with optional search
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    const search = (searchParams.get('search') || '').trim();

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.news.count({ where }),
      prisma.news.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const cacheHeaders = { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } as const;

    return NextResponse.json(
      {
        items,
        pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      },
      { headers: cacheHeaders }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Create a new news item
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: User not found' }, 
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { title, description, featuredImage, content, sendTo, sendToAll } = body;
    
    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' }, 
        { status: 400 }
      );
    }
    
    const news = await prisma.news.create({
      data: {
        title,
        description: description || '',
        featuredImage: featuredImage?.trim() || null,
        content,
        sendTo: Array.isArray(sendTo) ? sendTo : [],
        sendToAll: sendToAll || false,
        createdBy: user.id, // Use actual user ID instead of placeholder
      },
    });
    
    return NextResponse.json(news);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create news: ' + (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Update an existing news item
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: User not found' }, 
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { id, title, description, featuredImage, content, sendTo, sendToAll, ...data } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'News ID is required' }, 
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' }, 
        { status: 400 }
      );
    }
    
    const news = await prisma.news.update({
      where: { id },
      data: {
        title,
        description: description || '',
        featuredImage: featuredImage?.trim() || null,
        content,
        sendTo: Array.isArray(sendTo) ? sendTo : [],
        sendToAll: sendToAll || false,
        ...data,
        updatedBy: user.id, // Use actual user ID instead of placeholder
      },
    });
    
    return NextResponse.json(news);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update news: ' + (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Delete a news item
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: User not found' }, 
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'News ID is required' }, { status: 400 });
    }
    
    await prisma.news.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'News deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete news: ' + (error as Error).message }, { status: 500 });
  }
}