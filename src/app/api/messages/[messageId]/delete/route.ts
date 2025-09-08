import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (message.userId !== me.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.message.update({ where: { id: messageId }, data: { deletedAt: new Date(), updatedBy: me.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("delete message error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


