import 'dotenv/config';
import { runCrossLanguageRadarPipeline } from './cron_jobs';

async function main() {
  console.log('[Manual Radar] Initializing global radar pipeline...');
  await runCrossLanguageRadarPipeline();
  console.log('[Manual Radar] Radar pipeline run completed successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[Manual Radar] Pipeline crashed:', err);
  process.exit(1);
});
