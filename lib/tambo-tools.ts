import { defineTool } from "@tambo-ai/react";
import { z } from "zod";

// Tool to list all tables in ClickHouse
export const listTablesTool = defineTool({
  name: "list_tables",
  description: `List all tables in the ClickHouse database. Returns table names and row counts.

The main database is 'hawkeye' which contains water utility data:
- hydrants: Fire hydrant assets
- hydrant_inspections: Inspection records
- valves: Water system valves
- valve_exercises: Valve testing records
- mains: Water main pipes
- main_breaks: Main break incidents
- work_orders: Maintenance work orders
- pressure_zones: Service pressure zones
- critical_users: Hospitals, schools, fire stations
- claims: Property damage claims`,
  tool: async () => {
    const response = await fetch("/api/clickhouse/tables");
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch tables");
    }
    return { tables: data.tables };
  },
  inputSchema: z.object({}),
  outputSchema: z.object({
    tables: z.array(z.object({
      name: z.string(),
      database: z.string(),
      total_rows: z.string(),
    })),
  }),
});

// Tool to get columns/schema for a specific table
export const getTableSchemaTool = defineTool({
  name: "get_table_schema",
  description: `Get the column schema for a specific ClickHouse table.

IMPORTANT: For Enum columns (status, priority, work_type), use string values in queries.
Example: WHERE priority = 'emergency'

Common enum values:
- priority: 'emergency', 'urgent', 'high', 'medium', 'low'
- status: 'open', 'in_progress', 'completed'
- work_type: 'repair', 'replacement', 'inspection', 'maintenance', 'emergency'`,
  tool: async ({ database, table }: { database: string; table: string }) => {
    const response = await fetch(`/api/clickhouse/columns?database=${database}&table=${table}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch table schema");
    }
    const columns = data.columns.map((c: { name: string; type: string }) => `${c.name}: ${c.type}`).join(", ");
    return { table: `${database}.${table}`, columns };
  },
  inputSchema: z.object({
    database: z.string().describe("The database name (usually 'hawkeye')"),
    table: z.string().describe("The table name"),
  }),
  outputSchema: z.object({
    table: z.string(),
    columns: z.string(),
  }),
});

// Tool to suggest a SQL query (does NOT execute - user clicks Run Query)
export const suggestQueryTool = defineTool({
  name: "suggest_query",
  description: `Suggest a SQL query to the user. Does NOT execute - the user can review and click "Run Query" to execute it.

QUERY RULES:
1. Always use LIMIT (default 100)
2. For Enum columns use string values: WHERE priority = 'emergency'
3. Use hawkeye database: SELECT * FROM hawkeye.table_name

Example: SELECT * FROM hawkeye.work_orders WHERE priority = 'emergency' LIMIT 100`,
  tool: async ({ query }: { query: string }) => {
    return { query };
  },
  inputSchema: z.object({
    query: z.string().describe("The SQL query to suggest"),
  }),
  outputSchema: z.object({
    query: z.string(),
  }),
});

// Export all tools
export const clickhouseTools = [
  listTablesTool,
  getTableSchemaTool,
  suggestQueryTool,
];
