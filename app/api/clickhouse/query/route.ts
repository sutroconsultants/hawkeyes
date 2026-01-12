import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/clickhouse";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query parameter is required and must be a string" },
        { status: 400 }
      );
    }

    // Basic SQL injection prevention - only allow SELECT queries
    const trimmedQuery = query.trim().toUpperCase();
    if (
      !trimmedQuery.startsWith("SELECT") &&
      !trimmedQuery.startsWith("SHOW") &&
      !trimmedQuery.startsWith("DESCRIBE") &&
      !trimmedQuery.startsWith("EXPLAIN")
    ) {
      return NextResponse.json(
        { error: "Only SELECT, SHOW, DESCRIBE, and EXPLAIN queries are allowed" },
        { status: 403 }
      );
    }

    const result = await executeQuery(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to execute query:", error);
    return NextResponse.json(
      { error: "Failed to execute query", details: String(error) },
      { status: 500 }
    );
  }
}
