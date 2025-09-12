// src/app/api/admin/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Check if this is a request for all news (for client-side rendering)
  const all = searchParams.get('all');
  
  if (all === 'true') {
    // Fetch all news items with client information for client-side rendering
    try {
      // For client-side requests, we'll check auth differently
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized: User not found' }, { status: 401 });
      }
      if (user.role !== 'PLATFORM_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized: User is not an admin' }, { status: 403 });
      }
      
      const news = await prisma.news.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          featuredImage: true,
          content: true,
          sendTo: true,
          sendToAll: true,
          createdAt: true,
          creator: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      const clients = await prisma.client.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
      });

      const cacheHeaders = { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=600' } as const; // 5min + 10min stale

      return NextResponse.json({ news, clients }, { headers: cacheHeaders });
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || 'Failed to fetch news';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } else {
    // Fetch paginated news items with optional search
    try {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized: User not found' }, { status: 401 });
      }
      if (user.role !== 'PLATFORM_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized: User is not an admin' }, { status: 403 });
      }
      
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
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || 'Failed to fetch news';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
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
    
    if (user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: User is not an admin' }, 
        { status: 403 }
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
    
    revalidateTag('news:list');
    revalidateTag('admin:dashboard');
    return NextResponse.json(news, { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } });
  } catch (error: any) {
    console.error(error);
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message?: string }).message
      : undefined;
    return NextResponse.json({ error: 'Failed to create news: ' + (errorMessage || 'Failed to create news') }, { status: 500 });
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
    
    if (user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: User is not an admin' }, 
        { status: 403 }
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
    
    revalidateTag('news:list');
    revalidateTag('admin:dashboard');
    return NextResponse.json(news, { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } });
  } catch (error: any) {
    console.error(error);
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message?: string }).message
      : 'Failed to update news';
    return NextResponse.json({ error: 'Failed to update news: ' + errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: User not found' }, 
        { status: 401 }
      );
    }
    
    if (user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: User is not an admin' }, 
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'News ID is required' }, 
        { status: 400 }
      );
    }
    
    // Soft delete the news item
    const news = await prisma.news.update({
      where: { id },
      data: { 
         deletedAt: new Date()
      },
    });
    
    revalidateTag('news:list');
    revalidateTag('admin:dashboard');
    return NextResponse.json({ message: 'News deleted successfully' });
  } catch (error: any) {
    console.error(error);
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message?: string }).message
      : 'Failed to delete news';
    return NextResponse.json({ error: 'Failed to delete news: ' + errorMessage }, { status: 500 });
  }
}