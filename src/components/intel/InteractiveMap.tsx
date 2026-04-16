"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import L from "leaflet";
import { MapContainer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TRIBE_NAMES } from "@/lib/game/constants";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Village {
  x: number;
  y: number;
  name: string | null;
  playerName: string | null;
  allianceName: string | null;
  tid: number | null;
  aid: number | null;
  population: number | null;
  uid: number | null;
}

/* ------------------------------------------------------------------ */
/*  Color helpers                                                      */
/* ------------------------------------------------------------------ */

const TRIBE_COLORS: Record<number, string> = {
  1: "#e74c3c",
  2: "#3498db",
  3: "#2ecc71",
  4: "#95a5a6",
  5: "#8e44ad",
  6: "#f39c12",
  7: "#e67e22",
  8: "#1abc9c",
  9: "#9b59b6",
};

function hashToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 55%)`;
}

function getRadius(population: number | null): number {
  const pop = population ?? 0;
  if (pop < 100) return 2;
  if (pop < 300) return 3;
  if (pop < 500) return 4;
  if (pop < 1000) return 5;
  if (pop < 2000) return 6;
  return 7;
}

/* ------------------------------------------------------------------ */
/*  Sub-components rendered inside <MapContainer>                      */
/* ------------------------------------------------------------------ */

function VillageLayer({
  villages,
  colorMode,
}: {
  villages: Village[];
  colorMode: "alliance" | "tribe";
}) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (layerRef.current) layerRef.current.remove();

    const layer = L.layerGroup();

    for (const v of villages) {
      const color =
        colorMode === "tribe"
          ? TRIBE_COLORS[v.tid ?? 0] || "#666"
          : v.allianceName
            ? hashToColor(v.allianceName)
            : "#666";

      const marker = L.circleMarker([v.y, v.x], {
        radius: getRadius(v.population),
        fillColor: color,
        fillOpacity: 0.75,
        weight: 0.5,
        color: "#fff",
        opacity: 0.3,
      });

      const tribeName = v.tid ? (TRIBE_NAMES[v.tid]?.pl || "?") : "?";
      marker.bindPopup(
        `<div style="font-size:13px;line-height:1.6">
          <b>${v.name || "Oaza"}</b><br/>
          👤 ${v.playerName || "—"}<br/>
          🏛️ ${v.allianceName || "—"}<br/>
          🏠 Pop: ${v.population?.toLocaleString() ?? 0}<br/>
          ⚔️ ${tribeName}<br/>
          📍 (${v.x}|${v.y})
        </div>`,
        { maxWidth: 220 },
      );

      layer.addLayer(marker);
    }

    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      layer.remove();
    };
  }, [villages, colorMode, map]);

  return null;
}

function GridLines() {
  const map = useMap();

  useEffect(() => {
    const gridGroup = L.layerGroup();

    for (let i = -200; i <= 200; i += 50) {
      gridGroup.addLayer(
        L.polyline(
          [
            [-200, i],
            [200, i],
          ],
          { color: "#444", weight: 0.5, opacity: 0.5, interactive: false },
        ),
      );
      gridGroup.addLayer(
        L.polyline(
          [
            [i, -200],
            [i, 200],
          ],
          { color: "#444", weight: 0.5, opacity: 0.5, interactive: false },
        ),
      );
    }

    // Stronger axis lines
    gridGroup.addLayer(
      L.polyline(
        [
          [-200, 0],
          [200, 0],
        ],
        { color: "#666", weight: 1, opacity: 0.7, interactive: false },
      ),
    );
    gridGroup.addLayer(
      L.polyline(
        [
          [0, -200],
          [0, 200],
        ],
        { color: "#666", weight: 1, opacity: 0.7, interactive: false },
      ),
    );

    gridGroup.addTo(map);
    return () => {
      gridGroup.remove();
    };
  }, [map]);

  return null;
}

function CoordDisplay() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useMapEvents({
    mousemove(e) {
      setCoords({
        x: Math.round(e.latlng.lng),
        y: Math.round(e.latlng.lat),
      });
    },
  });

  return (
    <div className="absolute bottom-2 left-2 z-[1000] bg-background/90 text-foreground px-3 py-1 rounded text-xs font-mono border">
      ({coords.x}|{coords.y})
    </div>
  );
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo([target[1], target[0]], 4, { duration: 0.5 });
    }
  }, [target, map]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function InteractiveMap() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [colorMode, setColorMode] = useState<"alliance" | "tribe">("alliance");

  const [filterAlliance, setFilterAlliance] = useState("");
  const [filterPlayer, setFilterPlayer] = useState("");
  const [filterTribe, setFilterTribe] = useState("");
  const [filterMinPop, setFilterMinPop] = useState("");

  const [locateX, setLocateX] = useState("");
  const [locateY, setLocateY] = useState("");
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetch("/api/map-data")
      .then((r) => r.json())
      .then((data) => {
        setVillages(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredVillages = useMemo(() => {
    return villages.filter((v) => {
      if (
        filterAlliance &&
        !v.allianceName?.toLowerCase().includes(filterAlliance.toLowerCase())
      )
        return false;
      if (
        filterPlayer &&
        !v.playerName?.toLowerCase().includes(filterPlayer.toLowerCase())
      )
        return false;
      if (filterTribe && v.tid !== parseInt(filterTribe)) return false;
      if (filterMinPop && (v.population ?? 0) < parseInt(filterMinPop))
        return false;
      return true;
    });
  }, [villages, filterAlliance, filterPlayer, filterTribe, filterMinPop]);

  const handleLocate = useCallback(() => {
    const x = parseInt(locateX);
    const y = parseInt(locateY);
    if (!isNaN(x) && !isNaN(y)) {
      setFlyTarget([x, y]);
    }
  }, [locateX, locateY]);

  const bounds = L.latLngBounds(
    [-210, -210],
    [210, 210],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">🗺️ Mapa interaktywna</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {loading
            ? "Ładowanie danych..."
            : `${filteredVillages.length.toLocaleString()} wiosek z ${villages.length.toLocaleString()}`}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Sojusz
              </label>
              <Input
                placeholder="Nazwa sojuszu"
                value={filterAlliance}
                onChange={(e) => setFilterAlliance(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Gracz
              </label>
              <Input
                placeholder="Nazwa gracza"
                value={filterPlayer}
                onChange={(e) => setFilterPlayer(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Plemię
              </label>
              <select
                value={filterTribe}
                onChange={(e) => setFilterTribe(e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">Wszystkie</option>
                {Object.entries(TRIBE_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name.pl}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Min. populacja
              </label>
              <Input
                type="number"
                placeholder="0"
                value={filterMinPop}
                onChange={(e) => setFilterMinPop(e.target.value)}
                className="h-8 text-sm"
                min={0}
                max={100000}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Kolorowanie
              </label>
              <select
                value={colorMode}
                onChange={(e) =>
                  setColorMode(e.target.value as "alliance" | "tribe")
                }
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="alliance">Wg sojuszu</option>
                <option value="tribe">Wg plemienia</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Skocz do
              </label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  placeholder="X"
                  value={locateX}
                  onChange={(e) => setLocateX(e.target.value)}
                  className="h-8 text-sm w-14 sm:w-16"
                  min={-200}
                  max={200}
                />
                <Input
                  type="number"
                  placeholder="Y"
                  value={locateY}
                  onChange={(e) => setLocateY(e.target.value)}
                  className="h-8 text-sm w-14 sm:w-16"
                  min={-200}
                  max={200}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleLocate}
                  className="h-8 text-xs"
                >
                  📍
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <div
        className="rounded-lg border overflow-hidden relative"
        style={{ height: "calc(100vh - 300px)", minHeight: "350px" }}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Ładowanie danych mapy...
          </div>
        ) : (
          <MapContainer
            center={[0, 0]}
            zoom={1}
            minZoom={0}
            maxZoom={6}
            maxBounds={bounds}
            maxBoundsViscosity={1.0}
            crs={L.CRS.Simple}
            style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
            preferCanvas={true}
          >
            <GridLines />
            <VillageLayer
              villages={filteredVillages}
              colorMode={colorMode}
            />
            <CoordDisplay />
            <FlyTo target={flyTarget} />
          </MapContainer>
        )}
      </div>

      {/* Tribe legend */}
      {colorMode === "tribe" && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3">
              {Object.entries(TRIBE_COLORS).map(([tid, color]) => {
                const name = TRIBE_NAMES[parseInt(tid)]?.pl;
                if (!name) return null;
                return (
                  <div
                    key={tid}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {name}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
