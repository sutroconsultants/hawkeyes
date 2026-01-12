import { NextResponse } from "next/server";
import { getTables } from "@/lib/clickhouse";

export async function GET() {
  try {
    const tables = await getTables();
    return NextResponse.json({ tables });
  } catch (error) {
    console.error("Failed to fetch tables:", error);
    return NextResponse.json(
      { error: "Failed to fetch tables", details: String(error) },
      { status: 500 }
    );
  }
}
