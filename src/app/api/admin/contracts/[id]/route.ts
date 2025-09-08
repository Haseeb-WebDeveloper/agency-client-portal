import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const contractId = (await params).id;

    const contract = await prisma.$queryRaw`
      SELECT 
        c.*,
        cl.name as client_name,
        cl.logo as client_logo,
        u."firstName" as creator_first_name,
        u."lastName" as creator_last_name,
        COALESCE(media_files.file_count, 0) as media_files_count
      FROM contracts c
      LEFT JOIN clients cl ON c."clientId" = cl.id
      LEFT JOIN users u ON c."createdBy" = u.id
      LEFT JOIN (
        SELECT 
          m."contractId",
          COUNT(ma.id) as file_count
        FROM messages m
        LEFT JOIN message_attachments ma ON m.id = ma."messageId"
        WHERE m."contractId" IS NOT NULL AND m."deletedAt" IS NULL
        GROUP BY m."contractId"
      ) media_files ON c.id = media_files."contractId"
      WHERE c.id = ${contractId} AND c."deletedAt" IS NULL
    `;

    const contractData = contract as any[];

    if (contractData.length === 0) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    const contractInfo = contractData[0];

    // Transform contract to match expected format
    const transformedContract = {
      id: contractInfo.id,
      title: contractInfo.title,
      description: contractInfo.description,
      status: contractInfo.status,
      tags: contractInfo.tags || [],
      progressPercentage: contractInfo.progressPercentage || 0,
      mediaFilesCount: parseInt(contractInfo.media_files_count) || 0,
      createdAt: new Date(contractInfo.createdAt).toISOString(),
      updatedAt: new Date(contractInfo.updatedAt).toISOString(),
      startDate: contractInfo.startDate ? new Date(contractInfo.startDate).toISOString() : null,
      endDate: contractInfo.endDate ? new Date(contractInfo.endDate).toISOString() : null,
      value: contractInfo.value ? parseFloat(contractInfo.value) : null,
      currency: contractInfo.currency,
      budget: contractInfo.budget ? parseFloat(contractInfo.budget) : null,
      priority: contractInfo.priority,
      estimatedHours: contractInfo.estimatedHours,
      actualHours: contractInfo.actualHours,
      clientId: contractInfo.clientId,
      client: {
        id: contractInfo.clientId,
        name: contractInfo.client_name,
        logo: contractInfo.client_logo,
      },
      creator: contractInfo.creator_first_name ? {
        firstName: contractInfo.creator_first_name,
        lastName: contractInfo.creator_last_name,
      } : null,
    };

    return NextResponse.json(transformedContract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const contractId = (await params).id;
    const body = await request.json();
    const { 
      title, 
      description, 
      status, 
      clientId, 
      tags, 
      priority, 
      startDate, 
      endDate, 
      value, 
      currency, 
      budget, 
      estimatedHours 
    } = body;

    if (!title || !clientId) {
      return NextResponse.json(
        { error: 'Title and client are required' },
        { status: 400 }
      );
    }

    // Update the contract
    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        title,
        description,
        status,
        clientId,
        tags: tags || [],
        priority: priority || 3,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        value: value ? parseFloat(value.toString()) : null,
        currency: currency || 'USD',
        budget: budget ? parseFloat(budget.toString()) : null,
        estimatedHours: estimatedHours ? parseInt(estimatedHours.toString()) : null,
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
        priority: contract.priority,
        startDate: contract.startDate,
        endDate: contract.endDate,
        value: contract.value,
        currency: contract.currency,
        budget: contract.budget,
        estimatedHours: contract.estimatedHours,
        updatedAt: contract.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const contractId = (await params).id;

    // Soft delete the contract
    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contract deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}
