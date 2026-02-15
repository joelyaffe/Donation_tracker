import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { hashPin } from "@/lib/auth";
import bcrypt from "bcryptjs";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Step 1: Look up security question by username
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  const user = await db
    .select({
      securityQuestion: users.securityQuestion,
    })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .get();

  if (!user || !user.securityQuestion) {
    return NextResponse.json(
      { error: "No account found with that username, or no security question set" },
      { status: 404 }
    );
  }

  return NextResponse.json({ securityQuestion: user.securityQuestion });
}

// Step 2: Verify answer and reset PIN
export async function POST(request: NextRequest) {
  try {
    const { username, securityAnswer, newPin } = await request.json();

    if (!username || !securityAnswer || !newPin) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      return NextResponse.json(
        { error: "PIN must be 4-6 digits" },
        { status: 400 }
      );
    }

    const user = await db
      .select({
        id: users.id,
        securityAnswerHash: users.securityAnswerHash,
      })
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .get();

    if (!user || !user.securityAnswerHash) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(
      securityAnswer.toLowerCase().trim(),
      user.securityAnswerHash
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect security answer" },
        { status: 403 }
      );
    }

    // Reset the PIN
    const newPinHash = await hashPin(newPin);
    await db
      .update(users)
      .set({ pinHash: newPinHash })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset PIN error:", error);
    return NextResponse.json(
      { error: "Failed to reset PIN" },
      { status: 500 }
    );
  }
}
