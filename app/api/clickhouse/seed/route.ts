import { NextRequest, NextResponse } from "next/server";
import { getClickHouseClient } from "@/lib/clickhouse";
import { seedStatements } from "@/lib/seed-data";

export async function POST(request: NextRequest) {
  try {
    const client = getClickHouseClient();
    const results: { statement: number; success: boolean; error?: string }[] = [];

    // Execute each seed statement
    for (let i = 0; i < seedStatements.length; i++) {
      const statement = seedStatements[i].trim();
      if (!statement) continue;

      try {
        await client.command({
          query: statement,
        });
        results.push({ statement: i + 1, success: true });
      } catch (error) {
        results.push({
          statement: i + 1,
          success: false,
          error: String(error),
        });
        // Continue with other statements even if one fails
        console.error(`Statement ${i + 1} failed:`, error);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Seed completed: ${successCount} succeeded, ${failCount} failed`,
      totalStatements: seedStatements.length,
      successCount,
      failCount,
      details: results.filter((r) => !r.success), // Only return failed statements
    });
  } catch (error) {
    console.error("Seed failed:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = getClickHouseClient();

    // Drop all tables in eastbay_water database
    const tables = [
      "claims",
      "documents",
      "work_orders",
      "main_breaks",
      "mains",
      "valve_exercises",
      "valves",
      "hydrant_inspections",
      "hydrants",
      "critical_users",
      "pressure_zones",
    ];

    for (const table of tables) {
      try {
        await client.command({
          query: `DROP TABLE IF EXISTS eastbay_water.${table}`,
        });
      } catch (error) {
        console.error(`Failed to drop ${table}:`, error);
      }
    }

    // Drop the database
    await client.command({
      query: "DROP DATABASE IF EXISTS eastbay_water",
    });

    return NextResponse.json({
      message: "Database reset complete - all East Bay Water tables dropped",
    });
  } catch (error) {
    console.error("Reset failed:", error);
    return NextResponse.json(
      { error: "Failed to reset database", details: String(error) },
      { status: 500 }
    );
  }
}
