import { runIngestionWorker } from "./ingestionWorker.js";

const DEFAULT_SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

let syncIntervalHandle = null;
let isSyncRunning = false;

/**
 * Triggers an ingestion run with mutex locking so concurrent jobs don't overlap.
 */
async function triggerSync(triggerType = "scheduled") {
  if (isSyncRunning) {
    console.log(`[Scheduler] ⏳ Previous sync still in progress. Skipping ${triggerType} trigger.`);
    return;
  }

  isSyncRunning = true;
  console.log(`[Scheduler] ⏰ Starting ${triggerType} sync job...`);

  try {
    await runIngestionWorker();
  } catch (err) {
    console.error(`[Scheduler] ❌ Sync job failed:`, err.message);
  } finally {
    isSyncRunning = false;
  }
}

/**
 * Starts the automated background ingestion timer.
 * 
 * @param {number} intervalMs - Milliseconds between sync cycles (default 15 minutes)
 */
export function startScheduler(intervalMs = DEFAULT_SYNC_INTERVAL_MS) {
  if (syncIntervalHandle) {
    console.log("[Scheduler] Background scheduler already active.");
    return;
  }

  console.log(`[Scheduler] 🔄 Automated news sync initialized (interval: ${intervalMs / 60000} minutes).`);

  // Run first sync 5 seconds after server boots up
  setTimeout(() => {
    triggerSync("initial_startup");
  }, 5000);

  // Set recurring interval
  syncIntervalHandle = setInterval(() => {
    triggerSync("recurring");
  }, intervalMs);
}

/**
 * Stops the background scheduler
 */
export function stopScheduler() {
  if (syncIntervalHandle) {
    clearInterval(syncIntervalHandle);
    syncIntervalHandle = null;
    console.log("[Scheduler] Background scheduler stopped.");
  }
}

export { triggerSync };
