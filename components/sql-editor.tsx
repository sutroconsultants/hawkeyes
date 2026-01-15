"use client";

import * as React from "react";
import { Play, Loader2, Copy, Check, Download, X, ChevronDown } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QUERY_SUGGESTION_EVENT } from "@/lib/tambo-events";

// Complex query examples for the dropdown
const QUERY_EXAMPLES = [
  {
    category: "JOINs",
    queries: [
      {
        name: "Work Orders with Main Break Details",
        query: `SELECT
  wo.work_order_id,
  wo.priority,
  wo.status,
  wo.description,
  mb.break_date,
  mb.cause,
  mb.estimated_gallons_lost,
  m.material,
  m.diameter as pipe_diameter
FROM hawkeye.work_orders wo
JOIN hawkeye.main_breaks mb ON wo.asset_id = mb.break_id
JOIN hawkeye.mains m ON mb.main_id = m.main_id
WHERE wo.work_type = 'repair'
ORDER BY mb.break_date DESC
LIMIT 50`,
      },
      {
        name: "Hydrant Inspections with Location",
        query: `SELECT
  h.hydrant_id,
  h.location_address,
  h.city,
  hi.inspection_date,
  hi.result,
  hi.inspector_name,
  hi.static_pressure,
  hi.flow_rate
FROM hawkeye.hydrants h
JOIN hawkeye.hydrant_inspections hi ON h.hydrant_id = hi.hydrant_id
WHERE hi.result = 'fail'
ORDER BY hi.inspection_date DESC
LIMIT 100`,
      },
      {
        name: "Valve Exercises by Pressure Zone",
        query: `SELECT
  v.valve_id,
  v.valve_type,
  v.location_address,
  pz.zone_name,
  ve.exercise_date,
  ve.result,
  ve.turns_achieved,
  ve.turns_expected
FROM hawkeye.valves v
JOIN hawkeye.pressure_zones pz ON v.pressure_zone = pz.zone_id
JOIN hawkeye.valve_exercises ve ON v.valve_id = ve.valve_id
WHERE ve.result != 'pass'
ORDER BY ve.exercise_date DESC
LIMIT 100`,
      },
    ],
  },
  {
    category: "Aggregations",
    queries: [
      {
        name: "Work Orders by Priority (Count)",
        query: `SELECT
  priority,
  status,
  count(*) as order_count,
  round(avg(total_cost), 2) as avg_cost
FROM hawkeye.work_orders
GROUP BY priority, status
ORDER BY priority, status`,
      },
      {
        name: "Main Breaks by Year and Cause",
        query: `SELECT
  toYear(break_date) as year,
  cause,
  count(*) as break_count,
  sum(estimated_gallons_lost) as total_gallons_lost,
  round(avg(total_repair_cost), 2) as avg_repair_cost
FROM hawkeye.main_breaks
GROUP BY year, cause
ORDER BY year DESC, break_count DESC`,
      },
      {
        name: "Hydrant Inspection Pass Rate by City",
        query: `SELECT
  h.city,
  count(*) as total_inspections,
  countIf(hi.result = 'pass') as passed,
  countIf(hi.result = 'fail') as failed,
  round(countIf(hi.result = 'pass') * 100.0 / count(*), 1) as pass_rate_pct
FROM hawkeye.hydrant_inspections hi
JOIN hawkeye.hydrants h ON hi.hydrant_id = h.hydrant_id
GROUP BY h.city
ORDER BY total_inspections DESC`,
      },
      {
        name: "Critical Users by Type and Priority",
        query: `SELECT
  facility_type,
  priority_level,
  count(*) as facility_count
FROM hawkeye.critical_users
GROUP BY facility_type, priority_level
ORDER BY facility_type, priority_level`,
      },
    ],
  },
  {
    category: "Subqueries & CTEs",
    queries: [
      {
        name: "Mains with Above-Average Breaks",
        query: `WITH avg_breaks AS (
  SELECT avg(break_history_count) as avg_count
  FROM hawkeye.mains
)
SELECT
  m.main_id,
  m.street_name,
  m.material,
  m.diameter,
  m.break_history_count,
  m.condition_score
FROM hawkeye.mains m, avg_breaks
WHERE m.break_history_count > avg_breaks.avg_count
ORDER BY m.break_history_count DESC
LIMIT 50`,
      },
      {
        name: "Recent Claims with Break Info",
        query: `SELECT
  c.claim_id,
  c.claimant_name,
  c.claim_type,
  c.claimed_amount,
  c.status,
  mb.break_date,
  mb.cause,
  m.street_name
FROM hawkeye.claims c
JOIN hawkeye.main_breaks mb ON c.main_break_id = mb.break_id
JOIN hawkeye.mains m ON mb.main_id = m.main_id
WHERE c.incident_date >= today() - 365
ORDER BY c.claimed_amount DESC
LIMIT 50`,
      },
    ],
  },
];

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
  customTitle?: string; // User-defined title (overrides auto-generated)
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

  // Tab editing and multi-select
  const [editingTabId, setEditingTabId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState("");
  const [selectedTabIds, setSelectedTabIds] = React.useState<Set<string>>(new Set());
  const lastClickedTabRef = React.useRef<string | null>(null);

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
    // Remove from selection
    setSelectedTabIds(prev => {
      const next = new Set(prev);
      next.delete(tabId);
      return next;
    });
  }, [activeTabId]);

  // Close multiple selected tabs
  const closeSelectedTabs = React.useCallback(() => {
    if (selectedTabIds.size === 0) return;

    setTabs(prev => {
      const newTabs = prev.filter(t => !selectedTabIds.has(t.id));
      // If active tab was closed, switch to another
      if (activeTabId && selectedTabIds.has(activeTabId) && newTabs.length > 0) {
        setActiveTabId(newTabs[0].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }
      return newTabs;
    });
    setSelectedTabIds(new Set());
  }, [selectedTabIds, activeTabId]);

  // Handle tab click with shift for multi-select
  const handleTabClick = React.useCallback((tabId: string, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedTabRef.current) {
      // Shift+click: select range
      const startIndex = tabs.findIndex(t => t.id === lastClickedTabRef.current);
      const endIndex = tabs.findIndex(t => t.id === tabId);
      const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];

      const newSelection = new Set(selectedTabIds);
      for (let i = from; i <= to; i++) {
        newSelection.add(tabs[i].id);
      }
      setSelectedTabIds(newSelection);
    } else if (e.metaKey || e.ctrlKey) {
      // Cmd/Ctrl+click: toggle selection
      setSelectedTabIds(prev => {
        const next = new Set(prev);
        if (next.has(tabId)) {
          next.delete(tabId);
        } else {
          next.add(tabId);
        }
        return next;
      });
    } else {
      // Normal click: clear selection and select tab
      setSelectedTabIds(new Set());
      setActiveTabId(tabId);
    }
    lastClickedTabRef.current = tabId;
  }, [tabs, selectedTabIds]);

  // Handle double-click to edit tab name
  const handleTabDoubleClick = React.useCallback((tabId: string, currentTitle: string) => {
    setEditingTabId(tabId);
    setEditingTitle(currentTitle);
  }, []);

  // Save edited tab name
  const saveTabName = React.useCallback(() => {
    if (editingTabId && editingTitle.trim()) {
      setTabs(prev => prev.map(t =>
        t.id === editingTabId
          ? { ...t, customTitle: editingTitle.trim() }
          : t
      ));
    }
    setEditingTabId(null);
    setEditingTitle("");
  }, [editingTabId, editingTitle]);

  // Cancel editing
  const cancelEditing = React.useCallback(() => {
    setEditingTabId(null);
    setEditingTitle("");
  }, []);

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
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold">SQL Query</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Examples
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                {QUERY_EXAMPLES.map((category, idx) => (
                  <React.Fragment key={category.category}>
                    {idx > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      {category.category}
                    </DropdownMenuLabel>
                    {category.queries.map((example) => (
                      <DropdownMenuItem
                        key={example.name}
                        onClick={() => setQuery(example.query)}
                        className="text-xs cursor-pointer"
                      >
                        {example.name}
                      </DropdownMenuItem>
                    ))}
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                {tabs.map((tab) => {
                  const displayTitle = tab.customTitle || tab.title;
                  const isSelected = selectedTabIds.has(tab.id);
                  const isEditing = editingTabId === tab.id;

                  return (
                    <div
                      key={tab.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleTabClick(tab.id, e)}
                      onDoubleClick={() => handleTabDoubleClick(tab.id, displayTitle)}
                      onKeyDown={(e) => e.key === "Enter" && setActiveTabId(tab.id)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 text-xs rounded-md cursor-pointer
                        max-w-[200px] group shrink-0 transition-colors
                        ${activeTabId === tab.id
                          ? "bg-background border shadow-sm"
                          : isSelected
                          ? "bg-primary/20 border border-primary/50"
                          : "hover:bg-muted/50 text-muted-foreground"
                        }
                      `}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={saveTabName}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") saveTabName();
                            if (e.key === "Escape") cancelEditing();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="bg-transparent border-b border-primary outline-none w-full font-mono text-xs"
                        />
                      ) : (
                        <span className="truncate font-mono" title={displayTitle}>
                          {displayTitle}
                        </span>
                      )}
                      {tab.error && (
                        <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                      )}
                      <button
                        onClick={(e) => closeTab(tab.id, e)}
                        className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5 shrink-0"
                        title="Close tab"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
                {/* Close selected tabs button */}
                {selectedTabIds.size > 1 && (
                  <button
                    onClick={closeSelectedTabs}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 shrink-0 ml-2"
                    title={`Close ${selectedTabIds.size} selected tabs`}
                  >
                    <X className="h-3 w-3" />
                    Close {selectedTabIds.size}
                  </button>
                )}
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
