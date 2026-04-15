/**
 * Scheduler for automatic map.sql collection using node-cron.
 *
 * Runs at configured interval (default: 00:05 UTC daily).
 * Retry logic: up to 6 attempts, 5 minutes apart.
 */

import { schedule, validate, type ScheduledTask } from 'node-cron';
import { collectAndStore } from './collector';

const MAX_RETRIES = 6;
const RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes

let scheduledTask: ScheduledTask | null = null;
let isCollecting = false;

async function runWithRetry(): Promise<void> {
  if (isCollecting) {
    console.log('[scheduler] Collection already in progress, skipping');
    return;
  }

  isCollecting = true;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[scheduler] Attempt ${attempt}/${MAX_RETRIES}`);
      const result = await collectAndStore();
      console.log(
        `[scheduler] Success: snapshot #${result.snapshotId}, ` +
        `${result.villageCount} villages (${result.fetchTimeMs + result.storeTimeMs}ms total)`
      );
      isCollecting = false;
      return;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[scheduler] Attempt ${attempt} failed: ${msg}`);

      if (attempt < MAX_RETRIES) {
        console.log(`[scheduler] Retrying in 5 minutes...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  console.error(`[scheduler] All ${MAX_RETRIES} attempts failed`);
  isCollecting = false;
}

export function startScheduler(): void {
  const cronExpression = process.env.MAP_SQL_CRON || '5 0 * * *';

  if (scheduledTask) {
    console.log('[scheduler] Stopping existing scheduler');
    scheduledTask.stop();
  }

  if (!validate(cronExpression)) {
    console.error(`[scheduler] Invalid cron expression: ${cronExpression}`);
    return;
  }

  scheduledTask = schedule(cronExpression, () => {
    runWithRetry().catch(err => {
      console.error('[scheduler] Unhandled error in runWithRetry:', err);
    });
  }, {
    timezone: 'UTC',
  });

  console.log(`[scheduler] Started with cron: "${cronExpression}" (UTC)`);
}

export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[scheduler] Stopped');
  }
}

export function isSchedulerRunning(): boolean {
  return scheduledTask !== null;
}

export function isCollectionInProgress(): boolean {
  return isCollecting;
}

export async function triggerManualCollection(): Promise<ReturnType<typeof collectAndStore>> {
  if (isCollecting) {
    throw new Error('Collection already in progress');
  }
  return collectAndStore();
}
