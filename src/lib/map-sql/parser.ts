/**
 * Parser for Travian map.sql file.
 *
 * The map.sql file contains INSERT statements with 16 fields:
 * INSERT INTO `x_world` VALUES (id, x, y, tid, vid, 'village_name', uid, 'player_name',
 *                               aid, 'alliance_name', population, region, is_capital,
 *                               is_city, has_harbor, victory_points);
 */

export interface VillageRow {
  mapId: number;
  x: number;
  y: number;
  tid: number;
  vid: number;
  name: string;
  uid: number;
  playerName: string;
  aid: number;
  allianceName: string;
  population: number;
  region: string | null;
  isCapital: number | null; // 1=true, 0=false, null=unknown
  isCity: number | null;
  hasHarbor: number | null;
  victoryPoints: number | null;
}

const ROW_PATTERN = new RegExp(
  "INSERT\\s+INTO\\s+`?x_world`?\\s+VALUES\\s*\\(" +
    "(\\d+)," +                         // 1: map_id
    "(-?\\d+)," +                       // 2: x
    "(-?\\d+)," +                       // 3: y
    "(\\d+)," +                         // 4: tid
    "(\\d+)," +                         // 5: vid
    "'((?:[^'\\\\]|'')*)'," +           // 6: village_name
    "(\\d+)," +                         // 7: uid
    "'((?:[^'\\\\]|'')*)'," +           // 8: player_name
    "(\\d+)," +                         // 9: aid
    "'((?:[^'\\\\]|'')*)'," +           // 10: alliance_name
    "(\\d+)," +                         // 11: population
    "(NULL|'(?:[^'\\\\]|'')*')," +      // 12: region
    "(TRUE|FALSE|NULL)," +              // 13: is_capital
    "(TRUE|FALSE|NULL)," +              // 14: is_city
    "(TRUE|FALSE|NULL)," +              // 15: has_harbor
    "(\\d+|NULL)" +                     // 16: victory_points
    "\\s*\\);",
  "i"
);

function unescapeSql(s: string): string {
  return s.replace(/''/g, "'");
}

function parseBool(val: string): number | null {
  const v = val.toUpperCase();
  if (v === "TRUE") return 1;
  if (v === "FALSE") return 0;
  return null;
}

function parseIntOrNull(val: string): number | null {
  if (val.toUpperCase() === "NULL") return null;
  return parseInt(val, 10);
}

function parseRegion(val: string): string | null {
  if (val.toUpperCase() === "NULL") return null;
  return val.replace(/^'|'$/g, "").replace(/''/g, "'");
}

export function parseLine(line: string): VillageRow | null {
  const m = line.trim().match(ROW_PATTERN);
  if (!m) return null;
  return {
    mapId: parseInt(m[1], 10),
    x: parseInt(m[2], 10),
    y: parseInt(m[3], 10),
    tid: parseInt(m[4], 10),
    vid: parseInt(m[5], 10),
    name: unescapeSql(m[6]),
    uid: parseInt(m[7], 10),
    playerName: unescapeSql(m[8]),
    aid: parseInt(m[9], 10),
    allianceName: unescapeSql(m[10]),
    population: parseInt(m[11], 10),
    region: parseRegion(m[12]),
    isCapital: parseBool(m[13]),
    isCity: parseBool(m[14]),
    hasHarbor: parseBool(m[15]),
    victoryPoints: parseIntOrNull(m[16]),
  };
}

export function parseMapSql(text: string): VillageRow[] {
  const rows: VillageRow[] = [];
  for (const line of text.split("\n")) {
    const row = parseLine(line);
    if (row !== null) {
      rows.push(row);
    }
  }
  return rows;
}
