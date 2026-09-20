export async function register() {
  // Only run in the Node.js server runtime (not edge or browser)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startAutopilotWorker } = await import('@/lib/autopilot-worker');
    startAutopilotWorker();
  }
}
