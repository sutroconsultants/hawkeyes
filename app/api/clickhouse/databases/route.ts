import { NextResponse } from "next/server";
import { getDatabases } from "@/lib/clickhouse";

export async function GET() {
  try {
    const databases = await getDatabases();
    return NextResponse.json({ databases });
  } catch (error) {
    console.error("Failed to fetch databases:", error);
    return NextResponse.json(
      { error: "Failed to fetch databases", details: String(error) },
      { status: 500 }
    );
  }
}
