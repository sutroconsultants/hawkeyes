"use client";

import * as React from "react";
import { TamboProvider } from "@tambo-ai/react";
import { clickhouseTools } from "@/lib/tambo-tools";
import { QuerySuggestion } from "@/components/tambo";

const BASE_INSTRUCTIONS = `You are HawkEye, a helpful AI assistant for water utility operations. You help users explore and analyze water utility data stored in ClickHouse.

WORKFLOW:
1. When user asks about data, briefly explain what you'll look for
2. Use suggest_query tool to show the SQL query - this displays an interactive card with Run Query button
3. The user will click "Run Query" to execute it

RESPONSE STYLE:
- Be brief and conversational
- Don't repeat yourself

QUERY RULES:
- Always use LIMIT (default 100)
- For Enum columns use string values: WHERE priority = 'emergency'
- Use hawkeye database: SELECT * FROM hawkeye.table_name
- Use the exact column names from the schema below`;

interface TableSchema {
  name: string;
  database: string;
  columns: Array<{ name: string; type: string }>;
}

async function fetchAllSchemas(): Promise<string> {
  try {
    // First get all tables
    const tablesRes = await fetch("/api/clickhouse/tables");
    if (!tablesRes.ok) return "";

    const tablesData = await tablesRes.json();
    const tables = tablesData.tables as Array<{ name: string; database: string }>;

    // Fetch schema for each table in parallel
    const schemaPromises = tables.map(async (table): Promise<TableSchema | null> => {
      try {
        const res = await fetch(
          `/api/clickhouse/columns?database=${table.database}&table=${table.name}`
        );
        if (!res.ok) return null;
        const data = await res.json();
        return {
          name: table.name,
          database: table.database,
          columns: data.columns,
        };
      } catch {
        return null;
      }
    });

    const schemas = (await Promise.all(schemaPromises)).filter(Boolean) as TableSchema[];

    // Format schemas as readable text
    const schemaText = schemas
      .map((schema) => {
        const cols = schema.columns
          .map((c) => `  ${c.name}: ${c.type}`)
          .join("\n");
        return `${schema.database}.${schema.name}:\n${cols}`;
      })
      .join("\n\n");

    return schemaText;
  } catch (error) {
    console.error("Failed to fetch schemas:", error);
    return "";
  }
}

interface TamboProviderWrapperProps {
  children: React.ReactNode;
}

// Context to check if Tambo is configured
export const TamboConfigContext = React.createContext<{ isConfigured: boolean }>({
  isConfigured: false,
});

export function useTamboConfig() {
  return React.useContext(TamboConfigContext);
}

export function TamboProviderWrapper({ children }: TamboProviderWrapperProps) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;
  const [schemaText, setSchemaText] = React.useState<string>("");
  const tamboComponents = React.useMemo(() => [QuerySuggestion], []);

  // Fetch schemas on mount
  React.useEffect(() => {
    fetchAllSchemas().then(setSchemaText);
  }, []);

  // Create the system instructions helper that includes dynamic schema
  const systemInstructionsHelper = React.useCallback(() => {
    if (!schemaText) {
      return BASE_INSTRUCTIONS + "\n\n(Schema loading...)";
    }
    return `${BASE_INSTRUCTIONS}

Available tables and their schemas:

${schemaText}`;
  }, [schemaText]);

  if (!apiKey) {
    console.warn(
      "NEXT_PUBLIC_TAMBO_API_KEY is not set. AI features will not work."
    );
    return (
      <TamboConfigContext.Provider value={{ isConfigured: false }}>
        {children}
      </TamboConfigContext.Provider>
    );
  }

  // NOTE: TamboProvider already creates TamboThreadProvider, TamboThreadInputProvider,
  // and TamboMcpProvider internally. Do NOT wrap with duplicate providers.
  return (
    <TamboConfigContext.Provider value={{ isConfigured: true }}>
      <TamboProvider
        apiKey={apiKey}
        tools={clickhouseTools}
        components={tamboComponents}
        contextHelpers={{ system_instructions: systemInstructionsHelper }}
        streaming={true}
      >
        {children}
      </TamboProvider>
    </TamboConfigContext.Provider>
  );
}
