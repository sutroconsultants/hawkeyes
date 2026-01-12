import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";

// Tool to list all tables in ClickHouse
export const listTablesTool: TamboTool = {
  name: "list_clickhouse_tables",
  description: `List all tables in the ClickHouse database. Returns table names, databases, row counts, and sizes.

The main database is 'ebmud' which contains water utility data:
- hydrants: Fire hydrant assets
- hydrant_inspections: Inspection records for hydrants
- valves: Water system valves
- valve_exercises: Valve exercise/testing records
- mains: Water main pipes
- main_breaks: Main break incidents
- work_orders: Maintenance and repair work orders
- documents: Attached files and records
- pressure_zones: Service pressure zones
- critical_users: Hospitals, schools, fire stations
- claims: Property damage claims`,
  tool: async () => {
    try {
      const response = await fetch("/api/clickhouse/tables");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tables");
      }
      return data.tables;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(`Failed to fetch tables: ${String(err)}`);
    }
  },
  inputSchema: z.object({}),
  outputSchema: z.array(z.object({
    name: z.string(),
    database: z.string(),
    engine: z.string(),
    total_rows: z.string(),
    total_bytes: z.string(),
  })),
};

// Tool to get columns/schema for a specific table
export const getTableSchemaTool: TamboTool = {
  name: "get_table_schema",
  description: `Get the column schema for a specific ClickHouse table. Returns column names and types.

IMPORTANT: For Enum columns (like status, priority, work_type), use string values in queries.
Example: WHERE priority = 'emergency' or WHERE status = 'active'

Common enum values:
- priority: 'emergency', 'urgent', 'high', 'medium', 'low'
- status: 'active', 'inactive', 'completed', 'open', etc.
- work_type: 'repair', 'replacement', 'inspection', 'maintenance', 'emergency'`,
  tool: async ({ database, table }: { database: string; table: string }) => {
    try {
      const response = await fetch(`/api/clickhouse/columns?database=${database}&table=${table}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch table schema");
      }
      return data.columns;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(`Failed to fetch table schema: ${String(err)}`);
    }
  },
  inputSchema: z.object({
    database: z.string().describe("The database name (usually 'ebmud')"),
    table: z.string().describe("The table name"),
  }),
  outputSchema: z.array(z.object({
    name: z.string(),
    type: z.string(),
    comment: z.string().optional(),
  })),
};

// Tool to execute a SQL query
export const executeQueryTool: TamboTool = {
  name: "execute_clickhouse_query",
  description: `Execute a SQL query against ClickHouse and return results.

IMPORTANT QUERY RULES:
1. Always use LIMIT (default 100)
2. For Enum columns use string values: WHERE priority = 'emergency'
3. Use ebmud database: SELECT * FROM ebmud.table_name
4. Only use columns that exist in the table - check schema first with get_table_schema

After running a query, describe the results in plain English and render a QuerySuggestion component using the executedQuery from the tool result. Avoid raw SQL unless the user asks.

Example: SELECT * FROM ebmud.work_orders WHERE priority = 'emergency' LIMIT 100`,
  tool: async ({ query }: { query: string }) => {
    try {
      const response = await fetch("/api/clickhouse/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details || data.error || `Query failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      return {
        data: data.data,
        rowCount: data.rows,
        statistics: data.statistics,
        executedQuery: query,
      };
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(`Failed to execute query: ${String(err)}`);
    }
  },
  inputSchema: z.object({
    query: z.string().describe("The SQL query to execute against ClickHouse. Always include LIMIT clause."),
  }),
  outputSchema: z.object({
    data: z.array(z.any()).describe("The query result rows"),
    rowCount: z.number().describe("Number of rows returned"),
    statistics: z.object({
      elapsed: z.number(),
      rows_read: z.number(),
      bytes_read: z.number(),
    }).optional(),
    executedQuery: z.string().describe("The SQL query that was executed"),
  }),
};

// Export all tools
export const clickhouseTools = [
  listTablesTool,
  getTableSchemaTool,
  executeQueryTool,
];
