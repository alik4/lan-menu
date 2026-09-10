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

  const admin = await prisma.admin.findUnique({
    where: { id: payload.adminId },
    include: {
      outlets: {
        include: {
          outlet: {
            include: {
              property: true,
            },
          },
        },
      },
    },
  });

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  return NextResponse.json({
    admin: {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      outlets: admin.outlets.map((ao) => ({
        id: ao.outlet.id,
        name: ao.outlet.name,
        slug: ao.outlet.slug,
        property: ao.outlet.property,
      })),
    },
  });
}
