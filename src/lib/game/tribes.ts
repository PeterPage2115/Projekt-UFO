/**
 * Travian tribe and unit definitions.
 * Ported from W.I.T.E.K bot/tribes.py — single source of truth.
 */

export type UnitType = 'inf' | 'cav' | 'siege' | 'special';

export interface UnitDef {
  name: string;
  namePl?: string;
  att: number;
  defInf: number;
  defCav: number;
  speed: number;
  crop: number;
  unitType: UnitType;
}

export interface TribeDef {
  tid: number;
  namePl: string;
  nameEn: string;
  emoji: string;
  wallType: string;
  units: UnitDef[];
}

// === Romans (tid=1) ===
const ROMANS: TribeDef = {
  tid: 1, namePl: 'Rzymianie', nameEn: 'Romans',
  emoji: '🏛️', wallType: 'City Wall',
  units: [
    { name: 'Legionnaire',          namePl: 'Legionista',          att: 40,  defInf: 35,  defCav: 50,  speed: 6,  crop: 1, unitType: 'inf' },
    { name: 'Praetorian',           namePl: 'Pretorianin',         att: 30,  defInf: 65,  defCav: 35,  speed: 5,  crop: 1, unitType: 'inf' },
    { name: 'Imperian',             namePl: 'Imperians',           att: 70,  defInf: 40,  defCav: 25,  speed: 7,  crop: 1, unitType: 'inf' },
    { name: 'Equites Legati',       namePl: 'Equites Legati',      att: 0,   defInf: 20,  defCav: 10,  speed: 16, crop: 2, unitType: 'cav' },
    { name: 'Equites Imperatoris',  namePl: 'Equites Imperatoris', att: 120, defInf: 65,  defCav: 50,  speed: 14, crop: 3, unitType: 'cav' },
    { name: 'Equites Caesaris',     namePl: 'Equites Caesaris',    att: 180, defInf: 80,  defCav: 105, speed: 10, crop: 4, unitType: 'cav' },
    { name: 'Battering Ram',        namePl: 'Taran',               att: 60,  defInf: 30,  defCav: 75,  speed: 4,  crop: 3, unitType: 'siege' },
    { name: 'Fire Catapult',        namePl: 'Katapulta ognista',   att: 75,  defInf: 60,  defCav: 10,  speed: 3,  crop: 6, unitType: 'siege' },
    { name: 'Senator',              namePl: 'Senator',             att: 50,  defInf: 40,  defCav: 30,  speed: 4,  crop: 5, unitType: 'special' },
    { name: 'Settler',              namePl: 'Osadnik',             att: 0,   defInf: 80,  defCav: 80,  speed: 5,  crop: 1, unitType: 'special' },
  ],
};

// === Teutons (tid=2) ===
const TEUTONS: TribeDef = {
  tid: 2, namePl: 'Germanie', nameEn: 'Teutons',
  emoji: '⚔️', wallType: 'Earth Wall',
  units: [
    { name: 'Clubswinger',       namePl: 'Pałkarz',            att: 40,  defInf: 20,  defCav: 5,   speed: 7,  crop: 1, unitType: 'inf' },
    { name: 'Spearfighter',      namePl: 'Włócznik',           att: 10,  defInf: 35,  defCav: 60,  speed: 7,  crop: 1, unitType: 'inf' },
    { name: 'Axefighter',        namePl: 'Topornik',           att: 60,  defInf: 30,  defCav: 30,  speed: 6,  crop: 1, unitType: 'inf' },
    { name: 'Scout',             namePl: 'Zwiadowca',          att: 0,   defInf: 10,  defCav: 5,   speed: 9,  crop: 1, unitType: 'cav' },
    { name: 'Paladin',           namePl: 'Paladyn',            att: 55,  defInf: 100, defCav: 40,  speed: 10, crop: 2, unitType: 'cav' },
    { name: 'Teutonic Knight',   namePl: 'Germański rycerz',   att: 150, defInf: 50,  defCav: 75,  speed: 9,  crop: 3, unitType: 'cav' },
    { name: 'Ram',               namePl: 'Taran',              att: 65,  defInf: 30,  defCav: 80,  speed: 4,  crop: 3, unitType: 'siege' },
    { name: 'Catapult',          namePl: 'Katapulta',          att: 50,  defInf: 60,  defCav: 10,  speed: 3,  crop: 6, unitType: 'siege' },
    { name: 'Chief',             namePl: 'Wódz',               att: 40,  defInf: 60,  defCav: 40,  speed: 4,  crop: 4, unitType: 'special' },
    { name: 'Settler',           namePl: 'Osadnik',            att: 0,   defInf: 80,  defCav: 80,  speed: 5,  crop: 1, unitType: 'special' },
  ],
};

// === Gauls (tid=3) ===
const GAULS: TribeDef = {
  tid: 3, namePl: 'Galowie', nameEn: 'Gauls',
  emoji: '🏹', wallType: 'Palisade',
  units: [
    { name: 'Phalanx',            namePl: 'Falangita',           att: 15,  defInf: 40,  defCav: 50,  speed: 7,  crop: 1, unitType: 'inf' },
    { name: 'Swordsman',          namePl: 'Miecznik',            att: 65,  defInf: 35,  defCav: 20,  speed: 6,  crop: 1, unitType: 'inf' },
    { name: 'Pathfinder',         namePl: 'Tropiciel',           att: 0,   defInf: 20,  defCav: 10,  speed: 17, crop: 2, unitType: 'cav' },
    { name: 'Theutates Thunder',  namePl: 'Grom Teutatesa',      att: 100, defInf: 25,  defCav: 40,  speed: 19, crop: 2, unitType: 'cav' },
    { name: 'Druidrider',         namePl: 'Jeździec druidzki',   att: 45,  defInf: 115, defCav: 55,  speed: 16, crop: 2, unitType: 'cav' },
    { name: 'Haeduan',            namePl: 'Haeduan',             att: 140, defInf: 50,  defCav: 165, speed: 13, crop: 3, unitType: 'cav' },
    { name: 'Ram',                namePl: 'Taran',               att: 50,  defInf: 30,  defCav: 105, speed: 4,  crop: 3, unitType: 'siege' },
    { name: 'Trebuchet',          namePl: 'Trebusz',             att: 70,  defInf: 45,  defCav: 10,  speed: 3,  crop: 6, unitType: 'siege' },
    { name: 'Chieftain',          namePl: 'Wódz',               att: 40,  defInf: 50,  defCav: 50,  speed: 5,  crop: 4, unitType: 'special' },
    { name: 'Settler',            namePl: 'Osadnik',             att: 0,   defInf: 80,  defCav: 80,  speed: 5,  crop: 1, unitType: 'special' },
  ],
};

// === Egyptians (tid=6) ===
const EGYPTIANS: TribeDef = {
  tid: 6, namePl: 'Egipcjanie', nameEn: 'Egyptians',
  emoji: '🏺', wallType: 'Stone Wall',
  units: [
    { name: 'Slave Militia',     att: 10,  defInf: 30,  defCav: 20,  speed: 7,  crop: 1, unitType: 'inf' },
    { name: 'Ash Warden',        att: 30,  defInf: 55,  defCav: 40,  speed: 6,  crop: 1, unitType: 'inf' },
    { name: 'Khopesh Warrior',   att: 65,  defInf: 50,  defCav: 20,  speed: 7,  crop: 1, unitType: 'inf' },
    { name: 'Sopdu Explorer',    att: 0,   defInf: 20,  defCav: 10,  speed: 16, crop: 2, unitType: 'cav' },
    { name: 'Anhur Guard',       att: 50,  defInf: 110, defCav: 50,  speed: 15, crop: 2, unitType: 'cav' },
    { name: 'Resheph Chariot',   att: 110, defInf: 120, defCav: 150, speed: 10, crop: 3, unitType: 'cav' },
    { name: 'Ram',               att: 55,  defInf: 30,  defCav: 95,  speed: 4,  crop: 3, unitType: 'siege' },
    { name: 'Catapult',          att: 65,  defInf: 55,  defCav: 10,  speed: 3,  crop: 6, unitType: 'siege' },
    { name: 'Nomarch',           att: 40,  defInf: 50,  defCav: 50,  speed: 4,  crop: 4, unitType: 'special' },
    { name: 'Settler',           att: 0,   defInf: 80,  defCav: 80,  speed: 5,  crop: 1, unitType: 'special' },
  ],
};

// === Huns (tid=7) ===
const HUNS: TribeDef = {
  tid: 7, namePl: 'Hunowie', nameEn: 'Huns',
  emoji: '🐎', wallType: 'Makeshift Wall',
  units: [
    { name: 'Mercenary',      att: 35,  defInf: 40,  defCav: 30,  speed: 7,  crop: 1, unitType: 'inf' },
    { name: 'Bowman',          att: 50,  defInf: 30,  defCav: 10,  speed: 6,  crop: 1, unitType: 'inf' },
    { name: 'Spotter',         att: 0,   defInf: 20,  defCav: 10,  speed: 19, crop: 2, unitType: 'cav' },
    { name: 'Steppe Rider',    att: 120, defInf: 30,  defCav: 15,  speed: 16, crop: 2, unitType: 'cav' },
    { name: 'Marksman',        att: 110, defInf: 80,  defCav: 70,  speed: 15, crop: 2, unitType: 'cav' },
    { name: 'Marauder',        att: 180, defInf: 60,  defCav: 40,  speed: 14, crop: 3, unitType: 'cav' },
    { name: 'Ram',             att: 65,  defInf: 30,  defCav: 90,  speed: 4,  crop: 3, unitType: 'siege' },
    { name: 'Catapult',        att: 45,  defInf: 55,  defCav: 10,  speed: 3,  crop: 6, unitType: 'siege' },
    { name: 'Logades',         att: 50,  defInf: 40,  defCav: 30,  speed: 5,  crop: 4, unitType: 'special' },
    { name: 'Settler',         att: 0,   defInf: 80,  defCav: 80,  speed: 5,  crop: 1, unitType: 'special' },
  ],
};

// === Spartans (tid=8) ===
const SPARTANS: TribeDef = {
  tid: 8, namePl: 'Spartanie', nameEn: 'Spartans',
  emoji: '🛡️', wallType: 'Defensive Wall',
  units: [
    { name: 'Hoplite',               att: 50,  defInf: 35,  defCav: 30,  speed: 6,  crop: 1, unitType: 'inf' },
    { name: 'Sentinel',              att: 0,   defInf: 40,  defCav: 22,  speed: 9,  crop: 1, unitType: 'inf' },
    { name: 'Shieldsman',            att: 40,  defInf: 85,  defCav: 45,  speed: 8,  crop: 1, unitType: 'inf' },
    { name: 'Twinsteel Therion',     att: 90,  defInf: 55,  defCav: 40,  speed: 6,  crop: 1, unitType: 'inf' },
    { name: 'Elpida Rider',          att: 55,  defInf: 120, defCav: 90,  speed: 16, crop: 2, unitType: 'cav' },
    { name: 'Corinthian Crusher',    att: 195, defInf: 80,  defCav: 75,  speed: 9,  crop: 3, unitType: 'cav' },
    { name: 'Ram',                   att: 65,  defInf: 30,  defCav: 80,  speed: 4,  crop: 3, unitType: 'siege' },
    { name: 'Catapult',              att: 50,  defInf: 60,  defCav: 10,  speed: 3,  crop: 6, unitType: 'siege' },
    { name: 'Ephor',                 att: 40,  defInf: 60,  defCav: 40,  speed: 4,  crop: 4, unitType: 'special' },
    { name: 'Settler',               att: 0,   defInf: 80,  defCav: 80,  speed: 5,  crop: 1, unitType: 'special' },
  ],
};

// === Registry ===

export const TRIBES: Record<number, TribeDef> = {
  1: ROMANS,
  2: TEUTONS,
  3: GAULS,
  6: EGYPTIANS,
  7: HUNS,
  8: SPARTANS,
};

/** Get tribe by ID */
export function getTribe(tid: number): TribeDef | undefined {
  return TRIBES[tid];
}

/** Get unit by tribe ID and unit index */
export function getUnit(tid: number, unitIndex: number): UnitDef | undefined {
  return TRIBES[tid]?.units[unitIndex];
}

/** Get slowest unit speed from a list of unit names for a tribe */
export function getSlowestSpeed(tid: number, unitNames: string[]): number {
  const tribe = TRIBES[tid];
  if (!tribe) return 3; // fallback to catapult speed
  let slowest = Infinity;
  for (const name of unitNames) {
    const unit = tribe.units.find(u => u.name === name || u.namePl === name);
    if (unit && unit.speed < slowest) slowest = unit.speed;
  }
  return slowest === Infinity ? 3 : slowest;
}

/** Calculate total defense value for given troops */
export function calculateDefenseValue(
  tid: number,
  troops: Record<string, number>,
): { infDef: number; cavDef: number } {
  const tribe = TRIBES[tid];
  if (!tribe) return { infDef: 0, cavDef: 0 };

  let infDef = 0;
  let cavDef = 0;
  for (const [name, count] of Object.entries(troops)) {
    const unit = tribe.units.find(u => u.name === name || u.namePl === name);
    if (unit) {
      infDef += unit.defInf * count;
      cavDef += unit.defCav * count;
    }
  }
  return { infDef, cavDef };
}

/** Calculate total attack value for given troops */
export function calculateAttackValue(
  tid: number,
  troops: Record<string, number>,
): number {
  const tribe = TRIBES[tid];
  if (!tribe) return 0;

  let total = 0;
  for (const [name, count] of Object.entries(troops)) {
    const unit = tribe.units.find(u => u.name === name || u.namePl === name);
    if (unit) total += unit.att * count;
  }
  return total;
}
