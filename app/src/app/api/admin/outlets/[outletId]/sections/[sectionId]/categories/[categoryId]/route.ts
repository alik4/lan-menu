import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { canAccessOutlet } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ outletId: string; sectionId: string; categoryId: string }> }
) {
  const { outletId, sectionId, categoryId } = await params;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      items: { orderBy: { displayOrder: "asc" } },
    },
  });

  if (!category || category.sectionId !== sectionId) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ category });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ outletId: string; sectionId: string; categoryId: string }> }
) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { outletId, categoryId } = await params;

  const hasAccess = await canAccessOutlet(payload.adminId, outletId, payload.role);

  if (!hasAccess) {
    return NextResponse.json(
      { error: "You do not have access to this outlet" },
      { status: 403 }
    );
  }

  const { name, displayOrder } = await req.json();

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(name && { name }),
      ...(displayOrder !== undefined && { displayOrder }),
    },
    include: {
      items: { orderBy: { displayOrder: "asc" } },
    },
  });

  return NextResponse.json({ category });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ outletId: string; sectionId: string; categoryId: string }> }
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

  const { categoryId } = await params;

  await prisma.category.delete({ where: { id: categoryId } });

  return NextResponse.json({ success: true });
}
