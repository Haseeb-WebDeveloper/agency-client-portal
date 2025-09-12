import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    // Get the authenticated admin user
    const user = await requireAdmin();

    // Parse the request body
    const body = await request.json();
    const { firstName, lastName, avatar } = body;

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: user.id,
    };

    // Update name fields if provided
    if (firstName !== undefined) {
      if (!firstName || firstName.trim().length < 1) {
        return NextResponse.json(
          { error: "First name must not be empty" },
          { status: 400 }
        );
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName || lastName.trim().length < 1) {
        return NextResponse.json(
          { error: "Last name must not be empty" },
          { status: 400 }
        );
      }
      updateData.lastName = lastName.trim();
    }

    // Update avatar if provided
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length <= 2) { // Only updatedAt and updatedBy
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update the user profile
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("redirect")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get the authenticated admin user
    const user = await requireAdmin();

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes("redirect")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
