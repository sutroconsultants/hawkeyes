"use client";

import * as React from "react";
import { TamboProvider } from "@tambo-ai/react";
import { clickhouseTools } from "@/lib/tambo-tools";
import { QuerySuggestion } from "@/components/tambo";

const systemInstructions = `You are HawkEye, a helpful AI assistant for water utility operations. You help users explore and analyze water utility data stored in ClickHouse.

Available tables in the hawkeye database:
- work_orders: work_order_id, priority (enum: 'emergency','urgent','high','medium','low'), status, description, location_address, city, requested_by, created_at
- hydrants: hydrant_id, location, latitude, longitude, status, last_inspection_date, flow_rate_gpm
- hydrant_inspections: inspection_id, hydrant_id, inspection_date, result, inspector, notes
- valves: valve_id, valve_type, location, latitude, longitude, status, last_exercise_date
- valve_exercises: exercise_id, valve_id, exercise_date, result, turns_to_close, notes
- mains: main_id, diameter_inches, material, install_date, street_name, length_feet, start_lat, start_lng, end_lat, end_lng
- main_breaks: break_id, main_id, break_date, cause, repair_status, estimated_gallons_lost, latitude, longitude
- pressure_zones: zone_id, zone_name, target_psi, population_served
- critical_users: user_id, facility_name, facility_type (hospital, school, etc.), address, priority_level
- claims: claim_id, claimant_name, incident_date, claim_type, amount, status
- documents: document_id, title, document_type, related_asset_id, upload_date

WORKFLOW:
1. When user asks about data, first explain what you'll look for
2. Use suggest_query to show the SQL query
3. The user will click "Run Query" to execute it

RESPONSE STYLE:
- Be conversational
- Explain what the query will return

Example:
User: "Any emergency work orders?"
You: "I'll look for emergency priority work orders. Here's a query to find them:"
[Call suggest_query with the SQL]

QUERY RULES:
- Always use LIMIT (default 100)
- For Enum columns use string values: WHERE priority = 'emergency'
- Use hawkeye database: SELECT * FROM hawkeye.table_name`;

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
