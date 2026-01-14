"use client";

import * as React from "react";
import { Play, Loader2, Copy, Check, Download, X } from "lucide-react";
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
import { QUERY_SUGGESTION_EVENT } from "@/lib/tambo-events";

interface QueryResult {
  data: Record<string, unknown>[];
  rows: number;
  statistics: {
    elapsed: number;
    rows_read: number;
    bytes_read: number;
  };
}

interface QueryTab {
  id: string;
  query: string;
  result: QueryResult | null;
  error: string | null;
  title: string;
}

const STORAGE_KEY_TABS = "hawkeyes-query-tabs";
const STORAGE_KEY_ACTIVE_TAB = "hawkeyes-active-tab";

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getShortQueryTitle(query: string): string {
  const cleaned = query.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 30) return cleaned;
  return cleaned.slice(0, 30) + "...";
}

function loadTabsFromStorage(): QueryTab[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TABS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function saveTabsToStorage(tabs: QueryTab[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabs));
  } catch {
    // Ignore storage errors
  }
}

function loadActiveTabFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY_ACTIVE_TAB);
}

function saveActiveTabToStorage(tabId: string | null) {
  if (typeof window === "undefined") return;
  if (tabId) {
    localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, tabId);
  } else {
    localStorage.removeItem(STORAGE_KEY_ACTIVE_TAB);
  }
}

interface SqlEditorProps {
  initialQuery?: string;
  selectedTable?: { database: string; table: string } | null;
}

export function SqlEditor({ initialQuery = "", selectedTable }: SqlEditorProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [isLoading, setIsLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Query result tabs
  const [tabs, setTabs] = React.useState<QueryTab[]>([]);
  const [activeTabId, setActiveTabId] = React.useState<string | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

  // Load tabs from localStorage on mount
  React.useEffect(() => {
    const savedTabs = loadTabsFromStorage();
    const savedActiveTab = loadActiveTabFromStorage();
    setTabs(savedTabs);
    if (savedActiveTab && savedTabs.some(t => t.id === savedActiveTab)) {
      setActiveTabId(savedActiveTab);
    } else if (savedTabs.length > 0) {
      setActiveTabId(savedTabs[0].id);
    }
    setIsMounted(true);
  }, []);

  // Save tabs to localStorage when they change
  React.useEffect(() => {
    if (isMounted) {
      saveTabsToStorage(tabs);
    }
  }, [tabs, isMounted]);

  // Save active tab to localStorage when it changes
  React.useEffect(() => {
    if (isMounted) {
      saveActiveTabToStorage(activeTabId);
    }
  }, [activeTabId, isMounted]);

  React.useEffect(() => {
    if (selectedTable) {
      setQuery(`SELECT * FROM ${selectedTable.database}.${selectedTable.table} LIMIT 100`);
    }
  }, [selectedTable]);

  const addOrUpdateTab = React.useCallback((queryText: string, result: QueryResult | null, error: string | null) => {
    const title = getShortQueryTitle(queryText);

    // Check if a tab with the same query already exists
    const existingTab = tabs.find(t => t.query.trim() === queryText.trim());

    if (existingTab) {
      // Update existing tab
      setTabs(prev => prev.map(t =>
        t.id === existingTab.id
          ? { ...t, result, error, title }
          : t
      ));
      setActiveTabId(existingTab.id);
    } else {
      // Create new tab
      const newTab: QueryTab = {
        id: generateTabId(),
        query: queryText,
        result,
        error,
        title,
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
    }
  }, [tabs]);

  const closeTab = React.useCallback((tabId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      // If we're closing the active tab, switch to another one
      if (activeTabId === tabId && newTabs.length > 0) {
        const closedIndex = prev.findIndex(t => t.id === tabId);
        const newActiveIndex = Math.min(closedIndex, newTabs.length - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }
      return newTabs;
    });
  }, [activeTabId]);

  const executeQuery = React.useCallback(async () => {
    if (!query?.trim()) return;

    setIsLoading(true);

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

      addOrUpdateTab(query, data, null);
    } catch (err) {
      addOrUpdateTab(query, null, err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [query, addOrUpdateTab]);

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
    const handleQuerySuggestion = (
      e: CustomEvent<{ query: string; result?: QueryResult }>
    ) => {
      const suggestedQuery = e.detail.query;
      const suggestedResult = e.detail.result;
      setQuery(suggestedQuery);

      if (suggestedResult) {
        addOrUpdateTab(suggestedQuery, suggestedResult, null);
        return;
      }

      setIsLoading(true);
      fetch("/api/clickhouse/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: suggestedQuery }),
      })
        .then((response) => response.json().then((data) => ({ response, data })))
        .then(({ response, data }) => {
          if (!response.ok) {
            throw new Error(data.error || "Failed to execute query");
          }
          addOrUpdateTab(suggestedQuery, data, null);
        })
        .catch((err) => {
          addOrUpdateTab(
            suggestedQuery,
            null,
            err instanceof Error ? err.message : "Unknown error"
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
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
  }, [addOrUpdateTab]);

  const activeTab = tabs.find(t => t.id === activeTabId);

  const copyToClipboard = async () => {
    if (activeTab?.result?.data) {
      await navigator.clipboard.writeText(JSON.stringify(activeTab.result.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadCsv = () => {
    if (!activeTab?.result?.data || activeTab.result.data.length === 0) return;

    const headers = Object.keys(activeTab.result.data[0]);
    const csvContent = [
      headers.join(","),
      ...activeTab.result.data.map((row) =>
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

  const columns = activeTab?.result?.data?.[0] ? Object.keys(activeTab.result.data[0]) : [];

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

      {/* Results Section with Query Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Query Result Tabs */}
        {tabs.length > 0 && (
          <div className="border-b bg-muted/30">
            <ScrollArea className="w-full">
              <div className="flex items-center px-2 py-1 gap-1">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveTabId(tab.id)}
                    onKeyDown={(e) => e.key === "Enter" && setActiveTabId(tab.id)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 text-xs rounded-md cursor-pointer
                      max-w-[200px] group shrink-0
                      ${activeTabId === tab.id
                        ? "bg-background border shadow-sm"
                        : "hover:bg-muted/50 text-muted-foreground"
                      }
                    `}
                  >
                    <span className="truncate font-mono">
                      {tab.title}
                    </span>
                    {tab.error && (
                      <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                    )}
                    <button
                      onClick={(e) => closeTab(tab.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5 shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Active Tab Content */}
        {activeTab ? (
          <>
            {/* Error Display */}
            {activeTab.error && (
              <div className="px-4 py-3 border-b bg-destructive/10">
                <p className="text-sm text-destructive">{activeTab.error}</p>
              </div>
            )}

            {/* Results */}
            {activeTab.result && (
              <>
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                  <h2 className="text-sm font-semibold">
                    Results ({activeTab.result.rows} rows)
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
                          {activeTab.result.data.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
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
                        {JSON.stringify(activeTab.result.data, null, 2)}
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Run a query to see results</p>
          </div>
        )}
      </div>
    </div>
  );
}
