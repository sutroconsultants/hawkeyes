"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Group, Panel, Separator as PanelSeparator, usePanelRef } from "react-resizable-panels";
import { PanelLeftIcon, PanelRightIcon, GripVertical } from "lucide-react";

import { ClickHouseTablesSidebar } from "@/components/clickhouse-tables-sidebar";
import { TamboChatSidebar } from "@/components/tambo-chat-sidebar";
import { SqlEditor } from "@/components/sql-editor";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DEFAULT_LEFT_SIZE = "250px";
const DEFAULT_RIGHT_SIZE = "320px";
const MIN_OPEN_SIZE = 100; // Minimum pixels to consider panel "open"

const STORAGE_KEY_LEFT = "hawkeyes-left-panel-size";
const STORAGE_KEY_RIGHT = "hawkeyes-right-panel-size";

function getSavedSize(key: string, defaultSize: string): string {
  if (typeof window === "undefined") return defaultSize;
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(key);
  } catch {
    return defaultSize;
  }
  if (!saved) return defaultSize;

  // Parse the saved value and ensure it's at least MIN_OPEN_SIZE
  const pixels = parseInt(saved, 10);
  if (isNaN(pixels) || pixels < MIN_OPEN_SIZE) {
    localStorage.removeItem(key);
    return defaultSize;
  }
  return saved;
}

function savePanelSize(key: string, sizePixels: number | null) {
  if (typeof window === "undefined") return;
  try {
    if (sizePixels === null || sizePixels < MIN_OPEN_SIZE) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, `${Math.round(sizePixels)}px`);
    }
  } catch {
    // Ignore storage errors (e.g., blocked storage in private mode).
  }
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [selectedTable, setSelectedTable] = React.useState<{
    database: string;
    table: string;
  } | null>(null);

  const leftPanelRef = usePanelRef();
  const rightPanelRef = usePanelRef();

  const [leftCollapsed, setLeftCollapsed] = React.useState(false);
  const [rightCollapsed, setRightCollapsed] = React.useState(false);

  // Track if component is mounted to avoid hydration mismatch
  const [isMounted, setIsMounted] = React.useState(false);

  // Load saved sizes from localStorage on mount
  const [leftSize, setLeftSize] = React.useState(DEFAULT_LEFT_SIZE);
  const [rightSize, setRightSize] = React.useState(DEFAULT_RIGHT_SIZE);

  React.useEffect(() => {
    const savedLeft = getSavedSize(STORAGE_KEY_LEFT, DEFAULT_LEFT_SIZE);
    const savedRight = getSavedSize(STORAGE_KEY_RIGHT, DEFAULT_RIGHT_SIZE);
    setLeftSize(savedLeft);
    setRightSize(savedRight);
    setIsMounted(true);
  }, []);

  const handleLeftResize = React.useCallback((size: { inPixels: number; asPercentage: number }) => {
    const isCollapsed = size.asPercentage === 0;
    setLeftCollapsed(isCollapsed);
    savePanelSize(STORAGE_KEY_LEFT, isCollapsed ? null : size.inPixels);
  }, []);

  const handleRightResize = React.useCallback((size: { inPixels: number; asPercentage: number }) => {
    const isCollapsed = size.asPercentage === 0;
    setRightCollapsed(isCollapsed);
    savePanelSize(STORAGE_KEY_RIGHT, isCollapsed ? null : size.inPixels);
  }, []);

  const handleTableSelect = (database: string, table: string) => {
    setSelectedTable({ database, table });
  };

  const toggleLeftPanel = () => {
    const panel = leftPanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  const toggleRightPanel = () => {
    const panel = rightPanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  // Show loading state until localStorage sizes are loaded to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-svh flex-col">
        <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b z-10">
          <div className="flex flex-1 items-center gap-2 px-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={toggleLeftPanel}
                >
                  <PanelLeftIcon className="h-4 w-4" />
                  <span className="sr-only">Toggle Left Sidebar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {leftCollapsed ? "Show" : "Hide"} Tables
              </TooltipContent>
            </Tooltip>
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Projects</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">
                    {projectId}
                  </BreadcrumbPage>
                </BreadcrumbItem>
                {selectedTable && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="line-clamp-1 font-mono text-xs">
                        {selectedTable.database}.{selectedTable.table}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2 px-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={toggleRightPanel}
                >
                  <PanelRightIcon className="h-4 w-4" />
                  <span className="sr-only">Toggle Right Sidebar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {rightCollapsed ? "Show" : "Hide"} AI Assistant
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <Group orientation="horizontal" className="flex-1">
          {/* Left Sidebar - ClickHouse Tables */}
          <Panel
            panelRef={leftPanelRef}
            defaultSize={leftSize}
            minSize={0}
            collapsible
            collapsedSize={0}
            onResize={handleLeftResize}
            className="bg-sidebar"
          >
            <ClickHouseTablesSidebar
              onTableSelect={handleTableSelect}
              className="h-full border-r-0"
            />
          </Panel>

          <PanelSeparator className="w-1.5 bg-border hover:bg-primary/20 transition-colors flex items-center justify-center group">
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </PanelSeparator>

          {/* Main Content - SQL Editor */}
          <Panel minSize={30}>
            <SqlEditor selectedTable={selectedTable} />
          </Panel>

          <PanelSeparator className="w-1.5 bg-border hover:bg-primary/20 transition-colors flex items-center justify-center group">
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </PanelSeparator>

          {/* Right Sidebar - AI Chat */}
          <Panel
            panelRef={rightPanelRef}
            defaultSize={rightSize}
            minSize={0}
            collapsible
            collapsedSize={0}
            onResize={handleRightResize}
            className="bg-sidebar"
          >
            <TamboChatSidebar className="h-full border-l-0" />
          </Panel>
        </Group>
      </div>
    </TooltipProvider>
  );
}
