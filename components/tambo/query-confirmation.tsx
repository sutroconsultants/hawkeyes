"use client";

import * as React from "react";
import { z } from "zod";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUERY_SUGGESTION_EVENT } from "@/lib/tambo-events";
import { useTamboCurrentComponent } from "@tambo-ai/react";
import type { TamboComponent } from "@tambo-ai/react";

// Props schema for Tambo AI to understand
export const QueryConfirmationPropsSchema = z.object({
  sql: z.string().describe("The complete SQL query to execute. Example: 'SELECT * FROM hawkeye.work_orders WHERE priority = \\'emergency\\' LIMIT 100'. This MUST contain the actual query text."),
  summary: z.string().describe("A brief 1-2 sentence description of what the query returns. Example: 'Shows all emergency work orders from the database.'"),
});

export type QueryConfirmationProps = z.infer<typeof QueryConfirmationPropsSchema>;

export function QueryConfirmation({ sql: sqlProp, summary: summaryProp }: QueryConfirmationProps) {
  // Get props from Tambo message context (this is how streaming props are passed)
  const currentComponent = useTamboCurrentComponent();
  const sql = currentComponent?.props?.sql ?? sqlProp ?? "";
  const summary = currentComponent?.props?.summary ?? summaryProp ?? "";

  const [executed, setExecuted] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  const handleRunQuery = () => {
    if (!sql) return;
    // Dispatch event to SQL editor to run the query in a new tab
    window.dispatchEvent(
      new CustomEvent(QUERY_SUGGESTION_EVENT, {
        detail: { query: sql },
      })
    );
    setExecuted(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (dismissed) {
    return (
      <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
        Query dismissed
      </div>
    );
  }

  if (executed) {
    return (
      <div className="rounded-lg border bg-green-500/10 border-green-500/20 p-3 text-sm text-green-600 dark:text-green-400">
        Query sent to editor - check the results tab
      </div>
    );
  }

  // Show error if no query provided
  if (!sql) {
    return (
      <div className="rounded-lg border bg-destructive/10 border-destructive/20 p-3 text-sm text-destructive">
        Error: No SQL query provided
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Summary */}
      {summary && <p className="text-sm text-foreground">{summary}</p>}

      {/* Query preview */}
      <div className="bg-muted/50 rounded-md p-3 overflow-x-auto">
        <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all">
          {sql}
        </pre>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleRunQuery} className="flex-1">
          <Play className="h-3 w-3 mr-2" />
          Run Query
        </Button>
        <Button size="sm" variant="outline" onClick={handleDismiss}>
          <X className="h-3 w-3 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

// Export as TamboComponent for registration
export const QueryConfirmationComponent: TamboComponent = {
  name: "QueryConfirmation",
  component: QueryConfirmation,
  description: "Shows a SQL query with a summary and Run/Cancel buttons. Use this after generating a query so the user can review and confirm before execution.",
  propsSchema: QueryConfirmationPropsSchema,
};
