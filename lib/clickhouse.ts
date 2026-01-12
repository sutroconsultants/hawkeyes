import { createClient, ClickHouseClient } from "@clickhouse/client";

let client: ClickHouseClient | null = null;

export function getClickHouseClient(): ClickHouseClient {
  if (!client) {
    client = createClient({
      url: process.env.CLICKHOUSE_HOST || "http://localhost:8123",
      username: process.env.CLICKHOUSE_USER || "default",
      password: process.env.CLICKHOUSE_PASSWORD || "clickhouse",
      database: process.env.CLICKHOUSE_DATABASE || "hawkeyes",
    });
  }
  return client;
}

export interface TableInfo {
  name: string;
  database: string;
  engine: string;
  total_rows: string;
  total_bytes: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  default_kind: string;
  default_expression: string;
  comment: string;
}

export async function getTables(): Promise<TableInfo[]> {
  const client = getClickHouseClient();
  const result = await client.query({
    query: `
      SELECT
        name,
        database,
        engine,
        toString(total_rows) as total_rows,
        toString(total_bytes) as total_bytes
      FROM system.tables
      WHERE database NOT IN ('system', 'INFORMATION_SCHEMA', 'information_schema')
      ORDER BY database, name
    `,
    format: "JSONEachRow",
  });
  return await result.json<TableInfo>();
}

export async function getTableColumns(
  database: string,
  table: string
): Promise<ColumnInfo[]> {
  const client = getClickHouseClient();
  const result = await client.query({
    query: `
      SELECT
        name,
        type,
        default_kind,
        default_expression,
        comment
      FROM system.columns
      WHERE database = {database:String} AND table = {table:String}
      ORDER BY position
    `,
    query_params: { database, table },
    format: "JSONEachRow",
  });
  return await result.json<ColumnInfo>();
}

export interface QueryResult {
  data: Record<string, unknown>[];
  rows: number;
  statistics: {
    elapsed: number;
    rows_read: number;
    bytes_read: number;
  };
}

export async function executeQuery(query: string): Promise<QueryResult> {
  const client = getClickHouseClient();
  const result = await client.query({
    query,
    format: "JSONEachRow",
  });
  const data = await result.json<Record<string, unknown>>();
  return {
    data,
    rows: data.length,
    statistics: {
      elapsed: 0,
      rows_read: data.length,
      bytes_read: 0,
    },
  };
}

export async function getDatabases(): Promise<string[]> {
  const client = getClickHouseClient();
  const result = await client.query({
    query: `
      SELECT name
      FROM system.databases
      WHERE name NOT IN ('system', 'INFORMATION_SCHEMA', 'information_schema')
      ORDER BY name
    `,
    format: "JSONEachRow",
  });
  const databases = await result.json<{ name: string }>();
  return databases.map((d) => d.name);
}
