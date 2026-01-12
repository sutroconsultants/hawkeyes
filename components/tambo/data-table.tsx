"use client";

import * as React from "react";
import { z } from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TamboComponent } from "@tambo-ai/react";

export interface DataTableProps {
  title?: string;
  data: Record<string, unknown>[];
  columns?: string[];
}

function DataTableComponent({ title, data, columns }: DataTableProps) {
  const tableColumns = columns || (data?.[0] ? Object.keys(data[0]) : []);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No data to display
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? "pt-0" : "pt-4"}>
        <ScrollArea className="h-[300px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {tableColumns.map((column) => (
                  <TableHead key={column} className="font-mono text-xs font-semibold">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {tableColumns.map((column) => (
                    <TableCell key={column} className="font-mono text-xs">
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
      </CardContent>
    </Card>
  );
}

// Schema for props validation
const dataTablePropsSchema = z.object({
  title: z.string().optional().describe("Optional title for the table"),
  data: z.array(z.any()).describe("Array of objects representing rows of data"),
  columns: z.array(z.string()).optional().describe("Optional array of column names to display"),
});

// Export as TamboComponent for registration
export const DataTable: TamboComponent = {
  name: "DataTable",
  description: `Table component for displaying static data. Do NOT use for query results - use QuerySuggestion instead so users can view results in the SQL editor.`,
  component: DataTableComponent,
  propsSchema: dataTablePropsSchema,
};
