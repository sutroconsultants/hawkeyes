import type { TamboTool } from "@tambo-ai/react";
import { QUERY_SUGGESTION_EVENT } from "@/lib/tambo-events";

// Tool to list all tables in ClickHouse (using raw JSON Schema)
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
    const response = await fetch("/api/clickhouse/tables");
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch tables");
    }
    return data.tables;
  },
  inputSchema: {
    type: "object",
    properties: {},
  },
  outputSchema: {},
  transformToContent: (result) => [
    { type: "text", text: JSON.stringify(result, null, 2) },
  ],
};

// Tool to get columns/schema for a specific table (using raw JSON Schema)
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
    const response = await fetch(`/api/clickhouse/columns?database=${database}&table=${table}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch table schema");
    }
    // Return simplified schema with just name and type
    const simplified = data.columns.map((c: { name: string; type: string }) => `${c.name}: ${c.type}`).join(", ");
    return { table: `${database}.${table}`, columns: simplified };
  },
  inputSchema: {
    type: "object",
    properties: {
      database: { type: "string", description: "The database name (usually 'ebmud')" },
      table: { type: "string", description: "The table name" },
    },
    required: ["database", "table"],
  },
  outputSchema: {},
  transformToContent: (result) => [
    { type: "text", text: `Table ${result.table} columns: ${result.columns}` },
  ],
};

// Tool to execute a SQL query (using raw JSON Schema)
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

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(QUERY_SUGGESTION_EVENT, {
          detail: { query, result: { data: data.data, rows: data.rows, statistics: data.statistics } },
        }),
      );
    }

    // Return simplified result - just summary and first few rows for AI context
    const preview = data.data.slice(0, 3);
    return {
      rowCount: data.rows,
      executedQuery: query,
      preview: preview,
    };
  },
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "The SQL query to execute against ClickHouse. Always include LIMIT clause." },
    },
    required: ["query"],
  },
  outputSchema: {},
  transformToContent: (result) => [
    { type: "text", text: `Query executed: ${result.executedQuery}\nRows returned: ${result.rowCount}\nSample data: ${JSON.stringify(result.preview, null, 2)}` },
  ],
};

// Export all tools with raw JSON Schema
export const clickhouseTools = [
  listTablesTool,
  getTableSchemaTool,
  executeQueryTool,
];
