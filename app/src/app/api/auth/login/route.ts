import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken, verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password required" },
      { status: 400 }
    );
  }

  const admin = await prisma.admin.findUnique({ where: { username } });

  if (!admin) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signToken({
    adminId: admin.id,
    username: admin.username,
    role: admin.role as "super_admin" | "outlet_admin",
  });

  return NextResponse.json({
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      role: admin.role,
    },
  });
}
