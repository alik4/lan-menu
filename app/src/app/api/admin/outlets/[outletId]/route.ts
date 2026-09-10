import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { canAccessOutlet } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { outletId: string } }
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

  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
    include: {
      property: true,
      sections: {
        orderBy: { displayOrder: "asc" },
        include: {
          categories: {
            orderBy: { displayOrder: "asc" },
            include: {
              items: { orderBy: { displayOrder: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!outlet) {
    return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
  }

  return NextResponse.json({ outlet });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { outletId: string } }
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

  const { name } = await req.json();

  if (!name) {
    return NextResponse.json(
      { error: "Section name required" },
      { status: 400 }
    );
  }

  const maxOrder = await prisma.section.findFirst({
    where: { outletId },
    orderBy: { displayOrder: "desc" },
  });

  const section = await prisma.section.create({
    data: {
      name,
      outletId,
      displayOrder: (maxOrder?.displayOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ section }, { status: 201 });
}
