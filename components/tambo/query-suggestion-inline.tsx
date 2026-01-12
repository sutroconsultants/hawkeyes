"use client";

import * as React from "react";
import { Play, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { QUERY_SUGGESTION_EVENT } from "@/components/tambo/query-suggestion";

interface QuerySuggestionInlineProps {
  query: string;
  title?: string;
}

export function QuerySuggestionInline({ query, title }: QuerySuggestionInlineProps) {
  const [copied, setCopied] = React.useState(false);

  const handleRunQuery = () => {
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
    <div className="rounded-lg border bg-card p-3 space-y-2 mt-2">
      {title && (
        <h4 className="font-medium text-xs text-foreground">{title}</h4>
      )}
      <div className="bg-muted/50 rounded-md p-2 overflow-x-auto">
        <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all">
          {query}
        </pre>
      </div>
      <ButtonGroup>
        <Button size="sm" onClick={handleRunQuery}>
          <Play className="h-3 w-3" />
          Run Query
        </Button>
        <Button size="sm" variant="outline" onClick={handleCopyQuery}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </ButtonGroup>
    </div>
  );
}

// Parse text for QuerySuggestion JSX and extract props
export function parseQuerySuggestion(text: string): { cleanText: string; query?: string; title?: string } {
  // Match <QuerySuggestion query="..." title="..." /> pattern
  const regex = /<QuerySuggestion\s+query=["']([^"']+)["'](?:\s+title=["']([^"']+)["'])?\s*\/>/;
  const match = text.match(regex);

  if (match) {
    const cleanText = text.replace(regex, "").trim();
    return {
      cleanText,
      query: match[1],
      title: match[2],
    };
  }

  const sqlBlockRegex = /```sql\s*([\s\S]*?)```/i;
  const sqlMatch = text.match(sqlBlockRegex);
  if (sqlMatch) {
    const cleanText = text.replace(sqlBlockRegex, "").trim();
    return {
      cleanText,
      query: sqlMatch[1]?.trim(),
    };
  }

  return { cleanText: text };
}

// Extract query from tool result content (for when AI doesn't render component)
export function extractQueryFromToolResult(content: unknown): string | null {
  if (!content) return null;

  const parseQueryObject = (value: unknown): string | null => {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    if (typeof record.executedQuery === "string") return record.executedQuery;
    if (typeof record.query === "string") return record.query;
    if (typeof record.sql === "string") return record.sql;
    return null;
  };

  const parseQueryText = (text: string): string | null => {
    try {
      return parseQueryObject(JSON.parse(text));
    } catch {
      return null;
    }
  };

  if (Array.isArray(content)) {
    for (const block of content) {
      if (!block || typeof block !== "object") continue;
      const part = block as { type?: string; content?: unknown; text?: string };

      if (part.type === "tool_result" && part.content) {
        if (typeof part.content === "string") {
          const query = parseQueryText(part.content);
          if (query) return query;
        } else {
          const query = parseQueryObject(part.content);
          if (query) return query;
        }
      }

      if (part.type === "text" && typeof part.text === "string") {
        const query = parseQueryText(part.text);
        if (query) return query;
      }
    }
  }

  if (typeof content === "string") {
    return parseQueryText(content);
  }

  return parseQueryObject(content);
}
