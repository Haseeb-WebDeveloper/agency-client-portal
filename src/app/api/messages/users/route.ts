import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const me = await getCurrentUser();
  
  // Handle case where user is not authenticated
  if (!me) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Number(searchParams.get("limit") || 10);

  const isAdmin = me.role === "PLATFORM_ADMIN" || me.role === "AGENCY_MEMBER";

  const where = isAdmin
    ? {
        deletedAt: null,
        isActive: true,
        OR: q
          ? [
              { firstName: { contains: q, mode: "insensitive" as const } },
              { lastName: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ]
          : undefined,
      }
    : {
        deletedAt: null,
        isActive: true,
        OR: q
          ? [
              { firstName: { contains: q, mode: "insensitive" as const } },
              { lastName: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ]
          : undefined,
      };

  const users = await prisma.user.findMany({
    where,
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
    take: Math.min(Math.max(limit, 1), 25),
    orderBy: { firstName: "asc" },
  });

  const items = users.map((u) => ({
    id: u.id,
    label: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email,
    value: u.id,
    email: u.email,
    avatar: u.avatar,
  }));

  return NextResponse.json({ items });
}