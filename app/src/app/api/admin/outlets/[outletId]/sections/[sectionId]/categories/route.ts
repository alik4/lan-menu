import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { canAccessOutlet } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(
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

  const { name } = await req.json();

  if (!name) {
    return NextResponse.json(
      { error: "Category name required" },
      { status: 400 }
    );
  }

  const maxOrder = await prisma.category.findFirst({
    where: { sectionId },
    orderBy: { displayOrder: "desc" },
  });

  const category = await prisma.category.create({
    data: {
      name,
      sectionId,
      displayOrder: (maxOrder?.displayOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ category }, { status: 201 });
}
