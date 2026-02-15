import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { hashPin } from "@/lib/auth";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, pin, name, securityQuestion, securityAnswer } = body;

    // Validate input
    if (!username || !pin) {
      return NextResponse.json(
        { error: "Username and PIN are required" },
        { status: 400 }
      );
    }

    if (username.length < 2) {
      return NextResponse.json(
        { error: "Username must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be 4-6 digits" },
        { status: 400 }
      );
    }

    if (!securityQuestion || !securityAnswer) {
      return NextResponse.json(
        { error: "Security question and answer are required" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .get();

    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    // Create user
    const pinHash = await hashPin(pin);
    const securityAnswerHash = await hashPin(securityAnswer.toLowerCase().trim());
    const id = crypto.randomUUID();

    await db.insert(users).values({
      id,
      username: username.toLowerCase(),
      pinHash,
      securityQuestion,
      securityAnswerHash,
      name: name || username,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      user: { id, username: username.toLowerCase(), name: name || username },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
