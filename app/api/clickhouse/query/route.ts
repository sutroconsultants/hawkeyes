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

    // Extract meaningful error message from ClickHouse error
    let errorMessage = "Failed to execute query";
    const errorString = String(error);

    // ClickHouse errors often contain useful info after "Code:" or in the message
    if (errorString.includes("Code:")) {
      // Extract the ClickHouse error message
      const match = errorString.match(/Code: \d+\.\s*([^(]+)/);
      if (match) {
        errorMessage = match[1].trim();
      } else {
        // Fallback: try to get the message part
        const parts = errorString.split("Code:");
        if (parts[1]) {
          errorMessage = parts[1].trim();
        }
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage, details: errorString },
      { status: 500 }
    );
  }
}
