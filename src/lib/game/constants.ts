export const MAP_SIZE = 401;
export const MAP_MIN = -200;
export const MAP_MAX = 200;
export const SERVER_SPEED = Number(process.env.SERVER_SPEED) || 3;
export const TRAVIAN_SERVER_URL = process.env.TRAVIAN_SERVER_URL || 'https://rof.x3.international.travian.com';
export const MAP_SQL_URL = `${TRAVIAN_SERVER_URL}/map.sql`;

export const TRIBE_IDS = {
  ROMANS: 1,
  TEUTONS: 2,
  GAULS: 3,
  NATURE: 4,
  NATARS: 5,
  EGYPTIANS: 6,
  HUNS: 7,
  SPARTANS: 8,
  VIKINGS: 9,
} as const;

// Tribes available on RoF x3
export const ROF_TRIBES = [
  TRIBE_IDS.ROMANS,
  TRIBE_IDS.TEUTONS,
  TRIBE_IDS.GAULS,
  TRIBE_IDS.EGYPTIANS,
  TRIBE_IDS.HUNS,
  TRIBE_IDS.SPARTANS,
] as const;

export type TribeId = (typeof ROF_TRIBES)[number];

export const TRIBE_NAMES: Record<number, { pl: string; en: string }> = {
  [TRIBE_IDS.ROMANS]: { pl: 'Rzymianie', en: 'Romans' },
  [TRIBE_IDS.TEUTONS]: { pl: 'Germanie', en: 'Teutons' },
  [TRIBE_IDS.GAULS]: { pl: 'Galowie', en: 'Gauls' },
  [TRIBE_IDS.NATURE]: { pl: 'Natura', en: 'Nature' },
  [TRIBE_IDS.NATARS]: { pl: 'Natarowie', en: 'Natars' },
  [TRIBE_IDS.EGYPTIANS]: { pl: 'Egipcjanie', en: 'Egyptians' },
  [TRIBE_IDS.HUNS]: { pl: 'Hunowie', en: 'Huns' },
  [TRIBE_IDS.SPARTANS]: { pl: 'Spartanie', en: 'Spartans' },
  [TRIBE_IDS.VIKINGS]: { pl: 'Wikingowie', en: 'Vikings' },
};
