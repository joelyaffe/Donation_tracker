import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { donations } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const result = await db
      .select()
      .from(donations)
      .where(eq(donations.userId, userId))
      .orderBy(desc(donations.createdAt))
      .limit(100);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get donations error:", error);
    return NextResponse.json(
      { error: "Failed to get donations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const newDonation = await db
      .insert(donations)
      .values({
        userId,
        description: body.description,
        organization: body.organization,
        amount: body.amount,
        donationDate: body.donationDate || "",
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(newDonation[0]);
  } catch (error) {
    console.error("Create donation error:", error);
    return NextResponse.json(
      { error: "Failed to create donation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await db
      .delete(donations)
      .where(
        and(
          eq(donations.id, parseInt(id)),
          eq(donations.userId, userId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete donation error:", error);
    return NextResponse.json(
      { error: "Failed to delete donation" },
      { status: 500 }
    );
  }
}
