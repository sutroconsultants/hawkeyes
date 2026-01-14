"use client";

import * as React from "react";
import { z } from "zod";
import { Play, Copy, Check } from "lucide-react";
import type { TamboComponent } from "@tambo-ai/react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { QUERY_SUGGESTION_EVENT } from "@/lib/tambo-events";

export { QUERY_SUGGESTION_EVENT };

const querySuggestionPropsSchema = z
  .object({
    query: z
      .string()
      .optional()
      .describe("The SQL query to suggest running in the SQL editor."),
    sql: z
      .string()
      .optional()
      .describe("Alias for query (SQL string)."),
    title: z.string().optional().describe("Optional title for the suggestion."),
    description: z
      .string()
      .optional()
      .describe("Optional description of what the query returns."),
    summary: z
      .string()
      .optional()
      .describe("Alias for description (brief summary)."),
  })
  .refine((data) => Boolean((data.query ?? data.sql)?.trim()), {
    message: "Query is required",
    path: ["query"],
  });

export type QuerySuggestionProps = z.infer<typeof querySuggestionPropsSchema>;

export function QuerySuggestionView({
  query,
  sql,
  title,
  description,
  summary,
}: QuerySuggestionProps) {
  const [copied, setCopied] = React.useState(false);
  const finalQuery = query?.trim() || sql?.trim() || "";
  const finalDescription = description ?? summary;

  if (!finalQuery) {
    return null;
  }

  const handleRunQuery = () => {
    window.dispatchEvent(
      new CustomEvent(QUERY_SUGGESTION_EVENT, {
        detail: { query: finalQuery },
      }),
    );
  };

  const handleCopyQuery = async () => {
    await navigator.clipboard.writeText(finalQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {title && (
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
      )}
      {finalDescription && (
        <p className="text-sm text-muted-foreground">{finalDescription}</p>
      )}
      <div className="bg-muted/50 rounded-md p-3 overflow-x-auto">
        <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all">
          {finalQuery}
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

export const QuerySuggestion: TamboComponent = {
  name: "QuerySuggestion",
  description:
    "Shows a SQL query with Run/Copy actions so the user can execute it.",
  component: QuerySuggestionView,
  propsSchema: querySuggestionPropsSchema,
};
