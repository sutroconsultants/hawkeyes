import { NextRequest, NextResponse } from "next/server";
import { getTableColumns } from "@/lib/clickhouse";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const database = searchParams.get("database");
  const table = searchParams.get("table");

  if (!database || !table) {
    return NextResponse.json(
      { error: "Database and table parameters are required" },
      { status: 400 }
    );
  }

  try {
    const columns = await getTableColumns(database, table);
    return NextResponse.json({ columns });
  } catch (error) {
    console.error("Failed to fetch columns:", error);
    return NextResponse.json(
      { error: "Failed to fetch columns", details: String(error) },
      { status: 500 }
    );
  }
}
