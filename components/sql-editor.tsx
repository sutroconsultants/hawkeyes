"use client";

import * as React from "react";
import { Play, Loader2, Copy, Check, Download } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { QUERY_SUGGESTION_EVENT } from "@/components/tambo/query-suggestion";

interface QueryResult {
  data: Record<string, unknown>[];
  rows: number;
  statistics: {
    elapsed: number;
    rows_read: number;
    bytes_read: number;
  };
}

interface SqlEditorProps {
  initialQuery?: string;
  selectedTable?: { database: string; table: string } | null;
}

export function SqlEditor({ initialQuery = "", selectedTable }: SqlEditorProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [result, setResult] = React.useState<QueryResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (selectedTable) {
      setQuery(`SELECT * FROM ${selectedTable.database}.${selectedTable.table} LIMIT 100`);
    }
  }, [selectedTable]);

  const executeQuery = React.useCallback(async () => {
    if (!query?.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/clickhouse/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to execute query");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        executeQuery();
      }
    },
    [executeQuery]
  );

  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Listen for query suggestions from Tambo
  React.useEffect(() => {
    const handleQuerySuggestion = (e: CustomEvent<{ query: string }>) => {
      const suggestedQuery = e.detail.query;
      setQuery(suggestedQuery);
      // Execute the query after a brief delay to allow state to update
      setTimeout(async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
          const response = await fetch("/api/clickhouse/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: suggestedQuery }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to execute query");
          }
          setResult(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
          setIsLoading(false);
        }
      }, 100);
    };

    window.addEventListener(
      QUERY_SUGGESTION_EVENT,
      handleQuerySuggestion as EventListener
    );
    return () => {
      window.removeEventListener(
        QUERY_SUGGESTION_EVENT,
        handleQuerySuggestion as EventListener
      );
    };
  }, []);

  const copyToClipboard = async () => {
    if (result?.data) {
      await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadCsv = () => {
    if (!result?.data || result.data.length === 0) return;

    const headers = Object.keys(result.data[0]);
    const csvContent = [
      headers.join(","),
      ...result.data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            const stringValue = value === null ? "" : String(value);
            return stringValue.includes(",") || stringValue.includes('"')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query-results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const columns = result?.data?.[0] ? Object.keys(result.data[0]) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Query Editor Section */}
      <div className="border-b">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <h2 className="text-sm font-semibold">SQL Query</h2>
          <Button
            onClick={executeQuery}
            disabled={isLoading || !query?.trim()}
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Query
          </Button>
        </div>
        <div className="border-b">
          <CodeMirror
            value={query}
            height="150px"
            extensions={[sql()]}
            theme={oneDark}
            onChange={(value) => setQuery(value)}
            placeholder="SELECT * FROM your_table LIMIT 100"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightActiveLine: true,
              foldGutter: true,
              autocompletion: true,
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground px-4 py-2">
          Press Cmd/Ctrl + Enter to run query
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-3 border-b bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
            <h2 className="text-sm font-semibold">
              Results ({result.rows} rows)
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copied" : "Copy JSON"}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCsv}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </div>
          <Tabs defaultValue="table" className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2 border-b">
              <TabsList>
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="table" className="flex-1 m-0 min-h-0">
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead
                          key={column}
                          className="font-mono text-xs bg-muted/50 sticky top-0"
                        >
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.data.map((row, rowIndex) => (
                      <TableRow
                        key={rowIndex}
                      >
                        {columns.map((column) => (
                          <TableCell
                            key={column}
                            className="font-mono text-xs"
                          >
                            {row[column] === null
                              ? "NULL"
                              : typeof row[column] === "object"
                              ? JSON.stringify(row[column])
                              : String(row[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="json" className="flex-1 m-0 min-h-0">
              <ScrollArea className="h-full">
                <pre className="p-4 text-xs font-mono">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
