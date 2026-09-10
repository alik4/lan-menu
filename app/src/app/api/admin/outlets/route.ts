import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Super admin sees all outlets; outlet_admin sees only their outlets
  if (payload.role === "super_admin") {
    const outlets = await prisma.outlet.findMany({
      include: {
        property: true,
        sections: {
          orderBy: { displayOrder: "asc" },
          include: {
            categories: {
              orderBy: { displayOrder: "asc" },
              include: {
                items: {
                  orderBy: { displayOrder: "asc" },
                },
              },
            },
          },
        },
      },
    });
    return NextResponse.json({ outlets });
  }

  // outlet_admin
  const adminOutlets = await prisma.adminOutlet.findMany({
    where: { adminId: payload.adminId },
    include: {
      outlet: {
        include: {
          property: true,
          sections: {
            orderBy: { displayOrder: "asc" },
            include: {
              categories: {
                orderBy: { displayOrder: "asc" },
                include: {
                  items: {
                    orderBy: { displayOrder: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const outlets = adminOutlets.map((ao) => ao.outlet);
  return NextResponse.json({ outlets });
}
