"use client";

import * as React from "react";
import { TamboProvider } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";
import { clickhouseTools } from "@/lib/tambo-tools";
import { QuerySuggestion } from "@/components/tambo";

const systemInstructions = `You help users query EBMUD water utility data in ClickHouse.

Available tables in the ebmud database:
- work_orders: columns include work_order_id, priority (enum: 'emergency','urgent','high','medium','low'), status, description, location_address, city, requested_by
- hydrants, hydrant_inspections, valves, valve_exercises, mains, main_breaks, pressure_zones, critical_users, claims

When answering questions, directly use execute_clickhouse_query with a SQL query like:
SELECT * FROM ebmud.work_orders WHERE priority = 'emergency' LIMIT 100

Describe results in plain English after the query runs.`;

const systemInstructionsHelper = () => systemInstructions;

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
  const tamboComponents = React.useMemo(
    () => [QuerySuggestion],  // Removed associatedTools to test
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
        streaming={true}
      >
        <TamboMcpProvider>
          {children}
        </TamboMcpProvider>
      </TamboProvider>
    </TamboConfigContext.Provider>
  );
}
