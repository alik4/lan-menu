import { JWTPayload } from "./auth";
import { prisma } from "@/lib/prisma";

/**
 * Check if an admin can access a specific outlet
 * - super_admin can access everything
 * - outlet_admin can only access their assigned outlets
 */
export async function canAccessOutlet(
  adminId: string,
  outletId: string,
  role: string
): Promise<boolean> {
  if (role === "super_admin") return true;

  const access = await prisma.adminOutlet.findUnique({
    where: {
      adminId_outletId: { adminId, outletId },
    },
  });

  return !!access;
}

/**
 * Get all outlets an admin can access
 */
export async function getAdminOutlets(
  adminId: string,
  role: string
): Promise<string[]> {
  if (role === "super_admin") {
    const outlets = await prisma.outlet.findMany();
    return outlets.map((o) => o.id);
  }

  const adminOutlets = await prisma.adminOutlet.findMany({
    where: { adminId },
  });

  return adminOutlets.map((ao) => ao.outletId);
}
