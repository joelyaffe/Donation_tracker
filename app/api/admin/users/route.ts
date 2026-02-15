import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, donations } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function checkAdmin(request: NextRequest): boolean {
  // Accept secret from query param, header, or body
  const secret =
    request.nextUrl.searchParams.get("secret") ||
    request.headers.get("x-admin-secret");

  if (!secret) return false;

  // Check against multiple possible env vars
  const candidates = [
    process.env.ADMIN_SECRET,
    process.env.AUTH_SECRET,
    process.env.NEXTAUTH_SECRET,
  ].filter(Boolean);

  if (candidates.length === 0) return false;

  return candidates.some((expected) => secret === expected);
}

// GET: List all users with donation counts
export async function GET(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      createdAt: users.createdAt,
      donationCount: sql<number>`(SELECT COUNT(*) FROM donations WHERE donations.user_id = ${users.id})`,
    })
    .from(users)
    .all();

  return NextResponse.json({ users: allUsers });
}

// DELETE: Remove a user by ID (cascades to donations)
export async function DELETE(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Delete donations first (in case FK cascade isn't working in Turso)
  await db.delete(donations).where(eq(donations.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
