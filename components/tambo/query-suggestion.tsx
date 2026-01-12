"use client";

import * as React from "react";
import { Play, Copy, Check } from "lucide-react";
import { z } from "zod";
import type { TamboComponent } from "@tambo-ai/react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

// Event to communicate with the SQL editor
export const QUERY_SUGGESTION_EVENT = "tambo:run-query";

// Props schema for Tambo
const querySuggestionPropsSchema = z.object({
  query: z.string().describe("The SQL query to suggest running"),
  description: z.string().optional().describe("A brief description of what this query does"),
  title: z.string().optional().describe("Optional title for the query suggestion"),
});

export type QuerySuggestionProps = z.infer<typeof querySuggestionPropsSchema>;

function QuerySuggestionComponent({ query, description, title }: QuerySuggestionProps) {
  const [copied, setCopied] = React.useState(false);

  // Don't render if no query provided
  if (!query || query.trim() === "") {
    return null;
  }

  const handleRunQuery = () => {
    // Dispatch a custom event that the SQL editor can listen to
    window.dispatchEvent(
      new CustomEvent(QUERY_SUGGESTION_EVENT, {
        detail: { query },
      })
    );
  };

  const handleCopyQuery = async () => {
    await navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {title && (
        <h4 className="font-medium text-sm text-foreground">{title}</h4>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="bg-muted/50 rounded-md p-3 overflow-x-auto">
        <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all">
          {query}
        </pre>
      </div>
      <ButtonGroup>
        <Button size="sm" onClick={handleRunQuery}>
          <Play className="h-3.5 w-3.5" />
          Run Query
        </Button>
        <Button size="sm" variant="outline" onClick={handleCopyQuery}>
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </ButtonGroup>
    </div>
  );
}

// Export as TamboComponent for registration
export const QuerySuggestion: TamboComponent = {
  name: "QuerySuggestion",
  description: `Shows a SQL query with "Run Query" and "Copy" buttons.

REQUIRED after every execute_clickhouse_query call.
Use the executedQuery value from the tool response as the query prop.

Example: <QuerySuggestion query={result.executedQuery} title="View Results" />`,
  component: QuerySuggestionComponent,
  propsSchema: querySuggestionPropsSchema,
};
