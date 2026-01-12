"use client";

import * as React from "react";
import {
  TamboProvider,
} from "@tambo-ai/react";
import { clickhouseTools, executeQueryTool } from "@/lib/tambo-tools";
import { DataChart, DataTable, QuerySuggestion } from "@/components/tambo";

const systemInstructions = `You help users query EBMUD water utility data in ClickHouse.

When answering questions:
1. Always use get_table_schema to confirm relevant columns before writing queries
2. Always use execute_clickhouse_query to answer data questions; do not answer from memory
3. Describe results clearly in plain English
4. After executing a query, render a QuerySuggestion component with the SQL (do not paste raw SQL unless asked)`;

const systemInstructionsHelper = () => systemInstructions;

interface ProvidersProps {
  children: React.ReactNode;
}

// Context to check if Tambo is configured
export const TamboConfigContext = React.createContext<{ isConfigured: boolean }>({
  isConfigured: false,
});

export function useTamboConfig() {
  return React.useContext(TamboConfigContext);
}

export function Providers({ children }: ProvidersProps) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;
  const tamboComponents = React.useMemo(
    () => [
      DataTable,
      DataChart,
      { ...QuerySuggestion, associatedTools: [executeQueryTool] },
    ],
    []
  );

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

  return (
    <TamboConfigContext.Provider value={{ isConfigured: true }}>
      <TamboProvider
        apiKey={apiKey}
        tools={clickhouseTools}
        components={tamboComponents}
        contextHelpers={{ system_instructions: systemInstructionsHelper }}
      >
        {children}
      </TamboProvider>
    </TamboConfigContext.Provider>
  );
}
