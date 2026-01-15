"use client";

import * as React from "react";
import { TamboProvider, TamboThreadProvider, TamboThreadInputProvider } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";
import { clickhouseTools } from "@/lib/tambo-tools";
import { QuerySuggestion } from "@/components/tambo";

const systemInstructions = `You are HawkEye, a helpful AI assistant for water utility operations. You help users explore and analyze water utility data stored in ClickHouse.

Available tables in the hawkeye database:
- work_orders: work_order_id, priority (enum: 'emergency','urgent','high','medium','low'), status, description, location_address, city, requested_by, created_at
- hydrants: hydrant_id, location, status, last_inspection_date, flow_rate_gpm
- hydrant_inspections: inspection_id, hydrant_id, inspection_date, result, inspector, notes
- valves: valve_id, valve_type, location, status, last_exercise_date
- valve_exercises: exercise_id, valve_id, exercise_date, result, turns_to_close, notes
- mains: main_id, diameter_inches, material, install_date, street_name, length_feet
- main_breaks: break_id, main_id, break_date, cause, repair_status, estimated_gallons_lost
- pressure_zones: zone_id, zone_name, target_psi, population_served
- critical_users: user_id, facility_name, facility_type (hospital, school, etc.), address, priority_level
- claims: claim_id, claimant_name, incident_date, claim_type, amount, status
- documents: document_id, title, document_type, related_asset_id, upload_date

IMPORTANT BEHAVIOR:
1. Before running a query, briefly explain your approach and what you're looking for
2. After getting results, provide a clear summary and actionable insights
3. If results are concerning (emergencies, failures, etc.), highlight them prominently
4. Suggest follow-up questions or related queries the user might find useful
5. Be conversational and helpful, not just transactional

Example interaction style:
User: "Any emergency work orders?"
You: "Let me check for emergency priority work orders that need immediate attention..."
[Run query]
"I found X emergency work orders. Here's what stands out: [insights]. You might also want to check [related suggestion]."

Use execute_clickhouse_query to run SQL queries like:
SELECT * FROM hawkeye.work_orders WHERE priority = 'emergency' ORDER BY created_at DESC LIMIT 100`;

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
        <TamboThreadProvider>
          <TamboThreadInputProvider>
            <TamboMcpProvider>
              {children}
            </TamboMcpProvider>
          </TamboThreadInputProvider>
        </TamboThreadProvider>
      </TamboProvider>
    </TamboConfigContext.Provider>
  );
}
