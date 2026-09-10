import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { canAccessOutlet } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { outletId: string; sectionId: string; categoryId: string } }
) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { outletId } = params;

  const hasAccess = await canAccessOutlet(payload.adminId, outletId, payload.role);

  if (!hasAccess) {
    return NextResponse.json(
      { error: "You do not have access to this outlet" },
      { status: 403 }
    );
  }

  const { name, description, price, imagePath } = await req.json();
  const { categoryId } = params;

  if (!name || price === undefined) {
    return NextResponse.json(
      { error: "Item name and price required" },
      { status: 400 }
    );
  }

  const maxOrder = await prisma.item.findFirst({
    where: { categoryId },
    orderBy: { displayOrder: "desc" },
  });

  const item = await prisma.item.create({
    data: {
      name,
      description: description || null,
      price: parseFloat(price),
      imagePath: imagePath || null,
      categoryId,
      displayOrder: (maxOrder?.displayOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
