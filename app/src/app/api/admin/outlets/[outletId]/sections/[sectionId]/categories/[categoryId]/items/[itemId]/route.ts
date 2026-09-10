import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { canAccessOutlet } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ outletId: string; sectionId: string; categoryId: string; itemId: string }> }
) {
  const { itemId } = await params;

  const item = await prisma.item.findUnique({ where: { id: itemId } });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ outletId: string; sectionId: string; categoryId: string; itemId: string }> }
) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { outletId } = await params;

  const hasAccess = await canAccessOutlet(payload.adminId, outletId, payload.role);

  if (!hasAccess) {
    return NextResponse.json(
      { error: "You do not have access to this outlet" },
      { status: 403 }
    );
  }

  const { name, description, price, active, displayOrder, imagePath } = await req.json();
  const { itemId } = await params;

  const item = await prisma.item.update({
    where: { id: itemId },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(active !== undefined && { active }),
      ...(displayOrder !== undefined && { displayOrder }),
      ...(imagePath !== undefined && { imagePath }),
    },
  });

  return NextResponse.json({ item });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ outletId: string; sectionId: string; categoryId: string; itemId: string }> }
) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { outletId } = await params;

  const hasAccess = await canAccessOutlet(payload.adminId, outletId, payload.role);

  if (!hasAccess) {
    return NextResponse.json(
      { error: "You do not have access to this outlet" },
      { status: 403 }
    );
  }

  const { itemId } = await params;

  await prisma.item.delete({ where: { id: itemId } });

  return NextResponse.json({ success: true });
}
