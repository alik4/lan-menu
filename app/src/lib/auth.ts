import jwt from "jsonwebtoken";

export interface JWTPayload {
  adminId: string;
  username: string;
  role: "super_admin" | "outlet_admin";
}

const JWT_SECRET = process.env.JWT_SECRET || "change-this-to-something-long-and-random";

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
