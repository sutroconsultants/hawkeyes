"use client";

import * as React from "react";
import {
  Database,
  Table,
  ChevronRight,
  RefreshCw,
  Search,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TableInfo {
  name: string;
  database: string;
  engine: string;
  total_rows: string;
  total_bytes: string;
}

interface GroupedTables {
  [database: string]: TableInfo[];
}

export function ClickHouseTablesSidebar({
  onTableSelect,
  className,
}: {
  onTableSelect?: (database: string, table: string) => void;
  className?: string;
}) {
  const [tables, setTables] = React.useState<TableInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const fetchTables = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/clickhouse/tables");
      if (!response.ok) {
        throw new Error("Failed to fetch tables");
      }
      const data = await response.json();
      setTables(data.tables || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const groupedTables = React.useMemo(() => {
    const filtered = tables.filter(
      (table) =>
        table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.database.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.reduce<GroupedTables>((acc, table) => {
      if (!acc[table.database]) {
        acc[table.database] = [];
      }
      acc[table.database].push(table);
      return acc;
    }, {});
  }, [tables, searchQuery]);

  const formatBytes = (bytes: string) => {
    const num = parseInt(bytes, 10);
    if (isNaN(num) || num === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatRows = (rows: string) => {
    const num = parseInt(rows, 10);
    if (isNaN(num)) return "0";
    return num.toLocaleString();
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="flex flex-col gap-2 p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <span className="font-semibold">HawkEye</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={fetchTables}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
            Tables
          </div>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <div className="px-2 py-4 text-sm text-destructive">
              <p>Error: {error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTables}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}
          {!loading && !error && Object.keys(groupedTables).length === 0 && (
            <div className="px-2 py-4 text-sm text-muted-foreground">
              No tables found. Make sure ClickHouse is running and has tables
              in a non-system database.
            </div>
          )}
          {!loading && !error && (
            <div className="space-y-1">
              {Object.entries(groupedTables).map(([database, dbTables]) => (
                <Collapsible key={database} defaultOpen className="group/collapsible">
                  <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                    <Database className="h-4 w-4" />
                    <span className="flex-1 text-left">{database}</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 border-l pl-2 space-y-0.5">
                      {dbTables.map((table) => (
                        <button
                          key={`${database}.${table.name}`}
                          onClick={() => onTableSelect?.(database, table.name)}
                          className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                        >
                          <Table className="h-3 w-3 mt-1 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="truncate">{table.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatRows(table.total_rows)} rows •{" "}
                              {formatBytes(table.total_bytes)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
