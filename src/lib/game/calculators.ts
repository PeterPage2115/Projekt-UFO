import { MAP_SIZE, SERVER_SPEED } from './constants';

/**
 * Calculate Euclidean distance between two points with map wrapping.
 * RoF map edges wrap around (401x401, -200..+200).
 */
export function calculateDistance(
  x1: number, y1: number,
  x2: number, y2: number,
): number {
  let dx = Math.abs(x2 - x1);
  let dy = Math.abs(y2 - y1);

  // Map wrapping: check if going through edge is shorter
  if (dx > MAP_SIZE / 2) dx = MAP_SIZE - dx;
  if (dy > MAP_SIZE / 2) dy = MAP_SIZE - dy;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate travel time in seconds.
 * @param distance - Euclidean distance
 * @param unitSpeed - base speed of the slowest unit
 * @param speedMultiplier - server speed (default: SERVER_SPEED)
 */
export function calculateTravelTime(
  distance: number,
  unitSpeed: number,
  speedMultiplier: number = SERVER_SPEED,
): number {
  if (unitSpeed <= 0) return Infinity;
  return (distance / (unitSpeed * speedMultiplier)) * 3600; // hours → seconds
}

/**
 * Calculate the time to send troops so they arrive at landingTime.
 * @returns ISO datetime string for when to send
 */
export function calculateSendTime(
  landingTime: Date | string,
  distance: number,
  unitSpeed: number,
  speedMultiplier: number = SERVER_SPEED,
): Date {
  const landing = typeof landingTime === 'string' ? new Date(landingTime) : landingTime;
  const travelSeconds = calculateTravelTime(distance, unitSpeed, speedMultiplier);
  return new Date(landing.getTime() - travelSeconds * 1000);
}

/**
 * Format seconds to HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '--:--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Calculate training time for a unit.
 * @param baseTime - base training time in seconds (at building level 1)
 * @param buildingLevel - level of the training building
 * @param speedMultiplier - server speed
 * @returns training time per unit in seconds
 */
export function calculateTrainingTime(
  baseTime: number,
  buildingLevel: number = 1,
  speedMultiplier: number = SERVER_SPEED,
): number {
  // Travian formula: time = baseTime * 0.9 ^ (buildingLevel - 1) / speedMultiplier
  return (baseTime * Math.pow(0.9, buildingLevel - 1)) / speedMultiplier;
}

/**
 * Calculate how many units can be trained in 24 hours.
 */
export function unitsPerDay(
  baseTime: number,
  buildingLevel: number = 1,
  speedMultiplier: number = SERVER_SPEED,
): number {
  const timePerUnit = calculateTrainingTime(baseTime, buildingLevel, speedMultiplier);
  if (timePerUnit <= 0) return 0;
  return Math.floor(86400 / timePerUnit);
}
