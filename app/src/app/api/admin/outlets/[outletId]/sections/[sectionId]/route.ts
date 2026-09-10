import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { canAccessOutlet } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { outletId: string; sectionId: string } }
) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { outletId, sectionId } = params;

  const hasAccess = await canAccessOutlet(payload.adminId, outletId, payload.role);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "You do not have access to this outlet" },
      { status: 403 }
    );
  }

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      categories: {
        orderBy: { displayOrder: "asc" },
        include: {
          items: { orderBy: { displayOrder: "asc" } },
        },
      },
    },
  });

  if (!section || section.outletId !== outletId) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  return NextResponse.json({ section });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { outletId: string; sectionId: string } }
) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { outletId, sectionId } = params;

  const hasAccess = await canAccessOutlet(payload.adminId, outletId, payload.role);

  if (!hasAccess) {
    return NextResponse.json(
      { error: "You do not have access to this outlet" },
      { status: 403 }
    );
  }

  const { name, displayOrder } = await req.json();

  const section = await prisma.section.update({
    where: { id: sectionId },
    data: {
      ...(name && { name }),
      ...(displayOrder !== undefined && { displayOrder }),
    },
    include: {
      categories: {
        orderBy: { displayOrder: "asc" },
        include: {
          items: { orderBy: { displayOrder: "asc" } },
        },
      },
    },
  });

  return NextResponse.json({ section });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { outletId: string; sectionId: string } }
) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { outletId, sectionId } = params;

  const hasAccess = await canAccessOutlet(payload.adminId, outletId, payload.role);

  if (!hasAccess) {
    return NextResponse.json(
      { error: "You do not have access to this outlet" },
      { status: 403 }
    );
  }

  await prisma.section.delete({ where: { id: sectionId } });

  return NextResponse.json({ success: true });
}
