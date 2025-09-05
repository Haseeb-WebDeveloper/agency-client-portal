import { NextRequest, NextResponse } from 'next/server';
import { getContractsWithDetails, getContractsByStatus } from '@/lib/admin-queries';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Get contracts based on filters
    let contracts;
    if (status) {
      contracts = await getContractsByStatus(status);
    } else {
      contracts = await getContractsWithDetails();
    }

    // Apply search filter if provided
    if (search) {
      contracts = contracts.filter(contract => 
        contract.title.toLowerCase().includes(search.toLowerCase()) ||
        contract.description?.toLowerCase().includes(search.toLowerCase()) ||
        contract.client_name.toLowerCase().includes(search.toLowerCase()) ||
        contract.tags.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Calculate pagination
    const total = contracts.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContracts = contracts.slice(startIndex, endIndex);

    // Transform contracts to match expected format and ensure proper serialization
    const transformedContracts = paginatedContracts.map(contract => ({
      id: contract.id,
      title: contract.title,
      description: contract.description,
      status: contract.status,
      tags: contract.tags || [],
      progressPercentage: contract.progressPercentage || 0,
      mediaFilesCount: parseInt(contract.media_files_count) || 0,
      createdAt: new Date(contract.createdAt).toISOString(),
      client_name: contract.client_name,
      client_logo: contract.client_logo,
      creator_first_name: contract.creator_first_name,
      creator_last_name: contract.creator_last_name,
    }));

    return NextResponse.json({
      contracts: transformedContracts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, status, clientId, tags, priority } = body;

    if (!title || !clientId) {
      return NextResponse.json(
        { error: 'Title and client are required' },
        { status: 400 }
      );
    }

    // Create the contract
    const contract = await prisma.contract.create({
      data: {
        title,
        description,
        status: status || 'DRAFT',
        clientId,
        tags: tags || [],
        priority: priority || 3,
        progressPercentage: 0,
        actualHours: 0,
      },
    });

    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        title: contract.title,
        description: contract.description,
        status: contract.status,
        tags: contract.tags,
        progressPercentage: contract.progressPercentage,
        createdAt: contract.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}
