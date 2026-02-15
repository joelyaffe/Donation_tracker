import { NextRequest, NextResponse } from "next/server";
import { parseDonation } from "@/lib/anthropic";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const parsed = await parseDonation(text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Parse error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to parse donation", details: errorMessage },
      { status: 500 }
    );
  }
}
