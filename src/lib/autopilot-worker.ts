import { processAutomatedReminders } from './reminder-service';

let isWorkerInitialized = false;

/**
 * Autopilot background worker daemon
 * Automatically scans overdue invoices and sends payment reminders.
 */
export function startAutopilotWorker() {
  // Prevent duplicate intervals during Turbopack hot reloading
  if (isWorkerInitialized) return;
  isWorkerInitialized = true;

  console.log('🚀 [PAYCHASE_AUTOPILOT] Background chasing engine initialized.');

  // Run first check 10 seconds after server boots
  setTimeout(async () => {
    await runAutopilotCycle();
  }, 10000);

  // Then run automatically every 1 hour (3600000 ms)
  const INTERVAL_MS = 60 * 60 * 1000;
  setInterval(async () => {
    await runAutopilotCycle();
  }, INTERVAL_MS);
}

async function runAutopilotCycle() {
  try {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[PAYCHASE_AUTOPILOT] 🔍 [${timestamp}] Running automated invoice check...`);

    const result = await processAutomatedReminders();

    if (result.sent > 0) {
      console.log(
        `[PAYCHASE_AUTOPILOT] 📬 [${timestamp}] Sent ${result.sent} reminder(s) successfully! (${result.processed} scanned, ${result.failed} failed).`
      );
    } else {
      console.log(
        `[PAYCHASE_AUTOPILOT] 😴 [${timestamp}] Check complete. No invoices due for reminders right now.`
      );
    }
  } catch (err) {
    console.error('[PAYCHASE_AUTOPILOT_ERROR]', err);
  }
}
