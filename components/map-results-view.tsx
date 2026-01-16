"use client";

import * as React from "react";
import Map from "react-map-gl/mapbox";
import { DeckGL } from "@deck.gl/react";
import { ScatterplotLayer, LineLayer } from "@deck.gl/layers";
import type { PickingInfo } from "@deck.gl/core";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapResultsViewProps {
  data: Record<string, unknown>[];
}

// Helper to check if a value looks like a ClickHouse Point (tuple/array with 2 numbers)
function isPointValue(value: unknown): value is [number, number] | { x: number; y: number } {
  if (Array.isArray(value) && value.length === 2) {
    return typeof value[0] === "number" && typeof value[1] === "number";
  }
  if (value && typeof value === "object" && "x" in value && "y" in value) {
    const obj = value as { x: unknown; y: unknown };
    return typeof obj.x === "number" && typeof obj.y === "number";
  }
  return false;
}

// Extract [lng, lat] from a ClickHouse Point value
function extractPointCoords(value: unknown): [number, number] | null {
  if (Array.isArray(value) && value.length === 2) {
    // ClickHouse Point is stored as (longitude, latitude)
    return [Number(value[0]), Number(value[1])];
  }
  if (value && typeof value === "object" && "x" in value && "y" in value) {
    const obj = value as { x: number; y: number };
    // x is longitude, y is latitude
    return [obj.x, obj.y];
  }
  return null;
}

// Detect geospatial column types in the data
function detectGeoColumns(data: Record<string, unknown>[]) {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  const lowerColumns = columns.map((c) => c.toLowerCase());
  const firstRow = data[0];

  // Get actual column names (preserving original case)
  const getColumn = (searchTerms: string[]) => {
    for (const term of searchTerms) {
      const idx = lowerColumns.indexOf(term);
      if (idx !== -1) return columns[idx];
    }
    return null;
  };

  // Check for ClickHouse Point type columns (stored as tuples/arrays)
  const locationCol = getColumn(["location", "point", "position", "geo"]);
  const startPointCol = getColumn(["start_point", "startpoint", "source_point"]);
  const endPointCol = getColumn(["end_point", "endpoint", "target_point"]);

  // Check if columns contain Point values
  if (startPointCol && endPointCol && isPointValue(firstRow[startPointCol]) && isPointValue(firstRow[endPointCol])) {
    return {
      type: "line_point" as const,
      startPointCol,
      endPointCol,
    };
  }

  if (locationCol && isPointValue(firstRow[locationCol])) {
    return {
      type: "point_native" as const,
      pointCol: locationCol,
    };
  }

  // Check for point data (lat/lng as separate columns)
  const hasLatitude =
    lowerColumns.includes("latitude") || lowerColumns.includes("lat");
  const hasLongitude =
    lowerColumns.includes("longitude") ||
    lowerColumns.includes("lng") ||
    lowerColumns.includes("lon");

  // Check for line data (start/end coords as separate columns)
  const hasStartLat =
    lowerColumns.includes("start_lat") || lowerColumns.includes("startlat");
  const hasStartLng =
    lowerColumns.includes("start_lng") ||
    lowerColumns.includes("startlng") ||
    lowerColumns.includes("start_lon");
  const hasEndLat =
    lowerColumns.includes("end_lat") || lowerColumns.includes("endlat");
  const hasEndLng =
    lowerColumns.includes("end_lng") ||
    lowerColumns.includes("endlng") ||
    lowerColumns.includes("end_lon");

  if (hasStartLat && hasStartLng && hasEndLat && hasEndLng) {
    return {
      type: "line" as const,
      startLatCol: getColumn(["start_lat", "startlat"])!,
      startLngCol: getColumn(["start_lng", "startlng", "start_lon"])!,
      endLatCol: getColumn(["end_lat", "endlat"])!,
      endLngCol: getColumn(["end_lng", "endlng", "end_lon"])!,
    };
  }

  if (hasLatitude && hasLongitude) {
    return {
      type: "point" as const,
      latCol: getColumn(["latitude", "lat"])!,
      lngCol: getColumn(["longitude", "lng", "lon"])!,
    };
  }

  return null;
}

// Detect asset type from data for coloring
function detectAssetType(data: Record<string, unknown>[]): string | null {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]).map((c) => c.toLowerCase());

  if (columns.includes("hydrant_id")) return "hydrant";
  if (columns.includes("valve_id")) return "valve";
  if (columns.includes("main_id") || columns.includes("pipe_id")) return "main";
  if (columns.includes("break_id")) return "break";
  return null;
}

// Detect status column in data
function detectStatusColumn(data: Record<string, unknown>[]): string | null {
  if (!data || data.length === 0) return null;
  const columns = Object.keys(data[0]);
  const statusCol = columns.find((c) => c.toLowerCase() === "status");
  return statusCol || null;
}

// Get color based on status value
function getStatusColor(status: unknown): [number, number, number] | null {
  if (typeof status !== "string") return null;
  const s = status.toLowerCase();
  if (s === "active" || s === "in_service" || s === "operational") return [34, 197, 94]; // Green
  if (s === "out_of_service" || s === "inactive" || s === "closed") return [239, 68, 68]; // Red
  if (s === "needs_repair" || s === "maintenance" || s === "pending") return [234, 179, 8]; // Yellow
  if (s === "critical" || s === "emergency") return [249, 115, 22]; // Orange
  return null;
}

// Get color based on asset type
function getAssetColor(assetType: string | null): [number, number, number] {
  switch (assetType) {
    case "hydrant":
      return [255, 0, 0]; // Red for hydrants
    case "valve":
      return [0, 128, 255]; // Blue for valves
    case "main":
      return [128, 128, 128]; // Gray for mains
    case "break":
      return [255, 165, 0]; // Orange for breaks
    default:
      return [100, 100, 255]; // Default blue
  }
}

// Format tooltip key to human-readable
function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Format tooltip value for display
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toFixed(6);
  }
  if (Array.isArray(value)) {
    if (value.length === 2 && typeof value[0] === "number") {
      return `${value[1].toFixed(5)}, ${value[0].toFixed(5)}`; // lat, lng format
    }
    return JSON.stringify(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// Calculate bounds from data
function calculateBounds(
  data: Record<string, unknown>[],
  geoConfig: ReturnType<typeof detectGeoColumns>
) {
  if (!geoConfig || data.length === 0) {
    return { center: [-122.27, 37.83], zoom: 11 };
  }

  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;

  data.forEach((row) => {
    if (geoConfig.type === "point") {
      const lat = Number(row[geoConfig.latCol]);
      const lng = Number(row[geoConfig.lngCol]);
      if (!isNaN(lat) && !isNaN(lng)) {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      }
    } else if (geoConfig.type === "point_native") {
      const coords = extractPointCoords(row[geoConfig.pointCol]);
      if (coords) {
        const [lng, lat] = coords;
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      }
    } else if (geoConfig.type === "line") {
      const startLat = Number(row[geoConfig.startLatCol]);
      const startLng = Number(row[geoConfig.startLngCol]);
      const endLat = Number(row[geoConfig.endLatCol]);
      const endLng = Number(row[geoConfig.endLngCol]);
      if (
        !isNaN(startLat) &&
        !isNaN(startLng) &&
        !isNaN(endLat) &&
        !isNaN(endLng)
      ) {
        minLat = Math.min(minLat, startLat, endLat);
        maxLat = Math.max(maxLat, startLat, endLat);
        minLng = Math.min(minLng, startLng, endLng);
        maxLng = Math.max(maxLng, startLng, endLng);
      }
    } else if (geoConfig.type === "line_point") {
      const startCoords = extractPointCoords(row[geoConfig.startPointCol]);
      const endCoords = extractPointCoords(row[geoConfig.endPointCol]);
      if (startCoords && endCoords) {
        const [startLng, startLat] = startCoords;
        const [endLng, endLat] = endCoords;
        minLat = Math.min(minLat, startLat, endLat);
        maxLat = Math.max(maxLat, startLat, endLat);
        minLng = Math.min(minLng, startLng, endLng);
        maxLng = Math.max(maxLng, startLng, endLng);
      }
    }
  });

  if (
    minLat === Infinity ||
    maxLat === -Infinity ||
    minLng === Infinity ||
    maxLng === -Infinity
  ) {
    return { center: [-122.27, 37.83], zoom: 11 };
  }

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Calculate zoom based on bounds
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const maxDiff = Math.max(latDiff, lngDiff);

  let zoom = 13;
  if (maxDiff > 0.1) zoom = 10;
  else if (maxDiff > 0.05) zoom = 11;
  else if (maxDiff > 0.02) zoom = 12;
  else if (maxDiff > 0.01) zoom = 13;
  else if (maxDiff > 0.005) zoom = 14;
  else zoom = 15;

  return { center: [centerLng, centerLat], zoom };
}

// Check if WebGL is available
function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return !!gl;
  } catch {
    return false;
  }
}

export function MapResultsView({ data }: MapResultsViewProps) {
  const [hoverInfo, setHoverInfo] = React.useState<PickingInfo | null>(null);
  const [webglError, setWebglError] = React.useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Ensure we're on the client side before rendering WebGL
  React.useEffect(() => {
    setIsClient(true);
    if (!isWebGLAvailable()) {
      setWebglError("WebGL is not available in your browser");
    }
  }, []);

  const geoConfig = React.useMemo(() => detectGeoColumns(data), [data]);
  const assetType = React.useMemo(() => detectAssetType(data), [data]);
  const assetColor = React.useMemo(() => getAssetColor(assetType), [assetType]);
  const statusColumn = React.useMemo(() => detectStatusColumn(data), [data]);
  const bounds = React.useMemo(
    () => calculateBounds(data, geoConfig),
    [data, geoConfig]
  );

  // Get color for a data point, considering status if available
  const getPointColor = React.useCallback(
    (d: Record<string, unknown>): [number, number, number] => {
      if (statusColumn) {
        const statusColor = getStatusColor(d[statusColumn]);
        if (statusColor) return statusColor;
      }
      return assetColor;
    },
    [statusColumn, assetColor]
  );

  const [viewState, setViewState] = React.useState({
    longitude: bounds.center[0],
    latitude: bounds.center[1],
    zoom: bounds.zoom,
    pitch: 0,
    bearing: 0,
  });

  // Update view state when bounds change
  React.useEffect(() => {
    setViewState((prev) => ({
      ...prev,
      longitude: bounds.center[0],
      latitude: bounds.center[1],
      zoom: bounds.zoom,
    }));
  }, [bounds]);

  const layers = React.useMemo(() => {
    if (!geoConfig) return [];

    if (geoConfig.type === "point") {
      return [
        new ScatterplotLayer({
          id: "points",
          data,
          getPosition: (d: Record<string, unknown>) => [
            Number(d[geoConfig.lngCol]),
            Number(d[geoConfig.latCol]),
          ],
          getRadius: 20,
          getFillColor: statusColumn
            ? (d: Record<string, unknown>) => getPointColor(d)
            : assetColor,
          radiusMinPixels: 4,
          radiusMaxPixels: 20,
          pickable: true,
          onHover: (info: PickingInfo) => setHoverInfo(info),
          updateTriggers: {
            getFillColor: [statusColumn, assetColor],
          },
        }),
      ];
    }

    if (geoConfig.type === "line") {
      return [
        new LineLayer({
          id: "lines",
          data,
          getSourcePosition: (d: Record<string, unknown>) => [
            Number(d[geoConfig.startLngCol]),
            Number(d[geoConfig.startLatCol]),
          ],
          getTargetPosition: (d: Record<string, unknown>) => [
            Number(d[geoConfig.endLngCol]),
            Number(d[geoConfig.endLatCol]),
          ],
          getColor: assetColor,
          getWidth: 3,
          pickable: true,
          onHover: (info: PickingInfo) => setHoverInfo(info),
        }),
      ];
    }

    // ClickHouse native Point type for single points
    if (geoConfig.type === "point_native") {
      return [
        new ScatterplotLayer({
          id: "points-native",
          data,
          getPosition: (d: Record<string, unknown>) => {
            const coords = extractPointCoords(d[geoConfig.pointCol]);
            return coords || [0, 0];
          },
          getRadius: 20,
          getFillColor: statusColumn
            ? (d: Record<string, unknown>) => getPointColor(d)
            : assetColor,
          radiusMinPixels: 4,
          radiusMaxPixels: 20,
          pickable: true,
          onHover: (info: PickingInfo) => setHoverInfo(info),
          updateTriggers: {
            getFillColor: [statusColumn, assetColor],
          },
        }),
      ];
    }

    // ClickHouse native Point types for line segments
    if (geoConfig.type === "line_point") {
      return [
        new LineLayer({
          id: "lines-native",
          data,
          getSourcePosition: (d: Record<string, unknown>) => {
            const coords = extractPointCoords(d[geoConfig.startPointCol]);
            return coords || [0, 0];
          },
          getTargetPosition: (d: Record<string, unknown>) => {
            const coords = extractPointCoords(d[geoConfig.endPointCol]);
            return coords || [0, 0];
          },
          getColor: assetColor,
          getWidth: 3,
          pickable: true,
          onHover: (info: PickingInfo) => setHoverInfo(info),
        }),
      ];
    }

    return [];
  }, [data, geoConfig, assetColor, statusColumn, getPointColor]);

  // Don't render on server or before client hydration
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Loading map...</p>
      </div>
    );
  }

  if (webglError) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">{webglError}</p>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">
          Mapbox token not configured. Add NEXT_PUBLIC_MAPBOX_TOKEN to your
          environment.
        </p>
      </div>
    );
  }

  if (!geoConfig) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">
          No geospatial data detected. Results need latitude/longitude or
          start_lat/end_lat columns.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: newViewState }) =>
          setViewState(newViewState as typeof viewState)
        }
        controller={true}
        layers={layers}
        onError={(error: Error) => {
          console.error("DeckGL error:", error);
          setWebglError("Map rendering error: " + error.message);
        }}
      >
        <Map
          mapboxAccessToken={mapboxToken}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          reuseMaps
        />
      </DeckGL>

      {/* Hover tooltip */}
      {hoverInfo?.object && (
        <div
          className="absolute z-10 bg-background/95 border rounded-lg shadow-lg px-3 py-2 text-xs pointer-events-none max-w-sm"
          style={{
            left: hoverInfo.x ? hoverInfo.x + 10 : 0,
            top: hoverInfo.y ? hoverInfo.y + 10 : 0,
          }}
        >
          {Object.entries(hoverInfo.object as Record<string, unknown>)
            .filter(([key]) => !["location", "start_point", "end_point"].includes(key.toLowerCase()))
            .slice(0, 8)
            .map(([key, value]) => (
              <div key={key} className="flex gap-2 py-0.5">
                <span className="font-medium text-muted-foreground min-w-[80px]">
                  {formatKey(key)}:
                </span>
                <span className="truncate font-mono">
                  {formatValue(value)}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 border rounded-lg px-3 py-2 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: `rgb(${assetColor[0]}, ${assetColor[1]}, ${assetColor[2]})`,
            }}
          />
          <span className="capitalize font-medium">{assetType || "Data"}</span>
          <span className="text-muted-foreground">({data.length} items)</span>
        </div>
        {statusColumn && (
          <div className="pt-1 border-t border-border/50 space-y-0.5">
            <div className="text-muted-foreground text-[10px] uppercase tracking-wide mb-1">By Status</div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "rgb(34, 197, 94)" }} />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "rgb(234, 179, 8)" }} />
              <span>Needs Repair</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "rgb(239, 68, 68)" }} />
              <span>Out of Service</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export function to check if data has geospatial content
export function hasGeospatialData(data: Record<string, unknown>[]): boolean {
  return detectGeoColumns(data) !== null;
}
